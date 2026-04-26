import { useGameStore } from './store';

function Person({ pos, color, scale = 1, armsUp = false }: { pos: [number, number, number]; color: string; scale?: number; armsUp?: boolean }) {
  return (
    <group position={pos} scale={scale}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.23]} />
        <meshStandardMaterial color="#4d2f1f" />
      </mesh>
      {armsUp && (
        <>
          <mesh position={[-0.34, 1.45, 0]} rotation-z={1.05}><capsuleGeometry args={[0.06, 0.5]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.34, 1.45, 0]} rotation-z={-1.05}><capsuleGeometry args={[0.06, 0.5]} /><meshStandardMaterial color={color} /></mesh>
        </>
      )}
    </group>
  );
}

export function Characters() {
  const step = useGameStore((s) => s.missionStep);
  const suspectArrested = useGameStore((s) => s.suspectArrested);
  if (step === 'hq') return <Person pos={[0, 0, 1]} color="#334f85" scale={1.05} />;
  if (step === 'market') return <Person pos={[2, 0, -1]} color="#8b5d2f" />;

  return (
    <>
      <Person pos={[4.2, 0, 1.4]} color={suspectArrested ? '#5a5a5a' : '#ca6529'} scale={1.2} armsUp={!suspectArrested} />
      <Person pos={[2.5, -0.4, 1.4]} color="#e7decf" scale={0.72} />
      <Person pos={[0, 0, 7.5]} color="#1f416f" scale={0.95} />
    </>
  );
}
