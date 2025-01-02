import { debug } from 'debug';

import { ColorsVariables, ColorsVariablesNames } from '../common/types/colors.types';
import { EnvironmentTypes, SuperVizSdkOptions } from '../common/types/sdk-options.types';
import ApiService from '../services/api';
import auth from '../services/auth-service';
import config from '../services/config';
import RemoteConfigService from '../services/remote-config-service';

import LauncherFacade from './launcher';
import { LauncherFacade as LauncherFacadeType } from './launcher/types';

/**
 * @function validateId
 * @description validate if the id follows the constraints
 * @param {string} id - id to validate
 * @returns {boolean}
 */
function validateId(id: string): boolean {
  const lengthConstraint = /^.{2,64}$/;
  const pattern = /^[-_&@+=,(){}\[\]\/«».|'"#a-zA-Z0-9À-ÿ\s]*$/;

  if (!lengthConstraint.test(id)) {
    return false;
  }

  if (!pattern.test(id)) {
    return false;
  }

  return true;
}

function validateEmail(email: string): boolean {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

/**
 * @function validateOptions
 * @description Validate the options passed to the SDK
 * @param {SuperVizSdkOptions} param
 * @returns {void}
 */
const validateOptions = ({
  group,
  participant,
  roomId,
  customColors,
}: SuperVizSdkOptions): void => {
  if (customColors) {
    validateColorsVariablesNames(customColors);
  }

  if (!group || !group.name || !group.id) {
    throw new Error('[SuperViz] Group fields is required');
  }

  if (!participant || !participant.id) {
    throw new Error('[SuperViz] Participant id is required');
  }

  if (!roomId) {
    throw new Error('[SuperViz] Room id is required');
  }

  if (!validateId(roomId)) {
    throw new Error(
      '[SuperViz] Room id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  }

  if (!validateId(participant.id)) {
    throw new Error(
      '[SuperViz] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  }

  if (participant.email && !validateEmail(participant.email)) {
    throw new Error('[SuperViz] Participant email is invalid');
  }
};

/**
 * @function validateColorsVariablesNames
 * @description validate if the custom colors variables names are valid
 * @param colors {ColorsVariables}
 */
const validateColorsVariablesNames = (colors: ColorsVariables) => {
  Object.entries(colors).forEach(([key, value]) => {
    if (!Object.values(ColorsVariablesNames).includes(key as ColorsVariablesNames)) {
      throw new Error(
        `[SuperViz] Color ${key} is not a valid color variable name. Please check the documentation for more information.`,
      );
    }

    if (!/^(\d{1,3}\s){2}\d{1,3}$/.test(value)) {
      throw new Error(
        `[SuperViz] Color ${key} is not a valid color variable value. Please check the documentation for more information.`,
      );
    }
  });
};

/**
 * @function setColorVariables
 * @description - add color variables as variables in the root of the document
 * @returns
 */
const setColorVariables = (colors: ColorsVariables): void => {
  if (!colors) return;

  Object.entries(colors).forEach(([key, value]) => {
    const color = value.replace(/\s/g, ', ');
    document.documentElement.style.setProperty(`--${key}`, color);
  });
};

/**
 * @function init
 * @description Initialize the SDK
 * @param apiKey - API key
 * @param options - SDK options
 * @returns {LauncherFacadeType}
 */
const init = async (apiKey: string, options: SuperVizSdkOptions): Promise<LauncherFacadeType> => {
  const validApiKey = apiKey && apiKey.trim();

  if (!validApiKey) throw new Error('API key is required');

  if (!options) throw new Error('Options is required');

  validateOptions(options);

  if (options.debug) {
    debug.enable('*');
  } else {
    debug.disable();
  }

  const [{ apiUrl, conferenceLayerUrl }, features] = await Promise.all([
    RemoteConfigService.getRemoteConfig(options.environment as EnvironmentTypes),
    RemoteConfigService.getFeatures(apiKey),
  ]);

  const [canAccess, waterMark, limits] = await Promise.all([
    auth(apiUrl, apiKey),
    ApiService.fetchWaterMark(apiUrl, apiKey),
    ApiService.fetchLimits(apiUrl, apiKey),
  ]).catch(() => {
    throw new Error('[SuperViz] Failed to load configuration from server');
  });

  if (!canAccess) {
    throw new Error('Failed to validate API key');
  }

  const { participant, roomId, customColors } = options;

  config.setConfig({
    apiUrl,
    apiKey,
    conferenceLayerUrl,
    environment: (options.environment as EnvironmentTypes) ?? EnvironmentTypes.PROD,
    roomId,
    debug: options.debug,
    limits,
    waterMark,
    colors: customColors,
    features,
  });

  setColorVariables(customColors);

  const apiParticipant = await ApiService.fetchParticipant(participant.id).catch(() => null);

  if (!apiParticipant && !participant.name) {
    throw new Error(
      '[SuperViz] - Participant does not exist, create the user in the API or add the name in the initialization to initialize the SuperViz room.',
    );
  }

  if (!apiParticipant) {
    await ApiService.createParticipant({
      participantId: participant.id,
      name: participant?.name,
      avatar: participant.avatar?.imageUrl,
      email: participant?.email,
    });
  }

  return LauncherFacade({
    ...options,
    participant: {
      id: participant.id,
      name: participant.name ?? apiParticipant?.name,
      avatar: participant.avatar ?? apiParticipant?.avatar,
      email: participant.email ?? apiParticipant?.email,
    },
  });
};

export default init;
