export interface Sides {
    left: number,
    top: number,
    right: number,
    bottom:number,
}

export type HorizontalSide = 'left' | 'right';

export interface SimpleParticipant {
    name?: string;
    avatar?: string;
}

export type ParticipantByGroupApi = {
    id: string;
    name: string;
    avatar: string;
    email: string;
};

export enum Presence3dEvents {
    PARTICIPANT_JOINED = 'participant-joined',
    GATHER = 'gather',
    FOLLOW_ME = 'follow-me',
}
