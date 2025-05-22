import { render, screen, userEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import SignUp from './sign-up';
import { store } from 'redux_store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from 'shared/api/actions';

import type { SignUpFormValues } from './sign-up';

import { resetAuthState } from 'redux_store/slices/auth-slice';
import { ASYNC_STORAGE_KEY__AUTH_DATA } from 'shared/constants';


const DEFAULT_FORM_VALUES: Readonly<SignUpFormValues> = Object.freeze({
  username: 'testUser',
  email: 'test@test.com',
  password: 'password123',
  confirmedPassword: 'password123',
})

jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: jest.fn() }));
jest.mock('shared/api/actions', () => ({ register: jest.fn() }));
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({navigate: mockNavigate}) }));

const user = userEvent.setup();


describe('SignUp form', () => {
  beforeEach(async () => {
    store.dispatch(resetAuthState());
    jest.clearAllMocks();
    render(
      <Provider store={store}>
        <SignUp />
      </Provider>
    );

    const response = { data: { token: 'token123', user: { username: 'testuser' } } };
    (register as jest.Mock).mockResolvedValue(response);
  });

  describe('sign up submission', () => {
    it('a successful submission passes the redux store via the updateAuth action', async () => {
      const initialAuthState = store.getState().auth;
      await fillInForm(DEFAULT_FORM_VALUES);
      const finalAuthState = store.getState().auth;
      
      expect(initialAuthState).toEqual({ token: null, username: null, tokenTimestamp: null });
      expect(finalAuthState).toEqual({ token: 'token123', username: 'testuser', tokenTimestamp: expect.any(Number) });
    });
  
    it('a successful submission navigates to the home page\'s feed screen', async () => {
      await fillInForm(DEFAULT_FORM_VALUES);
  
      expect(mockNavigate).toHaveBeenCalledWith('Home', { screen: 'Feed' });
    });
  
    it('a successful submission saves the response data to AsyncStorage', async () => {
      await fillInForm(DEFAULT_FORM_VALUES);
  
      const [key, savedAuthStateString] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(key).toBe(ASYNC_STORAGE_KEY__AUTH_DATA);
      const savedAuthState = JSON.parse(savedAuthStateString);
      expect(savedAuthState).toEqual({ token: 'token123', username: 'testuser', tokenTimestamp: expect.any(Number) });
    });
  });

  describe('sign up button', () => {
    it('is no op if passwords do not match', async () => {
      await fillInForm({...DEFAULT_FORM_VALUES, confirmedPassword: `something other than ${DEFAULT_FORM_VALUES.password}`});
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(store.getState().auth).toEqual({ token: null, username: null, tokenTimestamp: null });
    });

    it('is no op if email is empty', async () => {
      await fillInForm({...DEFAULT_FORM_VALUES, email: ''});
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(store.getState().auth).toEqual({ token: null, username: null, tokenTimestamp: null });
    });

    it('is no op if username is empty', async () => {
      await fillInForm({...DEFAULT_FORM_VALUES, username: ''});
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(store.getState().auth).toEqual({ token: null, username: null, tokenTimestamp: null });
    });

    it('is no op if password is empty', async () => {
      await fillInForm({...DEFAULT_FORM_VALUES, password: '', confirmedPassword: ''});
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(store.getState().auth).toEqual({ token: null, username: null, tokenTimestamp: null });
    });
  });

  describe('server errors', () => {
    it('display string-valued message', async () => {
      (register as jest.Mock).mockRejectedValueOnce({
        response: {
          data: { message: 'Server error occurred' },
        },
      });

      await fillInForm(DEFAULT_FORM_VALUES);

      expect(await screen.findByText('Server error occurred')).toBeTruthy();
    });

    it('displays server error for invalid fields', async () => {
      (register as jest.Mock).mockRejectedValueOnce({
        response: {
          data: {
            message: {
              issues: [
                { path: ['email'], message: 'Invalid email' },
                { path: ['username'], message: 'Username ugly' },
                { path: ['password'], message: 'Weak password' },
              ],
            },
          },
        },
      });

      await fillInForm(DEFAULT_FORM_VALUES);

      await screen.findByText('Some fields were invalid');
    });

    it('removes errors after a failed submission followed by a successful submission', async () => {
      (register as jest.Mock)
        .mockRejectedValueOnce({
          response: {
            data: { message: 'Server error occurred' },
          },
        })
        .mockResolvedValueOnce({
          data: {
            token: 'testToken',
            user: {
              username: 'testUser',
            },
          },
        });


      await fillInForm(DEFAULT_FORM_VALUES);

      expect(await screen.findByText('Server error occurred')).toBeTruthy();

      await user.press(await screen.findByText('Sign Up'));

      expect(screen.queryByText('Server error occurred')).toBeFalsy();
    });
  });
});

/** Submit generic valid form inputs */
async function fillInForm(formValues: SignUpFormValues) {
  await user.type(await screen.findByLabelText('Username'), formValues.username);
  await user.type(await screen.findByLabelText('Email'), formValues.email);
  await user.type(await screen.findByLabelText('Password'), formValues.password);
  await user.type(await screen.findByLabelText('Confirm Password'), formValues.confirmedPassword);

  await user.press(await screen.findByText('Sign Up'));
}