// src/ai/flows/notification-summarizer.ts
'use server';

/**
 * @fileOverview Summarizes notifications for a user.
 *
 * - summarizeNotifications - A function that summarizes notifications.
 * - SummarizeNotificationsInput - The input type for the summarizeNotifications function.
 * - SummarizeNotificationsOutput - The return type for the summarizeNotifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotificationsInputSchema = z.object({
  notifications: z
    .array(z.string())
    .describe('An array of notification messages to summarize.'),
});
export type SummarizeNotificationsInput = z.infer<typeof SummarizeNotificationsInputSchema>;

const SummarizeNotificationsOutputSchema = z.object({
  summary: z.string().describe('A summary of the notifications.'),
  shouldHighlight: z.boolean().describe('Whether or not these notifications are important enough to highlight to the user.'),
});
export type SummarizeNotificationsOutput = z.infer<typeof SummarizeNotificationsOutputSchema>;

export async function summarizeNotifications(input: SummarizeNotificationsInput): Promise<SummarizeNotificationsOutput> {
  return summarizeNotificationsFlow(input);
}

const summarizeNotificationsPrompt = ai.definePrompt({
  name: 'summarizeNotificationsPrompt',
  input: {schema: SummarizeNotificationsInputSchema},
  output: {schema: SummarizeNotificationsOutputSchema},
  prompt: `You are a notification summarizer.  You will receive a list of notifications and summarize them into a single message. You will also decide if the notifications are important enough to highlight to the user. If the notifications contain important information, such as a new follower, or a new comment on their story, you should set the shouldHighlight field to true. Otherwise, set it to false.

Notifications:
{{#each notifications}}
- {{{this}}}
{{/each}}
`,
});

const summarizeNotificationsFlow = ai.defineFlow(
  {
    name: 'summarizeNotificationsFlow',
    inputSchema: SummarizeNotificationsInputSchema,
    outputSchema: SummarizeNotificationsOutputSchema,
  },
  async input => {
    const {output} = await summarizeNotificationsPrompt(input);
    return output!;
  }
);
