export class ASRError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ASRError';
  }
}

export class UnsupportedParameterError extends ASRError {
  constructor(parameter: string, provider: string) {
    super(
      `Parameter '${parameter}' is not supported by provider '${provider}'`,
      provider,
      'UNSUPPORTED_PARAMETER'
    );
    this.name = 'UnsupportedParameterError';
  }
}

export class ProviderNotConfiguredError extends ASRError {
  constructor(provider: string, availableProviders: string[]) {
    super(
      `Provider '${provider}' is not configured. Available providers: ${availableProviders.join(', ')}`,
      provider,
      'PROVIDER_NOT_CONFIGURED'
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

export class AudioProcessingError extends ASRError {
  constructor(message: string, provider: string) {
    super(message, provider, 'AUDIO_PROCESSING_ERROR');
    this.name = 'AudioProcessingError';
  }
}