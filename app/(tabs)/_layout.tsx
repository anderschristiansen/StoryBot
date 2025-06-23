import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

const TabIcon = ({ icon }: { icon: keyof typeof Ionicons.glyphMap }) => {
    return (
      <View>
        <Ionicons name={icon} size={20} color="#683f2f" />
      </View>
    )
  }

const _layout = () => {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#000',
      tabBarStyle: {
        backgroundColor: '#F5EFE7',
      },
    }}>
        <Tabs.Screen 
          name="home" 
          options={{ 
            headerShown: false, 
            title: 'Hjem',
            tabBarIcon: () => (
              <TabIcon icon="home" />
            ),
          }} 
        />
        <Tabs.Screen 
          name="stories" 
          options={{ 
            headerShown: false, 
            title: 'Historier',
            tabBarIcon: () => (
              <TabIcon icon="book" />
            ),
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            headerShown: false, 
            title: 'Profil',
            tabBarIcon: () => (
              <TabIcon icon="person" />
            ),
          }} 
        />
    </Tabs>
  )
}

export default _layout