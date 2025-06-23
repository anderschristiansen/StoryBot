import OpenAI from 'openai';
import { Story, StoryStep, UserProfile, StoryTheme } from '../types/story';

// Initialize OpenAI client with environment variable
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
  private static generateStoryPrompt(theme: StoryTheme, protagonist: UserProfile): string {
    return `Du skal skrive en interaktiv børnehistorie på PERFEKT DANSK til ${protagonist.name}, som er ${protagonist.age} år gammel og identificerer sig som ${protagonist.gender}.

Tema: ${theme.title} - ${theme.description}

KRAV TIL DANSK SPROG (MEGET VIGTIGT):
- Brug KUN korrekt dansk grammatik, stavning og tegnsætning
- Skriv naturligt dansk, som danske børn taler og forstår
- Brug alderssvarende ordforråd til ${protagonist.age}-årige
- Undgå anglicismer og direkte oversættelser
- Brug korrekte danske vendinger og udtryk
- Sørg for korrekt bøjning af navneord, tillægsord og udsagnsord
- Brug dansk sætningsopbygning (subjekt-verbum-objekt)

HISTORIESTRUKTUR:
- Præcis 6 trin inklusiv slutningen
- Trin 1-5: Hver har 2-3 handlingsmuligheder
- Trin 6: Slutningen med "isEnding": true og choices: []
- Historien skal være positiv, lærerig og engagerende
- ${protagonist.name} er hovedpersonen gennem hele historien
- Valgene skal påvirke historiens udvikling

VALGKLASSIFICERING (MEGET VIGTIGT):
- Klassificer hvert valg som en af: "courage" (mod), "wisdom" (visdom), "kindness" (snilhed)
- Tildel 1-3 point baseret på hvor godt valget repræsenterer egenskaben
- courage: Modige, eventyrlige valg der kræver tapperhed
- wisdom: Tænksomme, kloge valg der viser god dømmekraft
- kindness: Venlige, hjælpsomme valg der viser omtanke for andre

Format dit svar som JSON:
{
  "title": "Spændende dansk historietitel",
  "steps": [
    {
      "id": "step1", 
      "text": "Engagerende historietekst på naturligt dansk. Brug korrekt grammatik, stavning og dansk sætningsbyggning. Skriv som en dansker ville fortælle historien til et barn.",
      "imagePrompt": "Detailed English description for DALL-E image generation",
      "choices": [
        {
          "id": "choice1_1",
          "text": "Handlingsmulighed beskrevet på naturligt dansk",
          "nextStepId": "step2",
          "consequences": "Konsekvens beskrevet på korrekt dansk",
          "choiceType": "courage",
          "points": 2
        }
      ],
      "isEnding": false
    },
    {
      "id": "step6",
      "text": "Tilfredsstillende afslutning på historien skrevet på perfekt dansk med korrekt grammatik og naturlig sætningsopbygning.",
      "imagePrompt": "Final scene description for DALL-E",
      "choices": [],
      "isEnding": true
    }
  ]
}

KONTROL AF DANSK SPROG:
- Læs alt dansk tekst igennem for fejl
- Kontroller alle kommaer, punktummer og store bogstaver
- Sørg for korrekt køn (en/et) og flertal
- Brug danske vendinger, ikke direkte oversættelser
- Kontroller at alle verber er bøjet korrekt
- Sørg for naturlig dansk rytme og flow

EKSEMPLER PÅ KORREKT DANSK:
✓ "${protagonist.name} gik ned ad stien"
✗ "${protagonist.name} walkede ned ad stien"
✓ "Hvad vil du gøre nu?"
✗ "Hvad vil du gøre næste?"
✓ "Du hører en mærkelig lyd"
✗ "Du høre en mærkelig lyd"`;
  }

  private static generateCharacterSheet(protagonist: UserProfile, theme: StoryTheme): string {
    const genderDescription = protagonist.gender === 'dreng' ? 'boy' : protagonist.gender === 'pige' ? 'girl' : 'child';
    const ageGroup = protagonist.age <= 6 ? 'young child' : protagonist.age <= 9 ? 'child' : 'pre-teen';
    
    // Generate character traits based on theme
    const themeTraits = {
      'Prinsesse Eventyr': 'wearing a simple, colorful outfit suitable for adventures, possibly with a small crown or tiara',
      'Pirat Skattejagt': 'wearing casual adventure clothes, maybe with a bandana or simple hat',
      'Rumrejsende': 'wearing a futuristic but child-friendly outfit, possibly with space-themed accessories',
      'Ninja Kriger': 'wearing comfortable, flexible clothing in earth tones',
      'Drageridder': 'wearing medieval-inspired but practical adventure clothing',
      'Default': 'wearing bright, comfortable clothes suitable for adventures'
    };
    
    const outfit = themeTraits[theme.title as keyof typeof themeTraits] || themeTraits.Default;
    
    return `CHARACTER DESIGN SHEET:
- ${protagonist.age}-year-old ${genderDescription} (${ageGroup})
- Round, friendly face with large, expressive eyes
- Cheerful, warm smile and rosy cheeks
- Medium-length hair in a simple, neat style
- ${outfit}
- Proportions: slightly oversized head (child-like), shorter limbs
- Always shown as confident, curious, and kind
- Consistent height, build, and facial features in every scene`;
  }

  private static generateImagePrompt(storyText: string, theme: StoryTheme, protagonist: UserProfile, storyId: string, stepNumber: number = 1): string {
    const characterSheet = this.generateCharacterSheet(protagonist, theme);
    
    return `CHILDREN'S BOOK ILLUSTRATION - Story: ${storyId}, Scene: ${stepNumber}

${characterSheet}

SCENE DESCRIPTION: ${storyText}

ARTISTIC STYLE REQUIREMENTS (CRITICAL - MUST BE IDENTICAL ACROSS ALL IMAGES):
- Children's book illustration style, similar to modern Pixar/Disney concept art
- Soft, rounded art style with no sharp edges or scary elements
- Warm, bright color palette with good contrast
- Digital painting technique with smooth gradients
- Consistent lighting: soft, warm daylight or magical glow
- Same brush texture and artistic approach throughout
- Professional children's book quality

COMPOSITION:
- Show the protagonist ${protagonist.name} as the main focus
- Character should be clearly visible and recognizable
- Background supports the scene but doesn't overwhelm
- Safe, child-appropriate environment
- Positive, engaging atmosphere

CONSISTENCY NOTES:
- This is image ${stepNumber} in a series - maintain exact same character design
- Same art style, color palette, and quality as previous images
- ${protagonist.name} must look identical to established character design
- Ensure smooth visual continuity throughout the story

Theme: ${theme.title} | Age-appropriate for ${protagonist.age}-year-olds`;
  }

  static async generateStory({ theme, protagonist, onProgress, abortSignal }: StoryGenerationRequest): Promise<Story> {
    const enableImages = protagonist.enableImages ?? true; // Default to true if not set
    const enableValidation = protagonist.validateDanishQuality ?? true; // Default to true if not set
    const imageStepsCount = enableImages ? 6 : 0; // Assume 6 images per story
    const validationStepsCount = enableValidation ? 1 : 0; // 1 validation step if enabled
    const totalSteps = 1 + validationStepsCount + imageStepsCount + 1; // story + validation + images + assembly
    let currentStep = 0;
    
    const updateProgress = (message: string) => {
      currentStep++;
      console.log(`[StoryGen ${currentStep}/${totalSteps}] ${message}`);
      onProgress?.(message, currentStep, totalSteps);
    };

    try {
      console.log('[StoryGen] Starting story generation with settings:', {
        theme: theme.title,
        protagonist: protagonist.name,
        enableImages,
        enableValidation,
        totalSteps
      });
      
      updateProgress('Fortæller OpenAI om dit eventyr...');
      
      // Generate story structure with GPT
      const prompt = this.generateStoryPrompt(theme, protagonist);
      console.log('[StoryGen] Sending story generation request to OpenAI GPT-4');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Du er en professionel dansk børnebogsforfatter og sprogekspert. Du skriver KUN på perfekt dansk med:

SPROGKRAV:
- Korrekt dansk grammatik, stavning og tegnsætning
- Naturlig dansk sætningsopbygning og rytme
- Autentiske danske vendinger og udtryk
- Alderssvarende dansk ordforråd
- Korrekt bøjning af alle ordklasser
- Dansk kulturel kontekst og referencer

Du er MEGET omhyggelig med dansk sprog og læser altid dit arbejde igennem for fejl. Du skriver som en indfødt dansker, ikke som en oversættelse fra engelsk.

OPGAVE: Skriv engagerende, interaktive børnehistorier på fejlfrit dansk med meningsfulde valg, der påvirker historiens udvikling.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7
      }, {
        signal: abortSignal
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        console.error('[StoryGen] No response content from OpenAI');
        throw new Error('No response from OpenAI');
      }

      console.log('[StoryGen] Received story response, parsing JSON...');
      
      // Parse the JSON response
      let storyData;
      try {
        storyData = JSON.parse(responseContent);
        console.log('[StoryGen] Story JSON parsed successfully:', {
          title: storyData.title,
          stepsCount: storyData.steps?.length,
          firstStepChoices: storyData.steps?.[0]?.choices?.length
        });
      } catch (parseError) {
        console.error('[StoryGen] Failed to parse story JSON:', parseError);
        console.error('[StoryGen] Raw response:', responseContent);
        throw new Error('Failed to parse story response');
      }
      
      // Validate Danish quality in the story (if enabled)
      if (enableValidation) {
        updateProgress('Kontroller dansk sprog kvalitet...');
        console.log('[StoryGen] Validating Danish language quality...');
        await this.validateDanishQuality(storyData, protagonist, abortSignal);
      } else {
        console.log('[StoryGen] Skipping Danish validation (disabled by user)');
      }
      
      // Create unique story ID for consistent character generation
      const storyId = `story_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      console.log('[StoryGen] Created story ID:', storyId);
      
      // Generate images for each step
      const stepsWithImages: StoryStep[] = [];
      const imageSteps = storyData.steps.length;
      
      for (let i = 0; i < storyData.steps.length; i++) {
        const step = storyData.steps[i];
        const stepNumber = i + 1;
        
        let imageUrl: string;
        
        if (enableImages) {
          updateProgress(`Tegner billede ${stepNumber} af ${imageSteps}...`);
          
          const imagePrompt = this.generateImagePrompt(step.text, theme, protagonist, storyId, stepNumber);
          console.log(`[StoryGen] Generating image ${stepNumber}/${imageSteps} for step: ${step.id}`);
          
          imageUrl = await this.generateImage(imagePrompt, abortSignal);
          console.log(`[StoryGen] Image ${stepNumber}/${imageSteps} completed:`, imageUrl.startsWith('http') ? 'SUCCESS' : 'PLACEHOLDER');
        } else {
          updateProgress(`Springer billede ${stepNumber} over (deaktiveret)...`);
          
          imageUrl = this.generateDevelopmentPlaceholder(stepNumber, theme);
          console.log(`[StoryGen] Using development placeholder for step ${stepNumber}/${imageSteps}`);
        }
        
        stepsWithImages.push({
          id: step.id,
          image: imageUrl,
          text: step.text,
          choices: step.choices || [],
          isEnding: step.isEnding || false
        });
      }

      updateProgress('Samler historien sammen...');
      
      // Create the complete story object
      const story: Story = {
        id: storyId,
        title: storyData.title,
        theme: theme.title,
        protagonist,
        steps: stepsWithImages,
        currentStepId: stepsWithImages[0]?.id || 'step1',
        choicesMade: [],
        choiceSequence: [],
        pointsEarned: { courage: 0, wisdom: 0, kindness: 0 },
        createdAt: new Date(),
        completed: false
      };

      console.log('[StoryGen] Story assembly complete:', {
        id: story.id,
        title: story.title,
        stepsCount: story.steps.length,
        startingStepId: story.currentStepId
      });

      return story;
    } catch (error) {
      console.error('[StoryGen] Critical error during story generation:', error);
      
      // Handle cancellation specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[StoryGen] Story generation was cancelled by user');
        onProgress?.('Afbryder historie generering...', currentStep, totalSteps);
        throw new Error('CANCELLED');
      }
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('API')) {
          onProgress?.('Fejl: Problemer med forbindelse til OpenAI', currentStep, totalSteps);
          throw new Error('Kunne ikke forbinde til OpenAI. Tjek din internetforbindelse.');
        } else if (error.message.includes('parse')) {
          onProgress?.('Fejl: Kunne ikke forstå historien fra OpenAI', currentStep, totalSteps);
          throw new Error('Modtog ugyldig historie fra OpenAI. Prøv igen.');
        }
      }
      
      onProgress?.('Fejl: Ukendt problem opstod', currentStep, totalSteps);
      throw new Error('Kunne ikke generere historie. Prøv igen senere.');
    }
  }

  private static async validateDanishQuality(storyData: any, protagonist: UserProfile, abortSignal?: AbortSignal): Promise<void> {
    try {
      // Check if story contains any obvious language errors or anglicisms
      const allText = [
        storyData.title,
        ...storyData.steps.map((step: any) => step.text),
        ...storyData.steps.flatMap((step: any) => step.choices?.map((choice: any) => choice.text) || [])
      ].join(' ');

      // Common Danish language validation
      const danishValidation = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du er en dansk sproglærer og korrekturlæser. Din opgave er at identificere sprogfejl i dansk tekst skrevet til børn. Svar kun med 'OK' hvis sproget er korrekt dansk, eller list specifikke fejl hvis der er problemer."
          },
          {
            role: "user",
            content: `Kontroller denne danske børnehistorie for sprogfejl, grammatik, stavning og naturlighed. Historien er til et ${protagonist.age}-årigt barn:

"${allText}"

Er sproget korrekt dansk? List eventuelle fejl.`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }, {
        signal: abortSignal
      });

      const validationResult = danishValidation.choices[0]?.message?.content?.trim();
      
      // If validation finds significant issues, log them (but don't block the story)
      if (validationResult && validationResult !== 'OK' && !validationResult.toLowerCase().includes('korrekt')) {
        console.warn('Danish language validation found issues:', validationResult);
        // In production, you might want to retry story generation or apply corrections
      }
    } catch (error) {
      console.warn('Danish validation failed:', error);
      // Don't block story generation if validation fails
    }
  }

  static async generateImage(prompt: string, abortSignal?: AbortSignal, retryCount: number = 0): Promise<string> {
    const maxRetries = 2;
    
    try {
      console.log('[DALL-E] Generating image with prompt length:', prompt.length);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      }, {
        signal: abortSignal
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        console.error('[DALL-E] No image URL in response:', response);
        throw new Error('No image URL returned from DALL-E');
      }

      console.log('[DALL-E] Image generated successfully:', imageUrl.substring(0, 50) + '...');
      return imageUrl;
    } catch (error) {
      console.error(`[DALL-E] Error generating image (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Retry logic for transient errors
      if (retryCount < maxRetries) {
        const isRetryableError = error instanceof Error && (
          error.message.includes('rate limit') ||
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('503') ||
          error.message.includes('502')
        );
        
        if (isRetryableError) {
          console.log(`[DALL-E] Retrying image generation in ${(retryCount + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return this.generateImage(prompt, abortSignal, retryCount + 1);
        }
      }
      
      // Return a better placeholder image with Danish text
      console.warn('[DALL-E] Using placeholder image due to generation failure');
      return `https://via.placeholder.com/1024x1024/E5C4B8/382017?text=${encodeURIComponent('Billede kunne ikke\nindlæses\n\n📚\n\nBrug din fantasi!')}`;
    }
  }

  static generateDevelopmentPlaceholder(stepNumber: number, theme: StoryTheme): string {
    const themeEmojis = {
      'Prinsesse Eventyr': '👑',
      'Pirat Skattejagt': '🏴‍☠️',
      'Rumrejsende': '🚀',
      'Ninja Kriger': '🥷',
      'Drageridder': '🐉',
    };
    
    const emoji = themeEmojis[theme.title as keyof typeof themeEmojis] || '📖';
    const text = `Udviklertest\nBillede ${stepNumber}\n\n${emoji}\n\n${theme.title}\n\nDALL-E deaktiveret`;
    
    // Use different background colors for variety
    const colors = ['E5C4B8', 'D1E7DD', 'FCE4EC', 'E8F4FD', 'FFF3CD', 'F8D7DA'];
    const bgColor = colors[(stepNumber - 1) % colors.length];
    
    return `https://via.placeholder.com/1024x1024/${bgColor}/2C3E50?text=${encodeURIComponent(text)}`;
  }

  static async generateStoryOutcome(story: Story): Promise<string> {
    try {
      const prompt = `Baseret på følgende historie og de valg, der blev truffet, skal du skrive en kort sammenfatning af historien og dens resultat på korrekt dansk:

Titel: ${story.title}
Tema: ${story.theme}
Hovedperson: ${story.protagonist.name} (${story.protagonist.age} år)
Valg truffet: ${story.choicesMade.join(', ')}

Skriv en positiv, opmuntrende sammenfatning på 2-3 sætninger, der roser barnets valg og beslutninger gennem historien. Brug korrekt dansk grammatik og stavning.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Du skriver positive, opmuntrende sammenfatninger af børnehistorier på perfekt dansk. Brug korrekt dansk grammatik, stavning og sætningsopbygning."
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