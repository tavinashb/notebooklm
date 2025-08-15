import { GoogleCloudASRProvider } from '../../../src/asr/providers/google';

describe('GoogleCloudASRProvider', () => {
  const config = { 
    projectId: 'test-project',
    region: 'us-central1'
  };
  let provider: GoogleCloudASRProvider;

  beforeEach(() => {
    provider = new GoogleCloudASRProvider(config);
    jest.clearAllMocks();
  });

  describe('validateParams', () => {
    it('should accept supported parameters', () => {
      const params = {
        language: 'en-US',
        timestamps: true,
        word_confidence: true,
        speaker_labels: true,
        enable_automatic_punctuation: true,
      };

      expect(() => provider.validateParams('latest_long', params)).not.toThrow();
    });

    it('should allow provider-specific parameters with prefix', () => {
      const params = {
        google_diarization_speaker_count: 3,
        google_enable_automatic_punctuation: true,
      };

      expect(() => provider.validateParams('latest_long', params)).not.toThrow();
    });
  });

  describe('translateParams', () => {
    it('should translate language to languageCode', () => {
      const params = { language: 'fr-FR' };
      const translated = provider.translateParams('latest_long', params);

      expect(translated).toHaveProperty('languageCode', 'fr-FR');
    });

    it('should translate timestamps to enableWordTimeOffsets', () => {
      const params = { timestamps: true };
      const translated = provider.translateParams('latest_long', params);

      expect(translated).toHaveProperty('enableWordTimeOffsets', true);
    });

    it('should translate word_confidence to enableWordConfidence', () => {
      const params = { word_confidence: true };
      const translated = provider.translateParams('latest_long', params);

      expect(translated).toHaveProperty('enableWordConfidence', true);
    });

    it('should translate speaker_labels to enableSpeakerDiarization', () => {
      const params = { speaker_labels: true };
      const translated = provider.translateParams('latest_long', params);

      expect(translated).toHaveProperty('enableSpeakerDiarization', true);
      expect(translated).toHaveProperty('diarizationSpeakerCount', 2);
    });

    it('should handle provider-specific parameters', () => {
      const params = { 
        google_diarization_speaker_count: 4,
        google_enable_automatic_punctuation: true,
      };
      const translated = provider.translateParams('latest_long', params);

      expect(translated).toHaveProperty('diarization_speaker_count', 4);
      expect(translated).toHaveProperty('enable_automatic_punctuation', true);
    });

    it('should not set flags when parameters are false', () => {
      const params = { 
        timestamps: false,
        word_confidence: false,
        speaker_labels: false,
      };
      const translated = provider.translateParams('latest_long', params);

      expect(translated).not.toHaveProperty('enableWordTimeOffsets');
      expect(translated).not.toHaveProperty('enableWordConfidence');
      expect(translated).not.toHaveProperty('enableSpeakerDiarization');
    });
  });

  describe('name property', () => {
    it('should return "google"', () => {
      expect(provider.name).toBe('google');
    });
  });

  describe('constructor', () => {
    it('should store config and set baseURL', () => {
      expect(provider['config']).toEqual(config);
      expect(provider['baseURL']).toBe('https://speech.googleapis.com/v1/speech:recognize');
    });
  });
});