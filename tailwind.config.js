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
                    900: '#111647',
                }
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
