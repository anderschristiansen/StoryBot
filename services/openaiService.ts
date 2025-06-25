import { Story, StoryTheme, UserProfile } from '../types/story';
import { ImageGenerator } from './openai/imageGenerator';
import { OutcomeGenerator } from './openai/outcomeGenerator';
import { StoryGenerator } from './openai/storyGenerator';
import { StoryProcessor } from './openai/storyProcessor';

export interface StoryGenerationRequest {
  theme: StoryTheme;
  protagonist: UserProfile;
  onProgress?: (message: string, step: number, totalSteps: number) => void;
  abortSignal?: AbortSignal;
}

export class OpenAIService {
  static async generateStory({ 
    theme, 
    protagonist, 
    onProgress, 
    abortSignal 
  }: StoryGenerationRequest): Promise<Story> {
    const enableImages = protagonist.enableImages ?? true;
    let storySteps = protagonist.storySteps || 5;
    
    // Limit story steps for standard model to avoid token limits  
    if ((protagonist.modelPreference || 'standard') === 'standard' && storySteps > 7) {
      console.log(`[StoryGen] Limiting steps from ${storySteps} to 7 for standard model`);
      storySteps = 7;
    }
    
    const totalSteps = enableImages ? 3 : 2;
    let currentStep = 0;
    
    const updateProgress = (message: string) => {
      currentStep++;
      onProgress?.(message, currentStep, totalSteps);
    };

    try {
      updateProgress('Genererer historie...');
      
      // 1. Generate story structure
      const storyData = await StoryGenerator.generateStoryStructure(
        theme, 
        protagonist, 
        abortSignal
      );
      
      const storyId = `story_${Date.now()}`;
      
      // Create story context from generated data
      const storyContext = storyData.storyContext ? {
        previousEvents: [],
        characterDevelopment: [],
        settingDetails: storyData.storyContext.settingDetails,
        characterDescription: storyData.storyContext.characterDescription
      } : undefined;
      
      if (enableImages) {
        updateProgress('Genererer billeder for historie-trin...');
        
        // 2. Generate images for story steps with enhanced context
        const images = await StoryProcessor.generateStoryImages(
          storyData.steps,
          theme,
          protagonist,
          storyData.storyContext,
          storyId,
          abortSignal
        );
        
        console.log(`[StoryGen] Generated ${images.length} images for ${storyData.steps.length} story steps`);
        
        // 3. Process and assemble story with images and context
        const processedSteps = StoryProcessor.processStorySteps(storyData.steps, theme, images, storyContext);
        updateProgress('Samler historie...');
        return StoryProcessor.assembleStory(storyId, storyData.title, theme, protagonist, processedSteps, storyContext);
      } else {
        // Process steps without images but with context
        const processedSteps = StoryProcessor.processStorySteps(storyData.steps, theme, undefined, storyContext);
        updateProgress('Samler historie...');
        return StoryProcessor.assembleStory(storyId, storyData.title, theme, protagonist, processedSteps, storyContext);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CANCELLED');
      }
      
      console.error('[StoryGen] Detailed error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('API nøgle problem. Tjek konfiguration.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('For mange forespørgsler. Prøv igen om lidt.');
        }
        if (error.message.includes('insufficient_quota') || error.message.includes('quota') || error.message.includes('billing')) {
          throw new Error('OpenAI kredit opbrugt. Tjek din OpenAI konto.');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Netværksfejl. Tjek internetforbindelse.');
        }
        console.error('[StoryGen] Original error message:', error.message);
      }
      
      throw new Error('Kunne ikke generere historie. Prøv igen.');
    }
  }

  static async generateImage(prompt: string, abortSignal?: AbortSignal): Promise<string> {
    return ImageGenerator.generateImageWithRetry(prompt, abortSignal);
  }

  static generateDevelopmentPlaceholder(stepNumber: number, theme: StoryTheme): string {
    return ImageGenerator.getDevelopmentPlaceholder(stepNumber, theme);
  }

  static async generateStoryOutcome(story: Story): Promise<string> {
    return OutcomeGenerator.generateStoryOutcome(story);
  }

}