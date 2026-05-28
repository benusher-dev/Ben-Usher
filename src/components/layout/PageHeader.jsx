export function PageHeader({ title, action }) {
  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-30 flex-shrink-0">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  )
}
