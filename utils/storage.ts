import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Story } from '../types/story';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  SAVED_STORIES: 'saved_stories',
} as const;

export const StorageUtils = {
  // User Profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async clearUserProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error clearing user profile:', error);
      throw error;
    }
  },

  // Stories
  async saveStories(stories: Story[]): Promise<void> {
    try {
      console.log('[Storage] Saving stories, count:', stories.length);
      const storiesData = stories.map(story => ({
        ...story,
        createdAt: story.createdAt instanceof Date ? story.createdAt.toISOString() : story.createdAt
      }));
      const jsonData = JSON.stringify(storiesData);
      console.log('[Storage] Saving JSON length:', jsonData.length);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_STORIES, jsonData);
      console.log('[Storage] Stories saved to AsyncStorage');
    } catch (error) {
      console.error('[Storage] Error saving stories:', error);
      throw error;
    }
  },

  async getSavedStories(): Promise<Story[]> {
    try {
      console.log('[Storage] Getting saved stories...');
      const stories = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_STORIES);
      console.log('[Storage] Raw storage value:', stories ? 'Found data' : 'No data');
      
      if (!stories) {
        console.log('[Storage] No stories found in storage');
        return [];
      }
      
      const parsedStories = JSON.parse(stories);
      console.log('[Storage] Parsed stories count:', parsedStories.length);
      
      // Debug first story if exists
      if (parsedStories.length > 0) {
        console.log('[Storage] First story sample:', {
          id: parsedStories[0].id,
          title: parsedStories[0].title,
          hasSteps: !!parsedStories[0].steps,
          stepsCount: parsedStories[0].steps?.length
        });
      }
      
      return parsedStories.map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt)
      }));
    } catch (error) {
      console.error('[Storage] Error getting saved stories:', error);
      return [];
    }
  },

  async addStory(story: Story): Promise<void> {
    try {
      console.log('[Storage] Adding story:', story.id);
      const existingStories = await this.getSavedStories();
      const updatedStories = [...existingStories, story];
      console.log('[Storage] Saving total stories:', updatedStories.length);
      await this.saveStories(updatedStories);
      console.log('[Storage] Story saved successfully');
    } catch (error) {
      console.error('[Storage] Error adding story:', error);
      throw error;
    }
  },

  async updateStory(updatedStory: Story): Promise<void> {
    try {
      console.log('[Storage] Updating story:', {
        id: updatedStory.id,
        title: updatedStory.title,
        completed: updatedStory.completed,
        choiceSequenceLength: updatedStory.choiceSequence.length,
        choicesMadeLength: updatedStory.choicesMade.length,
        choiceSequence: updatedStory.choiceSequence
      });
      
      const existingStories = await this.getSavedStories();
      console.log('[Storage] Existing stories before update:', existingStories.length);
      
      // Safety check: if no existing stories but we're updating, the story might not be saved yet
      if (existingStories.length === 0) {
        console.warn('[Storage] No existing stories found during update, adding as new story');
        await this.addStory(updatedStory);
        return;
      }
      
      const updatedStories = existingStories.map(story => 
        story.id === updatedStory.id ? updatedStory : story
      );
      
      // Verify the story was found and updated
      const wasUpdated = updatedStories.some(story => story.id === updatedStory.id);
      if (!wasUpdated) {
        console.warn('[Storage] Story not found in existing stories, adding as new');
        updatedStories.push(updatedStory);
      }
      
      console.log('[Storage] Saving updated stories:', updatedStories.length);
      await this.saveStories(updatedStories);
      
      console.log('[Storage] Story updated successfully');
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  },

  async deleteStory(storyId: string): Promise<void> {
    try {
      const existingStories = await this.getSavedStories();
      const filteredStories = existingStories.filter(story => story.id !== storyId);
      await this.saveStories(filteredStories);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_PROFILE, STORAGE_KEYS.SAVED_STORIES]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
};