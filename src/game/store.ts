import { create } from 'zustand';
import { InteractableId, MissionStep, Vec3 } from './types';

type GameState = {
  started: boolean;
  missionStep: MissionStep;
  playerPosition: Vec3;
  playerYaw: number;
  crouching: boolean;
  sprinting: boolean;
  childSecured: boolean;
  laptopScanned: boolean;
  laptopCollected: boolean;
  cashScanned: boolean;
  cashCollected: boolean;
  suspectArrested: boolean;
  monitorsInspected: boolean;
  xp: number;
  integrity: number;
  publicTrust: number;
  agencyFavour: number;
  currentInteractable: InteractableId;
  missionComplete: boolean;
  hqDone: boolean;
  marketDone: boolean;
  startMission: () => void;
  setPlayerPosition: (pos: Vec3) => void;
  setPlayerYaw: (yaw: number) => void;
  setMovementMode: (crouching: boolean, sprinting: boolean) => void;
  setInteractable: (id: InteractableId) => void;
  doInteract: () => void;
  doScan: () => void;
  nextStep: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  started: false,
  missionStep: 'hq',
  playerPosition: [-5, 0, 2],
  playerYaw: 0,
  crouching: false,
  sprinting: false,
  childSecured: false,
  laptopScanned: false,
  laptopCollected: false,
  cashScanned: false,
  cashCollected: false,
  suspectArrested: false,
  monitorsInspected: false,
  xp: 0,
  integrity: 50,
  publicTrust: 50,
  agencyFavour: 50,
  currentInteractable: null,
  missionComplete: false,
  hqDone: false,
  marketDone: false,
  startMission: () => set({ started: true }),
  setPlayerPosition: (playerPosition) => set({ playerPosition }),
  setPlayerYaw: (playerYaw) => set({ playerYaw }),
  setMovementMode: (crouching, sprinting) => set({ crouching, sprinting }),
  setInteractable: (currentInteractable) => set({ currentInteractable }),
  doInteract: () => {
    const s = get();
    const id = s.currentInteractable;
    if (!id) return;
    if (s.missionStep === 'hq' && id === 'commander') {
      set({ hqDone: true, xp: s.xp + 20, missionStep: 'market', playerPosition: [-3, 0, 0] });
      return;
    }
    if (s.missionStep === 'market' && id === 'informant') {
      set({ marketDone: true, xp: s.xp + 40, missionStep: 'raid', playerPosition: [-5, 0, 2] });
      return;
    }
    if (id === 'child') set({ childSecured: true, publicTrust: s.publicTrust + 8, xp: s.xp + 35 });
    if (id === 'laptop' && s.laptopScanned) set({ laptopCollected: true, xp: s.xp + 45 });
    if (id === 'cash' && s.cashScanned) set({ cashCollected: true, xp: s.xp + 40 });
    if (id === 'suspect' && s.childSecured) set({ suspectArrested: true, integrity: s.integrity + 8, xp: s.xp + 55 });
  },
  doScan: () => {
    const s = get();
    const id = s.currentInteractable;
    if (id === 'laptop') set({ laptopScanned: true, agencyFavour: s.agencyFavour + 5, xp: s.xp + 20 });
    if (id === 'cash') set({ cashScanned: true, xp: s.xp + 15 });
    if (id === 'monitors') set({ monitorsInspected: true, xp: s.xp + 10 });
    if (id === 'informant') set({ xp: s.xp + 10 });
  },
  nextStep: () => set({ missionStep: 'aftermath', missionComplete: true })
}));
