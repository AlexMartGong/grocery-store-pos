import { Toaster } from 'sonner'
import { AppRouter } from './routes/AppRouter'
import { PwaUpdatePrompt } from './shared/components/pwa/PwaUpdatePrompt'

export const App = () => {
    return (
        <>
            <AppRouter />
            <Toaster richColors position="top-right" />
            <PwaUpdatePrompt />
        </>
    )
}
