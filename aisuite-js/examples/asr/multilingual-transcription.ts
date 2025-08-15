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

  // Mock audio buffers for different languages (in real usage, these would be actual audio files)
  const mockAudioBuffers = {
    english: Buffer.from('mock english audio data'),
    spanish: Buffer.from('mock spanish audio data'),
    french: Buffer.from('mock french audio data'),
    german: Buffer.from('mock german audio data'),
  };

  // Example 1: English transcription with multiple providers
  console.log('\n--- English Transcription Comparison ---');
  
  const providers = [
    { name: 'OpenAI Whisper', model: 'openai:whisper-1' },
    { name: 'Deepgram Nova', model: 'deepgram:nova-2' },
    { name: 'Google Cloud', model: 'google:latest_long' },
  ];

  for (const provider of providers) {
    try {
      const result = await client.audio.transcriptions.create({
        model: provider.model,
        file: mockAudioBuffers.english,
        language: 'en-US',
        timestamps: true,
      });

      console.log(`${provider.name}:`);
      console.log(`  Text: "${result.text}"`);
      console.log(`  Language: ${result.language}`);
      console.log(`  Confidence: ${result.confidence || 'N/A'}`);
      console.log(`  Words: ${result.words.length}`);
    } catch (error) {
      console.log(`${provider.name} Error:`, error instanceof Error ? error.message : error);
    }
  }

  // Example 2: Spanish transcription
  console.log('\n--- Spanish Transcription ---');
  try {
    const spanishResult = await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: mockAudioBuffers.spanish,
      language: 'es-ES',
      timestamps: true,
      word_confidence: true,
    });

    console.log('Spanish Result:');
    console.log(`  Text: "${spanishResult.text}"`);
    console.log(`  Detected Language: ${spanishResult.language}`);
    console.log(`  Word Count: ${spanishResult.words.length}`);
  } catch (error) {
    console.error('Spanish Error:', error instanceof Error ? error.message : error);
  }

  // Example 3: French transcription with OpenAI
  console.log('\n--- French Transcription ---');
  try {
    const frenchResult = await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: mockAudioBuffers.french,
      language: 'fr-FR',
      temperature: 0.1, // Lower temperature for better accuracy
    });

    console.log('French Result:');
    console.log(`  Text: "${frenchResult.text}"`);
    console.log(`  Language: ${frenchResult.language}`);
  } catch (error) {
    console.error('French Error:', error instanceof Error ? error.message : error);
  }

  // Example 4: German transcription with Google Cloud
  console.log('\n--- German Transcription ---');
  try {
    const germanResult = await client.audio.transcriptions.create({
      model: 'google:latest_short',
      file: mockAudioBuffers.german,
      language: 'de-DE',
      timestamps: true,
      word_confidence: true,
    });

    console.log('German Result:');
    console.log(`  Text: "${germanResult.text}"`);
    console.log(`  Language: ${germanResult.language}`);
    console.log(`  Confidence: ${germanResult.confidence || 'N/A'}`);
  } catch (error) {
    console.error('German Error:', error instanceof Error ? error.message : error);
  }

  // Example 5: Language detection (using model without specifying language)
  console.log('\n--- Automatic Language Detection ---');
  try {
    // OpenAI Whisper can detect language automatically
    const autoDetectResult = await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: mockAudioBuffers.spanish,
      // No language specified - let the model detect it
      timestamps: true,
    });

    console.log('Auto-detected Language Result:');
    console.log(`  Text: "${autoDetectResult.text}"`);
    console.log(`  Detected Language: ${autoDetectResult.language}`);
  } catch (error) {
    console.error('Auto-detect Error:', error instanceof Error ? error.message : error);
  }

  // Example 6: Batch processing multiple languages
  console.log('\n--- Batch Processing Multiple Languages ---');
  
  const languageTests = [
    { lang: 'en-US', buffer: mockAudioBuffers.english, name: 'English' },
    { lang: 'es-ES', buffer: mockAudioBuffers.spanish, name: 'Spanish' },
    { lang: 'fr-FR', buffer: mockAudioBuffers.french, name: 'French' },
    { lang: 'de-DE', buffer: mockAudioBuffers.german, name: 'German' },
  ];

  const batchResults = await Promise.allSettled(
    languageTests.map(async (test) => {
      const result = await client.audio.transcriptions.create({
        model: 'deepgram:nova-2',
        file: test.buffer,
        language: test.lang,
        timestamps: true,
      });
      return { ...test, result };
    })
  );

  batchResults.forEach((outcome, index) => {
    const test = languageTests[index];
    if (outcome.status === 'fulfilled') {
      const { result } = outcome.value;
      console.log(`${test.name} (${test.lang}): "${result.text}" - ${result.words.length} words`);
    } else {
      console.log(`${test.name} failed:`, outcome.reason instanceof Error ? outcome.reason.message : outcome.reason);
    }
  });

  // Example 7: Language-specific provider recommendations
  console.log('\n--- Provider Recommendations by Language ---');
  
  const recommendations = {
    'en-US': 'All providers work well for English',
    'es-ES': 'Deepgram Nova has excellent Spanish support',
    'fr-FR': 'OpenAI Whisper handles French very well',
    'de-DE': 'Google Cloud has strong German language models',
    'ja-JP': 'Google Cloud excels at Japanese transcription',
    'zh-CN': 'OpenAI Whisper and Google both support Chinese well',
  };

  Object.entries(recommendations).forEach(([lang, recommendation]) => {
    console.log(`${lang}: ${recommendation}`);
  });
}

main().catch(console.error);