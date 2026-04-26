import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from './store';

const target = new Vector3();
const desired = new Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const playerPosition = useGameStore((s) => s.playerPosition);
  const playerYaw = useGameStore((s) => s.playerYaw);

  useFrame(() => {
    target.set(playerPosition[0], 1.5, playerPosition[2]);
    desired.set(playerPosition[0] + Math.sin(playerYaw) * 2.4, 2.2, playerPosition[2] + Math.cos(playerYaw) * 2.8);
    camera.position.lerp(desired, 0.12);
    camera.lookAt(target);
  });

  return null;
}
