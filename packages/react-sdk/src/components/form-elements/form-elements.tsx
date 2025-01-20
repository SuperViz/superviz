import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { ComponentLifeCycleEvent, FormElementsComponent } from '../../lib/sdk';
import { FieldEvents, FormElementsProps } from './form-elements.types';

export function FormElements({
  onMount,
  onUnmount,
  disableOutline,
  disableRealtimeSync,
  fields,
  children,
  onInteraction,
  onContentChange,
}: FormElementsProps) {
  const { room, component, addComponent } =
    useInternalFeatures<FormElementsComponent>('formElements');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!component) return;
    component.unsubscribe(ComponentLifeCycleEvent.MOUNT);

    if (onMount) {
      component.subscribe(ComponentLifeCycleEvent.MOUNT, onMount);
    }
  }, [component, onMount]);

  useEffect(() => {
    if (!component) return;
    component.unsubscribe(ComponentLifeCycleEvent.UNMOUNT);

    if (onUnmount) {
      component.subscribe(ComponentLifeCycleEvent.UNMOUNT, onUnmount);
    }
  }, [component, onUnmount]);

  useEffect(() => {
    if (!component) return;
    component.unsubscribe(FieldEvents.CONTENT_CHANGE);

    if (onContentChange) {
      component.subscribe(FieldEvents.CONTENT_CHANGE, onContentChange);
    }
  }, [component, onContentChange]);

  useEffect(() => {
    if (!component) return;
    component.unsubscribe(FieldEvents.INTERACTION);

    if (onInteraction) {
      component.subscribe(FieldEvents.INTERACTION, onInteraction);
    }
  }, [component, onInteraction]);

  useEffect(() => {
    if (!room || initializedTimestamp) return;

    const formElementsInstance = new FormElementsComponent({
      fields,
      disableOutline,
      disableRealtimeSync,
    });

    addComponent(formElementsInstance);
    setInitializedTimestamp(Date.now());
  }, [room]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return children ?? <></>;
}
