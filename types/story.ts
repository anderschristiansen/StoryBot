export type ModelPreference = 'standard' | 'premium';

export type ArtStyle = 'pixar' | 'cartoon' | 'watercolor' | 'digital' | 'sketch' | 'fantasy';

export interface CharacterAppearance {
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  clothing?: string;
  specialFeatures?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  // Story settings
  storySteps?: number; // Number of story steps (default: 5, range: 3-10)
  modelPreference?: ModelPreference; // AI model quality preference (default: 'standard')
  // Visual settings
  artStyle?: ArtStyle; // Preferred art style for images (default: 'pixar')
  characterAppearance?: CharacterAppearance; // Optional character customization
  // Development settings
  enableImages?: boolean; // Generate DALL-E images (default: true)
  developerMode?: boolean; // Show developer options (default: false)
}

export interface Choice {
  id: string;
  text: string; // Choice description in Danish
  isCorrect: boolean; // True for the morally correct choice
  // If correct choice: points to next step
  nextStepId?: string;
  // If wrong choice: contains failure info inline
  failureInfo?: {
    text: string; // Explanation of what went wrong
    moralLesson?: string; // Why this choice was wrong
  };
}

export interface StoryContext {
  previousEvents: string[]; // Summary of what happened in previous steps
  characterDevelopment: string[]; // How the protagonist has grown/changed
  settingDetails: string; // Consistent setting description
  characterDescription: string; // Physical appearance for image consistency
}

export interface StoryStep {
  id: string;
  image: string; // DALL-E generated image URL
  text: string; // Story context/situation in Danish
  choices: Choice[];
  isEnding?: boolean; // True for the final step
}

export interface Story {
  id: string;
  title: string;
  theme: string;
  protagonist: UserProfile;
  steps: StoryStep[];
  currentStepId: string;
  choicesMade: string[]; // Track user's choice path
  choiceSequence: string[]; // Track choice IDs for path discovery
  storyContext?: StoryContext; // Narrative continuity tracking
  outcome?: string; // Final story outcome
  createdAt: Date;
  completed: boolean;
  completedCorrectly?: boolean; // True only if completed via correct moral choices
  wrongChoicesCount?: number; // Number of wrong choices made
  retryAttempts?: number; // Number of times user had to retry
}

export interface StoryTheme {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface AppState {
  userProfile: UserProfile | null;
  currentStory: Story | null;
  savedStories: Story[];
  isGeneratingStory: boolean;
  selectedTheme: StoryTheme | null;
}