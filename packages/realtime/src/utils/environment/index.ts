import { isBun, isDeno, isNode as isnode } from 'browser-or-node';

export const isNode = () => isBun || isDeno || isnode;
