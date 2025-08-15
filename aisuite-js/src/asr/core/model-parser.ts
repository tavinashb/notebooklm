export function parseModel(model: string): { provider: string; model: string } {
  const parts = model.split(':');
  
  if (parts.length !== 2) {
    throw new Error(
      `Invalid model format: "${model}". Expected format: "provider:model"`
    );
  }
  
  const [provider, modelName] = parts;
  
  if (!provider || !modelName) {
    throw new Error(
      `Invalid model format: "${model}". Both provider and model name are required.`
    );
  }
  
  return { provider, model: modelName };
}