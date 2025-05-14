import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  ChatSession,
} from "@google/generative-ai";
import type { Content, ModelParams } from "@google/generative-ai"
import { getApiKey, getDefaultModel } from './configService';
import chalk from 'chalk';

let genAI: GoogleGenerativeAI | null = null;
let activeModelName: string | null = null;
let generativeModelInstance: GenerativeModel | null = null;

async function getGenAI(): Promise<GoogleGenerativeAI> {
  if (!genAI) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.error(chalk.red("Gemini API key not set. Please run 'gem configure' or set GEMINI_API_KEY environment variable."));
      process.exit(1);
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function listModels(): Promise<string[]> {
  console.warn(chalk.yellowBright("Note: Model listing is currently based on common models. Refer to Google Gemini documentation for the authoritative list."));
  return [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-preview-04-17",
    "gemini-2.5-pro-preview-05-06",
  ];
}

export async function getGenerativeModel(modelNameOverride?: string): Promise<GenerativeModel> {
  const ai = await getGenAI();
  const modelNameToUse = modelNameOverride || await getDefaultModel();

  if (generativeModelInstance && activeModelName === modelNameToUse) {
    return generativeModelInstance;
  }

  console.log(chalk.dim(`Initializing Gemini model: ${modelNameToUse}`));
  activeModelName = modelNameToUse;

  const modelParams: ModelParams = {
    model: activeModelName!,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    // generationConfig: { // Optional: will see into this later...
    //  temperature: 0.7,
    //  topK: 1,
    //  topP: 1,
    //  maxOutputTokens: 2048,
    // }
  };

  generativeModelInstance = ai.getGenerativeModel(modelParams);
  return generativeModelInstance;
}

export async function startChatSession(modelNameOverride?: string, history?: Content[]): Promise<ChatSession> {
  const model = await getGenerativeModel(modelNameOverride);
  return model.startChat({ history });
}

export async function generateContent(prompt: string, modelNameOverride?: string): Promise<string> {
  const model = await getGenerativeModel(modelNameOverride);
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    if (error.message && error.message.includes("SAFETY")) {
      console.error(chalk.red("Gemini API Error: Content blocked due to safety settings."));
      if (error.response && error.response.promptFeedback) {
        console.error(chalk.red("Prompt Feedback:"), JSON.stringify(error.response.promptFeedback, null, 2));
      }
    } else if (error.message && error.message.includes("API key not valid")) {
      console.error(chalk.red("Gemini API Error: API key not valid. Please check your API key in 'gem configure'."));
    }
    throw error;
  }
}

export async function* streamChat(chatSession: ChatSession, newMessage: string): AsyncGenerator<string, void, undefined> {
  try {
    const result = await chatSession.sendMessageStream(newMessage);
    for await (const chunk of result.stream) {
      if (chunk.text && typeof chunk.text === 'function') {
        yield chunk.text();
      } else if (typeof chunk.text === 'string') {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    if (error.message && error.message.includes("SAFETY")) {
      yield chalk.red("\n[Gemini Error: Response part blocked due to safety settings.]\n");
      if (error.response && error.response.promptFeedback) {
        yield chalk.red(`[Prompt Feedback: ${JSON.stringify(error.response.promptFeedback.safetyRatings)}]\n`);
      }
    } else if (error.message && error.message.includes("API key not valid")) {
      yield chalk.red("\n[Gemini API Error: API key not valid. Please check your API key in 'gem configure'.]\n");
    } else {
      yield chalk.red(`\n[Error streaming chat: ${error.message}]\n`);
    }
    throw error;
  }
}
