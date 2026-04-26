import { useEffect } from 'react';
import { useGameStore } from './store';

export function MissionLogic() {
  const step = useGameStore((s) => s.missionStep);
  const nextStep = useGameStore((s) => s.nextStep);
  const done = useGameStore((s) => s.childSecured && s.laptopScanned && s.laptopCollected && s.cashScanned && s.cashCollected && s.suspectArrested);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const { doInteract, doScan } = useGameStore.getState();
      if (e.key.toLowerCase() === 'e') doInteract();
      if (e.key.toLowerCase() === 'f') doScan();
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, []);

  useEffect(() => {
    if (step === 'raid' && done) {
      const timer = setTimeout(() => nextStep(), 600);
      return () => clearTimeout(timer);
    }
  }, [done, nextStep, step]);

  return null;
}
