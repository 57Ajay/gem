import path from 'path';
import readline from 'readline/promises';
import chalk from 'chalk';
import type { Content } from '@google/generative-ai'; // Import Content type
import { startChatSession, streamChat } from '../services/geminiService';
import { readFileContent, saveChat } from '../services/fileService';
import { streamToStdout } from '../utils/streamFormatter';

export async function analyseFile(filePath: string): Promise<void> {
  console.log(chalk.blue(`Analyzing file: ${filePath}...`));

  const absoluteFilePath = path.resolve(filePath);
  let fileContent: string;
  try {
    fileContent = await readFileContent(absoluteFilePath);
  } catch (error) {
    console.error(chalk.red(`Could not read file: ${absoluteFilePath}`));
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const initialPrompt = `You are a helpful AI code assistant. I want to discuss the following file:
File Path: ${absoluteFilePath}

File Content:
\`\`\`
${fileContent}
\`\`\`

What would you like to know or discuss about this file? Or ask me your questions about my goals with this file.`;

  const chatHistoryForSaving: Content[] = [];
  let chatSession;

  try {
    chatHistoryForSaving.push({ role: 'user', parts: [{ text: initialPrompt }] });
    chatSession = await startChatSession(undefined, []);

    console.log(chalk.green('Gemini:'));
    let firstResponse = "";
    const stream = streamChat(chatSession, initialPrompt);
    for await (const chunk of stream) {
      streamToStdout(chunk);
      firstResponse += chunk;
    }
    process.stdout.write('\n');
    chatHistoryForSaving.push({ role: 'model', parts: [{ text: firstResponse }] });


    while (true) {
      const userInput = await rl.question(chalk.cyan('You: '));
      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      chatHistoryForSaving.push({ role: 'user', parts: [{ text: userInput }] });

      console.log(chalk.green('Gemini:'));
      let fullResponse = "";
      const responseStream = streamChat(chatSession, userInput);
      for await (const chunk of responseStream) {
        streamToStdout(chunk);
        fullResponse += chunk;
      }
      process.stdout.write('\n');
      chatHistoryForSaving.push({ role: 'model', parts: [{ text: fullResponse }] });
    }
  } catch (error: any) {
    console.error(chalk.red('Error during chat session:'), error.message);
    if (error.response && error.response.promptFeedback) {
      console.error(chalk.red('Prompt Feedback:'), error.response.promptFeedback);
    }
  } finally {
    rl.close();
    const chatName = `analyse_${path.basename(absoluteFilePath).replace(/\.[^/.]+$/, "")}`;
    if (chatSession) {
      const sdkHistory = await chatSession.getHistory();
      await saveChat(chatName, sdkHistory);
    } else if (chatHistoryForSaving.length > 0) {
      await saveChat(chatName, chatHistoryForSaving);
    }
    console.log(chalk.magenta('Chat ended.'));
  }
}
