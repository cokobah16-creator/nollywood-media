import { Color } from 'three';
import { OrbitControls, Stars } from '@react-three/drei';
import { useGameStore } from './store';
import { Player } from './Player';
import { CameraRig } from './CameraRig';
import { Environment } from './Environment';
import { Characters } from './Characters';
import { PropsSet } from './Props';
import { Interactables } from './Interactables';
import { Markers } from './Markers';
import { Effects } from './Effects';

export function Scene() {
  const missionStep = useGameStore((s) => s.missionStep);
  return (
    <>
      <color attach="background" args={[new Color(missionStep === 'raid' ? '#081120' : '#12161e')]} />
      <fog attach="fog" args={[missionStep === 'raid' ? '#081120' : '#141820', 16, 46]} />
      <ambientLight intensity={0.35} color={missionStep === 'raid' ? '#7c8baf' : '#8aa3c9'} />
      <directionalLight position={[7, 10, 2]} intensity={missionStep === 'raid' ? 0.4 : 0.6} color="#8bb8ff" castShadow />
      {missionStep === 'raid' && <pointLight position={[0.2, 2.3, 0]} intensity={2.5} color="#ffbf83" />}

      <Stars radius={90} depth={30} count={1500} factor={2} saturation={0} />
      <Environment />
      <PropsSet />
      <Characters />
      <Interactables />
      <Markers />
      <Effects />
      <Player />
      <CameraRig />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
    </>
  );
}
