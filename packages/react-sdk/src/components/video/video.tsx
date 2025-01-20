import { useCallback, useEffect, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { FrameEvent, MeetingEvent, VideoConferenceComponent } from '../../lib/sdk';
import { VideoCallbacks, VideoComponentProps } from './video.types';

const generateCallbackList = (callbacks: VideoCallbacks) => {
  return {
    [MeetingEvent.DESTROY]: callbacks.onDestroy,
    [FrameEvent.FRAME_DIMENSIONS_UPDATE]: callbacks.onFrameDimensionsChange,
    [MeetingEvent.MEETING_WAITING_FOR_HOST]: callbacks.onWaitingForHostChange,
    [MeetingEvent.MEETING_CONNECTION_STATUS_CHANGE]: callbacks.onConnectionStatusChange,
    [MeetingEvent.MEETING_STATE_UPDATE]: callbacks.onMeetingStateChange,
    [MeetingEvent.MEETING_SAME_PARTICIPANT_ERROR]: callbacks.onSameAccountError,
    [MeetingEvent.MEETING_DEVICES_CHANGE]: callbacks.onDevicesStateChange,
    [MeetingEvent.MEETING_HOST_CHANGE]: callbacks.onHostChange,
    [MeetingEvent.MEETING_HOST_AVAILABLE]: callbacks.onHostAvailable,
    [MeetingEvent.MEETING_NO_HOST_AVAILABLE]: callbacks.onNoHostAvailable,
    [MeetingEvent.MEETING_START]: callbacks.onMeetingStart,
    [MeetingEvent.MEETING_PARTICIPANT_JOINED]: callbacks.onParticipantJoin,
    [MeetingEvent.MY_PARTICIPANT_JOINED]: callbacks.onLocalParticipantJoin,
    [MeetingEvent.MEETING_PARTICIPANT_LEFT]: callbacks.onParticipantLeave,
    [MeetingEvent.MY_PARTICIPANT_LEFT]: callbacks.onLocalParticipantLeave,
    [MeetingEvent.MEETING_PARTICIPANT_LIST_UPDATE]: callbacks.onParticipantListChange,
    [MeetingEvent.MEETING_PARTICIPANT_AMOUNT_UPDATE]: callbacks.onParticipantAmountChange,
    [MeetingEvent.MEETING_KICK_PARTICIPANTS]: callbacks.onKickAllParticipants,
    [MeetingEvent.MEETING_KICK_PARTICIPANT]: callbacks.onKickLocalParticipant,
    mount: callbacks.onMount,
    unmount: callbacks.onUnmount,
  };
};

export function VideoConference(params: VideoComponentProps) {
  const {
    onMeetingStart,
    onDestroy,
    onFrameDimensionsChange,
    onWaitingForHostChange,
    onConnectionStatusChange,
    onMeetingStateChange,
    onSameAccountError,
    onDevicesStateChange,
    onHostChange,
    onHostAvailable,
    onNoHostAvailable,
    onParticipantJoin,
    onLocalParticipantJoin,
    onParticipantLeave,
    onLocalParticipantLeave,
    onParticipantListChange,
    onParticipantAmountChange,
    onKickAllParticipants,
    onKickLocalParticipant,
    onMount,
    onUnmount,
  } = params;
  const { room, component, addComponent, removeComponent } =
    useInternalFeatures<VideoConferenceComponent>('videoConference');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);
  const callbacks = useRef<Record<MeetingEvent | string, any>>({});
  const videoInstance = useRef<VideoConferenceComponent | null>(null);

  useEffect(() => {
    if (!room || initializedTimestamp || videoInstance.current) return;

    videoInstance.current = new VideoConferenceComponent(params);

    const destroyCallback = () => {
      removeComponent(videoInstance.current!);
      videoInstance.current = null;
      setInitializedTimestamp(null);
    };

    videoInstance.current.subscribe('destroy', destroyCallback);

    updateCallbacks(params);

    addComponent(videoInstance.current);
    setInitializedTimestamp(Date.now());
  }, [room]);

  useEffect(() => {
    const updatedList = generateCallbackList(params);

    if (
      !videoInstance.current ||
      (!Object.values(callbacks.current).length && Object.values(updatedList).every((cb) => !cb))
    ) {
      return;
    }

    updateCallbacks(params);
  }, [
    onMeetingStart,
    onDestroy,
    onFrameDimensionsChange,
    onWaitingForHostChange,
    onConnectionStatusChange,
    onMeetingStateChange,
    onSameAccountError,
    onDevicesStateChange,
    onHostChange,
    onHostAvailable,
    onNoHostAvailable,
    onParticipantJoin,
    onLocalParticipantJoin,
    onParticipantLeave,
    onLocalParticipantLeave,
    onParticipantListChange,
    onParticipantAmountChange,
    onKickAllParticipants,
    onKickLocalParticipant,
    onMount,
    onUnmount,
  ]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  const updateCallbacks = useCallback((params: VideoComponentProps) => {
    const updatedList = generateCallbackList(params);

    Object.entries(updatedList).forEach(([event, callback]) => {
      if (callbacks.current[event]) {
        videoInstance.current!.unsubscribe(event, callbacks.current[event]);
        callbacks.current[event] = undefined;
      }

      if (callback) {
        videoInstance.current!.subscribe(event, callback);
        callbacks.current[event] = callback;
      }
    });
  }, []);

  return <></>;
}
