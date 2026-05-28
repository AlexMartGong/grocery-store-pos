import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['logo.svg'],
            manifest: {
                name: 'Venta Core',
                short_name: 'VentaCore',
                description: 'Sistema de Punto de Venta VentaCore',
                theme_color: '#0f172a',
                background_color: '#f8fafc',
                display: 'standalone',
                icons: [
                    {src: 'logo.svg', sizes: 'any', type: 'image/svg+xml'},
                    {src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png'},
                    {src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png'},
                ],
            },
        }),
    ],
})
