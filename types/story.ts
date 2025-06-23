import { ChoicePoints, UserGameStats } from './gamification';

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  gameStats?: UserGameStats;
  // Development settings
  enableImages?: boolean; // Generate DALL-E images (default: true)
  validateDanishQuality?: boolean; // Validate Danish language quality (default: true)
  developerMode?: boolean; // Show developer options (default: false)
}

export interface Choice {
  id: string;
  text: string; // Choice description in Danish
  nextStepId: string;
  consequences?: string; // What happens when this choice is made
  choiceType?: 'courage' | 'wisdom' | 'kindness'; // For gamification
  points?: number; // Points awarded for this choice
}

export interface StoryStep {
  id: string;
  image: string; // DALL-E generated image URL
  text: string; // Story context/situation in Danish
  choices: Choice[];
  isEnding?: boolean;
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
  pointsEarned?: ChoicePoints; // Points earned in this story
  outcome?: string; // Final story outcome
  createdAt: Date;
  completed: boolean;
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