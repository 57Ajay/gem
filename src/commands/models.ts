import chalk from 'chalk';
import { listModels as fetchModelsList } from '../services/geminiService';
import { getCurrentModel as getConfiguredCurrentModel } from '../services/configService';


export async function listAvailableModels(): Promise<void> {
  console.log(chalk.blue('Fetching available Gemini models...'));
  try {
    const models = await fetchModelsList();
    const currentSessionModel = await getConfiguredCurrentModel();

    if (models.length === 0) {
      console.log(chalk.yellow('No models found. This might be an issue with the hardcoded list or the SDK.'));
      return;
    }
    console.log(chalk.green('Available Gemini Models:'));
    models.forEach(model => {
      const isCurrent = model === currentSessionModel;
      console.log(`  - ${model}${isCurrent ? chalk.cyan(' (current)') : ''}`);
    });
    console.log(chalk.gray("\nNote: This list might be based on common models. Always refer to official Google Gemini documentation for the most up-to-date list."));
  } catch (error: any) {
    console.error(chalk.red('Error fetching models:'), error.message);
  }
}
