import {
  TranscriptionRequest,
  TranscriptionResult,
  ASRProviderConfigs,
  RequestOptions,
} from "./types";
import { BaseASRProvider } from "./core/base-asr-provider";
import { parseModel } from "./core/model-parser";
import { ProviderNotConfiguredError } from "./core/errors";
import { OpenAIASRProvider } from "./providers/openai";
import { DeepgramASRProvider } from "./providers/deepgram";
import { GoogleCloudASRProvider } from "./providers/google";

export class ASRClient {
  private providers: Map<string, BaseASRProvider> = new Map();

  constructor(config: ASRProviderConfigs) {
    this.initializeProviders(config);
  }

  private initializeProviders(config: ASRProviderConfigs): void {
    if (config.openai) {
      this.providers.set("openai", new OpenAIASRProvider(config.openai));
    }

    if (config.deepgram) {
      this.providers.set("deepgram", new DeepgramASRProvider(config.deepgram));
    }

    if (config.google) {
      this.providers.set("google", new GoogleCloudASRProvider(config.google));
    }
  }

  public audio = {
    transcriptions: {
      create: async (
        request: TranscriptionRequest,
        options?: RequestOptions
      ): Promise<TranscriptionResult> => {
        const { provider, model } = parseModel(request.model);
        const providerInstance = this.providers.get(provider);

        if (!providerInstance) {
          throw new ProviderNotConfiguredError(
            provider,
            Array.from(this.providers.keys())
          );
        }

        const requestWithParsedModel = {
          ...request,
          model, // Just the model name without provider prefix
        };

        return providerInstance.transcribe(requestWithParsedModel, options);
      },
    },
  };

  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public isProviderConfigured(provider: string): boolean {
    return this.providers.has(provider);
  }
}