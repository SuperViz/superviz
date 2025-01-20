import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { VideoConferenceComponent } from '../lib/sdk';

type UseVideoData = {
  isReady: boolean;
  /**
   * @function toggleMeetingSetup
   * @description open/close meeting setup
   * @returns {void}
   */
  toggleMeetingSetup: () => void;
  /**
   * @function toggleMicrophone
   * @description mute/unmute user's microphone
   * @returns {void}
   */
  toggleMicrophone: () => void;
  /**
   * @function toggleCam
   * @description enable/disable user's camera
   * @returns {void}
   */
  toggleCam: () => void;
  /**
   * @function toggleScreenShare
   * @description enable/disable user's screen share
   * @returns {void}
   */
  toggleScreenShare: () => void;
  /**
   * @function toggleChat
   * @description open/close meeting chat
   * @returns {void}
   */
  toggleChat: () => void;
  /**
   * @function toggleRecording
   * @description open/close meeting recording
   * @returns {void}
   */
  toggleRecording: () => void;
  /**
   * @function hangUp
   * @description hang up user's call
   * @returns {void}
   * */
  hangUp: () => void;
};

export function useVideo(): UseVideoData {
  const { component, room, ...context } =
    useInternalFeatures<VideoConferenceComponent>('videoConference');
  const instance = useRef<VideoConferenceComponent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (component) {
      instance.current = component;
      setIsReady(true);
    }
  }, [component]);

  useEffect(() => {
    if (!room && instance.current) {
      instance.current = null;
      setIsReady(false);
    }
  }, [room]);

  const toggleMeetingSetup = useCallback(() => {
    if (!instance.current) return;
    instance.current.toggleMeetingSetup();
  }, [instance.current]);

  const toggleMicrophone = useCallback(() => {
    if (!instance.current) return;
    instance.current.toggleMicrophone();
  }, [instance.current]);

  const toggleCam = useCallback(() => {
    if (!instance.current) return;
    instance.current.toggleCam();
  }, [instance.current]);

  const toggleScreenShare = useCallback(() => {
    if (!instance.current) return;
    instance.current.toggleScreenShare();
  }, [instance.current]);

  const toggleChat = useCallback(() => {
    if (!instance.current) return;
    instance.current.toggleChat();
  }, [instance.current]);

  const toggleRecording = useCallback(() => {
    if (!instance.current) return;
    instance.current.toggleRecording();
  }, [instance.current]);

  const hangUp = useCallback(() => {
    if (!instance.current) return;
    instance.current.hangUp();
  }, [instance.current]);

  return useMemo(() => {
    return {
      isReady,
      toggleMeetingSetup,
      toggleMicrophone,
      toggleCam,
      toggleScreenShare,
      toggleChat,
      toggleRecording,
      hangUp,
    };
  }, [room, context.activeComponents, component, isReady]);
}
