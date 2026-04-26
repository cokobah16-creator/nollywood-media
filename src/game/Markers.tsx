import { Html } from '@react-three/drei';
import { INTERACTABLES } from './constants';
import { useGameStore } from './store';

export function Markers() {
  const step = useGameStore((s) => s.missionStep);
  const childSecured = useGameStore((s) => s.childSecured);
  const show = Object.entries(INTERACTABLES).filter(([id]) => {
    if (step === 'hq') return id === 'commander';
    if (step === 'market') return id === 'informant';
    if (step === 'raid' && id === 'child' && childSecured) return false;
    return step === 'raid' ? id !== 'commander' && id !== 'informant' : false;
  });

  return (
    <>
      {show.map(([id, item]) => (
        <Html key={id} position={[item.pos[0], 1.7, item.pos[2]]} distanceFactor={16}>
          <div className="world-marker">{item.label}</div>
        </Html>
      ))}
    </>
  );
}
