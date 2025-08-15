import 'dotenv/config';
import { 
  ASRClient, 
  ASRError, 
  UnsupportedParameterError, 
  ProviderNotConfiguredError,
  AudioProcessingError 
} from '../../src/asr';

async function main() {
  console.log('--- ASR Error Handling Examples ---\n');

  // Example 1: Provider not configured error
  console.log('1. Provider Not Configured Error:');
  try {
    const clientWithoutProviders = new ASRClient({});
    await clientWithoutProviders.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: Buffer.from('test'),
    });
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      console.log('✓ Caught ProviderNotConfiguredError:', error.message);
      console.log('  Provider:', error.provider);
      console.log('  Code:', error.code);
    } else {
      console.log('Unexpected error:', error);
    }
  }

  // Example 2: Invalid model format error
  console.log('\n2. Invalid Model Format Error:');
  try {
    const client = new ASRClient({
      openai: { apiKey: 'test-key' }
    });
    await client.audio.transcriptions.create({
      model: 'invalid-format-without-colon',
      file: Buffer.from('test'),
    });
  } catch (error) {
    console.log('✓ Caught model format error:', error instanceof Error ? error.message : error);
  }

  // Example 3: Unsupported parameter error
  console.log('\n3. Unsupported Parameter Error:');
  try {
    const client = new ASRClient({
      openai: { apiKey: 'test-key' }
    });
    await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: Buffer.from('test'),
      speaker_labels: true, // Not supported by OpenAI
    });
  } catch (error) {
    if (error instanceof UnsupportedParameterError) {
      console.log('✓ Caught UnsupportedParameterError:', error.message);
      console.log('  Provider:', error.provider);
      console.log('  Code:', error.code);
    } else {
      console.log('Unexpected error:', error instanceof Error ? error.message : error);
    }
  }

  // Example 4: Multiple unsupported parameters
  console.log('\n4. Multiple Unsupported Parameters:');
  try {
    const client = new ASRClient({
      openai: { apiKey: 'test-key' }
    });
    await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: Buffer.from('test'),
      word_confidence: true, // Not supported by OpenAI
      speaker_labels: true,  // Not supported by OpenAI
    });
  } catch (error) {
    if (error instanceof UnsupportedParameterError) {
      console.log('✓ Caught first unsupported parameter:', error.message);
    }
  }

  // Example 5: Network/API errors (simulated)
  console.log('\n5. API Error Handling:');
  try {
    const client = new ASRClient({
      deepgram: { apiKey: 'invalid-key' }
    });
    await client.audio.transcriptions.create({
      model: 'deepgram:nova-2',
      file: Buffer.from('test audio data'),
      language: 'en-US',
    });
  } catch (error) {
    if (error instanceof ASRError) {
      console.log('✓ Caught ASR API Error:', error.message);
      console.log('  Provider:', error.provider);
      console.log('  Code:', error.code);
    } else {
      console.log('Network/API error:', error instanceof Error ? error.message : error);
    }
  }

  // Example 6: File handling errors
  console.log('\n6. File Handling Errors:');
  try {
    const client = new ASRClient({
      openai: { apiKey: process.env.OPENAI_API_KEY || 'test-key' }
    });
    await client.audio.transcriptions.create({
      model: 'openai:whisper-1',
      file: '/nonexistent/path/to/audio.wav',
      language: 'en-US',
    });
  } catch (error) {
    console.log('✓ Caught file error:', error instanceof Error ? error.message : error);
  }

  // Example 7: Graceful degradation - try multiple providers
  console.log('\n7. Graceful Degradation Example:');
  
  const client = new ASRClient({
    openai: { apiKey: process.env.OPENAI_API_KEY || 'test-key' },
    deepgram: { apiKey: process.env.DEEPGRAM_API_KEY || 'test-key' },
    google: { projectId: 'test-project' },
  });

  const audioBuffer = Buffer.from('test audio data');
  const providers = ['openai:whisper-1', 'deepgram:nova-2', 'google:latest_short'];
  
  let transcriptionResult = null;
  
  for (const model of providers) {
    try {
      console.log(`Trying ${model}...`);
      transcriptionResult = await client.audio.transcriptions.create({
        model,
        file: audioBuffer,
        language: 'en-US',
      });
      console.log(`✓ Success with ${model}:`, transcriptionResult.text);
      break;
    } catch (error) {
      console.log(`✗ Failed with ${model}:`, error instanceof Error ? error.message : error);
    }
  }
  
  if (!transcriptionResult) {
    console.log('All providers failed');
  }

  // Example 8: Error recovery with retry logic
  console.log('\n8. Retry Logic Example:');
  
  async function transcribeWithRetry(
    client: ASRClient,
    model: string,
    file: Buffer,
    maxRetries: number = 3
  ) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} with ${model}`);
        const result = await client.audio.transcriptions.create({
          model,
          file,
          language: 'en-US',
        });
        console.log(`✓ Success on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`✗ Attempt ${attempt} failed:`, lastError.message);
        
        // Don't retry for certain types of errors
        if (error instanceof UnsupportedParameterError || 
            error instanceof ProviderNotConfiguredError) {
          console.log('  → Not retrying for this error type');
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          console.log(`  → Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  try {
    await transcribeWithRetry(client, 'deepgram:nova-2', audioBuffer, 2);
  } catch (error) {
    console.log('Final error after retries:', error instanceof Error ? error.message : error);
  }

  // Example 9: Input validation
  console.log('\n9. Input Validation:');
  
  const invalidInputs = [
    { name: 'null file', file: null },
    { name: 'empty string file', file: '' },
    { name: 'invalid object', file: { invalid: 'object' } },
  ];

  for (const input of invalidInputs) {
    try {
      await client.audio.transcriptions.create({
        model: 'openai:whisper-1',
        file: input.file as any,
        language: 'en-US',
      });
    } catch (error) {
      console.log(`✓ Caught error for ${input.name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n--- Error Handling Examples Complete ---');
}

main().catch(console.error);