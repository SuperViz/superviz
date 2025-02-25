import { useCallback, useEffect, useMemo } from "react";
import { useInternalFeatures } from "src/contexts/room";
import type { Participant } from "@superviz/video/dist/common/types/participant.types";
import type { MeetingState } from "@superviz/video/dist/common/types/events.types";
import type { VideoConference, VideoHuddle } from "@superviz/video";

type VideoCallbacks = {
  onHostChanged?: (host: Participant | null) => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participant: Participant) => void;
  onParticipantKicked?: (participant: Participant) => void;
  onParticipantListUpdate?: (participants: Record<string, Participant>) => void;
  onMeetingStateUpdate?: (meetingState: MeetingState) => void;
};

export const useVideo = (callbacks?: VideoCallbacks) => {
  const { components } = useInternalFeatures();

  const video = useMemo<VideoConference | VideoHuddle>(() => {
    const video = components?.videoConference;

    return video as VideoConference | VideoHuddle;
  }, [components]);

  useEffect(() => {
    if (video) {
      callbacks?.onHostChanged && video.subscribe("host.changed", callbacks.onHostChanged);
      callbacks?.onParticipantJoined && video.subscribe("my.participant.joined", callbacks.onParticipantJoined);
      callbacks?.onParticipantLeft && video.subscribe("my.participant.left", callbacks.onParticipantLeft);
      callbacks?.onParticipantListUpdate && video.subscribe("participant.list.update", callbacks.onParticipantListUpdate);
      callbacks?.onMeetingStateUpdate && video.subscribe("meeting.state.update", callbacks.onMeetingStateUpdate);
      callbacks?.onParticipantKicked && video.subscribe("my.participant.kicked", callbacks.onParticipantKicked);
    }

    return () => {
      if (video) {
        callbacks?.onHostChanged && video.unsubscribe("host.changed", callbacks.onHostChanged);
        callbacks?.onParticipantJoined && video.unsubscribe("my.participant.joined", callbacks.onParticipantJoined);
        callbacks?.onParticipantLeft && video.unsubscribe("my.participant.left", callbacks.onParticipantLeft);
        callbacks?.onParticipantListUpdate && video.unsubscribe("participant.list.update", callbacks.onParticipantListUpdate);
        callbacks?.onMeetingStateUpdate && video.unsubscribe("meeting.state.update", callbacks.onMeetingStateUpdate);
        callbacks?.onParticipantKicked && video.unsubscribe("my.participant.kicked", callbacks.onParticipantKicked);
      }
    };
  }, [video]);

  /**
   * @function toggleMeetingSetup
   * @description open/close meeting setup
   * @returns {void}
   */
  const toggleMeetingSetup = useCallback(() => {
    if (!video) return;

    video.toggleMeetingSetup();
  }, [video]);

  /**
   * @function toggleMicrophone
   * @description mute/unmute user's microphone
   * @returns {void}
   */
  const toggleMicrophone = useCallback(() => {
    if (!video) return;

    video.toggleMicrophone();
  }, [video]);

  /**
   * @function toggleCam
   * @description enable/disable user's camera
   * @returns {void}
   */
  const toggleCam = useCallback(() => {
    if (!video) return;

    video.toggleCam();
  }, [video]);

  /**
   * @function toggleScreenShare
   * @description enable/disable user's screen share
   * @returns {void}
   */
  const toggleScreenShare = useCallback(() => {
    if (!video) return;

    video.toggleScreenShare();
  }, [video]);

  /**
   * @function toggleChat
   * @description open/close meeting chat
   * @returns {void}
   */
  const toggleChat = useCallback(() => {
    if (!video) return;

    video.toggleChat();
  }, [video]);

  /**
   * @function toggleRecording
   * @description open/close meeting recording
   * @returns {void}
   */
  const toggleRecording = useCallback(() => {
    if (!video) return;

    video.toggleRecording();
  }, [video]);

  /**
   * @function hangUp
   * @description hang up user's call
   * @returns {void}
   */
  const hangUp = useCallback(() => {
    if (!video) return;

    video.hangUp();
  }, [video]);

  return {
    toggleMeetingSetup,
    toggleMicrophone,
    toggleCam,
    toggleScreenShare,
    toggleChat,
    toggleRecording,
    hangUp,
  };
};