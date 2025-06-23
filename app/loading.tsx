import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
  
  // Simple fade animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const abortControllerRef = useRef<AbortController | null>(null);

  const demoMessages = [
    'Forbereder dit eventyr...',
    'Genererer historie...',
    'Genererer billeder for historie-trin...',
    'Samler historie...'
  ];

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

  // Demo mode simulation
  useEffect(() => {
    if (!isDemo) return;

    let messageIndex = 0;
    const interval = setInterval(() => {
      setLoadingMessage(demoMessages[messageIndex]);
      messageIndex = (messageIndex + 1) % demoMessages.length;
    }, 2000);

    return () => clearInterval(interval);
  }, [isDemo, demoMessages]);

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
            setLoadingMessage(message);
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
          console.log('[Loading] Story generation completed but user cancelled, not saving');
        }
      } catch (error) {
        // Check if it was a cancellation first (not an error)
        if (error instanceof Error && error.message === 'CANCELLED') {
          console.log('[Loading] Story generation cancelled by user');
          
          // Clean up any partially created story
          if (currentStoryId) {
            console.log('[Loading] Cleaning up incomplete story:', currentStoryId);
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
        console.log('[Loading] Cleanup: Aborting story generation');
        abortControllerRef.current.abort();
      }
    };
  }, [isDemo, userProfile, selectedTheme, addSavedStory, setCurrentStory, setIsGeneratingStory, isCancelling]);

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
            console.log('[Loading] User requested cancellation');
            
            // Set cancelling state first to prevent any further processing
            setIsCancelling(true);
            
            // Abort the ongoing generation immediately
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
            
            // Clean up any partially saved story
            if (currentStoryId) {
              console.log('[Loading] Cleaning up partially saved story:', currentStoryId);
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
        console.log('[Loading] Component unmounting, ensuring cleanup');
        abortControllerRef.current.abort();
        setIsGeneratingStory(false);
        
        // Clean up any incomplete story when component unmounts
        if (currentStoryId) {
          console.log('[Loading] Component unmounting, cleaning up story:', currentStoryId);
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
        {/* Lottie Animation */}
        <View>
          <LottieView
            source={require('../assets/animations/loading.json')}
            autoPlay
            loop
            style={{
              width: 400,
              height: 400,
            }}
          />
        </View>

        {/* Story Theme */}
        <View className="items-center mb-5">
          <Text className="text-xl font-semibold text-primary-900 text-center leading-6">
            {isDemo 
              ? `Eventyrer eventyr med ${userProfile?.name || 'Emma'}`
              : `${selectedTheme?.title} eventyr med ${userProfile?.name}`
            }
          </Text>
        </View>

        {/* Progress Message */}
        <View className="mb-12">
          <Text className="text-lg text-primary-700 text-center font-medium leading-6">
            {loadingMessage}
          </Text>
        </View>

        {/* Demo Back Button */}
        {isDemo && (
          <TouchableOpacity
            onPress={handleCloseDemo}
            className="bg-primary-200 py-4 px-8 rounded-xl"
          >
            <Text className="text-primary-900 font-semibold text-center">
              ← Tilbage til Profil
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button (Real Mode Only) */}
        {!isDemo && showCancelButton && (
          <TouchableOpacity
            onPress={handleCancel}
            className="bg-red-100 border border-red-200 py-4 px-8 rounded-xl"
          >
            <Text className="text-red-700 font-semibold text-center">
              Afbryd Generering
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

export default LoadingScreen;