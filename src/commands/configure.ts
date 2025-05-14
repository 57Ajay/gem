import inquirer from 'inquirer';
import chalk from 'chalk';
import { setApiKey, getDefaultModel, setDefaultModel, getConfig } from '../services/configService';

export async function configureSettings(): Promise<void> {
  console.log(chalk.blue('Gem Configuration'));

  const currentConfig = await getConfig();

  const questions = [
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Google Gemini API Key (leave blank to keep current):',
      mask: '*',
      default: currentConfig.apiKey ? '********' : undefined,
    },
    {
      type: 'input',
      name: 'defaultModel',
      message: 'Enter your default Gemini model (e.g., gemini-2.0-flash, gemini-2.5-pro (remember to first see models via `gem models`)):',
      default: await getDefaultModel(),
    },
  ];

  const answers = await inquirer.prompt(questions as unknown as any);

  if (answers.apiKey && answers.apiKey !== '********') {
    await setApiKey(answers.apiKey);
    console.log(chalk.green('API Key updated.'));
  } else if (!currentConfig.apiKey && !answers.apiKey) {
    console.log(chalk.yellow('API Key not set. Some commands may not work.'));
  } else {
    console.log(chalk.gray('API Key not changed.'));
  }


  if (answers.defaultModel) {
    await setDefaultModel(answers.defaultModel);
    console.log(chalk.green(`Default model set to: ${answers.defaultModel}`));
  }

  console.log(chalk.blue('Configuration saved.'));
}
