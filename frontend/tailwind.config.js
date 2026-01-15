/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    500: '#6366f1', // Indigo
                    600: '#4f46e5',
                    700: '#4338ca',
                    900: '#312e81',
                },
                dark: {
                    bg: '#0f172a',    // Slate 900
                    card: '#1e293b',  // Slate 800
                    text: '#e2e8f0',  // Slate 200
                    muted: '#94a3b8', // Slate 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
