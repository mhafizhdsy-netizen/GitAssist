import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: {
        'gemini-2.5-flash': {model: 'gemini-2.5-flash-preview-0514'},
      },
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
