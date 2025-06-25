import { ModelPreference } from '../types/story';

// Prompt Manager - Easy access to all prompts
export { storyPrompts } from './storyGeneration';
export { imagePrompts } from './imageGeneration';
export { outcomePrompts } from './storyOutcome';

// Prompt configuration
export const promptConfig = {
  // OpenAI model selection by preference
  models: {
    standard: "gpt-3.5-turbo-1106", // Cheaper, faster model
    premium: "gpt-4",                // Higher quality, more expensive
    outcome: "gpt-3.5-turbo-1106"    // Always use standard for outcomes
  },
  
  // Token limits by model
  maxTokens: {
    standard: 3500,
    premium: 4000,
    outcome: 200
  },
  
  // Temperature settings
  temperature: {
    story: 0.7,
    outcome: 0.7
  }
};

// Helper functions
export const promptHelpers = {
  getModelForPreference: (preference?: ModelPreference): string => {
    const modelPreference = preference || 'standard'; // Default to cheaper model
    return promptConfig.models[modelPreference];
  },
  
  getMaxTokensForPreference: (preference?: ModelPreference): number => {
    const modelPreference = preference || 'standard'; // Default to standard
    return promptConfig.maxTokens[modelPreference];
  },
  
  getModelDisplayName: (preference?: ModelPreference): string => {
    const modelPreference = preference || 'standard';
    return modelPreference === 'premium' ? 'GPT-4 (Premium)' : 'GPT-3.5 (Standard)';
  },
  
  getModelDescription: (preference?: ModelPreference): string => {
    const modelPreference = preference || 'standard';
    return modelPreference === 'premium' 
      ? 'Højere kvalitet historier, mere kreative og detaljerede (dyrere)'
      : 'God kvalitet historier, hurtigere generering (billigere)';
  }
};