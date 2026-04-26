import { useGameStore } from './store';

export function PropsSet() {
  const step = useGameStore((s) => s.missionStep);

  if (step !== 'raid') {
    return (
      <group>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[2, 0.2, 1]} /><meshStandardMaterial color="#3c4c66" /></mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[-3.7, 0.55, 0]}><boxGeometry args={[2.8, 1.1, 1.2]} /><meshStandardMaterial color="#b7a58f" /></mesh>
      <mesh position={[0.8, 0.38, 0.2]}><boxGeometry args={[2.4, 0.18, 1.2]} /><meshStandardMaterial color="#5b3d2c" /></mesh>
      <mesh position={[2.2, 0.18, 1.9]}><boxGeometry args={[0.6, 0.06, 0.4]} /><meshStandardMaterial color="#232830" /></mesh>
      <mesh position={[5.1, 0.75, 0.9]}><boxGeometry args={[2.4, 1.5, 0.7]} /><meshStandardMaterial color="#53392e" /></mesh>
      <mesh position={[5.1, 1.4, 1.1]}><boxGeometry args={[0.9, 0.56, 0.05]} /><meshStandardMaterial color="#1b2e45" emissive="#2e7aff" emissiveIntensity={0.3} /></mesh>
      <mesh position={[6.1, 1.4, 1.1]}><boxGeometry args={[0.9, 0.56, 0.05]} /><meshStandardMaterial color="#1b2e45" emissive="#2e7aff" emissiveIntensity={0.3} /></mesh>
      <mesh position={[0.2, 1.3, -0.2]}><sphereGeometry args={[0.2]} /><meshStandardMaterial color="#ffcc8e" emissive="#ffb36f" emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 0.3, 10]}><boxGeometry args={[2.2, 0.6, 1]} /><meshStandardMaterial color="#0d2339" emissive="#0f2b58" /></mesh>
      <mesh position={[-1.5, 1.2, -5.82]}><planeGeometry args={[1.2, 1.8]} /><meshStandardMaterial color="#8a704e" /></mesh>
    </group>
  );
}
