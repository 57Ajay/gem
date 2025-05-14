#!/usr/bin/env bun
import yargsLib from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

import { analyseFile } from './commands/analyse';
import { configureSettings } from './commands/configure';
import { fixFile } from './commands/fix';
import { listAvailableModels } from './commands/models';
import { useModel } from './commands/useModel';
import { startGeneralChat } from './commands/chat';
import { getApiKey, getConfig } from './services/configService';

const VERSION = "0.1.0";

async function main() {
  const rawArgv = hideBin(process.argv);
  const parsedEarly = await yargsLib(rawArgv).help(false).version(false).argv;
  const command = parsedEarly._[0]?.toString();

  const commandsRequiringApiKey = ['analyse', 'fix', 'chat'];
  const isDefaultCommand = !command && rawArgv.length === 0;

  if (
    (command && commandsRequiringApiKey.includes(command)) ||
    isDefaultCommand
  ) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.error(chalk.red("🔴 Gemini API key not set."));
      console.log(chalk.yellow("Please run 'gem configure' to set your API key, or set the GEMINI_API_KEY environment variable."));
      process.exit(1);
    }
    const config = await getConfig();
    const modelToUse = config.currentModel || config.defaultModel || 'gemini-1.5-flash-latest';
    console.log(chalk.dim(`Using model: ${modelToUse}`));
  }

  const terminalWidth = yargsLib().terminalWidth();

  const cli = yargsLib(hideBin(process.argv))
    .scriptName(chalk.bold.magenta("gem"))
    .version('v', chalk.green(`Show version number (gem -v)`), chalk.cyan(VERSION))
    .alias('v', 'version')
    .help('h', chalk.green(`Show help (gem -h)`))
    .alias('h', 'help')
    .command(
      'analyse <fileName>',
      chalk.blue('Analyze a file and start an interactive chat about it'),
      (y) => y.positional('fileName', { type: 'string', demandOption: true, describe: chalk.gray('Path to the file to analyze') }),
      async (argv) => { await analyseFile(argv.fileName as string); }
    )
    .command(
      'fix <fileName>',
      chalk.blue('Attempt to fix code in a file and save to <fileName-fixedByGemini>'),
      (y) => y.positional('fileName', { type: 'string', demandOption: true, describe: chalk.gray('Path to the file to fix') }),
      async (argv) => { await fixFile(argv.fileName as string); }
    )
    .command(
      'models',
      chalk.blue('List available/configured Gemini models'),
      {},
      async () => { await listAvailableModels(); }
    )
    .command(
      'use model <modelName>',
      chalk.blue('Set the Gemini model to use for the current session'),
      (y) => y.positional('modelName', { type: 'string', demandOption: true, describe: chalk.gray('Name of the model to use (e.g., gemini-1.5-flash-latest)') }),
      async (argv) => { await useModel(argv.modelName as string); }
    )
    .command(
      'configure',
      chalk.blue('Configure Gem settings (API key, default model)'),
      {},
      async () => { await configureSettings(); }
    )
    .command(
      ['chat [path]', '$0'],
      chalk.blue('Chat with Gemini about the current directory or a specific path'),
      (y) => y.positional('path', { type: 'string', describe: chalk.gray('Optional path to a file or directory to discuss') }),
      async (argv) => { await startGeneralChat(argv.path as string | undefined); }
    )
    .demandCommand(0, chalk.yellow(' Gem needs a command to sparkle! Try running `gem chat` or `gem --help` for options.'))
    .recommendCommands()
    .strict()
    .epilogue(chalk.gray('For more information or to report issues, visit: gitbub.com/57ajay/gem'))
    .fail((msg, err) => {
      if (err) {
        console.error(chalk.red('Oops! Something went wrong with the command:'));
        console.error(chalk.yellow(msg));
        // console.error(yargsInstanceArg.help());
      } else {
        console.error(chalk.red('An unexpected error occurred:'));
        console.error(chalk.red(msg));
      }
      process.exit(1);
    })
    .wrap(terminalWidth);

  await cli.parse();
}

main().catch(error => {
  console.error(chalk.redBright("💥 A critical error occurred outside of command execution:"));
  console.error(error);
  process.exit(1);
});
