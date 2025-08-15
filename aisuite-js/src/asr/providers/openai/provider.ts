import OpenAI from 'openai';
import { BaseASRProvider } from '../../core/base-asr-provider';
import { 
  TranscriptionRequest, 
  TranscriptionResult,
  RequestOptions 
} from '../../types';
import { OpenAIASRConfig } from './types';
import { adaptRequest, adaptResponse } from './adapters';
import { ASRError, UnsupportedParameterError } from '../../core/errors';
import * as fs from 'fs';

export class OpenAIASRProvider extends BaseASRProvider {
  public readonly name = 'openai';
  private client: OpenAI;

  constructor(config: OpenAIASRConfig) {
    super();
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
  }

  validateParams(model: string, params: { [key: string]: any }): void {
    const supported = new Set([
      'language', 'timestamps', 'temperature', 'prompt', 'response_format'
    ]);
    
    const unsupported = ['word_confidence', 'speaker_labels'];
    
    for (const [key, value] of Object.entries(params)) {
      if (unsupported.includes(key)) {
        throw new UnsupportedParameterError(key, this.name);
      }
      if (!supported.has(key) && !key.startsWith('openai_')) {
        // Allow provider-specific parameters with openai_ prefix
        console.warn(`Parameter '${key}' may not be supported by OpenAI ASR`);
      }
    }
  }

  translateParams(model: string, params: { [key: string]: any }): { [key: string]: any } {
    const translated: { [key: string]: any } = {};
    
    for (const [key, value] of Object.entries(params)) {
      switch (key) {
        case 'language':
          translated.language = value;
          break;
        case 'timestamps':
          if (value) {
            translated.response_format = 'verbose_json';
          }
          break;
        case 'temperature':
          translated.temperature = value;
          break;
        default:
          // Pass through other parameters
          if (key.startsWith('openai_')) {
            // Remove prefix for provider-specific params
            translated[key.substring(7)] = value;
          } else {
            translated[key] = value;
          }
      }
    }
    
    return translated;
  }

  async transcribe(
    request: TranscriptionRequest,
    options?: RequestOptions
  ): Promise<TranscriptionResult> {
    try {
      this.validateParams(request.model, request);
      const translatedParams = this.translateParams(request.model, request);
      
      // Handle different input types
      let audioFile: any;
      if (typeof request.file === 'string') {
        // File path
        audioFile = fs.createReadStream(request.file);
      } else if (Buffer.isBuffer(request.file) || request.file instanceof Uint8Array) {
        // Convert Buffer/Uint8Array to File-like object
        const blob = new Blob([request.file]);
        audioFile = new File([blob], 'audio.wav', { type: 'audio/wav' });
      } else {
        audioFile = request.file;
      }

      const openaiRequest = {
        file: audioFile,
        model: request.model,
        ...translatedParams
      };

      const response = await this.client.audio.transcriptions.create(openaiRequest);
      return adaptResponse(response);
    } catch (error) {
      if (error instanceof ASRError) {
        throw error;
      }
      throw new ASRError(
        `OpenAI ASR error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'API_ERROR'
      );
    }
  }
}