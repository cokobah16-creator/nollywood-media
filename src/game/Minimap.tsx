import { useGameStore } from './store';

export function Minimap() {
  const player = useGameStore((s) => s.playerPosition);
  return (
    <div className="minimap">
      <div className="mini-dot player" style={{ left: `${50 + player[0] * 3}%`, top: `${50 + player[2] * 3}%` }} />
      <div className="mini-dot suspect" style={{ left: '76%', top: '52%' }} />
      <div className="mini-dot civil" style={{ left: '62%', top: '58%' }} />
      <div className="mini-dot evidence" style={{ left: '56%', top: '54%' }} />
    </div>
  );
}
