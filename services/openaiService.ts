import OpenAI from 'openai';
import { Story, StoryStep, UserProfile, StoryTheme } from '../types/story';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface StoryGenerationRequest {
  theme: StoryTheme;
  protagonist: UserProfile;
  onProgress?: (message: string, step: number, totalSteps: number) => void;
  abortSignal?: AbortSignal;
}

export class OpenAIService {
  // Optimized prompt with nested failure structure
  private static generateStoryPrompt(theme: StoryTheme, protagonist: UserProfile): string {
    const storySteps = protagonist.storySteps || 5; // Default 5 steps if not set
    
    return `Create an interactive Danish children's story for ${protagonist.name} (${protagonist.age} years old, ${protagonist.gender}).

Theme: ${theme.title} - ${theme.description}

STORY STRUCTURE:
- ${storySteps} story steps, each with exactly 3 choices (1 correct + 2 wrong)
- 1 happy ending (only reachable via correct choices)
- Wrong choices contain inline failure explanations

CHOICE RULES:
- Correct choice: shows kindness, honesty, helpfulness (isCorrect: true, has nextStepId)
- Wrong choices: show selfishness, lying, greed (isCorrect: false, has failureInfo)
- Failure info includes explanation and moral lesson

LANGUAGE:
- Write ALL story text in perfect Danish
- Use age-appropriate vocabulary for ${protagonist.age}-year-olds
- Natural Danish grammar and sentence structure

Return ONLY valid JSON:

{
  "title": "Story title in Danish",
  "steps": [
    {
      "id": "step1",
      "text": "Story situation in natural Danish for ${protagonist.age}-year-old",
      "choices": [
        {
          "id": "choice1_correct",
          "text": "Correct moral action in Danish",
          "isCorrect": true,
          "nextStepId": "step2"
        },
        {
          "id": "choice1_wrong1",
          "text": "Wrong selfish action in Danish",
          "isCorrect": false,
          "failureInfo": {
            "text": "Kind explanation of why this choice was wrong, in Danish",
            "moralLesson": "What the child should learn from this mistake"
          }
        },
        {
          "id": "choice1_wrong2",
          "text": "Another wrong action in Danish",
          "isCorrect": false,
          "failureInfo": {
            "text": "Kind explanation of why this choice was wrong, in Danish",
            "moralLesson": "Another moral lesson"
          }
        }
      ]
    },
    ${Array.from({length: storySteps - 1}, (_, i) => `{"id":"step${i + 2}","text":"Danish story ${i + 2}","choices":[{"id":"choice${i + 2}_correct","text":"Correct choice","isCorrect":true,"nextStepId":"${i + 2 === storySteps - 1 ? 'ending' : `step${i + 3}`}"},{"id":"choice${i + 2}_wrong1","text":"Wrong choice 1","isCorrect":false,"failureInfo":{"text":"Explanation","moralLesson":"Lesson"}},{"id":"choice${i + 2}_wrong2","text":"Wrong choice 2","isCorrect":false,"failureInfo":{"text":"Explanation","moralLesson":"Lesson"}}]}`).join(',')},
    {
      "id": "ending",
      "text": "Happy ending in Danish, congratulating moral choices",
      "isEnding": true,
      "choices": []
    }
  ]
}`;
  }

  private static generateImagePrompt(stepNumber: number, theme: StoryTheme, protagonist: UserProfile): string {
    const genderDesc = protagonist.gender === 'dreng' ? 'boy' : 'girl';
    
    return `Children's book illustration: ${protagonist.age}-year-old ${genderDesc} in ${theme.title} adventure.
Style: Pixar-like, warm colors, child-friendly.
Character: consistent appearance, round face, friendly expression.
Scene ${stepNumber}: engaging, safe, colorful background.
High quality digital art, professional children's book style.`;
  }

  static async generateStory({ theme, protagonist, onProgress, abortSignal }: StoryGenerationRequest): Promise<Story> {
    const enableImages = protagonist.enableImages ?? true;
    let storySteps = protagonist.storySteps || 5;
    
    // Limit story steps for complex themes to avoid token limits
    const isComplexTheme = ['Rumrejsende', 'Drageridder', 'Ninja Kriger'].includes(theme.title);
    if (isComplexTheme && storySteps > 7) {
      console.log(`[StoryGen] Limiting steps from ${storySteps} to 7 for complex theme: ${theme.title}`);
      storySteps = 7;
    }
    
    const totalSteps = enableImages ? 3 : 2; // story generation + parallel images + assembly
    let currentStep = 0;
    
    const updateProgress = (message: string) => {
      currentStep++;
      onProgress?.(message, currentStep, totalSteps);
    };

    try {
      updateProgress('Genererer historie...');
      
      // 1. Generate story structure (smart model selection)
      const model = isComplexTheme ? "gpt-4" : "gpt-3.5-turbo-1106";
      
      console.log(`[StoryGen] Using ${model} for theme: ${theme.title}`);
      
      const completion = await openai.chat.completions.create({
        model, // Smart selection: GPT-4 for complex themes, GPT-3.5 for simple ones
        messages: [
          {
            role: "system",
            content: "Du er børnebogsforfatter. Skriv engagerende historier på perfekt dansk med moral-valg."
          },
          {
            role: "user",
            content: this.generateStoryPrompt(theme, protagonist)
          }
        ],
        max_tokens: isComplexTheme ? 4000 : 3500, // More tokens for complex themes
        temperature: 0.7
      }, { signal: abortSignal });

      // Parse and validate the response
      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('Intet svar fra OpenAI');
      }
      
      // Check if response was truncated
      const finishReason = completion.choices[0]?.finish_reason;
      if (finishReason === 'length') {
        console.warn('[StoryGen] Response was truncated due to max_tokens limit');
        console.warn('[StoryGen] Response length:', responseContent.length);
      }
      
      let storyData;
      try {
        console.log('[StoryGen] Parsing JSON response...');
        console.log('[StoryGen] Response length:', responseContent.length, 'Finish reason:', finishReason);
        storyData = JSON.parse(responseContent);
      } catch (parseError) {
        console.error('[StoryGen] Failed to parse OpenAI response:', parseError);
        console.error('[StoryGen] Raw response content (first 800 chars):', responseContent.substring(0, 800));
        console.error('[StoryGen] Raw response content (last 200 chars):', responseContent.substring(-200));
        
        // If truncated, try to complete the JSON
        if (finishReason === 'length') {
          console.log('[StoryGen] Attempting to fix truncated JSON...');
          let fixedJson = responseContent.trim();
          
          // Count open braces to determine how many to close
          const openBraces = (fixedJson.match(/\{/g) || []).length;
          const closeBraces = (fixedJson.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          // Add missing closing braces
          for (let i = 0; i < missingBraces; i++) {
            fixedJson += '}';
          }
          
          // Remove any trailing commas before closing braces
          fixedJson = fixedJson.replace(/,\s*}/g, '}');
          
          try {
            console.log('[StoryGen] Attempting to parse fixed JSON...');
            storyData = JSON.parse(fixedJson);
            console.log('[StoryGen] Successfully parsed fixed JSON');
          } catch (fixError) {
            console.error('[StoryGen] Failed to fix truncated JSON:', fixError);
          }
        }
        
        // If still failed, try to extract JSON from response
        if (!storyData) {
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              console.log('[StoryGen] Attempting to extract JSON from wrapped response...');
              storyData = JSON.parse(jsonMatch[0]);
            } catch (secondParseError) {
              console.error('[StoryGen] Second parse attempt failed:', secondParseError);
            }
          }
        }
        
        if (!storyData) {
          throw new Error(`JSON parse fejl: ${parseError instanceof Error ? parseError.message : 'Ukendt fejl'}. Prøv igen med færre historie-trin.`);
        }
      }
      
      // Validate that we have a proper story structure
      if (!storyData.steps || !Array.isArray(storyData.steps) || storyData.steps.length === 0) {
        console.error('[StoryGen] Invalid story structure received:', storyData);
        throw new Error('OpenAI returnerede en ufuldstændig historie. Prøv igen.');
      }
      
      // Validate title
      if (!storyData.title || typeof storyData.title !== 'string') {
        console.warn('[StoryGen] Missing or invalid title, using default');
        storyData.title = `${protagonist.name}s ${theme.title} Eventyr`;
      }
      
      const storyId = `story_${Date.now()}`;
      console.log(`[StoryGen] Story validation passed: ${storyData.steps.length} steps received`);
      
      if (enableImages) {
        updateProgress('Genererer billeder for historie-trin...');
        
        // Generate images only for story steps (no failure images needed)
        const imagePromises = storyData.steps.map((_: any, i: number) => 
          this.generateImage(
            this.generateImagePrompt(i + 1, theme, protagonist), 
            abortSignal
          ).catch(error => {
            console.warn(`Image ${i + 1} failed:`, error);
            return this.generateDevelopmentPlaceholder(i + 1, theme);
          })
        );

        // Wait for all images with progress tracking
        const images = await Promise.allSettled(imagePromises);
        
        console.log(`[StoryGen] Generated ${images.length} images for ${storyData.steps.length} story steps`);
        
        // Process all steps with images
        const processedSteps = this.processStorySteps(storyData.steps, theme, images);
        updateProgress('Samler historie...');
        return this.assembleStory(storyId, storyData.title, theme, protagonist, processedSteps);
      } else {
        // Process steps without images
        const processedSteps = this.processStorySteps(storyData.steps, theme);
        updateProgress('Samler historie...');
        return this.assembleStory(storyId, storyData.title, theme, protagonist, processedSteps);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CANCELLED');
      }
      throw new Error('Kunne ikke generere historie. Prøv igen.');
    }
  }

  // Optimized step processing with nested failure structure
  private static processStorySteps(
    rawSteps: any[], 
    theme: StoryTheme, 
    images?: PromiseSettledResult<string>[]
  ): StoryStep[] {
    return rawSteps.map((step: any, i: number) => ({
      id: step.id || `step${i + 1}`,
      image: images 
        ? (images[i].status === 'fulfilled' ? images[i].value : this.generateDevelopmentPlaceholder(i + 1, theme))
        : this.generateDevelopmentPlaceholder(i + 1, theme),
      text: step.text || 'Historie tekst mangler...',
      choices: Array.isArray(step.choices) ? step.choices.map((choice: any) => ({
        id: choice.id,
        text: choice.text,
        isCorrect: choice.isCorrect || false,
        // Handle both old and new choice structures for compatibility
        nextStepId: choice.nextStepId,
        failureInfo: choice.failureInfo ? {
          text: choice.failureInfo.text,
          moralLesson: choice.failureInfo.moralLesson
        } : undefined
      })) : [],
      isEnding: step.isEnding || false
    }));
  }

  private static assembleStory(
    id: string, 
    title: string, 
    theme: StoryTheme, 
    protagonist: UserProfile, 
    steps: StoryStep[]
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
      createdAt: new Date(),
      completed: false,
      completedCorrectly: false,
      wrongChoicesCount: 0,
      retryAttempts: 0
    };
  }

  static async generateImage(prompt: string, abortSignal?: AbortSignal): Promise<string> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard", // Use "standard" instead of "hd" for speed
        style: "vivid"
      }, { signal: abortSignal });

      return response.data?.[0]?.url || this.generateFallbackPlaceholder();
    } catch (error) {
      console.warn('DALL-E generation failed:', error);
      
      // If rate limited, add a small delay and retry once
      if (error instanceof Error && error.message.includes('rate limit')) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
          }, { signal: abortSignal });
          
          return retryResponse.data?.[0]?.url || this.generateFallbackPlaceholder();
        } catch (retryError) {
          console.warn('DALL-E retry failed:', retryError);
        }
      }
      
      return this.generateFallbackPlaceholder();
    }
  }

  private static generateFallbackPlaceholder(): string {
    return `https://via.placeholder.com/1024x1024/E5C4B8/382017?text=${encodeURIComponent('Billede\nindlæses...\n\n📚')}`;
  }

  static generateDevelopmentPlaceholder(stepNumber: number, theme: StoryTheme): string {
    const emoji = '📖';
    const text = `Test\nBillede ${stepNumber}\n\n${emoji}\n\n${theme.title}`;
    return `https://via.placeholder.com/1024x1024/E5C4B8/2C3E50?text=${encodeURIComponent(text)}`;
  }

  static async generateStoryOutcome(story: Story): Promise<string> {
    try {
      const prompt = `Skriv en kort afslutning på denne børnehistorie på korrekt dansk:

Titel: ${story.title}
Tema: ${story.theme}
Hovedperson: ${story.protagonist.name} (${story.protagonist.age} år)
Fuldført korrekt: ${story.completedCorrectly ? 'Ja' : 'Nej'}

Skriv en varm, afsluttende tekst på 3-4 sætninger der:
- Fortæller hvordan historien slutter
- Roser ${story.protagonist.name}s valg og mod
- Giver en positiv besked om at lære af sine beslutninger
Brug korrekt dansk grammatik og naturlig børnesprog for ${story.protagonist.age}-årige.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106", // Use faster model for simple outcomes
        messages: [
          {
            role: "system",
            content: "Du er børnebogsforfatter. Skriv varme, afsluttende tekster til børnehistorier på perfekt dansk med naturlig sprogbrug for børn."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'Fantastisk historie! Du traf nogle virkelig gode beslutninger.';
    } catch (error) {
      console.error('Error generating story outcome:', error);
      return 'Fantastisk historie! Du traf nogle virkelig gode beslutninger.';
    }
  }
}