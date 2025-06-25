import OpenAI from 'openai';
import { Platform } from 'react-native';

// Initialize OpenAI client with web support
export const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: Platform.OS === 'web',
});