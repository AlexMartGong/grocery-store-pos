import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {App} from './App.tsx'
import { startSessionKeeper } from './features/auth/store/sessionKeeper'

// Before the first render and after every module has evaluated: restores an expired store
// session through the refresh cookie and schedules proactive renewals.
startSessionKeeper()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
