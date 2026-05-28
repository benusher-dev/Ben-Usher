const MAP = [
  { keywords: ['bench press', 'chest press', 'push up', 'pushup', 'push-up', 'fly', 'flye', 'dip', 'pec', 'incline press', 'decline press', 'cable cross'], muscles: ['chest', 'shoulders', 'triceps'] },
  { keywords: ['overhead press', 'shoulder press', 'ohp', 'military press', 'arnold press', 'lateral raise', 'front raise', 'upright row', 'face pull', 'reverse fly'], muscles: ['shoulders', 'traps'] },
  { keywords: ['pull up', 'pullup', 'chin up', 'chinup', 'lat pulldown', 'pull down', 'pulldown', 'straight arm pulldown'], muscles: ['lats', 'biceps', 'upperBack'] },
  { keywords: ['row', 'bent over', 'cable row', 'seated row', 't-bar', 'chest supported row'], muscles: ['upperBack', 'lats', 'biceps', 'traps'] },
  { keywords: ['shrug'], muscles: ['traps'] },
  { keywords: ['deadlift', 'sumo deadlift'], muscles: ['hamstrings', 'glutes', 'lowerBack', 'traps', 'upperBack'] },
  { keywords: ['squat', 'front squat', 'hack squat', 'goblet squat'], muscles: ['quads', 'glutes', 'hamstrings'] },
  { keywords: ['lunge', 'split squat', 'bulgarian', 'step up'], muscles: ['quads', 'glutes', 'hamstrings'] },
  { keywords: ['leg press'], muscles: ['quads', 'glutes'] },
  { keywords: ['leg extension'], muscles: ['quads'] },
  { keywords: ['leg curl', 'hamstring curl', 'nordic', 'rdl', 'romanian'], muscles: ['hamstrings', 'glutes'] },
  { keywords: ['hip thrust', 'glute bridge', 'hip extension', 'kickback'], muscles: ['glutes', 'hamstrings'] },
  { keywords: ['calf raise', 'calf press', 'standing calf', 'seated calf', 'donkey calf'], muscles: ['calves'] },
  { keywords: ['bicep curl', 'hammer curl', 'concentration curl', 'preacher curl', 'barbell curl', 'curl'], muscles: ['biceps', 'forearms'] },
  { keywords: ['tricep', 'skull crusher', 'close grip', 'pushdown', 'overhead extension'], muscles: ['triceps'] },
  { keywords: ['forearm', 'wrist curl', 'farmer'], muscles: ['forearms'] },
  { keywords: ['crunch', 'sit up', 'situp', 'plank', 'ab ', 'abs ', 'core', 'russian twist', 'leg raise', 'mountain climber', 'hanging knee', 'cable crunch'], muscles: ['abs'] },
  { keywords: ['good morning', 'back extension', 'hyperextension', 'reverse hyper'], muscles: ['lowerBack', 'hamstrings', 'glutes'] },
  { keywords: ['clean', 'snatch', 'kettlebell swing', 'thruster'], muscles: ['glutes', 'hamstrings', 'shoulders', 'traps', 'lowerBack'] },
]

export function getMusclesFromExercises(exerciseNames) {
  const muscles = new Set()
  for (const name of exerciseNames) {
    const lower = name.toLowerCase()
    for (const entry of MAP) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        entry.muscles.forEach(m => muscles.add(m))
      }
    }
  }
  return muscles
}

export const MUSCLE_LABELS = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  biceps: 'Biceps',
  forearms: 'Forearms',
  abs: 'Core',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  traps: 'Traps',
  upperBack: 'Upper Back',
  lats: 'Lats',
  lowerBack: 'Lower Back',
}
