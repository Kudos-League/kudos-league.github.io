/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    theme: { extend: {} },
    darkMode: 'class',
    plugins: [require('daisyui')],
    daisyui: {
        themes: false,
        base: false
    }
};
