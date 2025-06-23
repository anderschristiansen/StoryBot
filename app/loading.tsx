import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { OpenAIService } from '../services/openaiService';

const LoadingScreen = () => {
  const { userProfile, selectedTheme, setCurrentStory, setIsGeneratingStory, addSavedStory } = useAppStore();
  const [loadingMessage, setLoadingMessage] = useState('Forbereder dit eventyr...');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(8);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Start animations
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  // Show cancel button after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isCancelling) {
        setShowCancelButton(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [isCancelling]);

  const handleCancel = () => {
    Alert.alert(
      'Afbryd Historie',
      'Er du sikker på, at du vil afbryde oprettelsen af din historie?',
      [
        {
          text: 'Nej',
          style: 'cancel'
        },
        {
          text: 'Ja, afbryd',
          style: 'destructive',
          onPress: () => {
            console.log('[Loading] User requested cancellation');
            setIsCancelling(true);
            setLoadingMessage('Afbryder...');
            
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const generateStory = async () => {
      if (!userProfile || !selectedTheme) {
        router.replace('/');
        return;
      }

      try {
        setIsGeneratingStory(true);
        
        // Create AbortController for cancellation
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        const handleProgress = (message: string, step: number, total: number) => {
          console.log(`[Loading] Progress: ${step}/${total} - ${message}`);
          setLoadingMessage(message);
          setCurrentStep(step);
          setTotalSteps(total);
          setProgress((step / total) * 100);
        };

        // Generate the story with progress tracking and cancellation support
        const story = await OpenAIService.generateStory({
          theme: selectedTheme,
          protagonist: userProfile,
          onProgress: handleProgress,
          abortSignal: abortController.signal
        });
        
        // Save and set the story
        setCurrentStory(story);
        await addSavedStory(story);
        
        setLoadingMessage('Klar til eventyr!');
        setProgress(100);
        
        // Navigate to story screen after a brief delay
        setTimeout(() => {
          router.push('/story');
        }, 1000);

      } catch (error) {
        console.error('Error generating story:', error);
        
        // Handle cancellation specifically
        if (error instanceof Error && error.message === 'CANCELLED') {
          console.log('[Loading] Story generation was cancelled');
          setLoadingMessage('Historie oprettelse afbrudt');
          setProgress(0);
          
          // Navigate back after short delay
          setTimeout(() => {
            router.back();
          }, 1500);
          return;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Der opstod en ukendt fejl';
        setLoadingMessage(`Fejl: ${errorMessage}`);
        setProgress(0);
        
        // Navigate back after showing error
        setTimeout(() => {
          router.back();
        }, 4000);
      } finally {
        setIsGeneratingStory(false);
        abortControllerRef.current = null;
      }
    };

    generateStory();
  }, [userProfile, selectedTheme]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="flex-1 bg-primary-50 justify-center items-center px-8">
      {/* Animated Book Icon */}
      <Animated.View
        style={{
          transform: [
            { scale: pulseValue },
            { rotate: spin }
          ]
        }}
        className="mb-8"
      >
        <View className="w-24 h-24 bg-primary-200 rounded-full items-center justify-center">
          <Text className="text-5xl">📚</Text>
        </View>
      </Animated.View>

      {/* Loading Title */}
      <Text className="text-3xl font-bold text-primary-900 text-center mb-4">
        Skaber dit eventyr
      </Text>

      {/* Loading Message */}
      <Text className="text-lg text-primary-700 text-center mb-4">
        {loadingMessage}
      </Text>

      {/* Progress Info */}
      <Text className="text-sm text-primary-600 text-center mb-6">
        Trin {currentStep} af {totalSteps}
      </Text>

      {/* Progress Bar */}
      <View className="w-full max-w-xs mb-8">
        <View className="bg-primary-200 h-3 rounded-full">
          <Animated.View 
            className="bg-primary-500 h-3 rounded-full"
            style={{ 
              width: `${Math.max(progress, 5)}%`,
              minWidth: progress > 0 ? 20 : 0
            }}
          />
        </View>
        <Text className="text-xs text-primary-600 text-center mt-2">
          {Math.round(progress)}%
        </Text>
      </View>

      {/* Progress Dots */}
      <View className="flex-row space-x-2">
        {[...Array(totalSteps)].map((_, index) => (
          <Animated.View
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < currentStep ? 'bg-primary-500' : 'bg-primary-300'
            }`}
            style={{
              opacity: index < currentStep ? 1 : pulseValue.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.3, 1],
              }),
              transform: [{
                scale: index === currentStep - 1 ? pulseValue.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [1, 1.3],
                }) : 1
              }]
            }}
          />
        ))}
      </View>

      {/* Cancel Button */}
      {showCancelButton && !isCancelling && (
        <TouchableOpacity
          onPress={handleCancel}
          className="mt-8 py-3 px-6 bg-primary-200 border border-primary-300 rounded-xl"
        >
          <Text className="text-primary-900 font-semibold text-center">
            Afbryd
          </Text>
        </TouchableOpacity>
      )}

      {/* Magical Particles Effect */}
      <View className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            className="absolute w-2 h-2 bg-primary-400 rounded-full"
            style={{
              left: `${20 + (index * 12)}%`,
              top: `${30 + (index % 3) * 20}%`,
              opacity: pulseValue.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.2, 0.8],
              }),
              transform: [
                {
                  translateY: pulseValue.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0, -10],
                  })
                },
                {
                  scale: pulseValue.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.5, 1.5],
                  })
                }
              ]
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default LoadingScreen;