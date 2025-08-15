export interface RequestOptions {
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

export type AudioInput = string | Buffer | Uint8Array;