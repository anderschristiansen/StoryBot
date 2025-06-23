export interface ChoicePoints {
  courage: number; // Mod Point
  wisdom: number;  // Visdom Point
  kindness: number; // Snilhed Point
}

export interface ChoiceClassification {
  type: 'courage' | 'wisdom' | 'kindness';
  points: number;
  message: string; // Encouraging message in Danish
}

export interface StoryPath {
  pathId: string;
  choiceSequence: string[]; // Array of choice IDs taken
  completed: boolean;
  completedAt?: Date;
}

export interface StoryPathData {
  totalPaths: number;
  discoveredPaths: StoryPath[];
  completionPercentage: number;
}

export interface UserGameStats extends ChoicePoints {
  totalStoriesCompleted: number;
  totalChoicesMade: number;
  favoriteChoiceType: 'courage' | 'wisdom' | 'kindness' | null;
  pathsDiscovered: number;
  totalPathsAvailable: number;
}

export interface PointsEarned {
  type: 'courage' | 'wisdom' | 'kindness';
  amount: number;
  message: string;
}