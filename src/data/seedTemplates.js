// OFF SZN programme — Ben Usher 8-week block
// Seeded once via useTemplates.js; never re-seeded after gwt_offszn_seeded is set.

function ex(id, name, sets, reps, weight, category, supersetId, restSeconds, notes, isCardio = false, exerciseType = 'weight') {
  return { id, name, sets, reps, weight, isCardio, supersetId, category, restSeconds, notes: notes ?? null, exerciseType }
}

export const SEED_TEMPLATES = [
  // ─── Lower 1 (Monday) ───────────────────────────────────────────────────────
  {
    id: 'offszn-lower1',
    name: 'Lower 1 — Off Szn',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    exercises: [
      ex('l1-wu', 'Warm-Up', 1, 1, null, 'other', null, 60,
        'Single leg calf raises ×15/side · 90/90 hip switches · Hip thrusts ×10 · Single leg RDLs ×5/side · Squats ×10 · Side lunges ×10/side · Split squats ×10/side', false, 'checklist'),

      // Block A — circuit, 4 rounds no rest
      ex('l1-a1', 'Pogos',             4, 10, null, 'legs',  'l1-A', 60, 'Start 10 reps — add 2 reps/week. Circuit A: no rest between exercises or rounds (4 rounds).'),
      ex('l1-a2', 'Sprint Stance ISO', 4, 10, null, 'other', 'l1-A', 60, '10s each side. Start 10s — add 1s/week.'),
      ex('l1-a3', 'Hanging Leg Raises',4,  8, null, 'core',  'l1-A', 60, 'Start 8 reps — add 1 rep/week.'),

      // Block B
      ex('l1-b1', 'Trap Bar Jumps', 3, 3, null, 'legs', null, 120,
        'Start with empty trap bar. Add ~2.5kg every 2 weeks.'),

      // Block C — progressive overload main lift
      ex('l1-c1', 'Squat', 2, 12, null, 'legs', null, 180,
        '~60% 1RM to start, +5kg/week. Progression: Wk1 2×12 · Wk2 2×10 · Wk3 3×8 · Wk4 3×6 · Wk5 4×5 · Wk6 4×4 · Wk7 5×3 · Wk8 5×2'),

      // Block D
      ex('l1-d1', 'Romanian Deadlift', 3, 9, null, 'legs', null, 120,
        'Target RPE 8. Increase weight when you hit 10 reps; decrease if RPE drops below 8. (3 × 8–10)'),
    ],
  },

  // ─── Upper 1 (Tuesday) ──────────────────────────────────────────────────────
  {
    id: 'offszn-upper1',
    name: 'Upper 1 — Off Szn',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    exercises: [
      ex('u1-wu', 'Warm-Up', 1, 1, null, 'other', null, 60,
        'Hang from bar ×30s · Half-kneeling thoracic rotations ×10/side · Prone T-lifts ×20 · Yoga push-ups ×10 · 90/90 shoulder cable rotation ×10/arm · KB overhead press bottoms-up ×10/side · Drop & catch push-up position ×5', false, 'checklist'),

      // Block A — circuit, 3 rounds no rest
      ex('u1-a1', 'Supine Med Ball Throws',  3, 3, null, 'other', 'u1-A', 60, '4kg med ball. Circuit A: no rest between exercises or rounds (3 rounds).'),
      ex('u1-a2', 'Slingshot Cable Rows',    3, 3, null, 'back',  'u1-A', 60, '3/side. Pull with intent — really drive it.'),
      ex('u1-a3', 'Cable Woodchops',         3, 8, null, 'core',  'u1-A', 60, '8/side.'),

      // Block B — progressive overload main lift
      ex('u1-b1', 'Horizontal Press', 2, 12, null, 'chest', null, 180,
        'BB Bench / Incline Press / Machine — pick one, keep for 8 weeks. ~60% 1RM, +5kg/week. Progression: Wk1 2×12 · Wk2 2×10 · Wk3 3×8 · Wk4 3×6 · Wk5 4×5 · Wk6 4×4 · Wk7 5×3 · Wk8 5×2'),

      // Block C
      ex('u1-c1', 'Vertical Pull',   4, 9,  null, 'back',      null, 90, 'Pull-Ups or Lat Pulldown — pick one, keep for 8 weeks. (4 × 8–10)'),
      ex('u1-c2', 'DB Cuban Press',  4, 11, null, 'shoulders', null, 90, 'Shoulder health. (4 × 10–12)'),

      // Block D — circuit, 4 rounds, rest 1:30 after each round
      ex('u1-d1', 'Biceps',     4, 10, null, 'arms', 'u1-D', 90, 'Your choice. 10/side. Circuit D: run D1–D3 × 4 rounds, rest 1:30 after each round.'),
      ex('u1-d2', 'Triceps',    4, 12, null, 'arms', 'u1-D', 90, 'Your choice.'),
      ex('u1-d3', 'Face Pulls', 4, 12, null, 'back', 'u1-D', 90, null),
    ],
  },

  // ─── Sprint Day (Wednesday) ──────────────────────────────────────────────────
  {
    id: 'offszn-sprints',
    name: 'Sprint Day — Off Szn',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    exercises: [
      ex('sp-wu', 'Warm-Up', 1, 1, null, 'other', null, 60,
        '2 min jog · Squats ×10 · Walking lunges ×10 · Single leg RDL ×5/side · Side lunge ×5/side · Leg swings ×5/side (front/back + side) · A-march 10m · Single A-switches ×20 · Lateral hop and stick ×10', false, 'checklist'),

      // Block A — sprint prep circuit
      ex('sp-a1', 'Wall Drive',           3, 5,  null, 'other', 'sp-A', 90, '5/leg — add 1 rep every 2 weeks. Sprint prep circuit.'),
      ex('sp-a2', 'Staggered Pogos',      3, 20, null, 'legs',  'sp-A', 90, 'Start 20 reps — add 1 rep/week.'),
      ex('sp-a3', 'Single Broad Jumps',   3, 3,  null, 'legs',  'sp-A', 90, null),

      // Block B — acceleration
      ex('sp-b1', 'Kneeling 5m Acceleration (uphill)', 1, 6, null, 'other', null, 180,
        '6 reps. Kneeling start, sprint uphill. Full rest between reps.'),

      // Block C — COD + sprint
      ex('sp-c1', 'Side Shuffle 5m → Sprint 10m (uphill)', 1, 2, null, 'other', null, 180,
        '1 rep left + 1 rep right = 2 total. Add 2 reps (1/side) every 2 weeks.'),
    ],
  },

  // ─── Lower 2 (Friday) ───────────────────────────────────────────────────────
  {
    id: 'offszn-lower2',
    name: 'Lower 2 — Off Szn',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    exercises: [
      ex('l2-wu', 'Warm-Up', 1, 1, null, 'other', null, 60,
        'Single leg calf raises ×15/side · 90/90 hip switches · Hip thrusts ×10 · Single leg RDLs ×5/side · Squats ×10 · Side lunges ×10/side · Split squats ×10/side', false, 'checklist'),

      // Block A — circuit, 4 rounds no rest
      ex('l2-a1', 'Lateral Wall ISOs',       4, 10, null, 'legs', 'l2-A', 60, '10s each side. Circuit A: no rest between exercises or rounds (4 rounds).'),
      ex('l2-a2', 'Lunge Jump Switches',     4,  4, null, 'legs', 'l2-A', 60, '4/side. Really jump — get in the air.'),
      ex('l2-a3', 'Copenhagen Short Lever',  4, 10, null, 'legs', 'l2-A', 60, '10s each side — add 1s/week.'),

      // Block B
      ex('l2-b1', 'Banded Broad Jumps', 3, 3, null, 'legs', null, 120, null),

      // Block C — progressive overload main lift
      ex('l2-c1', 'Deadlift', 2, 12, null, 'legs', null, 180,
        'Trap bar recommended; hip thrusts if back issues. ~60% 1RM, +5kg/week. Progression: Wk1 2×12 · Wk2 2×10 · Wk3 3×8 · Wk4 3×6 · Wk5 4×5 · Wk6 4×4 · Wk7 5×3 · Wk8 5×2'),

      // Block D
      ex('l2-d1', 'Split Squats',    3, 9,  null, 'legs', null, 90, 'BB/DB or SL Leg Press. (3 × 8–10)'),
      ex('l2-d2', 'Hamstring Curls', 3, 11, null, 'legs', null, 90, '3 × 10–12.'),
    ],
  },

  // ─── Upper 2 (Saturday) ─────────────────────────────────────────────────────
  {
    id: 'offszn-upper2',
    name: 'Upper 2 — Off Szn',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    exercises: [
      ex('u2-wu', 'Warm-Up', 1, 1, null, 'other', null, 60,
        'Hang from bar ×30s · Half-kneeling thoracic rotations ×10/side · Prone T-lifts ×20 · Yoga push-ups ×10 · 90/90 shoulder cable rotation ×10/arm · KB overhead press bottoms-up ×10/side · Drop & catch push-up position ×5', false, 'checklist'),

      // Block A — circuit
      ex('u2-a1', 'Plyometric Push-Ups',              3, 5, null, 'chest', 'u2-A', 60, 'Start 5 reps — add 1 rep every 2 weeks.'),
      ex('u2-a2', 'Overhead Rotate & Med Ball Slam',  3, 2, null, 'other', 'u2-A', 60, '4kg med ball. 2/side.'),
      ex('u2-a3', 'Quadruped Shoulder Touches',       3, 5, null, 'core',  'u2-A', 60, '5/side — add 1 rep/week.'),

      // Block B — progressive overload main lift
      ex('u2-b1', 'Shoulder Press', 2, 12, null, 'shoulders', null, 180,
        'Pick one variation, keep for 8 weeks. ~60% 1RM, +5kg/week. Progression: Wk1 2×12 · Wk2 2×10 · Wk3 3×8 · Wk4 3×6 · Wk5 4×5 · Wk6 4×4 · Wk7 5×3 · Wk8 5×2'),

      // Block C
      ex('u2-c1', 'Row Variation',  4, 9,  null, 'back',  null, 90, 'Your choice. (4 × 8–10)'),

      // Block D
      ex('u2-d1', 'Chest Flies',  4, 13, null, 'chest', null, 90, 'Your choice. (4 × 12–15)'),
      ex('u2-d2', 'DB Shrugs',    4, 12, null, 'back',  null, 90, null),

      // Block E — optional finisher
      ex('u2-e1', 'Biceps',    4, 13, null, 'arms',      null, 60, 'Your choice. Optional finisher. (4 × 12–15)'),
      ex('u2-e2', 'Triceps',   4, 13, null, 'arms',      null, 60, 'Your choice. Optional finisher. (4 × 12–15)'),
      ex('u2-e3', 'LU Raises', 4, 11, null, 'shoulders', null, 60, 'Optional finisher. (4 × 10–12)'),
    ],
  },
]
