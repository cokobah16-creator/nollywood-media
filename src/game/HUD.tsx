import { Shield, Hand, Users, LocateFixed } from 'lucide-react';
import { useGameStore } from './store';
import { Minimap } from './Minimap';

export function HUD() {
  const s = useGameStore();
  if (!s.started) return null;
  const objectives = [
    ['Secure civilians', s.childSecured],
    ['Prevent evidence wipe', s.laptopScanned],
    ['Scan and collect laptop', s.laptopScanned && s.laptopCollected],
    ['Scan and collect cash', s.cashScanned && s.cashCollected],
    ['Arrest suspect', s.suspectArrested]
  ];

  return (
    <>
      <div className="hud top-left">
        <h3>OPERATION NIGHT RAID</h3><small>LEKKI MANSION RAID</small>
        {objectives.map(([t, ok]) => <div key={t} className={ok ? 'ok' : ''}>{ok ? '✓' : '◇'} {t}</div>)}
      </div>
      <div className="hud top-center">W · NW · N · NE · E | Obj: 7m</div>
      <div className="hud top-right"><Minimap /><div>LAGOS CITY / LEKKI COMPOUND</div><b>ALERT: HIGH</b></div>
      <div className="hud bottom-left">Integrity {s.integrity} | Public Trust {s.publicTrust} | Agency Favour {s.agencyFavour}</div>
      <div className="hud bottom-center">{promptFor(s.currentInteractable, s)}</div>
      <div className="hud bottom-right"><Users size={14}/> Squad <Shield size={14}/>Order <LocateFixed size={14}/>Scan <Hand size={14}/>Cuff</div>
      <div className="reticle">+</div>

      {s.missionStep === 'aftermath' && (
        <div className="overlay complete">
          <h2>Mission Complete</h2>
          <p>Evidence Collected | Civilians Secured | Force Used: 0</p>
          <p>XP Earned: {s.xp} | Integrity +8 | Public Trust +8 | Agency Favour +5</p>
          <h4>Unlocked Next:</h4>
          <div className="cards">
            <button>Lagos HQ Briefing (Completed)</button><button>Lagos Market Patrol (Completed)</button><button>Operation Night Raid (Completed)</button>
            <button disabled>Kano Raid (Locked)</button><button disabled>Edo-Delta Evidence Trail (Locked)</button><button disabled>Final Standoff (Locked)</button>
          </div>
        </div>
      )}
    </>
  );
}

function promptFor(id: string | null, s: ReturnType<typeof useGameStore.getState>) {
  if (!id) return 'Move closer to objective marker';
  if (id === 'suspect' && !s.childSecured) return 'Secure civilian first';
  if (id === 'laptop' && !s.laptopScanned) return 'F Scan Evidence Laptop';
  if (id === 'laptop' && s.laptopScanned) return 'E Collect Evidence Laptop';
  if (id === 'cash' && !s.cashScanned) return 'F Scan Evidence Cash';
  if (id === 'cash' && s.cashScanned) return 'E Collect Evidence Cash';
  if (id === 'child') return 'E Secure Civilian';
  if (id === 'suspect') return 'E Arrest Suspect';
  if (id === 'monitors') return 'F Inspect Monitors';
  if (id === 'commander') return 'E Receive HQ Briefing';
  if (id === 'informant') return 'F Scan Clue / E Continue';
  return 'E Interact';
}
