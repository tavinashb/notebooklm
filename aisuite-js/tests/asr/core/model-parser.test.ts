import { parseModel } from '../../../src/asr/core/model-parser';

describe('parseModel', () => {
  it('should parse valid model format correctly', () => {
    const result = parseModel('openai:whisper-1');
    expect(result).toEqual({
      provider: 'openai',
      model: 'whisper-1'
    });
  });

  it('should parse provider and model with hyphens', () => {
    const result = parseModel('deepgram:nova-2');
    expect(result).toEqual({
      provider: 'deepgram',
      model: 'nova-2'
    });
  });

  it('should parse provider and model with underscores', () => {
    const result = parseModel('google:latest_long');
    expect(result).toEqual({
      provider: 'google',
      model: 'latest_long'
    });
  });

  it('should throw error for invalid format without colon', () => {
    expect(() => parseModel('openai-whisper-1')).toThrow(
      'Invalid model format: "openai-whisper-1". Expected format: "provider:model"'
    );
  });

  it('should throw error for format with multiple colons', () => {
    expect(() => parseModel('openai:whisper:1')).toThrow(
      'Invalid model format: "openai:whisper:1". Expected format: "provider:model"'
    );
  });

  it('should throw error for empty provider', () => {
    expect(() => parseModel(':whisper-1')).toThrow(
      'Invalid model format: ":whisper-1". Both provider and model name are required.'
    );
  });

  it('should throw error for empty model', () => {
    expect(() => parseModel('openai:')).toThrow(
      'Invalid model format: "openai:". Both provider and model name are required.'
    );
  });

  it('should throw error for empty string', () => {
    expect(() => parseModel('')).toThrow(
      'Invalid model format: "". Expected format: "provider:model"'
    );
  });
});