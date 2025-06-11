
// src/ai/flows/writing-suggester-flow.ts
'use server';
/**
 * @fileOverview Provides AI-powered writing suggestions.
 *
 * - getWritingSuggestions - A function that generates writing suggestions based on input text.
 * - WritingSuggesterInput - The input type for the getWritingSuggestions function.
 * - WritingSuggesterOutput - The return type for the getWritingSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WritingSuggesterInputSchema = z.object({
  currentText: z.string().describe('The current text the user has written and wants suggestions for.'),
  storyGenre: z.string().optional().describe('The genre of the story (e.g., Sci-Fi, Fantasy, Romance).'),
  suggestionType: z.string().optional().describe('The specific type of suggestion needed (e.g., "plot twist", "character dialogue", "scene description", "continue writing").'),
});
export type WritingSuggesterInput = z.infer<typeof WritingSuggesterInputSchema>;

const WritingSuggesterOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 3-5 distinct writing suggestions based on the input.'),
});
export type WritingSuggesterOutput = z.infer<typeof WritingSuggesterOutputSchema>;

export async function getWritingSuggestions(input: WritingSuggesterInput): Promise<WritingSuggesterOutput> {
  return writingSuggesterFlow(input);
}

const writingSuggesterPrompt = ai.definePrompt({
  name: 'writingSuggesterPrompt',
  input: {schema: WritingSuggesterInputSchema},
  output: {schema: WritingSuggesterOutputSchema},
  prompt: `You are an expert creative writing assistant. Your goal is to help users overcome writer's block and enhance their stories.
Based on the provided text, and optionally the story's genre and the type of suggestion requested, please generate 3 distinct, creative, and relevant suggestions.
The suggestions should be concise and directly usable as continuations or improvements to the text.

Context:
Current Text:
{{{currentText}}}

{{#if storyGenre}}
Story Genre: {{{storyGenre}}}
{{/if}}

{{#if suggestionType}}
Type of Suggestion Needed: {{{suggestionType}}}
{{/if}}

Please provide your suggestions.`,
});

const writingSuggesterFlow = ai.defineFlow(
  {
    name: 'writingSuggesterFlow',
    inputSchema: WritingSuggesterInputSchema,
    outputSchema: WritingSuggesterOutputSchema,
  },
  async (input: WritingSuggesterInput) => {
    const {output} = await writingSuggesterPrompt(input);
    // Ensure there's always an output, and specifically the suggestions array.
    // If the model somehow fails to provide suggestions, return an empty array
    // instead of null/undefined to match the schema.
    return output ? output : { suggestions: [] };
  }
);
