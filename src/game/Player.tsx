import { useEffect, useMemo, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from './store';
import { ROOM_BOUNDS } from './constants';

const keys = new Set<string>();

export function Player() {
  const ref = useRef<Group>(null);
  const setPos = useGameStore((s) => s.setPlayerPosition);
  const setYaw = useGameStore((s) => s.setPlayerYaw);
  const setMoveMode = useGameStore((s) => s.setMovementMode);
  const started = useGameStore((s) => s.started);
  const step = useGameStore((s) => s.missionStep);
  const basePos = useGameStore((s) => s.playerPosition);
  const velocity = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onMouse = (e: MouseEvent) => {
      if (!ref.current || !started) return;
      ref.current.rotation.y -= e.movementX * 0.0023;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [started]);

  useFrame((_, dt) => {
    if (!ref.current || !started || step === 'aftermath') return;
    const sprint = keys.has('shift');
    const crouch = keys.has('c');
    setMoveMode(crouch, sprint);
    const speed = crouch ? 1.4 : sprint ? 4.2 : 2.6;

    const forward = new Vector3(0, 0, Number(keys.has('s')) - Number(keys.has('w')));
    const strafe = new Vector3(Number(keys.has('d')) - Number(keys.has('a')), 0, 0);
    velocity.copy(forward.add(strafe));
    if (velocity.lengthSq() > 0) velocity.normalize().multiplyScalar(speed * dt);
    velocity.applyAxisAngle(new Vector3(0, 1, 0), ref.current.rotation.y);

    ref.current.position.add(velocity);
    ref.current.position.x = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, ref.current.position.x));
    ref.current.position.z = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, ref.current.position.z));

    setPos([ref.current.position.x, 0, ref.current.position.z]);
    setYaw(ref.current.rotation.y);
  });

  return (
    <group ref={ref} position={basePos as [number, number, number]}>
      <mesh castShadow position={[0, 1.3, 0]}>
        <capsuleGeometry args={[0.38, 0.9, 4, 8]} />
        <meshStandardMaterial color="#1f3f77" roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 2.1, 0.05]}>
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial color="#4a2e1f" />
      </mesh>
      <mesh position={[0, 1.4, -0.18]}>
        <boxGeometry args={[0.66, 0.74, 0.22]} />
        <meshStandardMaterial color="#152641" />
      </mesh>
    </group>
  );
}
