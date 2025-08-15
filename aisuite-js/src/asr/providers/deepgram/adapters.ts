import { TranscriptionRequest, TranscriptionResult, Word, Segment } from '../../types';

export function adaptRequest(request: TranscriptionRequest): any {
  const { language, timestamps, word_confidence, speaker_labels, ...otherParams } = request;
  
  const deepgramRequest: any = {
    ...otherParams
  };

  // Map unified parameters to Deepgram parameters
  if (language) {
    deepgramRequest.language = language;
  }
  
  if (timestamps) {
    deepgramRequest.utterances = true;
  }
  
  if (word_confidence) {
    deepgramRequest.smart_format = true;
  }
  
  if (speaker_labels) {
    deepgramRequest.diarize = true;
  }

  return deepgramRequest;
}

export function adaptResponse(response: any): TranscriptionResult {
  const words: Word[] = [];
  const segments: Segment[] = [];

  // Handle Deepgram response structure
  if (response.results?.channels?.[0]?.alternatives?.[0]) {
    const alternative = response.results.channels[0].alternatives[0];
    
    // Extract words with timestamps and confidence
    if (alternative.words) {
      alternative.words.forEach((word: any) => {
        words.push({
          text: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence,
          speaker: word.speaker?.toString()
        });
      });
    }

    // Extract utterances/segments
    if (response.results.utterances) {
      response.results.utterances.forEach((utterance: any) => {
        segments.push({
          text: utterance.transcript,
          start: utterance.start,
          end: utterance.end,
          speaker: utterance.speaker?.toString()
        });
      });
    }

    return {
      text: alternative.transcript,
      language: response.metadata?.language || 'unknown',
      confidence: alternative.confidence,
      words,
      segments
    };
  }

  // Fallback for unexpected response structure
  return {
    text: response.transcript || '',
    language: 'unknown',
    confidence: undefined,
    words: [],
    segments: []
  };
}