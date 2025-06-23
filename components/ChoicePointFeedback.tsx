import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { PointsEarned } from '../types/gamification';

interface ChoicePointFeedbackProps {
  pointsEarned: PointsEarned | null;
  visible: boolean;
  onAnimationComplete: () => void;
}

const ChoicePointFeedback: React.FC<ChoicePointFeedbackProps> = ({
  pointsEarned,
  visible,
  onAnimationComplete
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible && pointsEarned) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold for a moment, then animate out
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: -30,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Reset values
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
            translateY.setValue(50);
            onAnimationComplete();
          });
        }, 2000);
      });
    }
  }, [visible, pointsEarned]);

  if (!visible || !pointsEarned) {
    return null;
  }

  const getPointTypeInfo = (type: string) => {
    switch (type) {
      case 'courage':
        return { icon: '🦁', label: 'Mod Point', color: '#FF6B35' };
      case 'wisdom':
        return { icon: '🧠', label: 'Visdom Point', color: '#4A90E2' };
      case 'kindness':
        return { icon: '❤️', label: 'Snilhed Point', color: '#F54A8C' };
      default:
        return { icon: '⭐', label: 'Point', color: '#FFD700' };
    }
  };

  const pointInfo = getPointTypeInfo(pointsEarned.type);

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center pointer-events-none z-50">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateY }
          ],
          borderColor: pointInfo.color,
          shadowColor: pointInfo.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        className="bg-white border-4 rounded-3xl px-8 py-6 shadow-lg mx-4"
      >
        <View className="items-center">
          <Text className="text-6xl mb-2">{pointInfo.icon}</Text>
          <Text 
            className="text-2xl font-bold mb-2"
            style={{ color: pointInfo.color }}
          >
            +{pointsEarned.amount} {pointInfo.label}
          </Text>
          <Text className="text-lg text-center text-primary-800 max-w-xs">
            {pointsEarned.message}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default ChoicePointFeedback;