export interface Sides {
    left: number,
    top: number,
    right: number,
    bottom:number,
}

export interface Simple2DPoint {
    x: number,
    y: number,
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
