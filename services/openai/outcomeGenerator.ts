import { openai } from './client';
import { outcomePrompts } from '../../prompts/storyOutcome';
import { Story } from '../../types/story';

export class OutcomeGenerator {
  static async generateStoryOutcome(story: Story): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            role: "system",
            content: outcomePrompts.systemPrompt
          },
          {
            role: "user",
            content: outcomePrompts.generateOutcomePrompt(story)
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || outcomePrompts.defaultOutcome;
    } catch (error) {
      console.error('Error generating story outcome:', error);
      return outcomePrompts.defaultOutcome;
    }
  }
}