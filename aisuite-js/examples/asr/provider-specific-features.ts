import 'dotenv/config';
import { ASRClient } from '../../src/asr';

async function main() {
  const client = new ASRClient({
    openai: { apiKey: process.env.OPENAI_API_KEY! },
    deepgram: { apiKey: process.env.DEEPGRAM_API_KEY! },
    google: { 
      projectId: process.env.GOOGLE_PROJECT_ID!,
      keyFilename: process.env.GOOGLE_KEY_FILE
    },
  });

  const mockAudioBuffer = Buffer.from('mock audio data for demonstration');

  // Example 1: OpenAI with provider-specific features
  console.log('\n--- OpenAI Provider-Specific Features ---');
  try {
    const result = await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: mockAudioBuffer,
      language: 'en-US',
      temperature: 0.2, // Lower temperature for more consistent results
      timestamps: true,
      // Provider-specific parameters with prefix
      openai_prompt: 'This is a business meeting about quarterly results.',
    });

    console.log('OpenAI Result:', result.text);
    console.log('Words with timestamps:', result.words.length);
  } catch (error) {
    console.error('OpenAI Error:', error instanceof Error ? error.message : error);
  }

  // Example 2: Deepgram with advanced features
  console.log('\n--- Deepgram Advanced Features ---');
  try {
    const result = await client.audio.transcriptions.create({
      model: 'deepgram:nova-3',
      file: mockAudioBuffer,
      language: 'en-US',
      timestamps: true,
      word_confidence: true,
      speaker_labels: true,
      // Provider-specific parameters
      deepgram_smart_format: true,
      deepgram_punctuate: true,
      deepgram_diarize: true,
      deepgram_utterances: true,
    });

    console.log('Deepgram Advanced Result:');
    console.log('Text:', result.text);
    console.log('Total words:', result.words.length);
    console.log('Total segments:', result.segments.length);
    
    // Show speaker information
    const speakers = new Set(result.words.map(w => w.speaker).filter(Boolean));
    console.log('Detected speakers:', Array.from(speakers));
  } catch (error) {
    console.error('Deepgram Error:', error instanceof Error ? error.message : error);
  }

  // Example 3: Google Cloud with diarization settings
  console.log('\n--- Google Cloud Advanced Features ---');
  try {
    const result = await client.audio.transcriptions.create({
      model: 'google:latest_long',
      file: mockAudioBuffer,
      language: 'en-US',
      timestamps: true,
      word_confidence: true,
      speaker_labels: true,
      // Provider-specific parameters
      google_diarization_speaker_count: 3, // Expect 3 speakers
      google_enable_automatic_punctuation: true,
    });

    console.log('Google Advanced Result:');
    console.log('Text:', result.text);
    console.log('Confidence:', result.confidence);
    
    // Show word-level details
    console.log('First few words with details:');
    result.words.slice(0, 5).forEach(word => {
      console.log(`  "${word.text}" - Speaker: ${word.speaker}, Confidence: ${word.confidence}`);
    });
  } catch (error) {
    console.error('Google Error:', error instanceof Error ? error.message : error);
  }

  // Example 4: Error handling for unsupported features
  console.log('\n--- Error Handling Example ---');
  try {
    // This should fail because OpenAI doesn't support speaker_labels
    await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: mockAudioBuffer,
      speaker_labels: true, // Not supported by OpenAI
    });
  } catch (error) {
    console.log('Expected error for unsupported feature:', error instanceof Error ? error.message : error);
  }

  // Example 5: Different input types
  console.log('\n--- Different Input Types ---');
  
  // Using file path (string)
  try {
    // In a real scenario, you'd use an actual file path
    const filePathResult = await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: '/path/to/audio/file.wav', // This would be a real file path
      language: 'en-US',
    });
    console.log('File path result length:', filePathResult.text.length);
  } catch (error) {
    console.log('File path example (expected to fail with mock path):', error instanceof Error ? error.message : 'Error');
  }

  // Using Buffer
  try {
    const bufferResult = await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: mockAudioBuffer,
      language: 'en-US',
    });
    console.log('Buffer result:', bufferResult.text);
  } catch (error) {
    console.error('Buffer Error:', error instanceof Error ? error.message : error);
  }

  // Using Uint8Array
  try {
    const uint8Array = new Uint8Array(mockAudioBuffer);
    const uint8Result = await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: uint8Array,
      language: 'en-US',
    });
    console.log('Uint8Array result:', uint8Result.text);
  } catch (error) {
    console.error('Uint8Array Error:', error instanceof Error ? error.message : error);
  }
}

main().catch(console.error);