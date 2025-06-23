import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Stories = () => {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Details {id}</Text>
    </View>
  )
}

export default Stories;

const styles = StyleSheet.create({});