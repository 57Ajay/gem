import chalk from 'chalk';
import { setCurrentModel } from '../services/configService';
import { listModels as fetchModelsList } from '../services/geminiService';

export async function useModel(modelName: string): Promise<void> {
  const knownModels = await fetchModelsList();
  if (!knownModels.map(m => m.toLowerCase()).includes(modelName.toLowerCase())) {
    console.warn(chalk.yellow(`Warning: Model "${modelName}" is not in the known list. It might not be a valid model.`));
  }

  try {
    await setCurrentModel(modelName);
    console.log(chalk.green(`Gemini model for the current session set to: ${chalk.bold(modelName)}`));
    console.log(chalk.gray(`This setting will be used until you close this terminal session or use 'gem use model' again.`));
    console.log(chalk.gray(`To set a persistent default model, use 'gem configure'.`));
  } catch (error: any) {
    console.error(chalk.red(`Error setting model: ${error.message}`));
  }
}
