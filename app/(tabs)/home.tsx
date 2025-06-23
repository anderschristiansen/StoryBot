import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, FlatList, Modal, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../store/appStore';
import { STORY_THEMES } from '../../data/storyThemes';
import { StoryTheme } from '../../types/story';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

const Home = () => {
  const { userProfile, setSelectedTheme } = useAppStore();
  const [selectedThemeForModal, setSelectedThemeForModal] = useState<StoryTheme | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleThemePress = (theme: StoryTheme) => {
    setSelectedThemeForModal(theme);
    setShowModal(true);
  };

  const handleConfirmTheme = () => {
    if (!selectedThemeForModal) return;
    
    if (!userProfile) {
      Alert.alert('Profil mangler', 'Du skal oprette din profil først');
      router.push('/');
      return;
    }

    setSelectedTheme(selectedThemeForModal);
    setShowModal(false);
    router.push('/loading');
  };

  const renderThemeCard = ({ item: theme }: { item: StoryTheme }) => (
    <TouchableOpacity
      style={{ width: cardWidth }}
      className="bg-white rounded-2xl p-4 m-2 shadow-sm border border-primary-100"
      onPress={() => handleThemePress(theme)}
      activeOpacity={0.7}
    >
      <View className="items-center">
        <View 
          className="w-16 h-16 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: theme.color + '40' }}
        >
          <Text className="text-3xl">{theme.icon}</Text>
        </View>
        <Text className="text-lg font-bold text-primary-900 text-center mb-2">
          {theme.title}
        </Text>
        <Text className="text-sm text-primary-700 text-center leading-5">
          {theme.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-bold text-primary-900">
          Hej {userProfile?.name || 'der'}! 👋
        </Text>
        <Text className="text-lg text-primary-700 mt-1">
          Vælg et eventyr, du vil udforske
        </Text>
      </View>

      {/* Theme Grid */}
      <FlatList
        data={STORY_THEMES}
        renderItem={renderThemeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Theme Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            {selectedThemeForModal && (
              <>
                <View className="items-center mb-6">
                  <View 
                    className="w-20 h-20 rounded-full items-center justify-center mb-4"
                    style={{ backgroundColor: selectedThemeForModal.color + '40' }}
                  >
                    <Text className="text-4xl">{selectedThemeForModal.icon}</Text>
                  </View>
                  <Text className="text-2xl font-bold text-primary-900 text-center mb-2">
                    {selectedThemeForModal.title}
                  </Text>
                  <Text className="text-base text-primary-700 text-center">
                    {selectedThemeForModal.description}
                  </Text>
                </View>

                <Text className="text-center text-primary-800 mb-6">
                  Vil du starte dette eventyr?
                </Text>

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    className="flex-1 py-3 px-4 bg-primary-200 rounded-xl"
                  >
                    <Text className="text-lg font-semibold text-primary-900 text-center">
                      Nej tak
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleConfirmTheme}
                    className="flex-1 py-3 px-4 bg-primary-500 rounded-xl"
                  >
                    <Text className="text-lg font-semibold text-white text-center">
                      Start nu!
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;