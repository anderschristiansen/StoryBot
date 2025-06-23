import React from 'react';
import { View, Text } from 'react-native';
import { ChoicePoints } from '../types/gamification';

interface PointsDisplayProps {
  points: ChoicePoints;
  className?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ points, className = "" }) => {
  const pointTypes = [
    {
      key: 'courage' as keyof ChoicePoints,
      icon: '🦁',
      label: 'Mod',
      color: '#FF6B35',
      value: points.courage
    },
    {
      key: 'wisdom' as keyof ChoicePoints,
      icon: '🧠',
      label: 'Visdom',
      color: '#4A90E2',
      value: points.wisdom
    },
    {
      key: 'kindness' as keyof ChoicePoints,
      icon: '❤️',
      label: 'Snilhed',
      color: '#F54A8C',
      value: points.kindness
    }
  ];

  const totalPoints = points.courage + points.wisdom + points.kindness;

  if (totalPoints === 0) {
    return (
      <View className={`bg-white rounded-2xl p-6 ${className}`}>
        <Text className="text-xl font-bold text-primary-900 mb-4 text-center">
          Dine Karakteregenskaber
        </Text>
        <Text className="text-center text-primary-700">
          Fuldfør historier for at optjene point og se dine karakterstyrker!
        </Text>
      </View>
    );
  }

  return (
    <View className={`bg-white rounded-2xl p-6 ${className}`}>
      <Text className="text-xl font-bold text-primary-900 mb-4 text-center">
        Dine Karakteregenskaber
      </Text>
      
      <View className="space-y-4">
        {pointTypes.map((pointType) => (
          <View key={pointType.key} className="flex-row items-center">
            <Text className="text-3xl mr-3">{pointType.icon}</Text>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-lg font-semibold text-primary-900">
                  {pointType.label}
                </Text>
                <Text 
                  className="text-lg font-bold"
                  style={{ color: pointType.color }}
                >
                  {pointType.value} point
                </Text>
              </View>
              <View className="bg-primary-100 h-3 rounded-full">
                <View
                  className="h-3 rounded-full"
                  style={{
                    backgroundColor: pointType.color,
                    width: totalPoints > 0 ? `${(pointType.value / Math.max(totalPoints * 0.4, 10)) * 100}%` : '0%',
                    maxWidth: '100%'
                  }}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-6 p-4 bg-primary-50 rounded-xl">
        <Text className="text-center text-primary-800 font-semibold">
          Total: {totalPoints} karakterpoint
        </Text>
        {totalPoints >= 10 && (
          <Text className="text-center text-primary-700 mt-1 text-sm">
            🌟 Du viser fantastiske karakteregenskaber! 🌟
          </Text>
        )}
      </View>
    </View>
  );
};

export default PointsDisplay;