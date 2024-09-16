import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { StoreType } from '../../common/types/stores.types';
import { useStore } from '../../common/utils/use-store';
import { IOC } from '../../services/io';
import { Presence3DManager } from '../../services/presence-3d-manager';
import { ComponentNames } from '../types';

import { FieldEvents } from './types';

import { FormElements } from '.';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';

describe('form elements', () => {
  let instance: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="field-1" />
      <input id="field-2" type="email" />
      <textarea id="field-3"></textarea>
      <input id="hidden" type="hidden" />
      <button id="button"></button>
    `;

    instance = new FormElements();

    const { hasJoinedRoom } = (instance as FormElements)['useStore'](StoreType.GLOBAL);
    hasJoinedRoom.publish(true);
    (instance as FormElements).attach({
      ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
      config: MOCK_CONFIG,
      eventBus: EVENT_BUS_MOCK,
      Presence3DManagerService: Presence3DManager,
      connectionLimit: LIMITS_MOCK.presence.maxParticipants,
      useStore,
    });
  });

  describe('constructor', () => {
    test('should create an instance of FormElements', () => {
      expect(instance).toBeInstanceOf(FormElements);
    });

    test('should set the name of the component', () => {
      expect(instance.name).toBe(ComponentNames.FORM_ELEMENTS);
    });

    test('should set the logger', () => {
      expect(instance['logger']).toBeDefined();
    });

    test('should throw error if fields is not a string or an array', () => {
      const fields = () => new FormElements({ fields: 123 as any });
      expect(fields).toThrowError();
    });

    test('should throw error if fields is a string and not a valid field id', () => {
      const fields = () => new FormElements({ fields: 'non-existent-field-id' });
      expect(fields).toThrowError();
    });

    test('should throw error if fields is an array and does not contain a valid field id', () => {
      const fields = () => new FormElements({ fields: ['non-existent-field-id'] });
      expect(fields).toThrowError();
    });

    test('should set fields to an empty object if fields is not provided', () => {
      const fields = new FormElements();
      expect(fields['fields']).toEqual({});
    });

    test('should set field to store fields ids if an valid array of ids is provided', () => {
      const fields = new FormElements({ fields: ['field-1', 'field-2'] });
      expect(fields['fields']).toEqual({ 'field-1': null, 'field-2': null });
    });

    test('should set field to store fields ids if an valid string id is provided', () => {
      const fields = new FormElements({ fields: 'field-1' });
      expect(fields['fields']).toEqual({ 'field-1': null });
    });

    test('should throw error if trying to register an element that is not an input or textarea', () => {
      const fields = () => new FormElements({ fields: ['button'] });
      expect(fields).toThrowError();
    });

    test('should throw error if trying to register input with invalid type', () => {
      const fields = () => new FormElements({ fields: ['hidden'] });
      expect(fields).toThrowError();
    });
  });

  describe('start', () => {
    test('should set localParticipant', () => {
      instance['start']();
      expect(instance['localParticipant']).toBeDefined();
    });

    test('should call registerField for each field ID passed to the constructor', () => {
      instance = new FormElements({ fields: ['field-1', 'field-2'] });
      const spy = jest.spyOn(instance, 'registerField');
      instance['start']();
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('destroy', () => {
    test('should call restoreOutlines', () => {
      const spy = jest.spyOn(instance, 'restoreOutlines');
      instance['destroy']();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should call deregisterAllFields', () => {
      const spy = jest.spyOn(instance, 'deregisterAllFields');
      instance['destroy']();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should set fieldsOriginalOutline to undefined', () => {
      instance['fieldsOriginalOutline'] = 'some value';
      instance['destroy']();
      expect(instance['fieldsOriginalOutline']).toBeUndefined();
    });
  });

  describe('addListenersToField', () => {
    test('should add event listeners to the field', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.addEventListener = jest.fn();
      instance['addListenersToField'](field);
      expect(field.addEventListener).toHaveBeenCalledTimes(3);
      expect(field.addEventListener).toHaveBeenCalledWith('input', instance['handleInput']);
      expect(field.addEventListener).toHaveBeenCalledWith('focus', instance['handleFocus']);
      expect(field.addEventListener).toHaveBeenCalledWith('blur', instance['handleBlur']);
    });

    test('should add proper listener to checkbox and radio input types', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'checkbox';
      document.body.appendChild(checkbox);

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = 'radio';
      document.body.appendChild(radio);

      const radioSpy = jest.spyOn(checkbox, 'addEventListener');
      const checkboxSpy = jest.spyOn(radio, 'addEventListener');

      instance['flags'].disableOutline = true;

      instance['addListenersToField'](checkbox);
      instance['addListenersToField'](radio);

      expect(radioSpy).toHaveBeenCalledTimes(1);
      expect(checkboxSpy).toHaveBeenCalledTimes(1);

      expect(radioSpy).toHaveBeenCalledWith('change', instance['handleChange']);
      expect(checkboxSpy).toHaveBeenCalledWith('change', instance['handleChange']);
    });
  });

  describe('addRealtimeListenersToField', () => {
    test('should add realtime listeners to the field', () => {
      instance['room'] = {
        on: jest.fn(),
      } as any;

      instance['updateFieldContent'] = jest.fn();
      instance['updateFieldColor'] = jest.fn();
      instance['removeFieldColor'] = jest.fn();
      instance['flags'].disableOutline = false;

      instance['addRealtimeListenersToField']('field-1');

      expect(instance['room'].on).toHaveBeenCalledTimes(4);
      expect(instance['room'].on).toHaveBeenCalledWith(
        `${FieldEvents.CONTENT_CHANGE}field-1`,
        instance['updateFieldContent'],
      );
      expect(instance['room'].on).toHaveBeenCalledWith(
        `${FieldEvents.INTERACTION}field-1`,
        instance['publishTypedEvent'],
      );
      expect(instance['room'].on).toHaveBeenCalledWith(
        `${FieldEvents.FOCUS}field-1`,
        instance['updateFieldColor'],
      );
      expect(instance['room'].on).toHaveBeenCalledWith(
        `${FieldEvents.BLUR}field-1`,
        instance['removeFieldColor'],
      );
    });

    test('should not add listeners to focus and blur if flag disableOutline is true', () => {
      instance['room'] = {
        on: jest.fn(),
      } as any;

      instance['updateFieldContent'] = jest.fn();
      instance['updateFieldColor'] = jest.fn();
      instance['removeFieldColor'] = jest.fn();
      instance['flags'].disableOutline = true;

      instance['addRealtimeListenersToField']('field-1');

      expect(instance['room'].on).toHaveBeenCalledTimes(2);
      expect(instance['room'].on).toHaveBeenCalledWith(
        `${FieldEvents.CONTENT_CHANGE}field-1`,
        instance['updateFieldContent'],
      );
      expect(instance['room'].on).toHaveBeenCalledWith(
        `${FieldEvents.INTERACTION}field-1`,
        instance['publishTypedEvent'],
      );
    });

    test('should not add realtime listeners if room is not defined', () => {
      instance['updateFieldContent'] = jest.fn();
      instance['updateFieldColor'] = jest.fn();
      instance['removeFieldColor'] = jest.fn();

      instance['room'] = undefined;
      instance['addRealtimeListenersToField']('field-1');

      expect(instance['updateFieldContent']).not.toHaveBeenCalled();
      expect(instance['updateFieldColor']).not.toHaveBeenCalled();
      expect(instance['removeFieldColor']).not.toHaveBeenCalled();
    });
  });

  describe('removeListenersFromField', () => {
    test('should remove event listeners from the field', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.removeEventListener = jest.fn();
      instance['removeListenersFromField'](field);
      expect(field.removeEventListener).toHaveBeenCalledTimes(3);
      expect(field.removeEventListener).toHaveBeenCalledWith('input', instance['handleInput']);
      expect(field.removeEventListener).toHaveBeenCalledWith('focus', instance['handleFocus']);
      expect(field.removeEventListener).toHaveBeenCalledWith('blur', instance['handleBlur']);
    });

    test('should remove proper listener to checkbox and radio input types', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'checkbox';
      document.body.appendChild(checkbox);

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = 'radio';
      document.body.appendChild(radio);

      const radioSpy = jest.spyOn(checkbox, 'removeEventListener');
      const checkboxSpy = jest.spyOn(radio, 'removeEventListener');

      instance['flags'].disableOutline = true;

      instance['removeListenersFromField'](checkbox);
      instance['removeListenersFromField'](radio);

      expect(radioSpy).toHaveBeenCalledTimes(1);
      expect(checkboxSpy).toHaveBeenCalledTimes(1);

      expect(radioSpy).toHaveBeenCalledWith('change', instance['handleChange']);
      expect(checkboxSpy).toHaveBeenCalledWith('change', instance['handleChange']);
    });
  });

  describe('removeRealtimeListenersFromField', () => {
    test('should remove realtime listeners from the field', () => {
      instance['room'] = {
        off: jest.fn(),
      } as any;

      instance['updateFieldContent'] = jest.fn();
      instance['updateFieldColor'] = jest.fn();
      instance['removeFieldColor'] = jest.fn();

      instance['flags'].disableShowOutline = false;

      instance['removeRealtimeListenersFromField']('field-1');
      expect(instance['room'].off).toHaveBeenCalledTimes(4);
      expect(instance['room'].off).toHaveBeenNthCalledWith(
        1,
        `${FieldEvents.CONTENT_CHANGE}field-1`,
        instance['updateFieldContent'],
      );
      expect(instance['room'].off).toHaveBeenNthCalledWith(
        2,
        `${FieldEvents.INTERACTION}field-1`,
        instance['publishTypedEvent'],
      );
      expect(instance['room'].off).toHaveBeenNthCalledWith(
        3,
        `${FieldEvents.FOCUS}field-1`,
        instance['updateFieldColor'],
      );
      expect(instance['room'].off).toHaveBeenNthCalledWith(
        4,
        `${FieldEvents.BLUR}field-1`,
        instance['removeFieldColor'],
      );
    });

    test('should not remove realtime listeners if room is not defined', () => {
      instance['updateFieldContent'] = jest.fn();
      instance['updateFieldColor'] = jest.fn();
      instance['removeFieldColor'] = jest.fn();
      instance['room'] = undefined;

      instance['removeRealtimeListenersFromField']('field-1');

      expect(instance['updateFieldContent']).not.toHaveBeenCalled();
      expect(instance['updateFieldColor']).not.toHaveBeenCalled();
      expect(instance['removeFieldColor']).not.toHaveBeenCalled();
    });

    test('should not remove listeners to focus and blur if flag disableOutline is true', () => {
      instance['room'] = {
        off: jest.fn(),
      } as any;

      instance['updateFieldContent'] = jest.fn();
      instance['updateFieldColor'] = jest.fn();
      instance['removeFieldColor'] = jest.fn();

      instance['flags'].disableOutline = true;

      instance['removeRealtimeListenersFromField']('field-1');
      expect(instance['room'].off).toHaveBeenCalledTimes(2);
      expect(instance['room'].off).toHaveBeenNthCalledWith(
        1,
        `${FieldEvents.CONTENT_CHANGE}field-1`,
        instance['updateFieldContent'],
      );
      expect(instance['room'].off).toHaveBeenNthCalledWith(
        2,
        `${FieldEvents.INTERACTION}field-1`,
        instance['publishTypedEvent'],
      );
    });
  });

  describe('registerField', () => {
    test('should register a field', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;

      instance['validateField'] = jest.fn();
      instance['addListenersToField'] = jest.fn();
      instance['addRealtimeListenersToField'] = jest.fn();
      instance['fieldsOriginalOutline'] = {};

      instance['registerField']('field-1');

      expect(instance['validateField']).toHaveBeenCalledTimes(1);
      expect(instance['fields']['field-1']).toBe(field);
      expect(instance['addListenersToField']).toHaveBeenCalledTimes(1);
      expect(instance['addRealtimeListenersToField']).toHaveBeenCalledTimes(1);
      expect(instance['fieldsOriginalOutline']['field-1']).toBe(field.style.outline);
    });
  });

  describe('deregisterAllFields', () => {
    test('should call deregisterField for each field in fields', () => {
      instance['deregisterField'] = jest.fn();
      instance['fields'] = {
        'field-1': document.getElementById('field-1') as HTMLInputElement,
        'field-2': document.getElementById('field-2') as HTMLInputElement,
      };

      instance['deregisterAllFields']();

      expect(instance['deregisterField']).toHaveBeenCalledTimes(2);
      expect(instance['fields']).toBeUndefined();
    });
  });

  describe('deregisterField', () => {
    test('should deregister a field', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;

      instance['removeListenersFromField'] = jest.fn();
      instance['removeRealtimeListenersFromField'] = jest.fn();
      instance['fieldsOriginalOutline'] = { 'field-1': 'some value' };
      instance['fields']['field-1'] = field;

      instance['deregisterField']('field-1');

      expect(instance['removeListenersFromField']).toHaveBeenCalledTimes(1);
      expect(instance['removeRealtimeListenersFromField']).toHaveBeenCalledTimes(1);
      expect(field.style.outline).toBe('some value');
      expect(instance['fields']['field-1']).toBeUndefined();
    });

    test('should throw error if field is not registered', () => {
      const deregister = () => instance['deregisterField']('non-existent-field-id');
      expect(deregister).toThrowError();
    });

    test('should emit blur event', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      instance['fields']['field-1'] = field;

      instance['room'] = {
        emit: jest.fn(),
        off: jest.fn(),
      } as any;

      instance['deregisterField']('field-1');

      expect(instance['room'].emit).toHaveBeenCalledTimes(1);
      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.BLUR}field-1`, {
        fieldId: 'field-1',
      });
    });
  });

  describe('handleInput', () => {
    test('should emit an event with the field content and local participant color', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const event = {
        target: { value: 'some value', id: 'field-1' },
      } as any;

      instance['handleInput'](event);

      expect(instance['room'].emit).toHaveBeenCalledTimes(2);

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.INTERACTION}field-1`, {
        fieldId: 'field-1',
        color: 'red',
      });

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.CONTENT_CHANGE}field-1`, {
        value: 'some value',
        color: 'red',
        fieldId: 'field-1',
        showOutline: true,
        syncContent: true,
        attribute: 'value',
      });
    });

    test('should not emit input event if can not sync', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const event = {
        target: { value: 'some value', id: 'field-1' },
      } as any;

      instance['flags'].disableRealtimeSync = true;

      instance['handleInput'](event);

      expect(instance['room'].emit).toHaveBeenCalledTimes(1);

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.INTERACTION}field-1`, {
        fieldId: 'field-1',
        color: 'red',
      });
    });
  });

  describe('handleChange', () => {
    test('should emit an event with the field content and local participant color', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const event = {
        target: { checked: true, id: 'field-1' },
      } as any;

      instance['handleChange'](event);

      expect(instance['room'].emit).toHaveBeenCalledTimes(1);

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.CONTENT_CHANGE}field-1`, {
        value: true,
        color: 'red',
        fieldId: 'field-1',
        showOutline: true,
        syncContent: true,
        attribute: 'checked',
      });
    });

    test('should not emit input event if can not sync', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const event = {
        target: { checked: true, id: 'field-1' },
      } as any;

      instance['flags'].disableRealtimeSync = true;

      instance['handleChange'](event);

      expect(instance['room'].emit).toHaveBeenCalledTimes(0);
    });
  });

  describe('handleFocus', () => {
    test('should emit an event with the local participant color', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const event = {
        target: { id: 'field-1' },
      } as any;

      instance['handleFocus'](event);

      expect(instance['room'].emit).toHaveBeenCalledTimes(1);
      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.FOCUS}field-1`, {
        color: 'red',
        fieldId: 'field-1',
      });
    });
  });

  describe('handleBlur', () => {
    test('should emit an event', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;

      const event = {
        target: { id: 'field-1' },
      } as any;

      instance['handleBlur'](event);

      expect(instance['room'].emit).toHaveBeenCalledTimes(1);
      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.BLUR}field-1`, {
        fieldId: 'field-1',
      });
    });
  });

  describe('validateField', () => {
    test('should call validation methods', () => {
      instance['validateFieldId'] = jest.fn();
      instance['validateFieldTagName'] = jest.fn();
      instance['validateFieldType'] = jest.fn();

      instance['validateField']('field-1');

      expect(instance['validateFieldId']).toHaveBeenCalledTimes(1);
      expect(instance['validateFieldTagName']).toHaveBeenCalledTimes(1);
      expect(instance['validateFieldType']).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateFieldTagName', () => {
    test('should throe error if field tag name is not allowed', () => {
      const field = document.getElementById('button') as HTMLButtonElement;
      const validate = () => instance['validateFieldTagName'](field);
      expect(validate).toThrowError();
    });

    test('should not throw error if field tag name is allowed', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      const validate = () => instance['validateFieldTagName'](field);
      expect(validate).not.toThrowError();
    });
  });

  describe('validateFieldType', () => {
    test('should throw error if input type is not allowed', () => {
      const field = document.getElementById('hidden') as HTMLInputElement;
      const validate = () => instance['validateFieldType'](field);
      expect(validate).toThrowError();
    });

    test('should not throw error if input type is allowed', () => {
      const field = document.getElementById('field-2') as HTMLInputElement;
      const validate = () => instance['validateFieldType'](field);
      expect(validate).not.toThrowError();
    });

    test('should not throw error if field is not an input', () => {
      const field = document.getElementById('field-3') as HTMLTextAreaElement;
      const validate = () => instance['validateFieldType'](field);
      expect(validate).not.toThrowError();
    });
  });

  describe('validateFieldId', () => {
    test('should throw error if field is not found', () => {
      const validate = () => instance['validateFieldId']('non-existent-field-id');
      expect(validate).toThrowError();
    });

    test('should not throw error if field is found', () => {
      const validate = () => instance['validateFieldId']('field-1');
      expect(validate).not.toThrowError();
    });
  });

  describe('removeFieldColor', () => {
    test('should remove field color', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = '1px solid red';
      instance['fieldsOriginalOutline'] = { 'field-1': 'some value' };
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = { 'field-1': { id: '123' } };

      instance['removeFieldColor']({ presence: { id: '123' }, data: { fieldId: 'field-1' } });

      expect(field.style.outline).toBe('some value');
      expect(instance['fields']['field-1']).toBe(field);
      expect(instance['fieldsOriginalOutline']['field-1']).toBeUndefined();
      expect(instance['focusList']['field-1']).toBeUndefined();
    });

    test('should not remove field color if focusList id does not match presence id', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = '1px solid red';
      instance['fieldsOriginalOutline'] = { 'field-1': 'some value' };
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = { 'field-1': { id: '321' } };

      instance['removeFieldColor']({ presence: { id: '123' }, data: { fieldId: 'field-1' } });

      expect(field.style.outline).toBe('1px solid red');
      expect(instance['fieldsOriginalOutline']['field-1']).toBe('some value');
      expect(instance['fields']['field-1']).toBe(field);
      expect(instance['focusList']).toStrictEqual({ 'field-1': { id: '321' } });
    });

    test('should not remove field color if field is not registered', () => {
      instance['fieldsOriginalOutline']['field-1'] = 'some value';
      instance['removeFieldColor']({ presence: { id: '123' }, data: { fieldId: 'field-1' } });

      expect(instance['fieldsOriginalOutline']['field-1']).toBe('some value');
    });

    test('should set outline to empty string if there is no saved original outline', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = '1px solid red';
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = { 'field-1': { id: '123' } };

      instance['removeFieldColor']({ presence: { id: '123' }, data: { fieldId: 'field-1' } });

      expect(field.style.outline).toBe('');
    });
  });

  describe('updateFieldColor', () => {
    beforeEach(() => {
      instance['localParticipant'] = MOCK_LOCAL_PARTICIPANT;
    });

    test('should update field color if there was no focus on it', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = {};

      instance['updateFieldColor']({
        presence: { id: '123' },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 1000,
      });

      expect(field.style.outline).toBe('1px solid red');
      expect(instance['focusList']['field-1']).toEqual({
        id: '123',
        color: 'red',
        firstInteraction: 1000,
        lastInteraction: 1000,
      });
    });

    test('should update field color if last interaction was a while ago', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = { 'field-1': { id: '123', lastInteraction: 0 } };

      instance['updateFieldColor']({
        presence: { id: '321' },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 5000,
      });

      expect(field.style.outline).toBe('1px solid red');
      expect(instance['focusList']['field-1']).toEqual({
        id: '321',
        color: 'red',
        firstInteraction: 5000,
        lastInteraction: 5000,
      });
    });

    test('should update field color is first interaction was long ago', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = { 'field-1': { id: '123', firstInteraction: 0 } };

      instance['updateFieldColor']({
        presence: { id: '321' },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 15000,
      });

      expect(field.style.outline).toBe('1px solid red');
      expect(instance['focusList']['field-1']).toEqual({
        id: '321',
        color: 'red',
        firstInteraction: 15000,
        lastInteraction: 15000,
      });
    });

    test('should update last interaction timestamp when participant in focus interacts again', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      instance['fields'] = { 'field-1': field };
      instance['focusList'] = {
        'field-1': { color: 'red', id: '123', firstInteraction: 0, lastInteraction: 0 },
      };

      instance['updateFieldColor']({
        presence: { id: '123' },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 5000,
      });

      expect(instance['focusList']['field-1']).toEqual({
        id: '123',
        color: 'red',
        firstInteraction: 0,
        lastInteraction: 5000,
      });
    });

    test('should update focus with local participant information without changing outline if they interact and there was no previous focus', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = 'old-outline';

      instance['fields'] = { 'field-1': field };
      instance['focusList'] = {};

      instance['updateFieldColor']({
        presence: { id: MOCK_LOCAL_PARTICIPANT.id },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 5000,
      });

      expect(instance['focusList']['field-1']).toEqual({
        id: MOCK_LOCAL_PARTICIPANT.id,
        color: 'red',
        firstInteraction: 5000,
        lastInteraction: 5000,
      });

      expect(field.style.outline).toBe('old-outline');
    });

    test('should not update outline color if first and last interaction were recent', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = '1px solid red';

      instance['fields'] = { 'field-1': field };
      instance['focusList'] = {
        'field-1': { id: '123', color: 'blue', firstInteraction: 0, lastInteraction: 0 },
      };

      instance['updateFieldColor']({
        presence: { id: '321' },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 500,
      });

      expect(field.style.outline).toBe('1px solid red');
    });

    test('should remove outline if local participant emitted event and input was previously focused', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = '1px solid green';
      instance['fieldsOriginalOutline'] = { 'field-1': '1px solid green' };

      instance['fields'] = { 'field-1': field };
      instance['focusList'] = {
        'field-1': { id: '123', color: 'blue', firstInteraction: 0, lastInteraction: 0 },
      };

      instance['updateFieldColor']({
        presence: { id: MOCK_LOCAL_PARTICIPANT.id },
        data: { color: 'red', fieldId: 'field-1' },
        timestamp: 5000,
      });

      expect(field.style.outline).toBe('1px solid green');
    });
  });

  describe('updateFieldContent', () => {
    test('should update field content', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.value = 'old content';
      instance['fields'] = { 'field-1': field };
      instance['localParticipant'] = { id: '123' } as any;

      instance['flags'].disableRealtimeSync = false;

      instance['updateFieldContent']({
        presence: { id: '321' },
        data: {
          value: 'new content',
          fieldId: 'field-1',
          syncContent: true,
          attribute: 'value',
        },
      });

      expect(field.value).toBe('new content');
    });

    test('should not update field content if presence id is local participant id', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.value = 'old content';

      instance['fields'] = { 'field-1': field };
      instance['localParticipant'] = { id: '123' } as any;

      instance['updateFieldContent']({
        presence: { id: '123' },
        data: { content: 'new content', fieldId: 'field-1' },
      });

      expect(field.value).toBe('old content');
    });

    test('should update outline color if flag is active and can update color', () => {
      const field = document.getElementById('field-1') as HTMLInputElement;
      field.style.outline = '1px solid red';
      instance['fields'] = { 'field-1': field };
      instance['localParticipant'] = { id: '123' } as any;

      instance['flags'].disableOutline = false;
      instance['updateFieldColor'] = jest.fn();
      instance['updateFieldContent']({
        presence: { id: '321' },
        data: {
          value: 'new content',
          fieldId: 'field-1',
          syncContent: true,
          attribute: 'value',
          showOutline: true,
        },
      });

      expect(instance['updateFieldColor']).toHaveBeenCalled();
    });
  });

  describe('restoreOutlines', () => {
    test('should restore outlines of all fields', () => {
      const field1 = document.getElementById('field-1') as HTMLInputElement;
      const field2 = document.getElementById('field-2') as HTMLInputElement;
      field1.style.outline = '1px solid red';
      field2.style.outline = '1px solid blue';

      instance['fields'] = { 'field-1': field1, 'field-2': field2 };
      instance['fieldsOriginalOutline'] = { 'field-1': 'old-outline', 'field-2': 'old-outline' };

      instance['restoreOutlines']();

      expect(field1.style.outline).toBe('old-outline');
      expect(field2.style.outline).toBe('old-outline');
    });
  });

  describe('publishTypedEvent', () => {
    test('should publish event', () => {
      const fieldId = 'field-1';
      const color = 'red';
      const presence = { id: '123' };
      const data = { fieldId, color };
      instance['localParticipant'] = { id: '321' } as any;
      instance['publish'] = jest.fn();

      instance['publishTypedEvent']({ presence, data });

      expect(instance['publish']).toHaveBeenCalledWith(FieldEvents.INTERACTION, {
        fieldId,
        userId: '123',
        userName: undefined,
        color,
      });
    });
  });

  describe('canUpdateColor', () => {
    test('should return false if disableOutline flag is true', () => {
      instance['flags'].disableOutline = true;
      expect(instance['canUpdateColor']('field-1')).toBeFalsy();
    });

    test('should return false if field is disabled', () => {
      instance['enabledOutlineFields'] = { 'field-1': false };
      expect(instance['canUpdateColor']('field-1')).toBeFalsy();
    });

    test('should return true if field is not disabled', () => {
      instance['enabledOutlineFields'] = { 'field-1': true };
      expect(instance['canUpdateColor']('field-1')).toBeTruthy();
    });
  });

  describe('enableOutline', () => {
    test('should enable outline color changes for a field', () => {
      instance['fields'] = { 'field-1': document.getElementById('field-1') as HTMLInputElement };
      instance['fields']['field-1'].style.outline = '1px solid black';
      instance['enabledOutlineFields'] = {};
      instance['fieldsOriginalOutline'] = {};

      const addEventListenerSpy = jest.spyOn(instance['fields']['field-1'], 'addEventListener');
      const onSpy = jest.spyOn(instance['room'], 'on');

      instance['enableOutline']('field-1');

      expect(instance['enabledOutlineFields']['field-1']).toBeTruthy();
      expect(instance['fieldsOriginalOutline']['field-1']).toBe('1px solid black');
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(onSpy).toHaveBeenCalledTimes(2);
    });

    test('should not enable outline color changes if field is not found', () => {
      instance['fields'] = {};
      instance['enabledOutlineFields'] = {};
      instance['fieldsOriginalOutline'] = {};

      const onSpy = jest.spyOn(instance['room'], 'on');

      instance['enableOutline']('field-1');

      expect(instance['enabledOutlineFields']['field-1']).toBeUndefined();
      expect(instance['fieldsOriginalOutline']['field-1']).toBeUndefined();
      expect(onSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('disableOutline', () => {
    test('should disable outline color changes for a field', () => {
      instance['fields'] = { 'field-1': document.getElementById('field-1') as HTMLInputElement };
      instance['fields']['field-1'].style.outline = '2px green';
      instance['enabledOutlineFields'] = {};
      instance['fieldsOriginalOutline'] = {
        'field-1': '1px solid black',
      };

      const removeEventListenerSpy = jest.spyOn(
        instance['fields']['field-1'],
        'removeEventListener',
      );
      const offSpy = jest.spyOn(instance['room'], 'off');

      instance['disableOutline']('field-1');

      expect(instance['enabledOutlineFields']['field-1']).toBe(false);
      expect(instance['fieldsOriginalOutline']['field-1']).toBe('1px solid black');
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(offSpy).toHaveBeenCalledTimes(2);
    });

    test('should not disable outline color changes if field is not found', () => {
      instance['fields'] = {};
      instance['enabledOutlineFields'] = {};
      instance['fieldsOriginalOutline'] = {};

      const offSpy = jest.spyOn(instance['room'], 'off');

      instance['disableOutline']('field-1');

      expect(instance['enabledOutlineFields']['field-1']).toBe(undefined);
      expect(offSpy).toHaveBeenCalledTimes(0);
    });

    test('should set outlien to empty string if there is no saved original outline', () => {
      instance['fields'] = { 'field-1': document.getElementById('field-1') as HTMLInputElement };
      instance['fields']['field-1'].style.outline = '2px green';
      instance['enabledOutlineFields'] = {};
      instance['fieldsOriginalOutline'] = {};

      instance['disableOutline']('field-1');

      expect(instance['fields']['field-1'].style.outline).toBe('');
    });
  });

  describe('sync', () => {
    test('should emit an event with the field content and local participant color', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const field = document.getElementById('field-1') as HTMLInputElement;
      field.value = 'some value';

      instance['fields'] = { 'field-1': field };
      instance['hasCheckedProperty'] = jest.fn().mockReturnValue(false);
      instance['sync']('field-1');

      expect(instance['room'].emit).toHaveBeenCalledTimes(2);

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.CONTENT_CHANGE}field-1`, {
        value: 'some value',
        color: 'red',
        fieldId: 'field-1',
        showOutline: true,
        syncContent: true,
        attribute: 'value',
      });

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.INTERACTION}field-1`, {
        value: 'some value',
        color: 'red',
        fieldId: 'field-1',
        showOutline: true,
        syncContent: true,
        attribute: 'value',
      });
    });

    test('should emit an event with the field checked value and local participant color', () => {
      instance['room'] = {
        emit: jest.fn(),
      } as any;
      instance['localParticipant'] = {
        slot: { color: 'red' },
      } as any;

      const field = document.createElement('checkbox') as HTMLInputElement;
      field.checked = true;

      instance['fields'] = { checkbox: field };
      instance['hasCheckedProperty'] = jest.fn().mockReturnValue(true);
      instance['sync']('checkbox');

      expect(instance['room'].emit).toHaveBeenCalledTimes(2);

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.CONTENT_CHANGE}checkbox`, {
        value: true,
        color: 'red',
        fieldId: 'checkbox',
        showOutline: true,
        syncContent: true,
        attribute: 'checked',
      });

      expect(instance['room'].emit).toHaveBeenCalledWith(`${FieldEvents.INTERACTION}checkbox`, {
        value: true,
        color: 'red',
        fieldId: 'checkbox',
        showOutline: true,
        syncContent: true,
        attribute: 'checked',
      });
    });
  });

  describe('enableRealtimeSync', () => {
    test('should add field to enabled realtime sync list', () => {
      instance['enabledRealtimeSyncFields'] = {};
      instance['enableRealtimeSync']('field-1');
      expect(instance['enabledRealtimeSyncFields']['field-1']).toBe(true);
    });
  });

  describe('disableRealtimeSync', () => {
    test('should remove field from enabled realtime sync list', () => {
      instance['enabledRealtimeSyncFields'] = { 'field-1': true };
      instance['disableRealtimeSync']('field-1');
      expect(instance['enabledRealtimeSyncFields']['field-1']).toBe(false);
    });
  });
});
