import { useMemo } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { FormElementsComponent } from '../lib/sdk';

type UseFormElementsData = {
  /**
   * @function enableOutline
   * @description Enables changes in the color of the outline of a field. Color changes are triggered when, in general, another participant interacts with the field on their side AND they also have color changes enabled.
   *
   *    Enabling this feature through this method overrides the global flag "disableOutline" set in the constructor for this particular input.
   * @param fieldId The id of the input field or textarea that will have its outline color changed
   * @returns {void}
   */
  enableOutline(fieldId: string): void;

  /**
   * @function disableOutline
   * @description Disables changes in the color of the outline of a field.
   *
   *    Disabling this feature through this method overrides the global flag "disableOutline" set in the constructor for this particular input.
   * @param fieldId The id of the input field or textarea that will have its outline color changed
   * @returns {void}
   */
  disableOutline(fieldId: string): void;

  /**
   * @function enableRealtimeSync
   * @description Enables the synchronization of the content of a field in real time. The content of the field will be updated in real time when another participant interacts with the field on their side AND they also have content synchronization enabled.
   *
   *    "Content" may refer to the value the user has typed or selected, or the status of the field (checked or not), depending on the type of field.
   *
   *    Enabling this feature through this method overrides the global flag "disableRealtimeSync" set in the constructor for this particular input.
   * @param fieldId The id of the input field or textarea that will have its content synchronized
   * @returns {void}
   */
  enableRealtimeSync(fieldId: string): void;

  /**
   * @function disableRealtimeSync
   * @description Disables the synchronization of the content of a field in real time.
   *
   *   Disabling this feature through this method overrides the global flag "disableRealtimeSync" set in the constructor for this particular input.
   *
   * @param fieldId The id of the input field or textarea that will have its content synchronized
   * @returns {void}
   */
  disableRealtimeSync(fieldId: string): void;

  /**
   * @function sync
   * @description Sends the value of the field to every other participant with the realtime sync enabled for this field.
   *
   *   This method is useful when you want to update the content of a field without waiting for the user to interact with it.
   *
   *   If realtime sync is disabled for the field, even though the content won't be updated, every other participant receives an event with details about the sync attempt.
   * @param fieldId
   */
  sync(fieldId: string): void;

  /**
   * @function registerField
   * @description Registers a field element. 
    
      A registered field will be monitored and most interactions with it will be shared with every other user in the room that is tracking the same field.

      Examples of common interactions that will be monitored include typing, focusing, and blurring, but more may apply.
   * @param {string} fieldId The id of the field that will be registered
   * @returns {void}
   */
  registerField(fieldId: string): void;

  /**
   * @function deregisterField
   * @description Deregisters a single field
   * @param {string} fieldId The id of the field that will be deregistered
   * @returns {void}
   */
  deregisterField(fieldId: string): void;
};

export function useFormElements(): UseFormElementsData {
  const { component, ...context } = useInternalFeatures<FormElementsComponent>('formElements');

  return useMemo(() => {
    if (!component) {
      return {
        isReady: false,
        enableOutline: () => {},
        disableOutline: () => {},
        enableRealtimeSync() {},
        disableRealtimeSync() {},
        sync() {},
        registerField() {},
        deregisterField() {},
      };
    }

    return {
      isReady: true,
      enableOutline: (fieldId: string) => {
        component.enableOutline(fieldId);
      },
      disableOutline: (fieldId: string) => {
        component.disableOutline(fieldId);
      },
      enableRealtimeSync(fieldId: string) {
        component.enableRealtimeSync(fieldId);
      },
      disableRealtimeSync(fieldId: string) {
        component.disableRealtimeSync(fieldId);
      },
      sync(fieldId: string) {
        component.sync(fieldId);
      },
      registerField(fieldId: string) {
        component.registerField(fieldId);
      },
      deregisterField(fieldId: string) {
        component.deregisterField(fieldId);
      },
    };
  }, [component, context.room, context.activeComponents]);
}
