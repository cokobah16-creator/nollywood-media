import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { useGameStore } from './store';

export function Effects() {
  const ref = useRef<Group>(null);
  const step = useGameStore((s) => s.missionStep);

  useFrame(({ clock }) => {
    if (!ref.current || step !== 'raid') return;
    const t = clock.getElapsedTime();
    ref.current.children[0].position.x = Math.sin(t * 2) * 3;
    ref.current.children[1].position.x = Math.cos(t * 2) * 3;
  });

  if (step !== 'raid') return null;
  return (
    <group ref={ref}>
      <pointLight position={[-2, 2.5, 7]} intensity={1.2} color="#2264ff" />
      <pointLight position={[2, 2.5, 7]} intensity={1.1} color="#ff2d2d" />
    </group>
  );
}
