import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'

const _layout = () => {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#382017', // primary-950
      tabBarInactiveTintColor: '#92756b', // primary-400
      tabBarStyle: {
        backgroundColor: '#faf8f6', // primary-50
        borderTopColor: '#e5c4b8', // primary-300
        borderTopWidth: 1,
        paddingTop: 5,
        paddingBottom: 5,
        height: 80,
      },
      tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
      },
    }}>
        <Tabs.Screen 
          name="home" 
          options={{ 
            headerShown: false, 
            title: 'Hjem',
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="stories" 
          options={{ 
            headerShown: false, 
            title: 'Historier',
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            headerShown: false, 
            title: 'Profil',
            tabBarIcon: ({ color, size = 24 }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }} 
        />
    </Tabs>
  )
}

export default _layout