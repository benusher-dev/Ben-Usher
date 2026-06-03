import { AppProvider, useApp } from './store/AppContext'
import { BottomNav } from './components/layout/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { Workouts } from './pages/Workouts'
import { LogWorkout } from './pages/LogWorkout'
import { History } from './pages/History'
import { Progress } from './pages/Progress'
import { BodyWeightPage } from './pages/BodyWeightPage'
import NetOpsConsole from './pages/NetOpsConsole'

function Pages() {
  const { activePage } = useApp()

  return (
    <main className="flex flex-col h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <div className="flex-1 overflow-hidden flex flex-col">
        {activePage === 'dashboard'   && <Dashboard />}
        {activePage === 'workouts'    && <Workouts />}
        {activePage === 'log'         && <LogWorkout />}
        {activePage === 'history'     && <History />}
        {activePage === 'progress'    && <Progress />}
        {activePage === 'bodyweight'  && <BodyWeightPage />}
        {activePage === 'netops'      && <div className="flex-1 overflow-y-auto"><NetOpsConsole /></div>}
      </div>
    </main>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Pages />
      <BottomNav />
    </AppProvider>
  )
}
