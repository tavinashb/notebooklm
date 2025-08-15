import { TranscriptionRequest, TranscriptionResult, Word, Segment } from '../../types';

export function adaptRequest(request: TranscriptionRequest): any {
  const { language, timestamps, word_confidence, speaker_labels, ...otherParams } = request;
  
  const googleRequest: any = {
    config: {
      encoding: 'LINEAR16', // Default encoding, should be configurable
      sampleRateHertz: 16000, // Default sample rate
      languageCode: language || 'en-US',
      ...otherParams
    },
    audio: {
      content: null // Will be set later with base64 encoded audio
    }
  };

  // Map unified parameters to Google Cloud parameters
  if (timestamps) {
    googleRequest.config.enableWordTimeOffsets = true;
  }
  
  if (word_confidence) {
    googleRequest.config.enableWordConfidence = true;
  }
  
  if (speaker_labels) {
    googleRequest.config.enableSpeakerDiarization = true;
    // Default to 2 speakers, can be overridden with google_diarization_speaker_count
    googleRequest.config.diarizationSpeakerCount = 2;
  }

  return googleRequest;
}

export function adaptResponse(response: any): TranscriptionResult {
  const words: Word[] = [];
  const segments: Segment[] = [];
  let fullTranscript = '';

  if (response.results) {
    response.results.forEach((result: any) => {
      if (result.alternatives && result.alternatives[0]) {
        const alternative = result.alternatives[0];
        fullTranscript += alternative.transcript + ' ';

        // Extract words with timestamps and confidence
        if (alternative.words) {
          alternative.words.forEach((word: any) => {
            words.push({
              text: word.word,
              start: parseFloat(word.startTime?.seconds || '0') + 
                     (parseFloat(word.startTime?.nanos || '0') / 1e9),
              end: parseFloat(word.endTime?.seconds || '0') + 
                   (parseFloat(word.endTime?.nanos || '0') / 1e9),
              confidence: word.confidence,
              speaker: word.speakerTag?.toString()
            });
          });
        }

        // Create segments from results
        segments.push({
          text: alternative.transcript,
          start: parseFloat(result.resultEndTime?.seconds || '0') + 
                 (parseFloat(result.resultEndTime?.nanos || '0') / 1e9),
          end: parseFloat(result.resultEndTime?.seconds || '0') + 
               (parseFloat(result.resultEndTime?.nanos || '0') / 1e9)
        });
      }
    });
  }

  return {
    text: fullTranscript.trim(),
    language: response.results?.[0]?.languageCode || 'unknown',
    confidence: response.results?.[0]?.alternatives?.[0]?.confidence,
    words,
    segments
  };
}