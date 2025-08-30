/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-empty-function */

import '@testing-library/jest-dom';

jest.mock(
    'react-router-dom',
    () => {
        const React = require('react');
        return {
            BrowserRouter: ({ children }: any) =>
                React.createElement('div', { 'data-testid': 'router' }, children),

            MemoryRouter: ({ children }: any) =>
                React.createElement('div', { 'data-testid': 'router' }, children),

            Routes: ({ children }: any) =>
                React.createElement('div', { 'data-testid': 'routes' }, children),

            Route: ({ element }: any) =>
                React.createElement(React.Fragment, null, element),

            Link: ({ to, children }: any) =>
                React.createElement('a', { href: String(to) }, children),

            NavLink: ({ to, children }: any) =>
                React.createElement('a', { href: String(to) }, children),

            Outlet: () => null,

            useNavigate: () => () => {},
            useLocation: () => ({ pathname: '/' }),
            useParams: () => ({}),
        };
    },
    { virtual: true }
);