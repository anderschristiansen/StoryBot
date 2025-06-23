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
      const storiesData = stories.map(story => ({
        ...story,
        createdAt: story.createdAt.toISOString()
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_STORIES, JSON.stringify(storiesData));
    } catch (error) {
      console.error('Error saving stories:', error);
      throw error;
    }
  },

  async getSavedStories(): Promise<Story[]> {
    try {
      const stories = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_STORIES);
      if (!stories) return [];
      
      const parsedStories = JSON.parse(stories);
      return parsedStories.map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt)
      }));
    } catch (error) {
      console.error('Error getting saved stories:', error);
      return [];
    }
  },

  async addStory(story: Story): Promise<void> {
    try {
      const existingStories = await this.getSavedStories();
      const updatedStories = [...existingStories, story];
      await this.saveStories(updatedStories);
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  },

  async updateStory(updatedStory: Story): Promise<void> {
    try {
      const existingStories = await this.getSavedStories();
      const updatedStories = existingStories.map(story => 
        story.id === updatedStory.id ? updatedStory : story
      );
      await this.saveStories(updatedStories);
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