import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  }, [userProfile, initializeApp]);

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
    <SafeAreaView className="flex-1 bg-primary-50">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-16 pb-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-6xl text-center mb-4">📚</Text>
            <Text className="text-3xl font-bold text-primary-900 text-center mb-2">
              Velkommen til StoryBot
            </Text>
            <Text className="text-lg text-primary-700 text-center leading-7">
              Skab dine egne eventyr og oplev magiske historier
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-2xl p-6 mb-6" style={{
            shadowColor: '#382017',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-primary-900 mb-3">
                Hvad hedder du?
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Skriv dit navn her..."
                placeholderTextColor="#a0877a"
                className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-lg text-primary-900"
                style={{ minHeight: 60, fontSize: 18 }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Age Selector */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-primary-900 mb-3">
                Hvor gammel er du?
              </Text>
              <View className="flex-row items-center justify-center bg-primary-50 border border-primary-200 rounded-xl py-4">
                <TouchableOpacity
                  onPress={() => handleAgeChange(false)}
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    age <= 4 ? 'bg-primary-100' : 'bg-primary-200'
                  }`}
                  disabled={age <= 4}
                  activeOpacity={0.7}
                >
                  <Text className="text-xl font-bold text-primary-900">-</Text>
                </TouchableOpacity>
                
                <View className="mx-8 px-6 py-2 bg-primary-200 rounded-lg">
                  <Text className="text-3xl font-bold text-primary-900 text-center">
                    {age}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => handleAgeChange(true)}
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    age >= 12 ? 'bg-primary-100' : 'bg-primary-200'
                  }`}
                  disabled={age >= 12}
                  activeOpacity={0.7}
                >
                  <Text className="text-xl font-bold text-primary-900">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender Selection */}
            <View>
              <Text className="text-xl font-bold text-primary-900 mb-3">
                Hvad er dit køn?
              </Text>
              <View className="flex-row space-x-3 gap-3">
                {[
                  { value: 'dreng', label: 'Dreng', emoji: '👦' },
                  { value: 'pige', label: 'Pige', emoji: '👧' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.7}
                    className={`flex-1 py-3 px-3 rounded-xl border items-center ${
                      gender === option.value 
                        ? 'bg-primary-200 border-primary-400' 
                        : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <Text className="text-2xl mb-1">{option.emoji}</Text>
                    <Text className={`text-base font-semibold ${
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
          <TouchableOpacity
            onPress={handleStart}
            disabled={isLoading}
            activeOpacity={0.7}
            className={`py-4 px-6 rounded-2xl items-center ${
              isLoading ? 'bg-primary-300' : 'bg-primary-500'
            }`}
            style={{
              shadowColor: '#382017',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-xl font-bold text-white text-center">
              {isLoading ? 'Gemmer...' : 'Start Eventyr'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
