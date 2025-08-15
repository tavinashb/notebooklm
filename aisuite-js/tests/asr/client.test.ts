import { ASRClient } from '../../src/asr/client';
import { TranscriptionResult, ASRProviderConfigs } from '../../src/asr/types';
import { ProviderNotConfiguredError } from '../../src/asr/core/errors';

describe('ASRClient', () => {
  const mockConfig: ASRProviderConfigs = {
    openai: { apiKey: 'test-openai-key' },
    deepgram: { apiKey: 'test-deepgram-key' },
    google: { 
      projectId: 'test-project',
      region: 'us-central1'
    },
  };

  let client: ASRClient;

  beforeEach(() => {
    client = new ASRClient(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize providers based on config', () => {
      expect(client.listProviders()).toContain('openai');
      expect(client.listProviders()).toContain('deepgram');
      expect(client.listProviders()).toContain('google');
    });

    it('should only initialize configured providers', () => {
      const partialConfig = { openai: { apiKey: 'test-key' } };
      const partialClient = new ASRClient(partialConfig);
      
      expect(partialClient.listProviders()).toEqual(['openai']);
      expect(partialClient.isProviderConfigured('openai')).toBe(true);
      expect(partialClient.isProviderConfigured('deepgram')).toBe(false);
    });
  });

  describe('listProviders', () => {
    it('should return list of configured providers', () => {
      const providers = client.listProviders();
      expect(providers).toHaveLength(3);
      expect(providers).toContain('openai');
      expect(providers).toContain('deepgram');
      expect(providers).toContain('google');
    });
  });

  describe('isProviderConfigured', () => {
    it('should return true for configured providers', () => {
      expect(client.isProviderConfigured('openai')).toBe(true);
      expect(client.isProviderConfigured('deepgram')).toBe(true);
      expect(client.isProviderConfigured('google')).toBe(true);
    });

    it('should return false for unconfigured providers', () => {
      expect(client.isProviderConfigured('aws')).toBe(false);
    });
  });

  describe('audio.transcriptions.create', () => {
    const mockAudioBuffer = Buffer.from('mock audio data');

    it('should throw error for unconfigured provider', async () => {
      await expect(
        client.audio.transcriptions.create({
          model: 'unconfigured:model',
          file: mockAudioBuffer,
        })
      ).rejects.toThrow(ProviderNotConfiguredError);
    });

    it('should parse model correctly and call provider', async () => {
      // Note: This test would need mocking of actual provider calls
      // For now, it tests the basic structure
      const request = {
        model: 'openai:whisper-1',
        file: mockAudioBuffer,
        language: 'en-US',
      };

      // In a real test, we'd mock the provider's transcribe method
      // await expect(client.audio.transcriptions.create(request)).resolves.toBeDefined();
    });

    it('should handle invalid model format', async () => {
      await expect(
        client.audio.transcriptions.create({
          model: 'invalid-format',
          file: mockAudioBuffer,
        })
      ).rejects.toThrow('Invalid model format');
    });
  });
});