import { useMemo } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { CommentsComponent } from '../lib/sdk';

type UseCommentsData = {
  /**
   * @function openThreads
   * @description - Open comments thread
   * @returns {void}
   */
  openThreads: () => void;
  /**
   * @function closeThreads
   * @description - Close comments thread
   * @returns {void}
   */
  closeThreads: () => void;
  /**
   * @function enable
   * @description - Activates the pin adapter and allows the user to create annotations
   * @returns {void}
   */
  enable(): void;
  /**
   * @function disable
   * @description - Deactivates the pin adapter and prevents the user from creating annotations
   * @returns {void}
   */
  disable(): void;
  /**
   * @function url
   * @description Gets the URL of the client
   * @returns {void}
   */
};

export function useComments(): UseCommentsData {
  const { component, ...context } = useInternalFeatures<CommentsComponent>('comments');

  return useMemo(() => {
    if (!component) {
      return {
        isReady: false,
        openThreads: () => {},
        closeThreads: () => {},
        enable: () => {},
        disable: () => {},
      };
    }

    return {
      isReady: true,
      openThreads: () => {
        component.openThreads();
      },
      closeThreads: () => {
        component.closeThreads();
      },
      enable: () => {
        component.enable();
      },
      disable: () => {
        component.disable();
      },
    };
  }, [component, context.room, context.activeComponents]);
}
