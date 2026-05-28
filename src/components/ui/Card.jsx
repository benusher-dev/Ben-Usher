export function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98] transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
