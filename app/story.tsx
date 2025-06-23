import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { StoryStep, Choice } from '../types/story';
import { OpenAIService } from '../services/openaiService';

const { width } = Dimensions.get('window');

const StoryScreen = () => {
  const { currentStory, updateSavedStory, setCurrentStory } = useAppStore();
  const [currentStep, setCurrentStep] = useState<StoryStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!currentStory) {
      router.replace('/(tabs)/home');
      return;
    }

    // Find current step
    const step = currentStory.steps.find(s => s.id === currentStory.currentStepId);
    setCurrentStep(step || null);
    
    // Calculate progress
    const currentIndex = currentStory.steps.findIndex(s => s.id === currentStory.currentStepId);
    setCurrentStepIndex(currentIndex);
    setStoryProgress(((currentIndex + 1) / currentStory.steps.length) * 100);
  }, [currentStory]);

  const handleChoice = async (choice: Choice) => {
    if (!currentStory || !currentStep) return;

    setIsLoading(true);

    try {
      // Check if this is the final step
      const nextStep = currentStory.steps.find(s => s.id === choice.nextStepId);
      
      // Update story with choice made
      const updatedStory = {
        ...currentStory,
        currentStepId: choice.nextStepId,
        choicesMade: [...currentStory.choicesMade, choice.text]
      };

      if (nextStep?.isEnding) {
        // Generate story outcome for final step
        const outcome = await OpenAIService.generateStoryOutcome(updatedStory);
        updatedStory.outcome = outcome;
        updatedStory.completed = true;
      }

      // Update the story in store and storage
      await updateSavedStory(updatedStory);
      setCurrentStory(updatedStory);

    } catch (error) {
      console.error('Error handling choice:', error);
      Alert.alert('Fejl', 'Der skete en fejl. Prøv igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewStory = () => {
    router.replace('/(tabs)/home');
  };

  const handleGoToStories = () => {
    router.replace('/(tabs)/stories');
  };

  if (!currentStory || !currentStep) {
    return (
      <View className="flex-1 bg-primary-50 justify-center items-center">
        <Text className="text-xl text-primary-700">Indlæser historie...</Text>
      </View>
    );
  }

  // Story completion screen
  if (currentStep.isEnding && currentStory.completed) {
    return (
      <ScrollView className="flex-1 bg-primary-50">
        <View className="px-6 pt-16 pb-8">
          {/* Completion Header */}
          <View className="items-center mb-8">
            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="text-3xl font-bold text-primary-900 text-center mb-2">
              Historie Fuldført!
            </Text>
            <Text className="text-lg text-primary-700 text-center">
              {currentStory.title}
            </Text>
          </View>

          {/* Final Image */}
          <View className="items-center mb-6">
            <Image
              source={{ uri: currentStep.image }}
              style={{ width: width - 48, height: (width - 48) * 0.75 }}
              className="rounded-2xl"
              resizeMode="cover"
            />
          </View>

          {/* Final Story Text */}
          <View className="bg-white rounded-2xl p-6 mb-6">
            <Text className="text-lg text-primary-900 leading-7">
              {currentStep.text}
            </Text>
          </View>

          {/* Story Outcome */}
          {currentStory.outcome && (
            <View className="bg-primary-100 rounded-2xl p-6 mb-8">
              <Text className="text-xl font-bold text-primary-900 mb-3 text-center">
                Din Historie
              </Text>
              <Text className="text-lg text-primary-800 leading-7 text-center">
                {currentStory.outcome}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="space-y-4">
            <TouchableOpacity
              onPress={handleNewStory}
              className="bg-primary-500 py-4 px-6 rounded-2xl"
            >
              <Text className="text-xl font-bold text-white text-center">
                Ny Historie
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleGoToStories}
              className="bg-primary-200 py-4 px-6 rounded-2xl"
            >
              <Text className="text-xl font-bold text-primary-900 text-center">
                Mine Historier
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Regular story step screen
  return (
    <View className="flex-1 bg-primary-50">
      {/* Progress Bar */}
      <View className="px-6 pt-12 pb-4">
        <View className="bg-primary-200 h-2 rounded-full">
          <View 
            className="bg-primary-500 h-2 rounded-full"
            style={{ width: `${storyProgress}%` }}
          />
        </View>
        <Text className="text-sm text-primary-700 mt-2 text-center">
          Trin {currentStepIndex + 1} af {currentStory.steps.length}
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-8">
          {/* Story Image */}
          <View className="items-center mb-6">
            <Image
              source={{ uri: currentStep.image }}
              style={{ width: width - 48, height: (width - 48) * 0.75 }}
              className="rounded-2xl"
              resizeMode="cover"
            />
          </View>

          {/* Story Text */}
          <View className="bg-white rounded-2xl p-6 mb-8">
            <Text className="text-lg text-primary-900 leading-7">
              {currentStep.text}
            </Text>
          </View>

          {/* Choices - only show if not ending step */}
          {!currentStep.isEnding && currentStep.choices.length > 0 && (
            <View className="space-y-4">
              <Text className="text-xl font-bold text-primary-900 mb-2">
                Hvad vil du gøre?
              </Text>
              
              {currentStep.choices.map((choice, index) => (
                <TouchableOpacity
                  key={choice.id}
                  onPress={() => handleChoice(choice)}
                  disabled={isLoading}
                  className={`p-5 rounded-2xl border-2 ${
                    isLoading 
                      ? 'bg-primary-100 border-primary-200' 
                      : 'bg-white border-primary-300'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-primary-500 rounded-full items-center justify-center mr-4">
                      <Text className="text-white font-bold">
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text className={`text-lg flex-1 ${
                      isLoading ? 'text-primary-600' : 'text-primary-900'
                    }`}>
                      {choice.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* End of story message for ending steps */}
          {currentStep.isEnding && (
            <View className="space-y-4">
              {/* Story Outcome */}
              {currentStory.outcome && (
                <View className="bg-primary-100 rounded-2xl p-6">
                  <Text className="text-xl font-bold text-primary-900 mb-3 text-center">
                    Din Historie
                  </Text>
                  <Text className="text-lg text-primary-800 leading-7 text-center">
                    {currentStory.outcome}
                  </Text>
                </View>
              )}
              
              <View className="bg-primary-100 rounded-2xl p-6">
                <Text className="text-xl font-bold text-primary-900 text-center mb-2">
                  🎉 Historien er slut!
                </Text>
                <Text className="text-lg text-primary-800 text-center">
                  Du har gennemført dette eventyr. Godt klaret!
                </Text>
                
                <View className="mt-6 space-y-3">
                  <TouchableOpacity
                    onPress={handleNewStory}
                    className="bg-primary-500 py-3 px-6 rounded-xl"
                  >
                    <Text className="text-lg font-bold text-white text-center">
                      Ny Historie
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleGoToStories}
                    className="bg-primary-200 py-3 px-6 rounded-xl"
                  >
                    <Text className="text-lg font-bold text-primary-900 text-center">
                      Mine Historier
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {isLoading && (
            <View className="mt-6 items-center">
              <Text className="text-lg text-primary-700">
                Forbereder den næste del...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StoryScreen;