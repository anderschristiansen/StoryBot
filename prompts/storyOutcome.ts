import { Story } from '../types/story';

export const outcomePrompts = {
  systemPrompt: `Du er børnebogsforfatter. Skriv varme, afsluttende tekster til børnehistorier på perfekt dansk med naturlig sprogbrug for børn.`,
  
  generateOutcomePrompt: (story: Story): string => {
    return `Skriv en kort afslutning på denne børnehistorie på korrekt dansk:

Titel: ${story.title}
Tema: ${story.theme}
Hovedperson: ${story.protagonist.name} (${story.protagonist.age} år)
Fuldført korrekt: ${story.completedCorrectly ? 'Ja' : 'Nej'}

Skriv en varm, afsluttende tekst på 3-4 sætninger der:
- Fortæller hvordan historien slutter
- Roser ${story.protagonist.name}s valg og mod
- Giver en positiv besked om at lære af sine beslutninger
Brug korrekt dansk grammatik og naturlig børnesprog for ${story.protagonist.age}-årige.`;
  },
  
  defaultOutcome: 'Fantastisk historie! Du traf nogle virkelig gode beslutninger.'
};