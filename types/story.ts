export interface UserProfile {
  name: string;
  age: number;
  gender: string;
}

export interface Choice {
  id: string;
  text: string; // Choice description in Danish
  nextStepId: string;
  consequences?: string; // What happens when this choice is made
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