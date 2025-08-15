export interface ASRProviderConfigs {
  openai?: OpenAIASRConfig;
  deepgram?: DeepgramConfig;
  google?: GoogleCloudConfig;
}

export interface OpenAIASRConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

export interface DeepgramConfig {
  apiKey: string;
  baseURL?: string;
}

export interface GoogleCloudConfig {
  projectId: string;
  region?: string;
  keyFilename?: string;
  credentials?: any;
}