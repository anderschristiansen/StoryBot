import { openai } from './client';
import { storyPrompts, promptHelpers } from '../../prompts';
import { StoryTheme, UserProfile } from '../../types/story';

export interface RawStoryData {
  title: string;
  steps: any[];
  storyContext?: {
    settingDetails: string;
    characterDescription: string;
  };
}

export class StoryGenerator {
  private static getModelForProfile(protagonist: UserProfile): string {
    return promptHelpers.getModelForPreference(protagonist.modelPreference);
  }

  private static getMaxTokensForProfile(protagonist: UserProfile): number {
    return promptHelpers.getMaxTokensForPreference(protagonist.modelPreference);
  }

  static async generateStoryStructure(
    theme: StoryTheme, 
    protagonist: UserProfile,
    abortSignal?: AbortSignal
  ): Promise<RawStoryData> {
    const model = this.getModelForProfile(protagonist);
    const maxTokens = this.getMaxTokensForProfile(protagonist);
    
    console.log(`[StoryGen] Using ${model} for user preference: ${protagonist.modelPreference || 'standard'}`);
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: storyPrompts.systemPrompt
        },
        {
          role: "user",
          content: storyPrompts.generateStoryPrompt(theme, protagonist)
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    }, { signal: abortSignal });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Intet svar fra OpenAI');
    }

    const finishReason = completion.choices[0]?.finish_reason;
    if (finishReason === 'length') {
      console.warn('[StoryGen] Response was truncated due to max_tokens limit');
    }

    return this.parseStoryResponse(responseContent, finishReason, protagonist, theme);
  }

  private static parseStoryResponse(
    responseContent: string, 
    finishReason: string | null,
    protagonist: UserProfile,
    theme: StoryTheme
  ): RawStoryData {
    let storyData;
    
    try {
      console.log('[StoryGen] Parsing JSON response...');
      console.log('[StoryGen] Response length:', responseContent.length, 'Finish reason:', finishReason);
      storyData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('[StoryGen] Failed to parse OpenAI response:', parseError);
      console.error('[StoryGen] Raw response content (first 800 chars):', responseContent.substring(0, 800));
      console.error('[StoryGen] Raw response content (last 200 chars):', responseContent.substring(-200));
      
      // Try to fix truncated JSON
      if (finishReason === 'length') {
        storyData = this.attemptJsonFix(responseContent);
      }
      
      // Try to extract JSON from wrapped response
      if (!storyData) {
        storyData = this.extractJsonFromResponse(responseContent);
      }
      
      if (!storyData) {
        throw new Error(`JSON parse fejl: ${parseError instanceof Error ? parseError.message : 'Ukendt fejl'}. Prøv igen med færre historie-trin.`);
      }
    }
    
    return this.validateStoryStructure(storyData, protagonist, theme);
  }

  private static attemptJsonFix(responseContent: string): any {
    console.log('[StoryGen] Attempting to fix truncated JSON...');
    let fixedJson = responseContent.trim();
    
    const openBraces = (fixedJson.match(/\{/g) || []).length;
    const closeBraces = (fixedJson.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;
    
    for (let i = 0; i < missingBraces; i++) {
      fixedJson += '}';
    }
    
    fixedJson = fixedJson.replace(/,\s*}/g, '}');
    
    try {
      console.log('[StoryGen] Attempting to parse fixed JSON...');
      const parsed = JSON.parse(fixedJson);
      console.log('[StoryGen] Successfully parsed fixed JSON');
      return parsed;
    } catch (fixError) {
      console.error('[StoryGen] Failed to fix truncated JSON:', fixError);
      return null;
    }
  }

  private static extractJsonFromResponse(responseContent: string): any {
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        console.log('[StoryGen] Attempting to extract JSON from wrapped response...');
        return JSON.parse(jsonMatch[0]);
      } catch (secondParseError) {
        console.error('[StoryGen] Second parse attempt failed:', secondParseError);
      }
    }
    return null;
  }

  private static validateStoryStructure(
    storyData: any, 
    protagonist: UserProfile, 
    theme: StoryTheme
  ): RawStoryData {
    if (!storyData.steps || !Array.isArray(storyData.steps) || storyData.steps.length === 0) {
      console.error('[StoryGen] Invalid story structure received:', storyData);
      throw new Error('OpenAI returnerede en ufuldstændig historie. Prøv igen.');
    }
    
    if (!storyData.title || typeof storyData.title !== 'string') {
      console.warn('[StoryGen] Missing or invalid title, using default');
      storyData.title = `${protagonist.name}s ${theme.title} Eventyr`;
    }
    
    console.log(`[StoryGen] Story validation passed: ${storyData.steps.length} steps received`);
    return storyData as RawStoryData;
  }
}