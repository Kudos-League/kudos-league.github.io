// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    babel: {
        plugins: [
            isDevelopment && 'react-refresh/babel'
        ].filter(Boolean),
    }
};
