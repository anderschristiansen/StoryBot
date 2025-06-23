import React from 'react';
import { SafeAreaView, Text } from 'react-native';

const Home = () => {
  return (
    <SafeAreaView className="flex-1 bg-primary-200 justify-center items-center">
      <Text className="text-5xl text-primary-950">Home</Text>
      <Text className="text-primary-900">This is the home screen</Text>
    </SafeAreaView>
  )
}

export default Home