import { OpenAIASRProvider } from '../../../src/asr/providers/openai';
import { UnsupportedParameterError } from '../../../src/asr/core/errors';

// Mock the OpenAI SDK
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('OpenAIASRProvider', () => {
  const config = { apiKey: 'test-openai-key' };
  let provider: OpenAIASRProvider;

  beforeEach(() => {
    provider = new OpenAIASRProvider(config);
    jest.clearAllMocks();
  });

  describe('validateParams', () => {
    it('should accept supported parameters', () => {
      const params = {
        language: 'en-US',
        timestamps: true,
        temperature: 0.5,
      };

      expect(() => provider.validateParams('whisper-1', params)).not.toThrow();
    });

    it('should reject unsupported parameters', () => {
      const params = {
        word_confidence: true, // Not supported by OpenAI
      };

      expect(() => provider.validateParams('whisper-1', params))
        .toThrow(UnsupportedParameterError);
    });

    it('should reject speaker_labels parameter', () => {
      const params = {
        speaker_labels: true, // Not supported by OpenAI
      };

      expect(() => provider.validateParams('whisper-1', params))
        .toThrow(UnsupportedParameterError);
    });

    it('should allow provider-specific parameters with prefix', () => {
      const params = {
        openai_prompt: 'Custom prompt',
      };

      expect(() => provider.validateParams('whisper-1', params)).not.toThrow();
    });
  });

  describe('translateParams', () => {
    it('should translate timestamps parameter', () => {
      const params = { timestamps: true };
      const translated = provider.translateParams('whisper-1', params);

      expect(translated).toHaveProperty('response_format', 'verbose_json');
    });

    it('should pass through language parameter', () => {
      const params = { language: 'es-ES' };
      const translated = provider.translateParams('whisper-1', params);

      expect(translated).toHaveProperty('language', 'es-ES');
    });

    it('should pass through temperature parameter', () => {
      const params = { temperature: 0.7 };
      const translated = provider.translateParams('whisper-1', params);

      expect(translated).toHaveProperty('temperature', 0.7);
    });

    it('should handle provider-specific parameters', () => {
      const params = { openai_prompt: 'Custom prompt' };
      const translated = provider.translateParams('whisper-1', params);

      expect(translated).toHaveProperty('prompt', 'Custom prompt');
    });

    it('should not set response_format when timestamps is false', () => {
      const params = { timestamps: false };
      const translated = provider.translateParams('whisper-1', params);

      expect(translated).not.toHaveProperty('response_format');
    });
  });

  describe('name property', () => {
    it('should return "openai"', () => {
      expect(provider.name).toBe('openai');
    });
  });

  // Note: Testing the actual transcribe method would require mocking
  // the OpenAI SDK more extensively and handling file operations
});