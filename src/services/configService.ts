import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'gem');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export interface GemConfig {
  apiKey?: string;
  defaultModel?: string;
  currentModel?: string;
}

const DefaultConfig: GemConfig = {
  defaultModel: 'gemini-2.0-flash',
};

export async function getConfig(): Promise<GemConfig> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const rawData = await fs.readFile(CONFIG_PATH, 'utf-8');
    return { ...DefaultConfig, ...JSON.parse(rawData) };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await saveConfig(DefaultConfig);
      return DefaultConfig;
    }
    console.error('Error reading config:', error);
    return DefaultConfig;
  }
}

export async function saveConfig(config: GemConfig): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

export async function getApiKey(): Promise<string | undefined> {
  const config = await getConfig();
  return config.apiKey || process.env.GEMINI_API_KEY;
}

export async function setApiKey(apiKey: string): Promise<void> {
  const config = await getConfig();
  config.apiKey = apiKey;
  await saveConfig(config);
}

export async function getCurrentModel(): Promise<string> {
  const config = await getConfig();
  return config.currentModel || config.defaultModel || 'gemini-2.0-flash';
}

export async function setCurrentModel(modelName: string): Promise<void> {
  const config = await getConfig();
  config.currentModel = modelName;
  await saveConfig(config);
}

export async function getDefaultModel(): Promise<string> {
  const config = await getConfig();
  return config.defaultModel || 'gemini-2.0-flash';
}

export async function setDefaultModel(modelName: string): Promise<void> {
  const config = await getConfig();
  config.defaultModel = modelName;
  if (!config.currentModel) {
    config.currentModel = modelName;
  }
  await saveConfig(config);
}
