import { getMusclesFromExercises, MUSCLE_LABELS } from '../../utils/muscleMap'

const ACTIVE = '#6366f1'
const INACTIVE = '#e5e7eb'
const STROKE = '#d1d5db'
const SW = '0.75'

function reg(active, muscle) {
  return { fill: active.has(muscle) ? ACTIVE : INACTIVE, stroke: STROKE, strokeWidth: SW }
}

function FrontView({ active }) {
  return (
    <svg viewBox="0 0 100 210" style={{ width: '100%', maxWidth: 130 }} aria-label="Front muscle diagram">
      {/* Head + Neck */}
      <circle cx="50" cy="10" r="10" fill="#f3f4f6" stroke={STROKE} strokeWidth={SW} />
      <rect x="46" y="20" width="8" height="8" rx="2" fill="#f3f4f6" stroke={STROKE} strokeWidth={SW} />

      {/* Shoulders */}
      <ellipse cx="21" cy="34" rx="11" ry="8" {...reg(active, 'shoulders')} />
      <ellipse cx="79" cy="34" rx="11" ry="8" {...reg(active, 'shoulders')} />

      {/* Chest */}
      <path d="M28,30 Q50,27 50,53 Q40,58 26,53 Z" {...reg(active, 'chest')} />
      <path d="M72,30 Q50,27 50,53 Q60,58 74,53 Z" {...reg(active, 'chest')} />

      {/* Biceps */}
      <path d="M11,42 Q8,52 9,69 L18,69 L20,42 Z" {...reg(active, 'biceps')} />
      <path d="M89,42 Q92,52 91,69 L82,69 L80,42 Z" {...reg(active, 'biceps')} />

      {/* Forearms */}
      <path d="M9,71 L18,71 L16,103 L7,103 Z" {...reg(active, 'forearms')} />
      <path d="M91,71 L82,71 L84,103 L93,103 Z" {...reg(active, 'forearms')} />

      {/* Abs */}
      <path d="M29,55 L71,55 L69,108 L31,108 Z" {...reg(active, 'abs')} />

      {/* Quads */}
      <path d="M31,112 L50,110 L49,163 L29,161 Z" {...reg(active, 'quads')} />
      <path d="M69,112 L50,110 L51,163 L71,161 Z" {...reg(active, 'quads')} />

      {/* Calves */}
      <path d="M29,165 L49,165 L47,202 L27,200 Z" {...reg(active, 'calves')} />
      <path d="M71,165 L51,165 L53,202 L73,200 Z" {...reg(active, 'calves')} />
    </svg>
  )
}

function BackView({ active }) {
  return (
    <svg viewBox="0 0 100 210" style={{ width: '100%', maxWidth: 130 }} aria-label="Back muscle diagram">
      {/* Head + Neck */}
      <circle cx="50" cy="10" r="10" fill="#f3f4f6" stroke={STROKE} strokeWidth={SW} />
      <rect x="46" y="20" width="8" height="8" rx="2" fill="#f3f4f6" stroke={STROKE} strokeWidth={SW} />

      {/* Traps */}
      <path d="M26,28 Q50,24 74,28 L72,46 Q50,50 28,46 Z" {...reg(active, 'traps')} />

      {/* Lats */}
      <path d="M15,36 Q10,52 13,70 L29,68 L27,46 Z" {...reg(active, 'lats')} />
      <path d="M85,36 Q90,52 87,70 L71,68 L73,46 Z" {...reg(active, 'lats')} />

      {/* Upper Back */}
      <path d="M28,48 L72,48 L70,70 L30,70 Z" {...reg(active, 'upperBack')} />

      {/* Triceps */}
      <path d="M11,42 Q8,52 9,69 L18,69 L20,42 Z" {...reg(active, 'triceps')} />
      <path d="M89,42 Q92,52 91,69 L82,69 L80,42 Z" {...reg(active, 'triceps')} />

      {/* Lower Back */}
      <path d="M30,72 L70,72 L68,108 L32,108 Z" {...reg(active, 'lowerBack')} />

      {/* Glutes */}
      <path d="M30,110 L50,108 L50,136 L28,138 Z" {...reg(active, 'glutes')} />
      <path d="M70,110 L50,108 L50,136 L72,138 Z" {...reg(active, 'glutes')} />

      {/* Hamstrings */}
      <path d="M28,140 L50,138 L48,183 L26,185 Z" {...reg(active, 'hamstrings')} />
      <path d="M72,140 L50,138 L52,183 L74,185 Z" {...reg(active, 'hamstrings')} />

      {/* Calves */}
      <path d="M26,187 L48,185 L46,204 L24,204 Z" {...reg(active, 'calves')} />
      <path d="M74,187 L52,185 L54,204 L76,204 Z" {...reg(active, 'calves')} />
    </svg>
  )
}

export function MuscleDiagram({ exercises }) {
  const active = getMusclesFromExercises(exercises.map(e => e.name))
  const muscleList = [...active].map(m => MUSCLE_LABELS[m]).filter(Boolean).sort()

  return (
    <div>
      <div className="flex gap-4 justify-center items-start">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Front</span>
          <FrontView active={active} />
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Back</span>
          <BackView active={active} />
        </div>
      </div>
      {muscleList.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
          {muscleList.map(m => (
            <span key={m} className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {m}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-gray-400 mt-2">Log more exercises to see muscle mapping</p>
      )}
    </div>
  )
}
