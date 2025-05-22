import { render, screen, userEvent } from '@testing-library/react-native';
import CreatePost from './create-post';
import { Provider } from 'react-redux';
import { store } from 'redux_store/store';

const mockOnSubmit = jest.fn();
const user = userEvent.setup();

jest.mock('react-hook-form', () => {
  const module = jest.requireActual('react-hook-form');
  return {
    ...module,
    useForm: () => {
      const form = module.useForm();
      return {...form, handleSubmit: () => form.handleSubmit(mockOnSubmit)};
    },
  }
});


describe('Submit button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSubmit for submit button press when title and body have content', async () => {
    render(<Provider store={store}><CreatePost /></Provider>);
    
    const titleTextInput = await screen.findByLabelText('Title');
    await user.type(titleTextInput, 'some text');
    const bodyTextInput = await screen.findByLabelText('Body');
    await user.type(bodyTextInput, 'some text');

    const submitButton = await screen.findByText('Submit');
    await user.press(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('does not call onSubmit for submit button press when body is untouched', async () => {
    render(<Provider store={store}><CreatePost /></Provider>);
    
    const titleTextInput = await screen.findByLabelText('Title');
    await user.type(titleTextInput, 'some text');

    const submitButton = await screen.findByText('Submit');
    await user.press(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit for submit button press when title is untouched', async () => {
    render(<Provider store={store}><CreatePost /></Provider>);
    
    const bodyTextInput = await screen.findByLabelText('Body');
    await user.type(bodyTextInput, 'some text');

    const submitButton = await screen.findByText('Submit');
    await user.press(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit for submit button press when body is empty', async () => {
    render(<Provider store={store}><CreatePost /></Provider>);
    
    const titleTextInput = await screen.findByLabelText('Title');
    await user.type(titleTextInput, 'some text');
    const bodyTextInput = await screen.findByLabelText('Body');
    await user.type(bodyTextInput, '');

    const submitButton = await screen.findByText('Submit');
    await user.press(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit for submit button press when title is untouched', async () => {
    render(<Provider store={store}><CreatePost /></Provider>);
    
    const titleTextInput = await screen.findByLabelText('Title');
    await user.type(titleTextInput, '');
    const bodyTextInput = await screen.findByLabelText('Body');
    await user.type(bodyTextInput, 'some text');

    const submitButton = await screen.findByText('Submit');
    await user.press(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});