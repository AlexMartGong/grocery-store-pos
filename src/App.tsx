import { Toaster } from 'sonner'
import { AppRouter } from './routes/AppRouter'

export const App = () => {
    return (
        <>
            <AppRouter />
            <Toaster richColors position="top-right" />
        </>
    )
}
