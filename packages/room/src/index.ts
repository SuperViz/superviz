import debug from 'debug';
import { z } from 'zod';

import { InitialParticipant, Participant } from './common/types/participant.types';
import { Room } from './core';
import { Callback, ParticipantEvent, RoomEvent } from './core/types';
import { ApiService } from './services/api';
import config from './services/config';
import { InitializeRoomParams, InitializeRoomSchema } from './types';

/**
 * Sets up the environment for the SuperViz application.
 *
 * This function configures the API URL, API key, debug mode, room ID, and environment.
 * It also validates the provided API key and fetches additional configuration data
 * such as watermarks and limits from the server.
 *
 * @throws
 *  Will throw an error if the configuration fails to load
 *  from the server or if the API key is invalid.
 */
async function setUpEnvironment({
  developerToken,
  roomId,
  environment,
  debug: enableDebug,
  group,
}: InitializeRoomParams): Promise<void> {
  config.set('group', group);
  config.set('apiKey', developerToken);
  config.set('debug', !!enableDebug);
  config.set('roomId', roomId);
  config.set('environment', environment ?? 'prod');
  config.set('apiUrl', config.get('environment') === 'prod' ? 'https://api.superviz.com' : 'https://dev.nodeapi.superviz.com');

  if (enableDebug) {
    console.log('[SuperViz | Room] Debug mode enabled');
    debug.enable('@superviz/*');
  } else {
    debug.disable();
  }

  const [canAccess, waterMark, limits] = await Promise.all([
    ApiService.validateApiKey(developerToken),
    ApiService.fetchWaterMark(developerToken),
    ApiService.fetchLimits(developerToken),
  ]).catch((error) => {
    console.log(error);
    throw new Error('[SuperViz | Room] Failed to load configuration from server');
  });

  if (!canAccess) {
    throw new Error('[SuperViz | Room] Unable to validate your API key. Please check your key and try again.');
  }

  config.set('limits', limits);
  config.set('waterMark', waterMark);
}

/**
 * Sets up a participant by fetching their details from the API or creating
   a new participant if they do not exist.
 *
 * @param {InitialParticipant} participant - The initial participant data.
 * @returns {Promise<InitialParticipant>} - A promise that resolves to the participant data.
 * @throws {Error} - Throws an error if the participant does not exist and no name is provided.
 */
async function setUpParticipant(participant: InitialParticipant): Promise<InitialParticipant> {
  const apiParticipant = await ApiService.fetchParticipant(participant.id).catch(() => null);

  if (!apiParticipant && !participant.name) {
    throw new Error(
      '[SuperViz | Room] - Participant does not exist, create the user in the API or add the name in the initialization to initialize the SuperViz room.',
    );
  }

  if (!apiParticipant) {
    await ApiService.createParticipant({
      participantId: participant.id,
      name: participant?.name,
      email: participant?.email,
    });
  }

  return {
    id: participant.id,
    name: participant.name ?? apiParticipant?.name,
    email: participant.email ?? apiParticipant?.email,
  };
}

/**
 * @description Creates a new room with the given parameters.
 * @param {InitializeRoomParams} params - The parameters required to initialize the room.
 * @returns A promise that resolves to the created Room instance.
 * @throws
 *  Will throw an error if the parameters are invalid or if
 *  any other error occurs during room creation.
 */
export async function createRoom(params: InitializeRoomParams): Promise<Room> {
  try {
    const { participant } = InitializeRoomSchema.parse(params);

    await setUpEnvironment(params);
    await setUpParticipant(participant as InitialParticipant);

    if (typeof window !== 'undefined' && window.SUPERVIZ_ROOM) {
      console.warn(`[SuperViz | Room] An existing room instance was found in the window object.
      To prevent conflicts, please call the 'leave' method on the existing room before creating a new one.
      Returning the previously created room instance.
      `);

      return window.SUPERVIZ_ROOM;
    }

    const room = new Room({
      participant: {
        id: participant.id,
        name: participant.name,
      },
    });

    if (typeof window !== 'undefined') {
      window.SUPERVIZ_ROOM = room;
    }

    return room;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((err) => err.message).join('\n');
      console.error(message);
      throw new Error(message);
    }

    throw error;
  }
}

// Exports

export type {
  Room,
  Participant,
};

export {
  RoomEvent,
  ParticipantEvent,
  Callback,
};

if (typeof window !== 'undefined') {
  window.SuperVizRoom = {
    createRoom,
    RoomEvent,
    ParticipantEvent,
  };
}
