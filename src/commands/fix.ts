import path from 'path';
import chalk from 'chalk';
import { generateContent } from '../services/geminiService';
import { readFileContent, writeFileContent } from '../services/fileService';

function extractCode(text: string): string {
  const codeBlockRegex = /```(?:[a-zA-Z0-9_.-]+)?\n([\s\S]*?)\n```/;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}


export async function fixFile(filePath: string): Promise<void> {
  console.log(chalk.blue(`Attempting to fix file: ${filePath}...`));

  const absoluteFilePath = path.resolve(filePath);
  let fileContent: string;
  try {
    fileContent = await readFileContent(absoluteFilePath);
  } catch (error) {
    console.error(chalk.red(`Could not read file: ${absoluteFilePath}`));
    return;
  }

  const fileExtension = path.extname(absoluteFilePath).slice(1);

  const prompt = `You are an expert code assistant.
Analyze the following code from the file "${path.basename(absoluteFilePath)}" and fix any bugs or improve it.
Please only output the complete, corrected code. Do not include any explanations, apologies, or introductory/concluding sentences before or after the code block.
The language is likely ${fileExtension || 'unknown'}.

Original Code:
\`\`\`${fileExtension || ''}
${fileContent}
\`\`\`

Corrected Code:`;

  try {
    console.log(chalk.yellow('Sending to Gemini for fixing... This may take a moment.'));
    const fixedCodeResponse = await generateContent(prompt);
    const fixedCode = extractCode(fixedCodeResponse);

    if (!fixedCode || fixedCode.trim() === fileContent.trim()) {
      console.log(chalk.yellow('Gemini did not suggest any changes or failed to provide a valid code block.'));
      return;
    }

    const baseName = path.basename(absoluteFilePath, path.extname(absoluteFilePath));
    const dirName = path.dirname(absoluteFilePath);
    const fixedFileName = `${baseName}-fixedByGemini${path.extname(absoluteFilePath)}`;
    const fixedFilePath = path.join(dirName, fixedFileName);

    await writeFileContent(fixedFilePath, fixedCode);
    console.log(chalk.green(`Fixed code written to: ${chalk.bold(fixedFilePath)}`));
    console.log(chalk.gray("Please review the changes carefully before using the fixed file."));

  } catch (error: any) {
    console.error(chalk.red('Error during file fixing process:'), error.message);
    if (error.response && error.response.promptFeedback) {
      console.error(chalk.red('Prompt Feedback:'), error.response.promptFeedback);
    }
  }
}
