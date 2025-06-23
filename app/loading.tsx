import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../store/appStore';
import { OpenAIService } from '../services/openaiService';

const LoadingScreen = () => {
  const { userProfile, selectedTheme, setCurrentStory, setIsGeneratingStory, addSavedStory } = useAppStore();
  const [loadingMessage, setLoadingMessage] = useState('Forbereder dit eventyr...');
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    const generateStory = async () => {
      if (!userProfile || !selectedTheme) {
        router.replace('/');
        return;
      }

      try {
        setIsGeneratingStory(true);
        
        // Update loading messages progressively
        const messages = [
          'Forbereder dit eventyr...',
          'Skaber magiske karakterer...',
          'Tegner smukke billeder...',
          'Samler historien sammen...',
          'Næsten færdig...'
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
          if (messageIndex < messages.length - 1) {
            messageIndex++;
            setLoadingMessage(messages[messageIndex]);
          }
        }, 2000);

        // Generate the story
        const story = await OpenAIService.generateStory({
          theme: selectedTheme,
          protagonist: userProfile
        });

        clearInterval(messageInterval);
        
        // Save and set the story
        setCurrentStory(story);
        await addSavedStory(story);
        
        setLoadingMessage('Klar til eventyr!');
        
        // Navigate to story screen after a brief delay
        setTimeout(() => {
          router.push('/story');
        }, 1000);

      } catch (error) {
        console.error('Error generating story:', error);
        setLoadingMessage('Der opstod en fejl. Prøver igen...');
        
        // Retry after 3 seconds or navigate back
        setTimeout(() => {
          router.back();
        }, 3000);
      } finally {
        setIsGeneratingStory(false);
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
      <Text className="text-lg text-primary-700 text-center mb-8">
        {loadingMessage}
      </Text>

      {/* Progress Dots */}
      <View className="flex-row space-x-2">
        {[...Array(5)].map((_, index) => (
          <Animated.View
            key={index}
            className="w-3 h-3 bg-primary-300 rounded-full"
            style={{
              opacity: pulseValue.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.3, 1],
              }),
              transform: [{
                scale: pulseValue.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.8, 1.2],
                })
              }]
            }}
          />
        ))}
      </View>

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