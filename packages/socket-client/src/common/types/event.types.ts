/**
 * @enum RoomEvents
 * @description events that the server listens to in the room module
 * @property JOIN_ROOM - event to join a room
 * @property LEAVE_ROOM - event to leave a room
 * @property UPDATE - event to update a room
 * @property JOINED_ROOM - event to indicate a user has joined a room
 * @property ERROR - event to indicate an error in the room module
 */
export enum RoomEvents {
  JOIN_ROOM = 'room.join',
  JOINED_ROOM = 'room.joined',
  LEAVE_ROOM = 'room.leave',
  UPDATE = 'room.update',
  ERROR = 'room.error',
}

export type RoomEventsArg = RoomEvents | `${RoomEvents}` | (string & {});

export enum InternalRoomEvents {
  GET = 'room.get',
}

/**
 * @enum PresenceEvents
 * @description events that the server listens to in the presence module
 * @property JOINED_ROOM - event to indicate a user has joined a room
 * @property LEAVE - event to indicate a user has left a room
 * @property UPDATE - event to indicate a user has updated their presence
 * @property ERROR - event to indicate an error in the presence module
 */
export enum PresenceEvents {
  JOINED_ROOM = 'presence.joined-room',
  LEAVE = 'presence.leave',
  UPDATE = 'presence.update',
}

export type PresenceEventsArg = PresenceEvents | `${PresenceEvents}`;

/**
 * @enum InternalPresenceEvents
 * @description events that the server listens to in the presence module
 * @property GET - event to get the presence list
 */
export enum InternalPresenceEvents {
  GET = 'presence.get',
}
