import { useGameStore } from './store';

export function Environment() {
  const step = useGameStore((s) => s.missionStep);
  if (step === 'hq') {
    return (
      <group>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#1f2733" />
        </mesh>
        <mesh position={[0, 2.5, -6]}>
          <boxGeometry args={[12, 5, 0.4]} />
          <meshStandardMaterial color="#2f3b4f" />
        </mesh>
      </group>
    );
  }
  if (step === 'market') {
    return (
      <group>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#2a2b2e" />
        </mesh>
        <mesh position={[0, 2.5, -6]}>
          <boxGeometry args={[16, 5, 0.4]} />
          <meshStandardMaterial color="#30363e" />
        </mesh>
        <mesh position={[3, 0.8, -2]}>
          <boxGeometry args={[3, 1.6, 2]} />
          <meshStandardMaterial color="#7c5232" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#3f3937" roughness={0.15} metalness={0.35} />
      </mesh>
      <mesh position={[0, 2.5, -6]}>
        <boxGeometry args={[16, 5, 0.3]} />
        <meshStandardMaterial color="#d5c2a7" />
      </mesh>
      <mesh position={[-8, 2.5, 1]}>
        <boxGeometry args={[0.3, 5, 14]} />
        <meshStandardMaterial color="#d0bea3" />
      </mesh>
      <mesh position={[8, 2.5, 1]}>
        <boxGeometry args={[0.3, 5, 14]} />
        <meshStandardMaterial color="#d0bea3" />
      </mesh>
      <mesh position={[0, 4.9, 1]}>
        <boxGeometry args={[16, 0.25, 14]} />
        <meshStandardMaterial color="#bca88d" />
      </mesh>
      <mesh position={[0, 2.5, 8]}>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial color="#7ca7d3" transparent opacity={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.01, 12]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial color="#0d1826" />
      </mesh>
    </group>
  );
}
