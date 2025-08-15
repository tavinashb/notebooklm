# ASR (Automatic Speech Recognition) Examples

This directory contains examples demonstrating the unified ASR functionality in aisuite-js.

## Overview

The ASR client provides a unified interface for transcribing audio using multiple providers:
- **OpenAI Whisper** - High-quality multilingual transcription
- **Deepgram** - Real-time transcription with advanced features like speaker diarization
- **Google Cloud Speech-to-Text** - Enterprise-grade speech recognition

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
GOOGLE_PROJECT_ID=your_google_cloud_project_id
GOOGLE_KEY_FILE=/path/to/your/service-account.json
```

## Examples

### 1. Basic Transcription (`basic-transcription.ts`)
Demonstrates basic transcription with different providers:
```bash
npm run example:asr:basic
```

Features shown:
- Basic transcription with OpenAI Whisper
- Timestamps and word confidence with Deepgram
- Speaker diarization
- Google Cloud Speech-to-Text

### 2. Provider-Specific Features (`provider-specific-features.ts`)
Shows advanced features unique to each provider:
```bash
npm run example:asr:features
```

Features shown:
- OpenAI: temperature control, custom prompts
- Deepgram: smart formatting, punctuation, utterances
- Google Cloud: speaker count specification, automatic punctuation
- Different input types (file paths, Buffers, Uint8Array)

### 3. Multilingual Transcription (`multilingual-transcription.ts`)
Demonstrates transcription across multiple languages:
```bash
npm run example:asr:multilingual
```

Features shown:
- Provider comparison for English
- Spanish, French, German transcription
- Automatic language detection
- Batch processing
- Language-specific provider recommendations

### 4. Error Handling (`error-handling.ts`)
Comprehensive error handling examples:
```bash
npm run example:asr:errors
```

Features shown:
- Provider not configured errors
- Invalid model format handling
- Unsupported parameter errors
- Network/API error handling
- Retry logic with exponential backoff
- Graceful degradation

## Usage Patterns

### Basic Usage
```typescript
import { ASRClient } from 'aisuite/asr';

const client = new ASRClient({
  openai: { apiKey: 'your-key' },
  deepgram: { apiKey: 'your-key' },
});

const result = await client.audio.transcriptions.create({
  model: 'openai:whisper-1',
  file: audioBuffer,
  language: 'en-US',
});

console.log(result.text);
```

### With Advanced Features
```typescript
const result = await client.audio.transcriptions.create({
  model: 'deepgram:nova-2',
  file: audioBuffer,
  language: 'en-US',
  timestamps: true,
  word_confidence: true,
  speaker_labels: true,
  // Provider-specific parameters
  deepgram_smart_format: true,
});

// Access word-level details
result.words.forEach(word => {
  console.log(`${word.text} (${word.start}s-${word.end}s, confidence: ${word.confidence})`);
});
```

## Supported Models

### OpenAI
- `whisper-1` - General purpose transcription
- `gpt-4o-transcribe` - Advanced transcription with GPT-4o

### Deepgram
- `nova-2` - Latest Nova model with enhanced accuracy
- `nova-3` - Newest Nova model with improved features

### Google Cloud
- `latest_long` - Optimized for longer audio files
- `latest_short` - Optimized for shorter audio clips
- `chirp` - Universal speech model

## Parameter Mapping

| Unified Parameter | OpenAI | Deepgram | Google Cloud |
|-------------------|--------|----------|--------------|
| `language` | `language` | `language` | `languageCode` |
| `timestamps` | `response_format: 'verbose_json'` | `utterances: true` | `enableWordTimeOffsets: true` |
| `word_confidence` | ❌ Not supported | `smart_format: true` | `enableWordConfidence: true` |
| `speaker_labels` | ❌ Not supported | `diarize: true` | `enableSpeakerDiarization: true` |
| `temperature` | `temperature` | ❌ Not supported | ❌ Not supported |

## Provider-Specific Parameters

Use prefixed parameters for provider-specific features:

### OpenAI (`openai_*`)
- `openai_prompt` - Context for better transcription
- `openai_response_format` - Response format override

### Deepgram (`deepgram_*`)
- `deepgram_smart_format` - Enhanced formatting
- `deepgram_punctuate` - Automatic punctuation
- `deepgram_utterances` - Semantic segmentation

### Google Cloud (`google_*`)
- `google_diarization_speaker_count` - Expected number of speakers
- `google_enable_automatic_punctuation` - Auto punctuation

## Error Handling

The ASR client provides specific error types:

- `ProviderNotConfiguredError` - Provider not initialized
- `UnsupportedParameterError` - Parameter not supported by provider
- `ASRError` - General ASR processing error
- `AudioProcessingError` - Audio file processing error

## Best Practices

1. **Provider Selection**: Choose based on your needs:
   - OpenAI Whisper: Best overall accuracy, multilingual
   - Deepgram: Real-time processing, speaker diarization
   - Google Cloud: Enterprise features, custom vocabularies

2. **Error Handling**: Always wrap transcription calls in try-catch blocks

3. **Retry Logic**: Implement retry logic for network failures

4. **Input Validation**: Validate audio files before processing

5. **Resource Management**: Monitor API usage and costs

## Running Examples

To run specific examples:

```bash
# Basic transcription
npm run example:asr:basic

# With actual audio file
npm run example:asr:basic /path/to/audio.wav

# Provider-specific features
npm run example:asr:features

# Multilingual examples
npm run example:asr:multilingual

# Error handling
npm run example:asr:errors
```

## Audio File Formats

Supported formats vary by provider:
- **OpenAI**: mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Deepgram**: wav, mp3, m4a, flac, opus, and more
- **Google Cloud**: Linear16, FLAC, MULAW, AMR, and more

## Rate Limits and Costs

Be aware of provider-specific limits:
- **OpenAI**: 25MB file size limit
- **Deepgram**: Real-time and batch pricing
- **Google Cloud**: Per-minute pricing, quotas apply

For production use, implement proper rate limiting and cost monitoring.