export enum DefaultCoordinates {
    x = 0,
    y = 0,
    z = 0
}

export interface Simple2DPoint {
    x: number,
    y: number,
}

export type Coordinates = Simple2DPoint & { z: number }
