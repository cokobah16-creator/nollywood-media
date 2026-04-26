import { useFrame } from '@react-three/fiber';
import { INTERACTABLES } from './constants';
import { useGameStore } from './store';

export function Interactables() {
  const player = useGameStore((s) => s.playerPosition);
  const step = useGameStore((s) => s.missionStep);
  const setInteractable = useGameStore((s) => s.setInteractable);
  const childSecured = useGameStore((s) => s.childSecured);

  useFrame(() => {
    const allowed = Object.entries(INTERACTABLES).filter(([id]) => {
      if (step === 'hq') return id === 'commander';
      if (step === 'market') return id === 'informant';
      return id !== 'commander' && id !== 'informant' && !(id === 'child' && childSecured);
    });

    let nearest: string | null = null;
    let nearestDist = Infinity;
    for (const [id, data] of allowed) {
      const dx = player[0] - data.pos[0];
      const dz = player[2] - data.pos[2];
      const d = Math.hypot(dx, dz);
      if (d < data.radius && d < nearestDist) {
        nearest = id;
        nearestDist = d;
      }
    }
    setInteractable((nearest as any) ?? null);
  });

  return null;
}
