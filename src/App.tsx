import { Canvas } from '@react-three/fiber';
import { Scene } from './game/Scene';
import { HUD } from './game/HUD';
import { MissionLogic } from './game/MissionLogic';
import { useGameStore } from './game/store';

export default function App() {
  const started = useGameStore((s) => s.started);
  const start = useGameStore((s) => s.startMission);
  const missionStep = useGameStore((s) => s.missionStep);

  return (
    <div className="app-root">
      <Canvas shadows camera={{ position: [0, 2.6, 8], fov: 52 }}>
        <Scene />
      </Canvas>
      <HUD />
      <MissionLogic />

      {!started && (
        <div className="overlay start-overlay">
          <h1>NACECA: Operation Serpent&apos;s Route</h1>
          <h2>Vertical Slice: HQ Briefing → Market Patrol → Night Raid</h2>
          <button onClick={start}>Start Mission</button>
        </div>
      )}

      {started && missionStep !== 'raid' && (
        <div className="overlay mission-tip">
          <strong>Current:</strong> {missionStep === 'hq' ? 'Lagos HQ Briefing' : 'Lagos Market Patrol'}
          <p>Use WASD/Mouse to move and look. Interact with key markers (E/F).</p>
        </div>
      )}
    </div>
  );
}
