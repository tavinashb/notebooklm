export { ASRClient } from "./client";
export * from "./types";
export * from "./core/errors";
export { parseModel } from "./core/model-parser";

// Re-export providers for advanced usage
export {
  OpenAIASRProvider,
  DeepgramASRProvider,
  GoogleCloudASRProvider,
} from "./providers";