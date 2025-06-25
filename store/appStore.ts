import { create } from 'zustand';
import { AppState, UserProfile, Story, StoryTheme } from '../types/story';
import { StorageUtils } from '../utils/storage';

interface AppStore extends AppState {
  // Actions
  setUserProfile: (profile: UserProfile) => void;
  clearUserProfile: () => void;
  loadUserProfile: () => Promise<void>;
  
  setCurrentStory: (story: Story | null) => void;
  setSelectedTheme: (theme: StoryTheme | null) => void;
  setIsGeneratingStory: (isGenerating: boolean) => void;
  
  loadSavedStories: () => Promise<void>;
  addSavedStory: (story: Story) => Promise<void>;
  updateSavedStory: (story: Story) => Promise<void>;
  deleteSavedStory: (storyId: string) => Promise<void>;
  replayStory: (story: Story) => Promise<void>;
  
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  userProfile: null,
  currentStory: null,
  savedStories: [],
  isGeneratingStory: false,
  selectedTheme: null,

  // Actions
  setUserProfile: (profile: UserProfile) => {
    set({ userProfile: profile });
    StorageUtils.saveUserProfile(profile).catch(console.error);
  },

  clearUserProfile: () => {
    set({ userProfile: null });
    StorageUtils.clearUserProfile().catch(console.error);
  },

  loadUserProfile: async () => {
    try {
      const profile = await StorageUtils.getUserProfile();
      set({ userProfile: profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  },

  setCurrentStory: (story: Story | null) => {
    set({ currentStory: story });
  },

  setSelectedTheme: (theme: StoryTheme | null) => {
    set({ selectedTheme: theme });
  },

  setIsGeneratingStory: (isGenerating: boolean) => {
    set({ isGeneratingStory: isGenerating });
  },

  loadSavedStories: async () => {
    try {
      const stories = await StorageUtils.getSavedStories();
      set({ savedStories: stories });
    } catch (error) {
      console.error('[AppStore] Error loading saved stories:', error);
    }
  },

  addSavedStory: async (story: Story) => {
    try {
      await StorageUtils.addStory(story);
      const { savedStories } = get();
      set({ savedStories: [...savedStories, story] });
    } catch (error) {
      console.error('[AppStore] Error adding saved story:', error);
      throw error;
    }
  },

  updateSavedStory: async (updatedStory: Story) => {
    try {
      await StorageUtils.updateStory(updatedStory);
      const { savedStories } = get();
      const updatedStories = savedStories.map(story =>
        story.id === updatedStory.id ? updatedStory : story
      );
      set({ savedStories: updatedStories });
    } catch (error) {
      console.error('Error updating saved story:', error);
      throw error;
    }
  },

  deleteSavedStory: async (storyId: string) => {
    try {
      await StorageUtils.deleteStory(storyId);
      const { savedStories } = get();
      const filteredStories = savedStories.filter(story => story.id !== storyId);
      set({ savedStories: filteredStories });
    } catch (error) {
      console.error('Error deleting saved story:', error);
      throw error;
    }
  },

  replayStory: async (story: Story) => {
    try {
      // Reset story to beginning
      const replayedStory: Story = {
        ...story,
        currentStepId: story.steps[0]?.id || 'step1',
        choicesMade: [],
        completed: false,
        outcome: undefined
      };

      // Update in storage and state
      await StorageUtils.updateStory(replayedStory);
      const { savedStories } = get();
      const updatedStories = savedStories.map(s =>
        s.id === story.id ? replayedStory : s
      );
      set({ savedStories: updatedStories, currentStory: replayedStory });
    } catch (error) {
      console.error('Error replaying story:', error);
      throw error;
    }
  },

  initializeApp: async () => {
    const { loadUserProfile, loadSavedStories } = get();
    await Promise.all([
      loadUserProfile(),
      loadSavedStories()
    ]);
  }
}));