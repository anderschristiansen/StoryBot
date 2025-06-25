import { StoryTheme, UserProfile } from '../types/story';

// Art style definitions with detailed descriptions
export const artStyles = {
  pixar: {
    name: 'Pixar',
    description: '3D animeret filmstil med varme farver',
    prompt: '3D Pixar animation style, vibrant colors, smooth lighting, detailed textures, cinematic quality'
  },
  cartoon: {
    name: 'Tegnefilm',
    description: 'Traditionel 2D tegnefilm stil',
    prompt: '2D cartoon animation style, bold outlines, flat colors, expressive characters, Disney-like quality'
  },
  watercolor: {
    name: 'Akvarel',
    description: 'Blød malet illustration',
    prompt: 'watercolor painting style, soft brushstrokes, flowing colors, artistic texture, gentle blending'
  },
  digital: {
    name: 'Digital Kunst',
    description: 'Moderne digital maleri',
    prompt: 'digital art painting, detailed brushwork, rich colors, artistic lighting, professional illustration'
  },
  sketch: {
    name: 'Tegning',
    description: 'Håndtegnet blyant stil',
    prompt: 'pencil sketch style, hand-drawn lines, shading, artistic sketching, detailed linework'
  },
  fantasy: {
    name: 'Fantasy',
    description: 'Magisk drømmeagtig kunstværk',
    prompt: 'fantasy art style, magical atmosphere, enchanted lighting, mystical colors, dreamlike quality'
  }
};

export const imagePrompts = {
  // Generate character description for consistency
  generateCharacterDescription: (protagonist: UserProfile): string => {
    const genderDesc = protagonist.gender === 'dreng' ? 'boy' : 'girl';
    const appearance = protagonist.characterAppearance;
    
    let description = `${protagonist.age}-year-old ${genderDesc}`;
    
    if (appearance) {
      if (appearance.hairColor) description += `, ${appearance.hairColor} hair`;
      if (appearance.eyeColor) description += `, ${appearance.eyeColor} eyes`;
      if (appearance.skinTone) description += `, ${appearance.skinTone} skin`;
      if (appearance.clothing) description += `, wearing ${appearance.clothing}`;
      if (appearance.specialFeatures) description += `, ${appearance.specialFeatures}`;
    } else {
      // Default appearance
      description += ', friendly appearance, bright eyes, cheerful expression';
    }
    
    return description;
  },

  // Generate comprehensive image prompt with consistency anchors
  generateImagePrompt: (
    theme: StoryTheme, 
    protagonist: UserProfile,
    sceneContext: string,
    settingDetails: string,
    storyId?: string
  ): string => {
    const artStyle = protagonist.artStyle || 'pixar';
    const styleInfo = artStyles[artStyle];
    const characterDesc = imagePrompts.generateCharacterDescription(protagonist);
    
    // Create semantic anchor for visual consistency
    const storyAnchor = storyId ? storyId.slice(-6) : `${protagonist.name}${theme.title}`.replace(/\s/g, '').slice(0, 6);
    
    return `SEMANTIC ANCHOR: "Storybook #${storyAnchor} - Maintain consistent visual identity and character design throughout"

SCENE: ${sceneContext}

CHARACTER: ${characterDesc} named ${protagonist.name} (CRITICAL: Keep EXACT same appearance, facial features, hair, clothing, and proportions as in previous scenes)

SETTING: ${settingDetails}, ${theme.description}

STYLE DIRECTION: Directed in the style of ${styleInfo.name} — ${styleInfo.prompt}
[Visual Continuity]: Same lighting setup, color palette, artistic technique, and camera angle approach as previous story illustrations

COMPOSITION: Single scene focusing on ${protagonist.name}. MAINTAIN: same character design, same outfit, same facial features, same artistic style. Appropriate for ${protagonist.age}-year-olds, safe and engaging environment, no text or books visible in image

CONSISTENCY REQUIREMENTS: 
- Same character proportions and design
- Same artistic lighting and color scheme  
- Same visual style and technique
- Cohesive with other scenes in this story series

MOOD: Child-friendly, appropriate for story context, warm and inviting atmosphere`;
  },

  // Generate simple prompt for when context is not available (backward compatibility)
  generateSimpleImagePrompt: (stepNumber: number, theme: StoryTheme, protagonist: UserProfile): string => {
    const artStyle = protagonist.artStyle || 'pixar';
    const styleInfo = artStyles[artStyle];
    const characterDesc = imagePrompts.generateCharacterDescription(protagonist);
    
    return `SCENE: ${protagonist.name} in ${theme.title} adventure, step ${stepNumber}

CHARACTER: ${characterDesc} (CONSISTENT APPEARANCE)

STYLE: ${styleInfo.prompt}

COMPOSITION: Child-friendly scene, no books or text visible, warm colors, engaging environment suitable for ${protagonist.age}-year-olds`;
  },
  
  placeholderUrls: {
    fallback: 'https://placehold.co/1024x1024/E5C4B8/382017/png?text=Billede%20Mangler',
    development: (stepNumber: number, theme: StoryTheme): string => {
      const text = encodeURIComponent(`Trin ${stepNumber}\n${theme.title}`);
      return `https://placehold.co/1024x1024/E5C4B8/2C3E50/png?text=${text}`;
    }
  }
};