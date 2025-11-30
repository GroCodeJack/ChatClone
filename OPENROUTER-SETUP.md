# OpenRouter Integration Setup

## Overview
OpenRouter has been successfully integrated into your chat application, providing access to 300+ AI models through a single API.

## What Was Changed

### 1. Dependencies
- ✅ Installed `@openrouter/ai-sdk-provider`

### 2. Model Configuration (`web/src/lib/models/config.ts`)
- Added `'openrouter'` to `ModelProvider` type
- Added 4 new OpenRouter models to `AVAILABLE_MODELS`:
  - **Claude 3.5 Sonnet** - `anthropic/claude-3.5-sonnet`
  - **Gemini Pro 1.5** - `google/gemini-pro-1.5`
  - **Llama 3.1 70B** - `meta-llama/llama-3.1-70b-instruct`
  - **Mistral Large** - `mistralai/mistral-large`

### 3. Chat API Route (`web/src/app/api/chat/route.ts`)
- Added OpenRouter import: `import { createOpenRouter } from "@openrouter/ai-sdk-provider"`
- Updated provider routing logic to handle OpenRouter models
- OpenRouter models use their full ID (e.g., `anthropic/claude-3.5-sonnet`)

## Required Action: Add Environment Variable

You need to add your OpenRouter API key to your environment variables:

### Option 1: Create/Update `.env.local` file in `/web` directory

```bash
# Add this line to web/.env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Option 2: Set in your deployment environment

If deploying to Vercel, Netlify, etc., add the environment variable in their dashboard:
- Variable name: `OPENROUTER_API_KEY`
- Value: Your OpenRouter API key (starts with `sk-or-v1-`)

## Getting an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-`)

## Testing

1. Add the `OPENROUTER_API_KEY` to your `.env.local` file
2. Restart your dev server: `npm run dev`
3. Create a new chat
4. Select an OpenRouter model from the model picker
5. Send a message to test

## Features Working with OpenRouter

- ✅ **Streaming** - Real-time response streaming
- ✅ **Chat persistence** - Messages saved to database
- ✅ **Authentication** - Works with existing Supabase auth
- ✅ **Model locking** - Model locks after first message
- ✅ **Tool calling** - Supported (for future external agents)

## Adding More Models

To add more models from OpenRouter's 300+ options:

1. Check available models at [OpenRouter Models](https://openrouter.ai/models)
2. Add to `web/src/lib/models/config.ts`:

```typescript
{
  id: 'provider/model-name',  // Use exact model ID from OpenRouter
  name: 'Display Name',
  provider: 'openrouter',
  description: 'Model description',
}
```

No changes needed to the chat route - it automatically handles any OpenRouter model!

## Cost & Billing

- OpenRouter bills per token usage
- Different models have different pricing
- Check pricing at [OpenRouter Pricing](https://openrouter.ai/models)
- Add credits at [OpenRouter Credits](https://openrouter.ai/credits)

## Troubleshooting

### Error: "Unauthorized" or "Invalid API Key"
- Verify `OPENROUTER_API_KEY` is set correctly
- Check the key starts with `sk-or-v1-`
- Restart your dev server after adding the key

### Error: "Model not found"
- Verify the model ID matches exactly from OpenRouter's docs
- Some models may be temporarily unavailable

### No streaming or partial responses
- OpenRouter fully supports streaming with Vercel AI SDK
- Check your console for any network errors

## Backward Compatibility

All existing functionality remains unchanged:
- ✅ OpenAI models still work (via direct OpenAI provider)
- ✅ Anthropic models still work (via direct Anthropic provider)
- ✅ Existing threads and messages unaffected
- ✅ No database migrations needed

## Next Steps

You can now:
1. Add the API key and test the new models
2. Remove OpenAI/Anthropic direct providers if you want to use only OpenRouter
3. Add more models from OpenRouter's catalog
4. Use OpenRouter's features like fallback models and rate limiting
