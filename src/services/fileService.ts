import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
const CHATS_DIR = path.join(os.homedir(), '.config', 'gem', 'chats');

export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

export async function writeFileContent(filePath: string, content: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  } catch (error: any) {
    console.error(chalk.red(`Error writing file ${filePath}: ${error.message}`));
    throw error;
  }
}

export async function saveChat(chatNamePrefix: string, history: any[]): Promise<void> {
  if (history.length === 0) {
    console.log(chalk.yellow("No chat history to save."));
    return;
  }
  try {
    await fs.mkdir(CHATS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${chatNamePrefix}_${timestamp}.json`;
    const filePath = path.join(CHATS_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(history, null, 2));
    console.log(`Chat saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving chat:', error);
  }
}

export async function getDirectoryListing(dirPath: string): Promise<string[]> {
  try {
    const items = await fs.readdir(dirPath);
    const detailedItems = await Promise.all(items.map(async item => {
      const itemPath = path.join(dirPath, item);
      try {
        const stats = await fs.stat(itemPath);
        return stats.isDirectory() ? `${item}/` : item;
      } catch {
        return item;
      }
    }));
    return detailedItems;
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error);
    return [`Error listing directory: ${(error as Error).message}`];
  }
}
