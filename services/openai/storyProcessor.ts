import { Story, StoryContext, StoryStep, StoryTheme, UserProfile } from '../../types/story';
import { ImageGenerator } from './imageGenerator';

export class StoryProcessor {
  static processStorySteps(
    rawSteps: any[], 
    theme: StoryTheme, 
    images?: PromiseSettledResult<string>[],
    storyContext?: StoryContext
  ): StoryStep[] {
    return rawSteps.map((step: any, i: number) => ({
      id: step.id || `step${i + 1}`,
      image: images 
        ? (images[i].status === 'fulfilled' ? images[i].value : ImageGenerator.getDevelopmentPlaceholder(i + 1, theme))
        : ImageGenerator.getDevelopmentPlaceholder(i + 1, theme),
      text: step.text || 'Historie tekst mangler...',
      choices: Array.isArray(step.choices) ? step.choices.map((choice: any) => ({
        id: choice.id,
        text: choice.text,
        isCorrect: choice.isCorrect || false,
        nextStepId: choice.nextStepId,
        failureInfo: choice.failureInfo ? {
          text: choice.failureInfo.text,
          moralLesson: choice.failureInfo.moralLesson
        } : undefined
      })) : [],
      isEnding: step.isEnding || false
    }));
  }

  static assembleStory(
    id: string, 
    title: string, 
    theme: StoryTheme, 
    protagonist: UserProfile, 
    steps: StoryStep[],
    storyContext?: StoryContext
  ): Story {
    return {
      id,
      title,
      theme: theme.title,
      protagonist,
      steps,
      currentStepId: steps[0]?.id || 'step1',
      choicesMade: [],
      choiceSequence: [],
      storyContext,
      createdAt: new Date(),
      completed: false,
      completedCorrectly: false,
      wrongChoicesCount: 0,
      retryAttempts: 0
    };
  }

  static async generateStoryImages(
    steps: any[],
    theme: StoryTheme,
    protagonist: UserProfile,
    storyContext?: { settingDetails: string; characterDescription: string },
    storyId?: string,
    abortSignal?: AbortSignal
  ): Promise<PromiseSettledResult<string>[]> {
    const imagePromises = steps.map((step: any, i: number) => {
      const sceneContext = step.sceneContext || `${protagonist.name} in ${theme.title} adventure, step ${i + 1}`;
      const settingDetails = storyContext?.settingDetails || theme.description;
      
      return ImageGenerator.generateImageWithRetry(
        ImageGenerator.generateImagePrompt(theme, protagonist, sceneContext, settingDetails, storyId), 
        abortSignal
      ).catch(error => {
        console.warn(`Image ${i + 1} failed:`, error);
        return ImageGenerator.getDevelopmentPlaceholder(i + 1, theme);
      });
    });

    return Promise.allSettled(imagePromises);
  }
}