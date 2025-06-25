import { imagePrompts } from '../../prompts/imageGeneration';
import { StoryTheme, UserProfile } from '../../types/story';
import { openai } from './client';

export class ImageGenerator {
  static async generateImageWithRetry(prompt: string, abortSignal?: AbortSignal): Promise<string> {
    const generate = async () =>
      await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      }, { signal: abortSignal });
  
    try {
      const response = await generate();
      return response.data?.[0]?.url || this.getFallbackPlaceholder();
    } catch (error) {
      console.warn('DALL-E generation failed:', error);
      if (error instanceof Error && error.message.includes('rate limit')) {
        await new Promise(res => setTimeout(res, 2000));
        try {
          const retry = await generate();
          return retry.data?.[0]?.url || this.getFallbackPlaceholder();
        } catch (retryError) {
          console.warn('DALL-E retry failed:', retryError);
        }
      }
      return this.getFallbackPlaceholder();
    }
  }

  static generateImagePrompt(
    theme: StoryTheme, 
    protagonist: UserProfile, 
    sceneContext?: string, 
    settingDetails?: string,
    storyId?: string
  ): string {
    if (sceneContext && settingDetails) {
      return imagePrompts.generateImagePrompt(theme, protagonist, sceneContext, settingDetails, storyId);
    } else {
      // Fallback to simple prompt for backward compatibility
      return imagePrompts.generateSimpleImagePrompt(1, theme, protagonist);
    }
  }

  static getFallbackPlaceholder(): string {
    return imagePrompts.placeholderUrls.fallback;
  }

  static getDevelopmentPlaceholder(stepNumber: number, theme: StoryTheme): string {
    return imagePrompts.placeholderUrls.development(stepNumber, theme);
  }
}