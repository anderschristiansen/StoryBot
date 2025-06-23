# StoryBot - Interactive Children's Storytelling App

A React Native/Expo app that creates personalized, interactive stories for children using AI. Kids can choose their adventures through an engaging storytelling experience with beautiful AI-generated images.

## Features

- **Personalized Onboarding**: Smart input for name, age, and gender
- **20 Story Themes**: From princess adventures to space exploration
- **AI-Generated Stories**: Unique narratives using OpenAI GPT-4
- **Beautiful Images**: DALL-E 3 generated illustrations for each story step
- **Interactive Choices**: Multiple choice paths that affect story outcomes
- **Story Library**: Save and replay completed adventures
- **Danish Language**: All content in Danish for local audience
- **Progress Tracking**: Visual progress indicators and completion stats

## Prerequisites

- Node.js 18+
- Expo CLI
- OpenAI API key with GPT-4 and DALL-E 3 access

## Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd StoryBot
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
   ```

3. **Run the App**
   ```bash
   # Start development server
   npm start
   
   # Run on specific platforms
   npm run ios      # iOS simulator/device
   npm run android  # Android emulator/device
   npm run web      # Web browser
   ```

## Project Structure

```
app/
├── (tabs)/           # Tab navigation screens
│   ├── home.tsx      # Story theme selection
│   ├── stories.tsx   # Saved stories library
│   └── profile.tsx   # User profile & settings
├── index.tsx         # Onboarding screen
├── loading.tsx       # Story generation loading
├── story.tsx         # Interactive story experience
└── _layout.tsx       # Root navigation layout

data/
└── storyThemes.ts    # 20 hardcoded story themes

services/
└── openaiService.ts  # OpenAI GPT-4 & DALL-E integration

store/
└── appStore.ts       # Zustand state management

types/
└── story.ts          # TypeScript interfaces

utils/
└── storage.ts        # AsyncStorage utilities
```

## Key Technologies

- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **NativeWind** for Tailwind CSS styling
- **Zustand** for state management
- **AsyncStorage** for local data persistence
- **OpenAI API** for story generation and images
- **Expo Router** for file-based navigation

## User Journey

1. **Onboarding**: Enter name, age (4-12), and gender
2. **Theme Selection**: Choose from 20 engaging story themes
3. **Generation**: AI creates personalized story with images
4. **Interactive Story**: Make choices that shape the narrative
5. **Completion**: See story outcome and save to library
6. **Library**: Review and replay previous adventures

## Development Commands

```bash
npm run lint          # Run ESLint
npm run android       # Android development
npm run ios           # iOS development
npm run web           # Web development
npm run reset-project # Reset to blank project
```

## Configuration Notes

- API keys are stored in environment variables
- All user data persists locally using AsyncStorage
- Images are cached automatically by Expo Image
- Danish language content throughout the app
- Responsive design for iPhone and iPad

## Target Audience

Children aged 4-12 years who speak Danish, with parental supervision for account setup and API usage monitoring.
