# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo application called "StoryBot" built with TypeScript. The app is a story generation platform that uses AI to create interactive stories for users, with features like user profiles, story themes, progress tracking, and gamification elements.

## Development Commands

- `npm install` - Install dependencies
- `npm start` or `npx expo start` - Start the development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device  
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint linting
- `npm run reset-project` - Reset to blank project (moves starter code to app-example/)

## Architecture

### Current Structure
- `app/` - Main application code using Expo Router file-based routing
  - `(tabs)/` - Tab-based navigation screens
    - `home.tsx` - Home/dashboard screen
    - `stories.tsx` - Stories list/library screen
    - `profile.tsx` - User profile and settings screen
    - `_layout.tsx` - Tab navigator layout
  - `_layout.tsx` - Root Stack navigator layout
  - `index.tsx` - Initial/welcome screen
  - `loading.tsx` - Story generation loading screen
  - `story.tsx` - Individual story reading screen
- `components/` - Reusable UI components
- `services/` - External service integrations
  - `openaiService.ts` - OpenAI API integration for story generation
- `store/` - Global state management
  - `appStore.ts` - Zustand store for app state
- `data/` - Static data and configurations
  - `storyThemes.ts` - Available story themes and categories
- `types/` - TypeScript type definitions
  - `story.ts` - Story-related types
  - `gamification.ts` - Gamification system types
- `utils/` - Utility functions
  - `storage.ts` - Async storage utilities
  - `gamificationUtils.ts` - Points and achievement logic
- `assets/` - Static assets (fonts, images, animations)

### Technical Stack
- Expo SDK ~53.0 with New Architecture enabled
- React 19 and React Native 0.79
- TypeScript with strict mode enabled
- NativeWind 4.x for styling with Tailwind CSS
- Zustand for state management
- OpenAI API for story generation
- Lottie React Native for animations
- Async Storage for data persistence
- Expo Router for file-based routing
- React Navigation for tab navigation
- ESLint with Expo configuration
- Support for iOS, Android, and web platforms

### Key Features
- **AI Story Generation**: Uses OpenAI API to generate personalized stories
- **User Profiles**: Customizable user profiles with preferences
- **Story Themes**: Multiple story categories and themes
- **Interactive Stories**: Choice-based narratives with branching paths
- **Gamification**: Points system and achievements
- **Progress Tracking**: Story progress and completion tracking
- **Loading Animations**: Lottie animations for better UX
- **Offline Storage**: Local data persistence with Async Storage

### Styling System
- **NativeWind**: Uses Tailwind CSS classes for styling React Native components
- **Color Palette**: Warm beige/brown theme from uicolors.app (#e5c4b8)
  - `primary-50` to `primary-950`: Warm beige/brown scale (#faf8f6 to #382017)
  - `secondary-50` to `secondary-950`: Slate gray scale for text and backgrounds
  - `bg`: Off-white background (#fefefe)
  - `text`: Dark brown text (#382017)
- **Usage**: Apply classes like `bg-primary-300 text-primary-900` or `text-primary-700`

### State Management
- **Zustand Store**: Centralized state management for user data, stories, and app settings
- **Async Storage**: Persistent storage for user preferences and story data
- **Types**: Comprehensive TypeScript types for story structure and gamification

### Key Configuration
- `expo-router` plugin with typed routes experiment enabled
- Splash screen with custom icon and white background
- Adaptive icons for Android, tablet support for iOS
- Edge-to-edge display on Android
- URL scheme: `storybot://`