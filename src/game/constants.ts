import { Vec3 } from './types';

export const ROOM_BOUNDS = { minX: -8, maxX: 8, minZ: -6, maxZ: 8 };

export const INTERACTABLES: Record<string, { label: string; pos: Vec3; radius: number }> = {
  child: { label: 'Secure Civilian', pos: [2.5, 0, 1.4], radius: 1.8 },
  laptop: { label: 'Evidence Laptop', pos: [2.2, 0, 1.9], radius: 1.8 },
  cash: { label: 'Evidence Cash', pos: [0.7, 0, 0.2], radius: 1.7 },
  suspect: { label: 'Suspect', pos: [4.2, 0, 1.4], radius: 2.2 },
  monitors: { label: 'Desk Monitors', pos: [5.6, 0, 0.8], radius: 2.2 },
  commander: { label: 'Commander Briefing', pos: [0, 0, 1], radius: 2 },
  informant: { label: 'Market Informant', pos: [2, 0, -1], radius: 2 }
};
