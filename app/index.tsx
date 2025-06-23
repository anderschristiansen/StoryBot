import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAppStore } from "../store/appStore";
import { UserProfile } from "../types/story";

export default function OnboardingScreen() {
  const { userProfile, setUserProfile, initializeApp } = useAppStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeApp();
    
    // If user profile exists, redirect to home
    if (userProfile) {
      router.replace("/(tabs)/home");
    }
  }, [userProfile]);

  const handleStart = async () => {
    if (!name.trim()) {
      Alert.alert('Mangler navn', 'Du skal skrive dit navn for at fortsætte');
      return;
    }
    
    if (!gender) {
      Alert.alert('Vælg køn', 'Du skal vælge dit køn for at fortsætte');
      return;
    }

    if (age < 4 || age > 12) {
      Alert.alert('Ugyldig alder', 'Du skal vælge en alder mellem 4 og 12 år');
      return;
    }

    setIsLoading(true);
    
    const profile: UserProfile = {
      name: name.trim(),
      age,
      gender
    };

    try {
      setUserProfile(profile);
      router.replace("/(tabs)/home");
    } catch {
      Alert.alert('Fejl', 'Kunne ikke gemme din profil. Prøv igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeChange = (increment: boolean) => {
    if (increment && age < 12) {
      setAge(age + 1);
    } else if (!increment && age > 4) {
      setAge(age - 1);
    }
  };

  return (
    <ScrollView className="flex-1 bg-primary-50">
      <View className="flex-1 px-6 pt-16 pb-8">
        {/* Header */}
        <View className="items-center mb-12">
          <Text className="text-6xl mb-4">📚</Text>
          <Text className="text-4xl font-bold text-primary-900 text-center mb-2">
            Velkommen til StoryBot
          </Text>
          <Text className="text-lg text-primary-700 text-center">
            Skab dine egne eventyr og oplev magiske historier
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-6">
          {/* Name Input */}
          <View>
            <Text className="text-xl font-semibold text-primary-900 mb-3">
              Hvad hedder du?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Skriv dit navn her..."
              className="bg-white border-2 border-primary-200 rounded-xl px-4 py-4 text-lg"
              style={{ minHeight: 56 }}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Age Selector */}
          <View>
            <Text className="text-xl font-semibold text-primary-900 mb-3">
              Hvor gammel er du?
            </Text>
            <View className="flex-row items-center justify-center bg-white border-2 border-primary-200 rounded-xl py-4">
              <TouchableOpacity
                onPress={() => handleAgeChange(false)}
                className="w-12 h-12 bg-primary-200 rounded-full items-center justify-center"
                disabled={age <= 4}
              >
                <Text className="text-2xl font-bold text-primary-900">-</Text>
              </TouchableOpacity>
              
              <View className="mx-8 px-6 py-2 bg-primary-100 rounded-lg">
                <Text className="text-3xl font-bold text-primary-900 text-center">
                  {age}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => handleAgeChange(true)}
                className="w-12 h-12 bg-primary-200 rounded-full items-center justify-center"
                disabled={age >= 12}
              >
                <Text className="text-2xl font-bold text-primary-900">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gender Selection */}
          <View>
            <Text className="text-xl font-semibold text-primary-900 mb-3">
              Hvad er dit køn?
            </Text>
            <View className="flex-row space-x-3">
              {[
                { value: 'dreng', label: 'Dreng', emoji: '👦' },
                { value: 'pige', label: 'Pige', emoji: '👧' },
                { value: 'andet', label: 'Andet', emoji: '🧒' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setGender(option.value)}
                  className={`flex-1 py-4 px-3 rounded-xl border-2 items-center ${
                    gender === option.value 
                      ? 'bg-primary-200 border-primary-400' 
                      : 'bg-white border-primary-200'
                  }`}
                >
                  <Text className="text-2xl mb-1">{option.emoji}</Text>
                  <Text className={`text-lg font-semibold ${
                    gender === option.value ? 'text-primary-900' : 'text-primary-700'
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Start Button */}
        <View className="mt-12">
          <TouchableOpacity
            onPress={handleStart}
            disabled={isLoading}
            className={`py-5 px-8 rounded-2xl items-center ${
              isLoading ? 'bg-primary-300' : 'bg-primary-500'
            }`}
            style={{ minHeight: 64 }}
          >
            <Text className="text-2xl font-bold text-white">
              {isLoading ? 'Gemmer...' : 'Start Eventyr'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
