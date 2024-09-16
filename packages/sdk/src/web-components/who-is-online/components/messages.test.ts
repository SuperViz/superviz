import '.';
import { MOCK_LOCAL_PARTICIPANT } from '../../../../__mocks__/participants.mock';
import sleep from '../../../common/utils/sleep';
import { useGlobalStore } from '../../../services/stores';

import { HorizontalSide, VerticalSide } from './types';

const createEl = (): HTMLElement => {
  const element: HTMLElement = document.createElement('superviz-who-is-online-messages');

  const elementWrapper = document.createElement('div');
  elementWrapper.style.height = '1500px';
  elementWrapper.style.width = '1500px';
  elementWrapper.style.position = 'relative';
  elementWrapper.appendChild(element);

  document.body.style.height = '1000px';
  document.body.style.width = '1000px';
  document.body.appendChild(elementWrapper);
  return element;
};

describe('messages', () => {
  let element: HTMLElement;
  const genericId1 = 'generic-id-1';
  const genericName1 = 'generic-name-1';
  const genericColor1 = 'rgb(170, 187, 204)';

  beforeEach(() => {
    document.body.innerHTML = '';
    const { localParticipant } = useGlobalStore();
    localParticipant.value = MOCK_LOCAL_PARTICIPANT;

    element = createEl();
  });

  describe('followingMessage', () => {
    test('should do nothing if following is not defined', () => {
      expect(element['followingMessage']()).toBe('');
    });

    test('should render message if following is defined', async () => {
      element['following'] = {
        id: genericId1,
        name: genericName1,
        color: genericColor1,
      };

      element['requestUpdate']();

      await sleep();

      const message = element.shadowRoot?.querySelector(
        '.who-is-online__following-message',
      ) as HTMLElement;

      expect(message).toBeTruthy();
      expect(window.getComputedStyle(message).borderColor).toBe(genericColor1);
      expect(message.innerText).toBe(`Following: ${genericName1} Stop`);
    });

    test('should call stopFollowing when stop button is clicked', async () => {
      element['following'] = {
        id: genericId1,
        name: genericName1,
        color: genericColor1,
      };

      element['stopFollowing'] = jest.fn();
      element['requestUpdate']();

      await sleep();

      const message = element.shadowRoot?.querySelector(
        '.who-is-online__following-message',
      ) as HTMLElement;
      const stopButton = message.querySelector(
        '.who-is-online__pcm__cancel-action-button',
      ) as HTMLElement;

      expect(stopButton).toBeTruthy();

      stopButton.click();

      await sleep();

      expect(element['stopFollowing']).toHaveBeenCalled();
    });
  });

  describe('everyoneFollowsMeMessage', () => {
    test('should do nothing if everyoneFollowsMe is not defined', () => {
      expect(element['everyoneFollowsMeMessage']()).toBe('');
    });

    test('should render message if everyoneFollowsMe is defined', async () => {
      element['everyoneFollowsMe'] = true;
      element['participantColor'] = genericColor1;

      element['requestUpdate']();

      await sleep();

      const message = element.shadowRoot?.querySelector(
        '.who-is-online__follow-me-message',
      ) as HTMLElement;

      expect(message).toBeTruthy();
      expect(window.getComputedStyle(message).borderColor).toBe(genericColor1);
      expect(message.innerText).toBe(`Everyone is following you Stop`);
    });

    test('should call stopEveryoneFollowsMe when stop button is clicked', async () => {
      element['everyoneFollowsMe'] = true;
      element['participantColor'] = genericColor1;

      element['stopEveryoneFollowsMe'] = jest.fn();
      element['requestUpdate']();

      await sleep();

      const message = element.shadowRoot?.querySelector(
        '.who-is-online__follow-me-message',
      ) as HTMLElement;
      const stopButton = message.querySelector(
        '.who-is-online__pcm__cancel-action-button',
      ) as HTMLElement;

      expect(stopButton).toBeTruthy();

      stopButton.click();

      await sleep();

      expect(element['stopEveryoneFollowsMe']).toHaveBeenCalled();
    });
  });

  describe('privateMessage', () => {
    test('should do nothing if isPrivate is not defined', () => {
      expect(element['everyoneFollowsMeMessage']()).toBe('');
    });

    test('should render message if isPrivate is defined', async () => {
      element['isPrivate'] = true;
      element['participantColor'] = genericColor1;

      element['requestUpdate']();

      await sleep();

      const message = element.shadowRoot?.querySelector(
        '.who-is-online__private-mode-message',
      ) as HTMLElement;

      expect(message).toBeTruthy();
      expect(window.getComputedStyle(message).borderColor).toBe(genericColor1);
      expect(message.innerText).toBe(`You are in Private Mode Cancel`);
    });

    test('should call cancelPrivate when stop button is clicked', async () => {
      element['isPrivate'] = true;
      element['participantColor'] = genericColor1;

      element['cancelPrivate'] = jest.fn();
      element['requestUpdate']();

      await sleep();

      const message = element.shadowRoot?.querySelector(
        '.who-is-online__private-mode-message',
      ) as HTMLElement;
      const stopButton = message.querySelector(
        '.who-is-online__pcm__cancel-action-button',
      ) as HTMLElement;

      expect(stopButton).toBeTruthy();

      stopButton.click();

      await sleep();

      expect(element['cancelPrivate']).toHaveBeenCalled();
    });
  });

  describe('repositionMessages', () => {
    test('should call reposition methods if following is defined', () => {
      element['following'] = {
        id: genericId1,
        name: genericName1,
        color: genericColor1,
      };

      element['repositionInVerticalDirection'] = jest.fn();
      element['repositionInHorizontalDirection'] = jest.fn();

      element['repositionMessages']();

      expect(element['repositionInVerticalDirection']).toHaveBeenCalled();
      expect(element['repositionInHorizontalDirection']).toHaveBeenCalled();
    });

    test('should call reposition methods if everyoneFollowsMe is defined', () => {
      element['everyoneFollowsMe'] = true;

      element['repositionInVerticalDirection'] = jest.fn();
      element['repositionInHorizontalDirection'] = jest.fn();

      element['repositionMessages']();

      expect(element['repositionInVerticalDirection']).toHaveBeenCalled();
      expect(element['repositionInHorizontalDirection']).toHaveBeenCalled();
    });

    test('should call reposition methods if isPrivate is defined', () => {
      element['following'] = true;

      element['repositionInVerticalDirection'] = jest.fn();
      element['repositionInHorizontalDirection'] = jest.fn();

      element['repositionMessages']();

      expect(element['repositionInVerticalDirection']).toHaveBeenCalled();
      expect(element['repositionInHorizontalDirection']).toHaveBeenCalled();
    });

    test('should request animation frame if any of the properties is defined', () => {
      element['following'] = true;

      const originalRequestAnimationFrame = window.requestAnimationFrame;
      window.requestAnimationFrame = jest.fn();

      element['repositionMessages']();

      expect(window.requestAnimationFrame).toBeCalledWith(element['repositionMessages']);
      window.requestAnimationFrame = originalRequestAnimationFrame;
    });

    test('should cancel animation frame if none of the properties is defined', () => {
      const originalCancelAnimationFrame = window.cancelAnimationFrame;
      window.cancelAnimationFrame = jest.fn();

      element['repositionMessages']();

      expect(window.cancelAnimationFrame).toBeCalledWith(element['animationFrame']);
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    });
  });

  describe('repositionInVerticalDirection', () => {
    test("should position messages to bottom if they're closer to the top", () => {
      element['parentElement']!.style.top = '0px';
      window['innerHeight'] = 1000;
      element['repositionInVerticalDirection']();

      expect(element['verticalSide']).toBe(VerticalSide.BOTTOM);
    });

    test("should position messages to top if they're closer to the bottom", () => {
      element['parentElement']!.style.top = '1000px';
      window['innerHeight'] = 1000;
      element['repositionInVerticalDirection']();

      expect(element['verticalSide']).toBe(VerticalSide.TOP);
    });
  });

  describe('repositionInHorizontalDirection', () => {
    test("should position messages to the left if they're closer to the left", () => {
      element['parentElement']!.style.left = '0px';
      window['innerWidth'] = 1000;
      element['repositionInHorizontalDirection']();

      expect(element['horizontalSide']).toBe(HorizontalSide.LEFT);
    });

    test("should position messages to the right if they're closer to the right", () => {
      element['parentElement']!.style.left = '1000px';
      window['innerWidth'] = 1000;
      element['repositionInHorizontalDirection']();

      expect(element['horizontalSide']).toBe(HorizontalSide.RIGHT);
    });
  });
});
