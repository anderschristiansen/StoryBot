import { ChoicePoints, PointsEarned } from '../types/gamification';

export const getEncouragingMessage = (choiceType: 'courage' | 'wisdom' | 'kindness', points: number): string => {
  const messages = {
    courage: [
      'Du er virkelig modig!',
      'Fantastisk mod vist!',
      'Du er så tapper!',
      'Hvilken dristig beslutning!',
      'Du viser ægte heltemod!'
    ],
    wisdom: [
      'Så kloge tanker!',
      'Du tænker virkelig smart!',
      'Hvilken vis beslutning!',
      'Du bruger dit hoved godt!',
      'Så gennemtænkt!'
    ],
    kindness: [
      'Hvor snilt af dig!',
      'Du har et godt hjerte!',
      'Så omtænksom!',
      'Du tænker på andre!',
      'Hvilken sød handling!'
    ]
  };

  const typeMessages = messages[choiceType];
  const randomIndex = Math.floor(Math.random() * typeMessages.length);
  return typeMessages[randomIndex];
};

export const createPointsEarned = (choiceType: 'courage' | 'wisdom' | 'kindness', points: number): PointsEarned => {
  return {
    type: choiceType,
    amount: points,
    message: getEncouragingMessage(choiceType, points)
  };
};

export const addPointsToProfile = (currentPoints: ChoicePoints, earnedPoints: PointsEarned): ChoicePoints => {
  return {
    ...currentPoints,
    [earnedPoints.type]: currentPoints[earnedPoints.type] + earnedPoints.amount
  };
};

export const addPointsToStory = (currentPoints: ChoicePoints, earnedPoints: PointsEarned): ChoicePoints => {
  return addPointsToProfile(currentPoints, earnedPoints);
};

export const initializeGameStats = () => ({
  courage: 0,
  wisdom: 0,
  kindness: 0,
  totalStoriesCompleted: 0,
  totalChoicesMade: 0,
  favoriteChoiceType: null as 'courage' | 'wisdom' | 'kindness' | null,
  pathsDiscovered: 0,
  totalPathsAvailable: 0
});

export const updateGameStats = (currentStats: any, story: any) => {
  if (!currentStats) currentStats = initializeGameStats();
  
  const totalPoints = (story.pointsEarned?.courage || 0) + 
                     (story.pointsEarned?.wisdom || 0) + 
                     (story.pointsEarned?.kindness || 0);

  return {
    ...currentStats,
    courage: currentStats.courage + (story.pointsEarned?.courage || 0),
    wisdom: currentStats.wisdom + (story.pointsEarned?.wisdom || 0),
    kindness: currentStats.kindness + (story.pointsEarned?.kindness || 0),
    totalStoriesCompleted: story.completed ? currentStats.totalStoriesCompleted + 1 : currentStats.totalStoriesCompleted,
    totalChoicesMade: currentStats.totalChoicesMade + (story.choicesMade?.length || 0),
    favoriteChoiceType: getFavoriteChoiceType({
      courage: currentStats.courage + (story.pointsEarned?.courage || 0),
      wisdom: currentStats.wisdom + (story.pointsEarned?.wisdom || 0),
      kindness: currentStats.kindness + (story.pointsEarned?.kindness || 0)
    })
  };
};

const getFavoriteChoiceType = (points: ChoicePoints): 'courage' | 'wisdom' | 'kindness' | null => {
  const total = points.courage + points.wisdom + points.kindness;
  if (total === 0) return null;
  
  if (points.courage >= points.wisdom && points.courage >= points.kindness) return 'courage';
  if (points.wisdom >= points.kindness) return 'wisdom';
  return 'kindness';
};