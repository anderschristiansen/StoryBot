# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo application called "StoryBot" built with TypeScript. The project uses Expo Router for file-based routing. Currently has a minimal structure with full example code available in `app-example/`.

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
  - `_layout.tsx` - Basic Stack navigator root layout
  - `index.tsx` - Main screen (currently minimal)
- `app-example/` - Full featured example with tabs, theming, and components
- `assets/` - Static assets (fonts, images)

### Technical Stack
- Expo SDK ~53.0 with New Architecture enabled
- React 19 and React Native 0.79
- TypeScript with strict mode enabled
- Path aliases configured: `@/*` maps to root directory
- ESLint with Expo configuration
- Metro bundler for web with static output
- Support for iOS, Android, and web platforms

### Development Patterns
When expanding the app, refer to `app-example/` for:
- **Theming**: Dark/light mode support with React Navigation themes, useColorScheme and useThemeColor hooks, themed components (ThemedText, ThemedView)
- **Navigation**: Tab-based navigation with haptic feedback, platform-specific styling (transparent tab bar on iOS)
- **Components**: Platform-specific UI components (IconSymbol, TabBarBackground), reusable components with theming support
- **Font Loading**: SpaceMono font integration with expo-font

### Key Configuration
- `expo-router` plugin with typed routes experiment enabled
- Splash screen with custom icon and white background
- Adaptive icons for Android, tablet support for iOS
- Edge-to-edge display on Android
- URL scheme: `storybot://`