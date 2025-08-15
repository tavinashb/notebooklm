import 'dotenv/config';
import { ASRClient } from '../../src/asr';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Initialize the ASR client with API keys
  const client = new ASRClient({
    openai: { apiKey: process.env.OPENAI_API_KEY! },
    deepgram: { apiKey: process.env.DEEPGRAM_API_KEY! },
    google: { 
      projectId: process.env.GOOGLE_PROJECT_ID!,
      keyFilename: process.env.GOOGLE_KEY_FILE
    },
  });

  console.log('Available ASR providers:', client.listProviders());

  // Example audio file path (you would replace this with an actual audio file)
  const audioFilePath = path.join(__dirname, 'sample-audio.wav');
  
  // For demonstration, we'll use a buffer (in real usage, you'd load an actual audio file)
  const mockAudioBuffer = Buffer.from('mock audio data for demonstration');

  // Example 1: Basic transcription with OpenAI Whisper
  console.log('\n--- OpenAI Whisper Example ---');
  try {
    const openaiResult = await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: mockAudioBuffer,
      language: 'en-US',
    });

    console.log('OpenAI Transcription:', openaiResult.text);
    console.log('Language:', openaiResult.language);
    console.log('Confidence:', openaiResult.confidence);
  } catch (error) {
    console.error('OpenAI Error:', error instanceof Error ? error.message : error);
  }

  // Example 2: Transcription with timestamps using Deepgram
  console.log('\n--- Deepgram with Timestamps Example ---');
  try {
    const deepgramResult = await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: mockAudioBuffer,
      language: 'en-US',
      timestamps: true,
      word_confidence: true,
    });

    console.log('Deepgram Transcription:', deepgramResult.text);
    console.log('Words with timestamps:');
    deepgramResult.words.forEach((word, index) => {
      if (index < 5) { // Show first 5 words
        console.log(`  "${word.text}" (${word.start}s-${word.end}s, confidence: ${word.confidence})`);
      }
    });
  } catch (error) {
    console.error('Deepgram Error:', error instanceof Error ? error.message : error);
  }

  // Example 3: Speaker diarization with Deepgram
  console.log('\n--- Deepgram Speaker Diarization Example ---');
  try {
    const diarizationResult = await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: mockAudioBuffer,
      language: 'en-US',
      speaker_labels: true,
      timestamps: true,
    });

    console.log('Transcription with speakers:');
    diarizationResult.segments.forEach((segment, index) => {
      if (index < 3) { // Show first 3 segments
        console.log(`Speaker ${segment.speaker}: "${segment.text}"`);
      }
    });
  } catch (error) {
    console.error('Diarization Error:', error instanceof Error ? error.message : error);
  }

  // Example 4: Google Cloud Speech-to-Text
  console.log('\n--- Google Cloud Speech Example ---');
  try {
    const googleResult = await client.audio.transcriptions.create({
      model: 'google:latest_long',
      file: mockAudioBuffer,
      language: 'en-US',
      timestamps: true,
      word_confidence: true,
    });

    console.log('Google Transcription:', googleResult.text);
    console.log('Language detected:', googleResult.language);
  } catch (error) {
    console.error('Google Error:', error instanceof Error ? error.message : error);
  }
}

// Handle file input from command line
if (process.argv.length > 2) {
  const audioFile = process.argv[2];
  console.log(`Processing audio file: ${audioFile}`);
  // In a real implementation, you would read the file:
  // const audioBuffer = fs.readFileSync(audioFile);
}

main().catch(console.error);