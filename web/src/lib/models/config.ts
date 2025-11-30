// Model configuration for the chat application
export type ModelProvider = 'openai' | 'anthropic' | 'openrouter';

export type ModelConfig = {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
};

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Latest flagship models via OpenRouter
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openrouter',
    description: 'Latest generation OpenAI model',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'openrouter',
    description: 'Next generation Claude model',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    provider: 'openrouter',
    description: 'Google\'s latest Gemini preview model',
  },
  // Direct provider models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable OpenAI model with vision and advanced reasoning',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Faster and more affordable version of GPT-4o',
  },
  {
    id: 'haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fast and efficient Claude model for quick responses',
  },
  // OpenRouter models - access to 300+ models
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    description: 'Most capable Claude model via OpenRouter',
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'openrouter',
    description: 'Google\'s latest multimodal model',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'openrouter',
    description: 'Meta\'s powerful open model',
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'openrouter',
    description: 'Mistral\'s flagship model',
  },
];

export const getModelById = (id: string): ModelConfig | undefined => {
  return AVAILABLE_MODELS.find((model) => model.id === id);
};

export const getDefaultModel = (): ModelConfig => {
  return AVAILABLE_MODELS[0]; // GPT-5.1 as default
};
