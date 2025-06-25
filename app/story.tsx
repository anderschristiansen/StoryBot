import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { OpenAIService } from '../services/openaiService';
import { useAppStore } from '../store/appStore';
import { Choice, StoryStep } from '../types/story';

const { width } = Dimensions.get('window');

// Fallback image component for when images fail to load
const FallbackImage = ({ stepNumber, theme }: { stepNumber: number; theme: string }) => (
  <View 
    style={{ width: width - 48, height: (width - 48) * 0.75 }}
    className="rounded-2xl bg-primary-200 items-center justify-center border-2 border-primary-300"
  >
    <Text className="text-6xl mb-2">📚</Text>
    <Text className="text-xl font-bold text-primary-800 text-center px-4">
      {theme}
    </Text>
    <Text className="text-lg text-primary-600 mt-1">
      Trin {stepNumber}
    </Text>
  </View>
);

const StoryScreen = () => {
  const { currentStory, updateSavedStory, setCurrentStory } = useAppStore();
  const [currentStep, setCurrentStep] = useState<StoryStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentStory) {
      router.replace('/(tabs)/home');
      return;
    }

    // Find current step
    const step = currentStory.steps.find(s => s.id === currentStory.currentStepId);
    
    // Don't override failure steps that are currently being displayed
    setCurrentStep(prevStep => {
      if (prevStep && (prevStep as any).isFailureStep) {
        return prevStep;
      }
      return step || null;
    });
    
    // Calculate progress
    const currentIndex = currentStory.steps.findIndex(s => s.id === currentStory.currentStepId);
    setCurrentStepIndex(currentIndex);
    setStoryProgress(((currentIndex + 1) / currentStory.steps.length) * 100);
  }, [currentStory]);

  const handleImageError = (imageUrl: string, error?: any) => {
    console.log('[Story] Image failed to load:', imageUrl);
    setImageErrors(prev => new Set(prev).add(imageUrl));
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentStory || !currentStep) return;

    setIsLoading(true);

    try {
      // Track moral choice correctness
      let updatedWrongChoicesCount = currentStory.wrongChoicesCount || 0;
      const updatedRetryAttempts = currentStory.retryAttempts || 0;
      
      if (!choice.isCorrect) {
        // Wrong choice - show inline failure
        updatedWrongChoicesCount++;

        
        // Display failure info inline (no navigation needed)
        const failureStep = {
          ...currentStep,
          isFailureStep: true,
          failureInfo: choice.failureInfo,
          retryFromStepId: currentStep.id
        } as any; // Temporary type assertion for transition
        
        setCurrentStep(failureStep);
        
        // Update story with wrong choice tracking
        const updatedStory = {
          ...currentStory,
          choicesMade: [...currentStory.choicesMade, choice.text],
          choiceSequence: [...currentStory.choiceSequence, choice.id],
          wrongChoicesCount: updatedWrongChoicesCount,
          retryAttempts: updatedRetryAttempts
        };
        
        await updateSavedStory(updatedStory);
        setCurrentStory(updatedStory);
        
        return;
      }
      
      // Correct choice - proceed to next step
      
      const nextStep = currentStory.steps.find(s => s.id === choice.nextStepId);
      
      const updatedChoiceSequence = [...currentStory.choiceSequence, choice.id];
      const updatedStory = {
        ...currentStory,
        currentStepId: choice.nextStepId!,
        choicesMade: [...currentStory.choicesMade, choice.text],
        choiceSequence: updatedChoiceSequence,
        wrongChoicesCount: updatedWrongChoicesCount,
        retryAttempts: updatedRetryAttempts
      };

      if (nextStep?.isEnding) {
        // Generate story outcome for final step
        const outcome = await OpenAIService.generateStoryOutcome(updatedStory);
        updatedStory.outcome = outcome;
        updatedStory.completed = true;
        
        // Only mark as correctly completed if reached via correct choices
        updatedStory.completedCorrectly = (updatedWrongChoicesCount === 0);
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

  const handleRetryFromFailure = async () => {
    if (!currentStory || !currentStep) return;
    
    setIsLoading(true);
    
    try {
      // Increment retry attempts
      const updatedRetryAttempts = (currentStory.retryAttempts || 0) + 1;
      
      // Get the original step (remove failure state)
      const originalStepId = (currentStep as any).retryFromStepId || currentStory.currentStepId;
      const originalStep = currentStory.steps.find(s => s.id === originalStepId);
      
      if (originalStep) {
        // Clear failure state and show original step
        setCurrentStep(originalStep);
        
        // Update retry count in story
        const updatedStory = {
          ...currentStory,
          retryAttempts: updatedRetryAttempts
        };
        
        await updateSavedStory(updatedStory);
        setCurrentStory(updatedStory);
        
      }
      
    } catch (error) {
      console.error('Error retrying story:', error);
      Alert.alert('Fejl', 'Der skete en fejl. Prøv igen.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentStory || !currentStep) {
    return (
      <View className="flex-1 bg-primary-50 justify-center items-center">
        <Text className="text-xl text-primary-700">Indlæser historie...</Text>
      </View>
    );
  }

  // Inline failure display screen
  if ((currentStep as any).isFailureStep) {
    const failureInfo = (currentStep as any).failureInfo;
    return (
      <ScrollView className="flex-1 bg-red-50 pt-10">
        <View className="px-6 pt-16 pb-8">
          {/* Failure Header */}
          <View className="items-center mb-8">
            <Text className="text-6xl mb-4">😔</Text>
            <Text className="text-3xl font-bold text-red-900 text-center mb-2">
              Åh nej!
            </Text>
            <Text className="text-lg text-red-700 text-center">
              Det var ikke det rigtige valg
            </Text>
          </View>

          {/* Failure Explanation */}
          <View className="bg-white rounded-2xl p-6 mb-6">
            <Text className="text-lg text-red-900 leading-7 text-center">
              {failureInfo?.text || 'Det valg var ikke korrekt. Prøv igen!'}
            </Text>
          </View>

          {/* Moral Lesson */}
          {failureInfo?.moralLesson && (
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <Text className="text-xl font-bold text-blue-900 mb-3 text-center">
                💡 Hvad lærte vi?
              </Text>
              <Text className="text-lg text-blue-800 leading-7 text-center">
                {failureInfo.moralLesson}
              </Text>
            </View>
          )}

          {/* Retry Button */}
          <View className="space-y-4 gap-3">
            <TouchableOpacity
              onPress={handleRetryFromFailure}
              disabled={isLoading}
              className={`py-4 px-6 rounded-2xl ${
                isLoading ? 'bg-green-300' : 'bg-green-500'
              }`}
            >
              <Text className="text-xl font-bold text-white text-center">
                {isLoading ? 'Prøver igen...' : '🔄 Prøv igen'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleGoToStories}
              className="py-3 px-6 bg-primary-200 rounded-xl"
            >
              <Text className="text-lg font-bold text-primary-900 text-center">
                Afslut historie
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Story completion screen
  if (currentStep.isEnding && currentStory.completed) {
    return (
      <ScrollView className="flex-1 bg-primary-50 pt-10">
        <View className="px-6 pt-16 pb-8">
          {/* Completion Header */}
          <View className="items-center mb-8">
            <Text className="text-6xl mb-4">
              {currentStory.completedCorrectly ? '🏆' : '🎉'}
            </Text>
            <Text className="text-3xl font-bold text-primary-900 text-center mb-2">
              {currentStory.completedCorrectly 
                ? 'Perfekt fuldført!' 
                : 'Historie fuldført!'}
            </Text>
            <Text className="text-lg text-primary-700 text-center">
              {currentStory.title}
            </Text>
            
            {/* Performance Summary */}
            <View className="mt-4 bg-white rounded-xl p-4">
              <Text className="text-center text-primary-900 font-semibold">
                {currentStory.completedCorrectly 
                  ? '🌟 Du traf alle de rigtige valg!' 
                  : `✨ Fuldført med ${currentStory.wrongChoicesCount || 0} fejl og ${currentStory.retryAttempts || 0} gentagelser`}
              </Text>
              {!currentStory.completedCorrectly && (
                <Text className="text-center text-primary-700 text-sm mt-2">
                  Prøv at spille igen for at træffe de perfekte valg!
                </Text>
              )}
            </View>
          </View>

          {/* Final Image */}
          <View className="items-center mb-6">
            {currentStep.image && !imageErrors.has(currentStep.image) ? (
              <>
                <Image
                  source={{ uri: currentStep.image }}
                  style={{ 
                    width: width - 48, 
                    height: (width - 48) * 0.75,
                    borderRadius: 16
                  }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  onError={(event) => {
                    handleImageError(currentStep.image, event);
                  }}
                  onLoad={() => {}}
                  placeholder={require('../assets/images/icon.png')}
                  placeholderContentFit="contain"
                  transition={300}
                />
              </>
            ) : (
              <FallbackImage 
                stepNumber={currentStory.steps.length} 
                theme={currentStory.theme}
              />
            )}
          </View>

          {/* Story Outcome */}
          {currentStory.outcome && (
            <View className="bg-primary-100 rounded-2xl p-6 mb-6">
              <Text className="text-xl font-bold text-primary-900 mb-3 text-center">
                Din historie
              </Text>
              <Text className="text-lg text-primary-800 leading-7 text-center">
                {currentStory.outcome}
              </Text>
            </View>
          )}


          {/* Action Buttons */}
          <View className="space-y-4 gap-3">
            <TouchableOpacity
              onPress={handleNewStory}
              className="bg-primary-500 py-4 px-6 rounded-2xl"
            >
              <Text className="text-xl font-bold text-white text-center">
                Ny historie
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleGoToStories}
              className="bg-primary-200 py-4 px-6 rounded-2xl"
            >
              <Text className="text-xl font-bold text-primary-900 text-center">
                Mine historier
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Regular story step screen
  return (
    <View className="flex-1 bg-primary-50 pt-10">
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
            {currentStep.image && !imageErrors.has(currentStep.image) ? (
              <>
                <Image
                  source={{ uri: currentStep.image }}
                  style={{ 
                    width: width - 48, 
                    height: (width - 48) * 0.75,
                    borderRadius: 16
                  }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  onError={(event) => {
                    handleImageError(currentStep.image, event);
                  }}
                  onLoad={() => {}}
                  placeholder={require('../assets/images/icon.png')}
                  placeholderContentFit="contain"
                  transition={300}
                />
              </>
            ) : (
              <FallbackImage 
                stepNumber={currentStepIndex + 1} 
                theme={currentStory.theme}
              />
            )}
          </View>

          {/* Story Text */}
          <View className="bg-white rounded-2xl p-6 mb-8">
            <Text className="text-lg text-primary-900 leading-7">
              {currentStep.text}
            </Text>
          </View>

          {/* Choices - only show if not ending step */}
          {!currentStep.isEnding && currentStep.choices.length > 0 && (
            <View className="space-y-4 gap-3">
              <Text className="text-xl font-bold text-primary-900 mb-2">
                Hvad vil du gøre?
              </Text>
              
              {currentStep.choices.map((choice, index) => {
                const isCorrectChoice = choice.isCorrect;
                const isDeveloperMode = currentStory.protagonist.developerMode;
                const shouldShowHint = isDeveloperMode && isCorrectChoice;
                
                return (
                  <TouchableOpacity
                    key={choice.id}
                    onPress={() => handleChoice(choice)}
                    disabled={isLoading}
                    className={`p-5 rounded-2xl border-2 ${
                      shouldShowHint
                        ? 'bg-green-50 border-green-400 border-dashed'
                        : isLoading 
                        ? 'bg-primary-100 border-primary-200' 
                        : 'bg-white border-primary-300'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${
                        shouldShowHint ? 'bg-green-500' : 'bg-primary-500'
                      }`}>
                        <Text className="text-white font-bold">
                          {shouldShowHint ? '✓' : String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text className={`text-lg flex-1 ${
                        shouldShowHint ? 'text-green-900 font-semibold' :
                        isLoading ? 'text-primary-600' : 'text-primary-900'
                      }`}>
                        {choice.text}
                        {shouldShowHint && (
                          <Text className="text-sm font-normal text-green-700">
                            {'\n'}💡 Korrekt valg (debug mode)
                          </Text>
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* End of story message for ending steps */}
          {currentStep.isEnding && (
            <View className="space-y-4">
              {/* Story Outcome */}
              {currentStory.outcome && (
                <View className="bg-primary-100 rounded-2xl p-6">
                  <Text className="text-xl font-bold text-primary-900 mb-3 text-center">
                    Din historie
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
                      Ny historie
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleGoToStories}
                    className="bg-primary-200 py-3 px-6 rounded-xl"
                  >
                    <Text className="text-lg font-bold text-primary-900 text-center">
                      Mine historier
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