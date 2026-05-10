import 'server-only'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

/**
 * Central place to switch the chat model.
 *
 * To swap providers (e.g. Anthropic, OpenAI) replace the export of `chatModel`
 * with the equivalent provider call from another `@ai-sdk/*` package.
 * The rest of the codebase consumes only `chatModel` and `googleProvider`.
 */

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey && process.env.NODE_ENV !== 'production') {
  console.warn('[ai/provider] GEMINI_API_KEY is not set — assistant calls will fail at runtime')
}

export const googleProvider = createGoogleGenerativeAI({ apiKey })

// Configurable via env so we can swap models without a redeploy.
// Default matches the model name requested for this project.
const MODEL_ID = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite-preview'

export const chatModel = googleProvider(MODEL_ID)
export const chatModelId = MODEL_ID
