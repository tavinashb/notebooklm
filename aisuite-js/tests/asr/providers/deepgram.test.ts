import { DeepgramASRProvider } from '../../../src/asr/providers/deepgram';

// Mock fetch for HTTP requests
global.fetch = jest.fn();

describe('DeepgramASRProvider', () => {
  const config = { apiKey: 'test-deepgram-key' };
  let provider: DeepgramASRProvider;

  beforeEach(() => {
    provider = new DeepgramASRProvider(config);
    jest.clearAllMocks();
  });

  describe('validateParams', () => {
    it('should accept supported parameters', () => {
      const params = {
        language: 'en-US',
        timestamps: true,
        word_confidence: true,
        speaker_labels: true,
        smart_format: true,
      };

      expect(() => provider.validateParams('nova-2', params)).not.toThrow();
    });

    it('should allow provider-specific parameters with prefix', () => {
      const params = {
        deepgram_punctuate: true,
        deepgram_diarize: true,
      };

      expect(() => provider.validateParams('nova-2', params)).not.toThrow();
    });
  });

  describe('translateParams', () => {
    it('should translate timestamps to utterances', () => {
      const params = { timestamps: true };
      const translated = provider.translateParams('nova-2', params);

      expect(translated).toHaveProperty('utterances', true);
    });

    it('should translate word_confidence to smart_format', () => {
      const params = { word_confidence: true };
      const translated = provider.translateParams('nova-2', params);

      expect(translated).toHaveProperty('smart_format', true);
    });

    it('should translate speaker_labels to diarize', () => {
      const params = { speaker_labels: true };
      const translated = provider.translateParams('nova-2', params);

      expect(translated).toHaveProperty('diarize', true);
    });

    it('should pass through language parameter', () => {
      const params = { language: 'en-GB' };
      const translated = provider.translateParams('nova-2', params);

      expect(translated).toHaveProperty('language', 'en-GB');
    });

    it('should handle provider-specific parameters', () => {
      const params = { 
        deepgram_punctuate: true,
        deepgram_utterances: false,
      };
      const translated = provider.translateParams('nova-2', params);

      expect(translated).toHaveProperty('punctuate', true);
      expect(translated).toHaveProperty('utterances', false);
    });

    it('should not set flags when parameters are false', () => {
      const params = { 
        timestamps: false,
        word_confidence: false,
        speaker_labels: false,
      };
      const translated = provider.translateParams('nova-2', params);

      expect(translated).not.toHaveProperty('utterances');
      expect(translated).not.toHaveProperty('smart_format');
      expect(translated).not.toHaveProperty('diarize');
    });
  });

  describe('name property', () => {
    it('should return "deepgram"', () => {
      expect(provider.name).toBe('deepgram');
    });
  });

  describe('constructor', () => {
    it('should use default baseURL when not provided', () => {
      const defaultProvider = new DeepgramASRProvider({ apiKey: 'test' });
      expect(defaultProvider['baseURL']).toBe('https://api.deepgram.com/v1');
    });

    it('should use custom baseURL when provided', () => {
      const customProvider = new DeepgramASRProvider({ 
        apiKey: 'test',
        baseURL: 'https://custom.deepgram.com'
      });
      expect(customProvider['baseURL']).toBe('https://custom.deepgram.com');
    });
  });
});