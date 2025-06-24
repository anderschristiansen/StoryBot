import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView, Switch } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../store/appStore';
import { UserProfile } from '../../types/story';
import { StorageUtils } from '../../utils/storage';

const Profile = () => {
  const { userProfile, setUserProfile, clearUserProfile, savedStories } = useAppStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState('');
  const [enableImages, setEnableImages] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);
  const [storySteps, setStorySteps] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setAge(userProfile.age);
      setGender(userProfile.gender);
      setEnableImages(userProfile.enableImages ?? true); // Default to true
      setDeveloperMode(userProfile.developerMode ?? false); // Default to false
      setStorySteps(userProfile.storySteps ?? 5); // Default to 5
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Mangler navn', 'Skriv dit navn for at fortsætte');
      return;
    }
    
    if (!gender) {
      Alert.alert('Vælg køn', 'Vælg dit køn for at fortsætte');
      return;
    }

    if (age < 4 || age > 12) {
      Alert.alert('Ugyldig alder', 'Vælg en alder mellem 4 og 12 år');
      return;
    }

    setIsSaving(true);
    
    const updatedProfile: UserProfile = {
      name: name.trim(),
      age,
      gender,
      enableImages,
      developerMode,
      storySteps
    };

    try {
      setUserProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Gemt', 'Din profil er blevet opdateret');
    } catch {
      Alert.alert('Fejl', 'Kunne ikke gemme din profil. Prøv igen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setName(userProfile.name);
      setAge(userProfile.age);
      setGender(userProfile.gender);
      setEnableImages(userProfile.enableImages ?? true);
      setDeveloperMode(userProfile.developerMode ?? false);
      setStorySteps(userProfile.storySteps ?? 5);
    }
    setIsEditing(false);
  };

  const handleAgeChange = (increment: boolean) => {
    if (increment && age < 12) {
      setAge(age + 1);
    } else if (!increment && age > 4) {
      setAge(age - 1);
    }
  };

  // Auto-save function for developer settings
  const handleDeveloperSettingChange = async (setting: 'enableImages' | 'developerMode', value: boolean) => {
    if (!userProfile) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      [setting]: value
    };
    
    try {
      setUserProfile(updatedProfile);
      
      // Update local state
      if (setting === 'enableImages') {
        setEnableImages(value);
      } else if (setting === 'developerMode') {
        setDeveloperMode(value);
      }
      
    } catch (error) {
      console.error('Error updating developer setting:', error);
      Alert.alert('Fejl', 'Kunne ikke gemme indstilling. Prøv igen.');
    }
  };

  const handleResetProfile = () => {
    Alert.alert(
      'Nulstil Profil',
      'Er du sikker på, at du vil nulstille din profil? Alle dine historier vil også blive slettet.',
      [
        { text: 'Nej', style: 'cancel' },
        {
          text: 'Ja, nulstil',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageUtils.clearAllData();
              clearUserProfile();
              router.replace('/');
            } catch {
              Alert.alert('Fejl', 'Kunne ikke nulstille profil. Prøv igen.');
            }
          }
        }
      ]
    );
  };

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50 justify-center items-center px-8">
        <Text className="text-6xl mb-6">👤</Text>
        <Text className="text-2xl font-bold text-primary-900 text-center mb-4">
          Ingen Profil Fundet
        </Text>
        <Text className="text-lg text-primary-700 text-center mb-8">
          Du skal oprette din profil først
        </Text>
        
        <TouchableOpacity
          onPress={() => router.replace('/')}
          className="bg-primary-500 py-4 px-8 rounded-2xl"
        >
          <Text className="text-xl font-bold text-white">
            Opret Profil
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-50">
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-primary-900">
            Min Profil
          </Text>
          <Text className="text-lg text-primary-700 mt-1">
            Rediger dine oplysninger
          </Text>
        </View>

        {/* Profile Stats */}
        <View className="bg-white rounded-2xl p-6 mb-6">
          <Text className="text-xl font-bold text-primary-900 mb-4">
            Statistikker
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary-600">
                {savedStories.length}
              </Text>
              <Text className="text-sm text-primary-700">
                Historier
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary-600">
                {savedStories.filter(s => s.completed).length}
              </Text>
              <Text className="text-sm text-primary-700">
                Fuldført
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary-600">
                {savedStories.reduce((acc, story) => acc + story.choicesMade.length, 0)}
              </Text>
              <Text className="text-sm text-primary-700">
                Valg truffet
              </Text>
            </View>
          </View>
        </View>


        {/* Profile Form */}
        <View className="bg-white rounded-2xl p-6 mb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-primary-900">
              Mine Oplysninger
            </Text>
            {!isEditing && (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-primary-200 py-2 px-4 rounded-xl"
              >
                <Text className="text-primary-900 font-semibold">
                  Rediger
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-primary-900 mb-2">
              Navn
            </Text>
            {isEditing ? (
              <TextInput
                value={name}
                onChangeText={setName}
                className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-lg"
                autoCapitalize="words"
                autoCorrect={false}
              />
            ) : (
              <Text className="text-lg text-primary-700 py-3">
                {userProfile.name}
              </Text>
            )}
          </View>

          {/* Age */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-primary-900 mb-2">
              Alder
            </Text>
            {isEditing ? (
              <View className="flex-row items-center justify-center bg-primary-50 border border-primary-200 rounded-xl py-3">
                <TouchableOpacity
                  onPress={() => handleAgeChange(false)}
                  className="w-10 h-10 bg-primary-200 rounded-full items-center justify-center"
                  disabled={age <= 4}
                >
                  <Text className="text-xl font-bold text-primary-900">-</Text>
                </TouchableOpacity>
                
                <View className="mx-6 px-4 py-1 bg-primary-100 rounded-lg">
                  <Text className="text-2xl font-bold text-primary-900 text-center">
                    {age}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => handleAgeChange(true)}
                  className="w-10 h-10 bg-primary-200 rounded-full items-center justify-center"
                  disabled={age >= 12}
                >
                  <Text className="text-xl font-bold text-primary-900">+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text className="text-lg text-primary-700 py-3">
                {userProfile.age} år
              </Text>
            )}
          </View>

          {/* Story Steps Configuration */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-primary-900 mb-2">
              Historie Længde
            </Text>
            {isEditing ? (
              <View className="flex-row items-center justify-center bg-primary-50 border border-primary-200 rounded-xl py-3">
                <TouchableOpacity
                  onPress={() => setStorySteps(Math.max(3, storySteps - 1))}
                  className="w-10 h-10 bg-primary-200 rounded-full items-center justify-center"
                  disabled={storySteps <= 3}
                >
                  <Text className="text-xl font-bold text-primary-900">-</Text>
                </TouchableOpacity>
                
                <View className="mx-6 px-4 py-1 bg-primary-100 rounded-lg">
                  <Text className="text-2xl font-bold text-primary-900 text-center">
                    {storySteps}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => setStorySteps(Math.min(10, storySteps + 1))}
                  className="w-10 h-10 bg-primary-200 rounded-full items-center justify-center"
                  disabled={storySteps >= 10}
                >
                  <Text className="text-xl font-bold text-primary-900">+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text className="text-lg text-primary-700 py-3">
                {userProfile.storySteps ?? 5} trin per historie
              </Text>
            )}
            <Text className="text-sm text-primary-600 mt-1 text-center">
              Vælg mellem 3-10 trin per historie
            </Text>
          </View>

          {/* Gender */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-primary-900 mb-2">
              Køn
            </Text>
            {isEditing ? (
              <View className="flex-row space-x-2">
                {[
                  { value: 'dreng', label: 'Dreng' },
                  { value: 'pige', label: 'Pige' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setGender(option.value)}
                    className={`flex-1 py-3 px-3 rounded-xl border ${
                      gender === option.value 
                        ? 'bg-primary-200 border-primary-400' 
                        : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <Text className={`text-center font-semibold ${
                      gender === option.value ? 'text-primary-900' : 'text-primary-700'
                    }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text className="text-lg text-primary-700 py-3 capitalize">
                {userProfile.gender}
              </Text>
            )}
          </View>

          {/* Edit Actions */}
          {isEditing && (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 py-3 px-4 bg-primary-200 rounded-xl"
              >
                <Text className="text-lg font-semibold text-primary-900 text-center">
                  Annuller
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className={`flex-1 py-3 px-4 rounded-xl ${
                  isSaving ? 'bg-primary-300' : 'bg-primary-500'
                }`}
              >
                <Text className="text-lg font-semibold text-white text-center">
                  {isSaving ? 'Gemmer...' : 'Gem'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Developer Settings */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <View className="mb-6">
            <Text className="text-xl font-bold text-blue-900 text-center">
              🛠️ Udviklerindstillinger
            </Text>
            <Text className="text-sm text-blue-700 text-center mt-1">
              Test-indstillinger der gemmes automatisk
            </Text>
          </View>

          {/* Image Generation Toggle */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold text-blue-900 mb-1">
                  DALL-E Billeder
                </Text>
                <Text className="text-sm text-blue-700">
                  {enableImages 
                    ? 'Generer rigtige billeder (koster penge)' 
                    : 'Brug pladsholderbilleder (gratis)'}
                </Text>
              </View>
              <Switch
                value={enableImages}
                onValueChange={(value) => handleDeveloperSettingChange('enableImages', value)}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor={enableImages ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Developer Mode Toggle */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold text-blue-900 mb-1">
                  Debug Mode
                </Text>
                <Text className="text-sm text-blue-700">
                  {developerMode 
                    ? 'Vis korrekte svar i historier (test mode)' 
                    : 'Normal spilmode (skjul korrekte svar)'}
                </Text>
              </View>
              <Switch
                value={developerMode}
                onValueChange={(value) => handleDeveloperSettingChange('developerMode', value)}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor={developerMode ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Demo & Testing */}
          <View className="mb-4">
            <TouchableOpacity
              onPress={() => router.push('/loading?demo=true')}
              className="bg-purple-100 border border-purple-200 rounded-xl p-4"
            >
              <Text className="text-lg font-semibold text-purple-900 mb-1 text-center">
                ✨ Se Loading Animation Demo
              </Text>
              <Text className="text-sm text-purple-700 text-center">
                Preview af den nye minimalistiske Lottie animation
              </Text>
            </TouchableOpacity>
          </View>

          {/* Performance & Cost Information */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <Text className="text-sm font-semibold text-yellow-800 mb-2">
              ⚡ Ydeevne & Omkostninger
            </Text>
            <View className="space-y-1">
              <Text className="text-xs text-yellow-700">
                • DALL-E: {enableImages ? 'Koster $0.20-0.40 per historie' : 'Sparer $0.20-0.40 per historie'}
              </Text>
              <Text className="text-xs text-yellow-700">
                • Debug Mode: {developerMode ? 'Viser korrekte svar for test' : 'Normal spilmode'}
              </Text>
              <Text className="text-xs font-semibold text-yellow-800 mt-2">
                {enableImages 
                  ? '🎨 Med billeder: ~10-15 sek. per historie' 
                  : '🚀 Kun tekst: ~3-5 sek. per historie'}
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <Text className="text-xl font-bold text-red-900 mb-4">
            Farezone
          </Text>
          <Text className="text-red-700 mb-4">
            Dette vil slette din profil og alle dine historier. Denne handling kan ikke fortrydes.
          </Text>
          <TouchableOpacity
            onPress={handleResetProfile}
            className="bg-red-500 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-bold text-center">
              Nulstil Alt
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
