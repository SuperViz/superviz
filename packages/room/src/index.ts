import debug from 'debug';
import { z } from 'zod';

import { Participant } from './common/types/participant.types';
import { Room } from './core';
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
 * @description Creates a new room with the given parameters.
 * @param {InitializeRoomParams} params - The parameters required to initialize the room.
 * @returns A promise that resolves to the created Room instance.
 * @throws
 *  Will throw an error if the parameters are invalid or if
 *  any other error occurs during room creation.
 */
export async function createRoom(params: InitializeRoomParams): Promise<Room> {
  try {
    const { developerToken, participant, roomId } = InitializeRoomSchema.parse(params);

    await setUpEnvironment(params);

    return new Room({ participant: participant as Participant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((err) => err.message).join('\n');
      console.error(message);
      throw new Error(message);
    }

    throw error;
  }
}
