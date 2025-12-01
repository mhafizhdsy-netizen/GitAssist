
'use server';

/**
 * @fileOverview A flow for refining user-provided text for issues or releases.
 *
 * - refineDescription - A function that refines a description.
 * - RefineDescriptionInput - The input type for the refineDescription function.
 * - RefineDescriptionOutput - The output type for the refineDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineDescriptionInputSchema = z.object({
  text: z
    .string()
    .describe('The user-written text to be refined.'),
  context: z
    .enum(['issue', 'release notes'])
    .describe('The context for the text, helping to tailor the refinement.')
});
export type RefineDescriptionInput = z.infer<typeof RefineDescriptionInputSchema>;

const RefineDescriptionOutputSchema = z.object({
  refinedText: z.string().describe('The AI-refined version of the text.'),
});
export type RefineDescriptionOutput = z.infer<typeof RefineDescriptionOutputSchema>;

export async function refineDescription(input: RefineDescriptionInput): Promise<RefineDescriptionOutput> {
  return refineDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineDescriptionPrompt',
  input: {schema: RefineDescriptionInputSchema},
  output: {schema: RefineDescriptionOutputSchema},
  prompt: `You are an expert technical writer. Your task is to refine the following text provided by a user for a GitHub {{context}}.

Analyze the user's text and improve it by:
- Correcting spelling and grammar.
- Improving clarity and conciseness.
- Structuring the text logically (e.g., using Markdown for lists, code blocks).
- Ensuring a professional and clear tone.
- If it's an 'issue', make sure it clearly describes the problem, steps to reproduce, and expected behavior.
- If it's 'release notes', make sure it's well-organized, highlighting new features, bug fixes, and other changes.

Do NOT change the core meaning of the user's text. Only enhance its presentation and clarity.

Original Text:
'''
{{text}}
'''

Please provide only the refined text as your output.
  `,
});

const refineDescriptionFlow = ai.defineFlow(
  {
    name: 'refineDescriptionFlow',
    inputSchema: RefineDescriptionInputSchema,
    outputSchema: RefineDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
