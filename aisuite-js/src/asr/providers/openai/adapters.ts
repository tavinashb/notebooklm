import { TranscriptionRequest, TranscriptionResult, Word, Segment } from '../../types';

export function adaptRequest(request: TranscriptionRequest): any {
  const { file, model, language, timestamps, temperature, ...otherParams } = request;
  
  const openaiRequest: any = {
    file,
    model,
    language,
    temperature,
    ...otherParams
  };

  // Handle timestamps - OpenAI uses response_format for verbose output
  if (timestamps) {
    openaiRequest.response_format = 'verbose_json';
  }

  return openaiRequest;
}

export function adaptResponse(response: any): TranscriptionResult {
  const words: Word[] = [];
  const segments: Segment[] = [];

  // Handle verbose JSON response with word-level timestamps
  if (response.words) {
    response.words.forEach((word: any) => {
      words.push({
        text: word.word,
        start: word.start,
        end: word.end,
        confidence: word.confidence
      });
    });
  }

  // Handle segments if available
  if (response.segments) {
    response.segments.forEach((segment: any) => {
      segments.push({
        text: segment.text,
        start: segment.start,
        end: segment.end
      });
    });
  }

  return {
    text: response.text,
    language: response.language || 'unknown',
    confidence: response.confidence,
    words,
    segments
  };
}