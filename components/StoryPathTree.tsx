import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Story } from '../types/story';

interface StoryPathTreeProps {
  story: Story;
  onReplayWithPath?: (choiceSequence: string[]) => void;
}

const StoryPathTree: React.FC<StoryPathTreeProps> = ({ story, onReplayWithPath }) => {
  // Debug logging
  console.log('[PathTree] Story data:', {
    id: story.id,
    title: story.title,
    completed: story.completed,
    choiceSequence: story.choiceSequence,
    choicesMade: story.choicesMade,
    stepsCount: story.steps.length,
    steps: story.steps.map((step, i) => ({
      stepIndex: i,
      stepId: step.id,
      choicesCount: step.choices.length,
      isEnding: step.isEnding
    }))
  });

  // Calculate path completion
  const calculatePaths = () => {
    const totalChoices = story.steps.reduce((acc, step) => acc + step.choices.length, 0);
    const totalPossiblePaths = Math.min(totalChoices, 8); // Reasonable max for visualization
    const discoveredPaths = 1; // Current completed path
    const completionPercentage = Math.round((discoveredPaths / totalPossiblePaths) * 100);
    
    return { discoveredPaths, totalPossiblePaths, completionPercentage };
  };

  const pathData = calculatePaths();

  // Generate a simplified tree structure
  const generateTreeData = () => {
    const currentPath = story.choiceSequence || [];
    const treeNodes = [];
    
    console.log('[PathTree] Generating tree data with path:', currentPath);
    
    // Show the path taken (exclude the final step since it has no choices)
    for (let i = 0; i < story.steps.length - 1; i++) {
      const step = story.steps[i];
      const choiceTaken = currentPath[i];
      
      console.log(`[PathTree] Step ${i + 1}:`, {
        stepId: step.id,
        choiceTaken,
        availableChoices: step.choices.map(c => ({ id: c.id, text: c.text.substring(0, 30) + '...' }))
      });
      
      treeNodes.push({
        stepIndex: i + 1,
        stepTitle: `Trin ${i + 1}`,
        choices: step.choices.map(c => ({
          ...c,
          isTaken: c.id === choiceTaken,
          isAvailable: !choiceTaken || c.id === choiceTaken
        }))
      });
    }
    
    console.log('[PathTree] Generated tree nodes:', treeNodes.length);
    return treeNodes;
  };

  const treeData = generateTreeData();

  return (
    <View className="bg-white rounded-2xl p-6">
      <Text className="text-xl font-bold text-primary-900 mb-4 text-center">
        Historiets Stier
      </Text>
      
      {/* Path Statistics */}
      <View className="bg-primary-50 rounded-xl p-4 mb-6">
        <Text className="text-center text-primary-800 font-semibold mb-2">
          Opdaget {pathData.discoveredPaths} af {pathData.totalPossiblePaths} mulige stier
        </Text>
        <View className="bg-primary-200 h-3 rounded-full">
          <View 
            className="bg-primary-500 h-3 rounded-full"
            style={{ width: `${pathData.completionPercentage}%` }}
          />
        </View>
        <Text className="text-center text-primary-700 text-sm mt-2">
          {pathData.completionPercentage}% udforsket
        </Text>
      </View>

      {/* Path Tree */}
      <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
        <View className="space-y-4">
          {treeData.map((node, index) => (
            <View key={index} className="relative">
              <Text className="text-lg font-semibold text-primary-900 mb-2">
                {node.stepTitle}
              </Text>
              
              <View className="space-y-2 ml-4">
                {node.choices.map((choice, choiceIndex) => (
                  <View
                    key={choice.id}
                    className={`p-3 rounded-xl border-2 ${
                      choice.isTaken 
                        ? 'bg-primary-100 border-primary-400' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-6 h-6 rounded-full mr-3 items-center justify-center ${
                        choice.isTaken ? 'bg-primary-500' : 'bg-gray-300'
                      }`}>
                        <Text className={`text-sm font-bold ${
                          choice.isTaken ? 'text-white' : 'text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + choiceIndex)}
                        </Text>
                      </View>
                      
                      <View className="flex-1">
                        <Text className={`text-sm ${
                          choice.isTaken ? 'text-primary-900 font-semibold' : 'text-gray-600'
                        }`}>
                          {choice.text}
                        </Text>
                        
                        {choice.choiceType && choice.isTaken && (
                          <View className="flex-row items-center mt-1">
                            <Text className="text-xs text-primary-600">
                              {choice.choiceType === 'courage' && '🦁 Mod'}
                              {choice.choiceType === 'wisdom' && '🧠 Visdom'}
                              {choice.choiceType === 'kindness' && '❤️ Snilhed'}
                              {choice.points && ` +${choice.points}`}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {choice.isTaken && (
                        <Text className="text-primary-600 text-lg">✓</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              
              {/* Connection line to next step */}
              {index < treeData.length - 1 && (
                <View className="absolute left-8 -bottom-2 w-0.5 h-6 bg-primary-300" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Encouragement */}
      <View className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <Text className="text-center text-yellow-800 font-semibold mb-1">
          🌟 Udforsk flere stier! 🌟
        </Text>
        <Text className="text-center text-yellow-700 text-sm">
          Spil historien igen og træf forskellige valg for at opdage nye eventyr!
        </Text>
      </View>
    </View>
  );
};

export default StoryPathTree;