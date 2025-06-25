import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { OpenAIService } from '../services/openaiService';
import { useAppStore } from '../store/appStore';

const LoadingScreen = () => {
  const { demo } = useLocalSearchParams();
  const isDemo = demo === 'true';
  
  const { userProfile, selectedTheme, setCurrentStory, setIsGeneratingStory, addSavedStory, deleteSavedStory } = useAppStore();
  const [loadingMessage, setLoadingMessage] = useState('Forbereder dit eventyr...');
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  
  // Enhanced animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const abortControllerRef = useRef<AbortController | null>(null);

  const demoMessages = useMemo(() => [
    'Forbereder dit eventyr...',
    'Genererer historie...',
    'Genererer billeder for historie-trin...',
    'Samler historie...'
  ], []);

  // Breathing animation for Lottie container
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breathingAnimation.start();
    return () => breathingAnimation.stop();
  }, [breatheAnim]);

  useEffect(() => {
    // Smooth entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (!isDemo) {
      // Show cancel button after 5 seconds in real mode
      const cancelTimer = setTimeout(() => {
        setShowCancelButton(true);
      }, 5000);
      return () => clearTimeout(cancelTimer);
    }
  }, [fadeAnim, isDemo]);

  // Smooth message transition function
  const animateMessageChange = useCallback((newMessage: string) => {
    Animated.sequence([
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => setLoadingMessage(newMessage), 200);
  }, [messageOpacity]);

  // Demo mode simulation with smooth transitions
  useEffect(() => {
    if (!isDemo) return;

    let messageIndex = 0;
    const interval = setInterval(() => {
      const newMessage = demoMessages[messageIndex];
      animateMessageChange(newMessage);
      messageIndex = (messageIndex + 1) % demoMessages.length;
    }, 2500); // Slightly longer for readability

    return () => clearInterval(interval);
  }, [isDemo, demoMessages, animateMessageChange]);

  // Real story generation
  useEffect(() => {
    if (isDemo) return;

    if (!userProfile || !selectedTheme) {
      router.replace('/');
      return;
    }

    const generateStory = async () => {
      try {
        abortControllerRef.current = new AbortController();
        
        const story = await OpenAIService.generateStory({
          theme: selectedTheme,
          protagonist: userProfile,
          onProgress: (message) => {
            animateMessageChange(message);
          },
          abortSignal: abortControllerRef.current.signal
        });

        if (!isCancelling) {
          // Save the story and track its ID
          setCurrentStoryId(story.id);
          await addSavedStory(story);
          setCurrentStory(story);
          setIsGeneratingStory(false);
          // Clear story ID since it's now properly saved and we're navigating away
          setCurrentStoryId(null);
          router.replace('/story');
        } else {
          // If cancelling, ensure story is not saved
          }
      } catch (error) {
        // Check if it was a cancellation first (not an error)
        if (error instanceof Error && error.message === 'CANCELLED') {
            
          // Clean up any partially created story
          if (currentStoryId) {
                try {
              await deleteSavedStory(currentStoryId);
            } catch (deleteError) {
              console.warn('[Loading] Could not delete incomplete story:', deleteError);
            }
          }
          
          setIsGeneratingStory(false);
          router.replace('/(tabs)/home');
          return;
        }
        
        // Only handle as error if not cancelling
        if (!isCancelling) {
          console.error('Error generating story:', error);
          setIsGeneratingStory(false);
          
          Alert.alert('Fejl', 'Kunne ikke generere historie. Prøv igen.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
          ]);
        }
      }
    };

    generateStory();

    // Cleanup function to abort generation if component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isDemo, userProfile, selectedTheme, addSavedStory, setCurrentStory, setIsGeneratingStory, isCancelling, animateMessageChange]);

  const handleCancel = () => {
    Alert.alert(
      'Afbryd Generering',
      'Er du sikker på, at du vil afbryde genereringen af historien?',
      [
        { text: 'Nej', style: 'cancel' },
        {
          text: 'Ja, afbryd',
          style: 'destructive',
          onPress: async () => {
                  
            // Set cancelling state first to prevent any further processing
            setIsCancelling(true);
            
            // Abort the ongoing generation immediately
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
            
            // Clean up any partially saved story
            if (currentStoryId) {
                    try {
                await deleteSavedStory(currentStoryId);
                setCurrentStoryId(null);
              } catch (deleteError) {
                console.warn('[Loading] Could not delete partially saved story:', deleteError);
              }
            }
            
            // Clear any loading states
            setIsGeneratingStory(false);
            setLoadingMessage('Afbryder...');
            
            // Navigate away immediately
            router.replace('/(tabs)/home');
          }
        }
      ]
    );
  };

  const handleCloseDemo = () => {
    router.back();
  };

  // Additional cleanup effect for component unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !isDemo) {
          abortControllerRef.current.abort();
        setIsGeneratingStory(false);
        
        // Clean up any incomplete story when component unmounts
        if (currentStoryId) {
            deleteSavedStory(currentStoryId).catch(error => {
            console.warn('[Loading] Could not delete story during unmount:', error);
          });
        }
      }
    };
  }, [isDemo, setIsGeneratingStory, currentStoryId, deleteSavedStory]);

  return (
    <View className="flex-1 bg-primary-50 justify-center items-center px-8">
      <Animated.View 
        style={{
          opacity: fadeAnim,
        }}
        className="w-full max-w-sm items-center"
      >
        {/* Lottie Animation with breathing effect */}
        <Animated.View 
          style={{
            transform: [{ scale: breatheAnim }],
          }}
          className="mb-6"
        >
          <View className="bg-white/5 rounded-full p-6 shadow-lg">
            <LottieView
              source={require('../assets/animations/loading.json')}
              autoPlay
              loop
              style={{
                width: 280,
                height: 280,
              }}
            />
          </View>
        </Animated.View>

        {/* Story Theme */}
        <View className="items-center mb-8 px-4">
          <Text className="text-2xl font-bold text-primary-900 text-center leading-7 tracking-wide">
            {isDemo 
              ? `Eventyrer eventyr med ${userProfile?.name || '?'}`
              : `${selectedTheme?.title} med ${userProfile?.name || '?'}`
            }
          </Text>
          <View className="mt-2 h-1 w-16 bg-primary-300 rounded-full" />
        </View>

        {/* Progress Message with fade animation */}
        <Animated.View 
          style={{ opacity: messageOpacity }}
          className="mb-12 px-6"
        >
          <View className="bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm border border-white/20">
            <Text className="text-lg text-primary-800 text-center font-medium leading-6">
              {loadingMessage}
            </Text>
          </View>
        </Animated.View>

        {/* Demo Back Button */}
        {isDemo && (
          <TouchableOpacity
            onPress={handleCloseDemo}
            className="bg-white/90 border border-primary-200 py-4 px-8 rounded-2xl shadow-lg"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-primary-900 font-bold text-center text-lg">
              ← Tilbage til Profil
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button (Real Mode Only) */}
        {!isDemo && showCancelButton && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            <TouchableOpacity
              onPress={handleCancel}
              className="bg-red-50 border-2 border-red-200 py-4 px-8 rounded-2xl shadow-md"
              style={{
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text className="text-red-700 font-bold text-center text-lg">
                Afbryd Generering
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

export default LoadingScreen;