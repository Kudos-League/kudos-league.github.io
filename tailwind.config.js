/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eaecfa',
                    100: '#d5d9f5',
                    200: '#abb3eb',
                    300: '#828de0',
                    400: '#5867d6',
                    500: '#3b49cb',
                    600: '#2c37b1',
                    700: '#232c8e',
                    800: '#1a216a',
                    900: '#111647'
                }
            },
            fontFamily: {
                // Body text - Inter (clean, modern, highly readable)
                sans: [
                    'Inter',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'sans-serif'
                ],

                // Headings - Poppins (friendly, geometric, bold)
                heading: ['Poppins', 'Inter', 'sans-serif'],

                // Details/Labels - Inter Medium (subtle distinction)
                detail: ['Inter', 'sans-serif'],

                // Accent/Special - Space Grotesk (unique, modern)
                accent: ['Space Grotesk', 'Inter', 'sans-serif'],

                // System fallback (easy to revert)
                system: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Oxygen',
                    'Ubuntu',
                    'Cantarell',
                    'Fira Sans',
                    'Droid Sans',
                    'Helvetica Neue',
                    'sans-serif'
                ]
            }
        }
    },
    darkMode: 'class',
    plugins: [require('daisyui')],
    daisyui: {
        themes: false,
        base: false
    }
};
