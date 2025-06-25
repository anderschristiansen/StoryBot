import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../../store/appStore';
import { Story } from '../../types/story';

const { width } = Dimensions.get('window');

// Fallback image component for when images fail to load
const FallbackImage = ({ theme }: { theme: string }) => (
  <View 
    style={{ width: width - 24, height: (width - 24) * 0.5 }}
    className="rounded-t-2xl bg-primary-200 items-center justify-center border-b-2 border-primary-300"
  >
    <Text className="text-5xl mb-2">📚</Text>
    <Text className="text-lg font-bold text-primary-800 text-center px-4">
      {theme}
    </Text>
  </View>
);

const Stories = () => {
  const { savedStories, loadSavedStories, setCurrentStory, deleteSavedStory, replayStory } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSavedStories();
  }, []);

  useEffect(() => {
  }, [savedStories]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedStories();
    setRefreshing(false);
  };

  const handleContinueStory = (story: Story) => {
    setCurrentStory(story);
    router.push('/story');
  };

  const handleReplayStory = async (story: Story) => {
    try {
      await replayStory(story);
      router.push('/story');
    } catch {
      Alert.alert('Fejl', 'Kunne ikke genstarte historien. Prøv igen.');
    }
  };

  const handleDeleteStory = (story: Story) => {
    Alert.alert(
      'Slet historie',
      `Er du sikker på, at du vil slette "${story.title}"?`,
      [
        { text: 'Nej', style: 'cancel' },
        {
          text: 'Ja, slet',
          style: 'destructive',
          onPress: () => deleteSavedStory(story.id)
        }
      ]
    );
  };

  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => new Set(prev).add(imageUrl));
  };

  const renderStoryCard = ({ item: story }: { item: Story }) => {
    const firstStep = story.steps[0];
    
    return (
      <View className="bg-white rounded-2xl m-3 shadow-sm border border-primary-100">
        {/* Story Image */}
        {firstStep?.image && !imageErrors.has(firstStep.image) ? (
          <Image
            source={{ uri: firstStep.image }}
            style={{ 
              width: width - 24, 
              height: (width - 24) * 0.5,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={(event) => {
                      handleImageError(firstStep.image);
            }}
            placeholder={require('../../assets/images/icon.png')}
            placeholderContentFit="contain"
            transition={300}
          />
        ) : (
          <FallbackImage theme={story.theme} />
        )}
        
        {/* Story Info */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-bold text-primary-900 flex-1 pr-2">
              {story.title}
            </Text>
            <View className={`px-3 py-1 rounded-full ${
              story.completed ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <Text className={`text-xs font-semibold ${
                story.completed ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {story.completed ? 'Færdig' : 'I gang'}
              </Text>
            </View>
          </View>
          
          <Text className="text-base text-primary-700 mb-3">
            Tema: {story.theme}
          </Text>
          
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-primary-600">
              {new Date(story.createdAt).toLocaleDateString('da-DK')}
            </Text>
            
            <View className="flex-row items-center">
              <Text className="text-sm text-primary-600 mr-2">
                {story.steps.findIndex(s => s.id === story.currentStepId) + 1}/{story.steps.length}
              </Text>
              <View className="w-4 h-4 bg-primary-200 rounded-full">
                <View 
                  className="h-4 bg-primary-500 rounded-full"
                  style={{ 
                    width: `${((story.steps.findIndex(s => s.id === story.currentStepId) + 1) / story.steps.length) * 100}%`
                  }}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-2 gap-2">
            {/* Continue/Play Button */}
            <TouchableOpacity
              onPress={() => handleContinueStory(story)}
              className={`flex-1 py-3 px-4 rounded-xl ${
                story.completed ? 'bg-primary-200' : 'bg-primary-500'
              }`}
            >
              <Text className={`text-center font-semibold ${
                story.completed ? 'text-primary-900' : 'text-white'
              }`}>
                {story.completed ? 'Se slutning' : 'Fortsæt'}
              </Text>
            </TouchableOpacity>

            {/* Replay Button */}
            <TouchableOpacity
              onPress={() => handleReplayStory(story)}
              className="flex-1 py-3 px-4 bg-primary-100 border border-primary-300 rounded-xl"
            >
              <Text className="text-primary-900 text-center font-semibold">
                Spil igen
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => handleDeleteStory(story)}
              className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl items-center justify-center"
            >
              <Text className="text-red-600 text-lg">🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (savedStories.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50">
        <View className="px-6 pt-4 pb-2">
          <Text className="text-3xl font-bold text-primary-900">
            Mine historier
          </Text>
        </View>
        
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-6xl mb-6">📖</Text>
          <Text className="text-2xl font-bold text-primary-900 text-center mb-4">
            Ingen Historier Endnu
          </Text>
          <Text className="text-lg text-primary-700 text-center mb-8">
            Gå til forsiden og start dit første eventyr!
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/home')}
            className="bg-primary-500 py-4 px-8 rounded-2xl"
          >
            <Text className="text-xl font-bold text-white">
              Start Eventyr
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-bold text-primary-900">
          Mine historier
        </Text>
        <Text className="text-lg text-primary-700 mt-1">
          Fortsæt hvor du slap eller spil igen fra begyndelsen
        </Text>
      </View>

      <FlatList
        data={savedStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
        renderItem={renderStoryCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default Stories;
