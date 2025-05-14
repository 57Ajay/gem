import path from 'path';
import readline from 'readline/promises';
import chalk from 'chalk';
import type { Content } from '@google/generative-ai';
import { startChatSession, streamChat } from '../services/geminiService';
import { saveChat, getDirectoryListing, readFileContent } from '../services/fileService';
import { streamToStdout } from '../utils/streamFormatter';
import fs from 'fs/promises';

async function getContextForPath(targetPath?: string): Promise<{ contextPrompt: string, chatNamePrefix: string }> {
  let contextPrompt: string;
  let chatNamePrefix = "chat_general";
  const cwd = process.cwd();

  if (targetPath) {
    const absolutePath = path.resolve(targetPath);
    try {
      const stats = await fs.stat(absolutePath);
      if (stats.isFile()) {
        const fileName = path.basename(absolutePath);
        chatNamePrefix = `chat_${fileName.replace(/\.[^/.]+$/, "")}`;
        console.log(chalk.blue(`Reading file context: ${absolutePath}`));
        const fileContent = await readFileContent(absolutePath);
        contextPrompt = `I want to chat about the file "${fileName}" located at "${absolutePath}".\nFile Content:\n\`\`\`\n${fileContent}\n\`\`\`\nWhat can you tell me about it, or what should we discuss?`;
      } else if (stats.isDirectory()) {
        chatNamePrefix = `chat_dir_${path.basename(absolutePath)}`;
        console.log(chalk.blue(`Listing directory context: ${absolutePath}`));
        const listing = await getDirectoryListing(absolutePath);
        contextPrompt = `I want to chat about the directory "${absolutePath}".\nIts contents are:\n${listing.join('\n')}\nWhat can we discuss about this directory or its contents?`;
      } else {
        contextPrompt = `I tried to get context for path "${absolutePath}", but it's neither a file nor a directory. Let's just have a general chat. I am currently in ${cwd}.`;
      }
    } catch (error) {
      console.warn(chalk.yellow(`Could not access path ${absolutePath}: ${(error as Error).message}`));
      contextPrompt = `I tried to access "${targetPath}" but couldn't. Let's have a general chat. My current working directory is ${cwd}.`;
    }
  } else {
    chatNamePrefix = `chat_cwd_${path.basename(cwd)}`;
    console.log(chalk.blue(`Getting context for current directory: ${cwd}`));
    const listing = await getDirectoryListing(cwd);
    contextPrompt = `I'm in the directory "${cwd}".\nIts contents are:\n${listing.join('\n')}\nLet's chat. You can start by asking me what I'd like to do or discuss.`;
  }
  return { contextPrompt: `You are a helpful AI assistant. ${contextPrompt}`, chatNamePrefix };
}


export async function startGeneralChat(targetPath?: string): Promise<void> {
  const { contextPrompt, chatNamePrefix } = await getContextForPath(targetPath);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const chatHistory: Content[] = [];
  let chatSession;

  try {
    chatHistory.push({ role: 'user', parts: [{ text: contextPrompt }] });
    chatSession = await startChatSession(undefined, []);

    console.log(chalk.green('Gemini:'));
    let firstResponse = "";
    const initialStream = streamChat(chatSession, contextPrompt);
    for await (const chunk of initialStream) {
      streamToStdout(chunk);
      firstResponse += chunk;
    }
    process.stdout.write('\n');
    chatHistory.push({ role: 'model', parts: [{ text: firstResponse }] });

    while (true) {
      const userInput = await rl.question(chalk.cyan('You: '));
      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      chatHistory.push({ role: 'user', parts: [{ text: userInput }] });

      console.log(chalk.green('Gemini:'));
      let fullResponse = "";
      const responseStream = streamChat(chatSession, userInput);
      for await (const chunk of responseStream) {
        streamToStdout(chunk);
        fullResponse += chunk;
      }
      process.stdout.write('\n');
      chatHistory.push({ role: 'model', parts: [{ text: fullResponse }] });
    }
  } catch (error: any) {
    console.error(chalk.red('Error during chat session:'), error.message);
    if (error.response && error.response.promptFeedback) {
      console.error(chalk.red('Prompt Feedback:'), error.response.promptFeedback);
    }
  } finally {
    rl.close();
    if (chatSession) {
      const sdkHistory = await chatSession.getHistory();
      await saveChat(chatNamePrefix, sdkHistory);
    } else if (chatHistory.length > 0) {
      await saveChat(chatNamePrefix, chatHistory);
    }
    console.log(chalk.magenta('Chat ended.'));
  }
}
