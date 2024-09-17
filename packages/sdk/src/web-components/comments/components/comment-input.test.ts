import { MOCK_PARTICIPANT_LIST } from '../../../../__mocks__/participants.mock';
import sleep from '../../../common/utils/sleep';
import { AutoCompleteHandler } from '../utils/autocomplete-handler';
import mentionHandler from '../utils/mention-handler';
import './comment-input';

import { CommentsCommentInput } from './comment-input';

describe('CommentsCommentInput', () => {
  let element: HTMLElement;
  let commentsCommentInput: CommentsCommentInput;

  beforeEach(async () => {
    element = document.createElement('superviz-comments-comment-input');
    element.setAttribute('eventType', 'create-annotation');
    document.body.appendChild(element);
    commentsCommentInput = new CommentsCommentInput();

    await sleep();
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test('renders a textarea and a send button', async () => {
    const textarea = element.querySelector('.comments__input__textarea') as HTMLTextAreaElement;
    const sendButton = element.shadowRoot!.querySelector(
      '.comments__input__send-button',
    ) as HTMLButtonElement;

    expect(textarea).toBeDefined();
    expect(sendButton).toBeDefined();
  });

  test('disables the send button when the textarea is empty', async () => {
    const sendButton = element.shadowRoot!.querySelector(
      '.comments__input__send-button',
    ) as HTMLButtonElement;

    expect(sendButton.disabled).toBe(true);
  });

  test('enables the send button when the textarea has text', async () => {
    const textarea = element.shadowRoot!.querySelector(
      '.comments__input__textarea',
    ) as HTMLTextAreaElement;
    const sendButton = element.shadowRoot!.querySelector(
      '.comments__input__send-button',
    ) as HTMLButtonElement;

    textarea.value = 'test';
    textarea.dispatchEvent(new Event('input'));

    expect(sendButton.disabled).toBe(false);
  });

  test('emits an event when the send button is clicked', async () => {
    const textarea = element.shadowRoot!.querySelector(
      '.comments__input__textarea',
    ) as HTMLTextAreaElement;
    const sendButton = element.shadowRoot!.querySelector(
      '.comments__input__send-button',
    ) as HTMLButtonElement;

    const spy = jest.fn();

    element.setAttribute('eventType', 'send');
    element.addEventListener('send', spy);

    textarea.value = 'test';
    textarea.dispatchEvent(new Event('input'));

    sendButton.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('emits an event when enter is pressed', async () => {
    const textarea = element.shadowRoot!.querySelector(
      '.comments__input__textarea',
    ) as HTMLTextAreaElement;
    textarea.value = 'test';

    const spy = jest.fn();
    element.setAttribute('eventType', 'send');
    element.addEventListener('send', spy);

    element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('test custom props with text', async () => {
    element.setAttribute('text', 'test');

    await sleep();

    const textarea = element.shadowRoot!.querySelector(
      '.comments__input__textarea',
    ) as HTMLTextAreaElement;
    const btnSend = element.shadowRoot!.querySelector(
      '.comments__input__send-button',
    ) as HTMLButtonElement;

    expect(textarea.value).toBe('test');
    expect(btnSend.disabled).toBe(false);
  });

  test('test custom props with btnActive', async () => {
    element.setAttributeNode(document.createAttribute('btnActive'));

    await sleep();

    const textarea = element.shadowRoot!.querySelector(
      '.comments__input__textarea',
    ) as HTMLTextAreaElement;
    const btnSend = element.shadowRoot!.querySelector(
      '.comments__input__send-button',
    ) as HTMLButtonElement;

    expect(textarea.value).toBe('');
    expect(btnSend.disabled).toBe(false);
  });

  test('should close edit mode when close-edit-mode event is dispatched', async () => {
    const spy = jest.fn();

    element.addEventListener('close-edit-mode', spy);
    element.setAttributeNode(document.createAttribute('editable'));

    await sleep();

    const button = element.shadowRoot!.querySelector('#close') as HTMLButtonElement;

    button.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('should change textarea elements classes when receiving focus', async () => {
    const textarea = element['commentInput'] as HTMLElement;
    const options = element['optionsContainer'] as HTMLElement;
    const rule = element['horizontalRule'] as HTMLElement;

    expect(options.classList.contains('active-textarea')).toBe(false);
    expect(rule.classList.contains('comments__input__divisor')).toBe(false);

    textarea.dispatchEvent(new CustomEvent('focus'));

    expect(options.classList.contains('active-textarea')).toBe(true);
    expect(rule.classList.contains('comments__input__divisor')).toBe(true);
  });

  test('should change textarea elements classes when losing focus and there is no text', async () => {
    const textarea = element['commentInput'] as HTMLElement;
    const options = element['optionsContainer'] as HTMLElement;
    const rule = element['horizontalRule'] as HTMLElement;

    element['optionsContainer'].classList.add('active-textarea');
    element['horizontalRule'].classList.add('comments__input__divisor');

    textarea.textContent = '';
    textarea.dispatchEvent(new CustomEvent('blur'));

    expect(options.classList.contains('active-textarea')).toBe(false);
    expect(rule.classList.contains('comments__input__divisor')).toBe(false);
  });

  test('should not change textarea elements classes when losing focus and there is no text', async () => {
    const textarea = element['commentInput'] as HTMLElement;
    const options = element['optionsContainer'] as HTMLElement;
    const rule = element['horizontalRule'] as HTMLElement;

    element['optionsContainer'].classList.add('active-textarea');
    element['horizontalRule'].classList.add('comments__input__divisor');

    textarea.textContent = 'text';
    textarea.dispatchEvent(new CustomEvent('blur'));

    expect(options.classList.contains('active-textarea')).toBe(true);
    expect(rule.classList.contains('comments__input__divisor')).toBe(true);
  });

  test('should set height to 41px if text goes back to having one line', () => {
    const textarea = element['commentInput'] as HTMLElement;

    textarea.textContent =
      'This is a text that has more than one line when typing it in the browser.';

    element['updateHeight']();

    const height = Number(textarea.style.height.slice(0, 2));
    expect(height).toBeGreaterThan(40);

    textarea.textContent = 'This is a text that has one line.';

    element['updateHeight']();

    expect(textarea.style.height).toBe('41px');
  });

  describe('addAtSymbolInCaretPosition', () => {
    test('should add the "@" symbol at the cursor position', () => {
      const textarea = element.shadowRoot!.querySelector(
        '.comments__input__textarea',
      ) as HTMLTextAreaElement;

      element['addAtSymbolInCaretPosition']();

      const textareaValue = textarea.value;

      expect(textareaValue).toBe('@');
    });
  });

  describe('insertMention', () => {
    test('Should insert mention and call autoCompleteHandler correctly', () => {
      const mockInsertMention = jest.fn();
      const createTextArea = () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        return textarea;
      };
      const sendInputEvent = (input: HTMLTextAreaElement, data: string): InputEvent => {
        const event = new InputEvent('input', { data, inputType: 'insertText' });
        input.dispatchEvent(event);
        return event;
      };

      AutoCompleteHandler.prototype.insertMention = mockInsertMention;

      const mentioned = {
        detail: {
          position: { start: 1, end: 5 },
          ...MOCK_PARTICIPANT_LIST[0],
        },
      };

      const event = new CustomEvent('mentionInserted', { detail: mentioned.detail });

      const textarea = createTextArea();
      const autocompleteHandler = new AutoCompleteHandler();

      const input = sendInputEvent(textarea, 'a');
      autocompleteHandler.setInput(input);
      autocompleteHandler.setValue('test');

      autocompleteHandler.insertMention(0, 1, mentioned.detail);
      element['insertMention'](event);

      expect(mockInsertMention).toHaveBeenCalledWith(0, 1, mentioned.detail);
      expect(autocompleteHandler.getValue()).toBe('test');
      document.dispatchEvent(event);
      expect(mockInsertMention).toHaveBeenCalledWith(1, 5, MOCK_PARTICIPANT_LIST[0]);
    });
  });

  describe('userMentionedByTextInput', () => {
    test('should set mentionList and call insertMention with correct data', () => {
      const mockInsertMention = jest.fn();
      element['insertMention'] = mockInsertMention;
      const mentioned = [
        {
          detail: {
            position: { start: 1, end: 5 },
            ...MOCK_PARTICIPANT_LIST[0],
          },
        },
      ];

      mockInsertMention(mentioned[0].detail);
      element['userMentionedByTextInput'](mentioned[0].detail);

      expect(mockInsertMention).toHaveBeenCalledWith(mentioned[0].detail);
    });
  });

  describe('handleInput', () => {
    test('should handle input correctly', () => {
      const inputEvent = {
        data: '@',
      };
      const mockButtonAtSimbol = jest.fn(() => ({
        searchText: 'mockSearchText',
        position: { start: 0, end: 5 },
      }));

      element['buttonAtSimbol'] = mockButtonAtSimbol;
      const mockHandleInput = jest.fn();
      element['handleInput'] = mockHandleInput;

      const originalFindDigitParticipant = mentionHandler['findDigitParticipant'];
      mentionHandler['findDigitParticipant'] = jest.fn(() => true);

      const mockInsertMention = jest.fn();
      element['insertMention'] = mockInsertMention;
      const mentioned = [
        {
          detail: {
            position: { start: 1, end: 5 },
            ...MOCK_PARTICIPANT_LIST[0],
          },
        },
      ];

      mockInsertMention(mentioned[0].detail);
      element['userMentionedByTextInput'](mentioned[0].detail);

      expect(mockInsertMention).toHaveBeenCalledWith(mentioned[0].detail);
      element['handleInput'](inputEvent);

      expect(mockHandleInput).toHaveBeenCalledWith(inputEvent);

      mentionHandler['findDigitParticipant'] = originalFindDigitParticipant;

      mockButtonAtSimbol();

      const mockhandleInput = jest.fn();
      element['handleInput'] = mockhandleInput;
      mockhandleInput(inputEvent);

      expect(mockButtonAtSimbol).toHaveBeenCalled();
      expect(mockhandleInput).toHaveBeenCalled();
    });
  });

  describe('onTextareaLoseFocus', () => {
    test('should call cancelComment when target is closeButton', () => {
      const mockCancelComment = jest.fn();
      element['cancelComment'] = mockCancelComment;

      const div = document.createElement('div');
      element['closeButton'].appendChild(div);

      const e = {
        explicitOriginalTarget: {
          parentNode: {
            host: div,
          },
        },
      };

      element['onTextareaLoseFocus'](e);

      expect(mockCancelComment).toHaveBeenCalled();
    });

    test('should call cancelComment when explicitOriginalTarget is closeButton', () => {
      const mockCancelComment = jest.fn();
      element['cancelComment'] = mockCancelComment;

      const div = document.createElement('div');
      element['closeButton'].appendChild(div);

      const e = {
        explicitOriginalTarget: div,
      };

      element['onTextareaLoseFocus'](e);

      expect(mockCancelComment).toHaveBeenCalled();
    });

    test('should call cancelComment when relatedTarget is closeButton', () => {
      const mockCancelComment = jest.fn();
      element['cancelComment'] = mockCancelComment;

      const div = document.createElement('div');
      element['closeButton'].appendChild(div);

      const e = {
        relatedTarget: div,
      };

      element['onTextareaLoseFocus'](e);

      expect(mockCancelComment).toHaveBeenCalled();
    });
  });

  describe('focusInput', () => {
    test('should focus keyboard cursor on input when clicking on it', () => {
      element['getCommentInput']().focus = jest.fn();
      element['focusInput']();

      expect(element['getCommentInput']().focus).toHaveBeenCalled();
    });
  });
});
