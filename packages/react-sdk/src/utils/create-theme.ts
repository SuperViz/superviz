import type { ColorsVariablesNames } from '../lib/sdk';

function convertColorFormat(color: string): string {
  color = color.replace('#', '');

  if (color.length === 6) {
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    return `${r} ${g} ${b}`;
  } else if (color.startsWith('rgb(') && color.endsWith(')')) {
    const rgbValues = color.substring(4, color.length - 1).split(',');

    return `${rgbValues[0].trim()} ${rgbValues[1].trim()} ${rgbValues[2].trim()}`;
  } else {
    return color;
  }
}

/**
 * @function createTheme
 * @description Creates a theme object by converting color values to a specific format.
 * @param colors - An object containing color variables and their values.
 * @returns The theme object with converted color values.
 */
export function createTheme(colors: Partial<Record<ColorsVariablesNames, string>>) {
  const theme: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(colors)) {
    theme[key] = convertColorFormat(value);
  }

  return theme;
}
