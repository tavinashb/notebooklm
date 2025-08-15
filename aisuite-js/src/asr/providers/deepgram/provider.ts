import { BaseASRProvider } from '../../core/base-asr-provider';
import { 
  TranscriptionRequest, 
  TranscriptionResult,
  RequestOptions 
} from '../../types';
import { DeepgramConfig } from './types';
import { adaptRequest, adaptResponse } from './adapters';
import { ASRError, UnsupportedParameterError } from '../../core/errors';
import * as fs from 'fs';

export class DeepgramASRProvider extends BaseASRProvider {
  public readonly name = 'deepgram';
  private apiKey: string;
  private baseURL: string;

  constructor(config: DeepgramConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.deepgram.com/v1';
  }

  validateParams(model: string, params: { [key: string]: any }): void {
    const supported = new Set([
      'language', 'timestamps', 'word_confidence', 'speaker_labels',
      'smart_format', 'punctuate', 'diarize', 'utterances'
    ]);
    
    for (const [key, value] of Object.entries(params)) {
      if (!supported.has(key) && !key.startsWith('deepgram_')) {
        console.warn(`Parameter '${key}' may not be supported by Deepgram ASR`);
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
            translated.utterances = true;
          }
          break;
        case 'word_confidence':
          if (value) {
            translated.smart_format = true;
          }
          break;
        case 'speaker_labels':
          if (value) {
            translated.diarize = true;
          }
          break;
        default:
          // Pass through Deepgram-specific parameters
          if (key.startsWith('deepgram_')) {
            translated[key.substring(9)] = value;
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
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('model', request.model);
      
      for (const [key, value] of Object.entries(translatedParams)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      }

      // Handle different input types
      let audioData: Buffer;
      if (typeof request.file === 'string') {
        audioData = fs.readFileSync(request.file);
      } else if (Buffer.isBuffer(request.file)) {
        audioData = request.file;
      } else if (request.file instanceof Uint8Array) {
        audioData = Buffer.from(request.file);
      } else {
        throw new ASRError('Unsupported audio input type', this.name, 'INVALID_INPUT');
      }

      const url = `${this.baseURL}/listen?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'audio/wav', // Adjust based on actual audio format
        },
        body: audioData,
        signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined,
      });

      if (!response.ok) {
        throw new ASRError(
          `Deepgram API error: ${response.status} ${response.statusText}`,
          this.name,
          'API_ERROR'
        );
      }

      const result = await response.json();
      return adaptResponse(result);
    } catch (error) {
      if (error instanceof ASRError) {
        throw error;
      }
      throw new ASRError(
        `Deepgram ASR error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'API_ERROR'
      );
    }
  }
}