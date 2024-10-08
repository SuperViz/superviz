import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { SuperVizYjsProvider } from '../lib/sdk';

type UseYjsProviderData = {
  isReady: boolean;
  /**
   * @var provider
   * @description the SuperVizYjsProvider instance
   */
  provider: SuperVizYjsProvider | null;

  /**
   * @function getLocalState
   * @description get the local state of the awareness instance
   * @returns Record<string, any> | null
   */
  getLocalState(): Record<string, any> | null;

  /**
   * @function getStates
   * @description get all the states of the awareness of participants in the room
   * @returns Map<number, Record<string, any>>
   */
  getStates(): Map<number, Record<string, any>>;

  /**
   * @function setLocalState
   * @description set the state of the local participant
   * @param {Record<string, any>} state the new state
   * @returns void
   */
  setLocalState(state: Record<string, any> | null): void;

  /**
   * @function setLocalStateField
   * @param {string} field the name of the field to update
   * @param {any} value the new value of the field
   */
  setLocalStateField(field: string, value: any): void;
};

export function useYjsProvider(): UseYjsProviderData {
  const { component, room, ...context } = useInternalFeatures<SuperVizYjsProvider>('yjsProvider');
  const instance = useRef<SuperVizYjsProvider | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (component) {
      instance.current = component;
      setIsReady(true);
    }

    if (!room && isReady) {
      instance.current = null;
      setIsReady(false);
    }
  }, [component]);

  const getLocalState = useCallback(() => {
    if (!instance.current?.awareness) return null;
    return instance.current.awareness.getLocalState();
  }, [instance.current]);

  const setLocalState = useCallback(
    (state: Record<string, any> | null) => {
      instance.current?.awareness?.setLocalState(state);
    },
    [instance.current],
  );

  const setLocalStateField = useCallback(
    (field: string, value: any) => {
      instance.current?.awareness?.setLocalStateField(field, value);
    },
    [getLocalState, setLocalState],
  );

  const getStates = useCallback(() => {
    if (!instance.current?.awareness) return new Map();
    return instance.current.awareness.getStates();
  }, [instance.current]);

  return useMemo(() => {
    return {
      isReady,
      getLocalState,
      getStates,
      setLocalState,
      setLocalStateField,
      provider: instance.current,
    };
  }, [room, context.activeComponents, component, isReady]);
}
