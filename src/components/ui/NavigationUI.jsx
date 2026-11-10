import { useEffect, useState } from 'react';
import { useScene } from '../../context/SceneContext';
import '../../styles/NavigationUI.scss';
const ROOM_HINTS = { about: 'Scroll to fly through my story', gallery: 'Scroll to browse projects · Click a card to inspect', contact: 'Choose a contact method to get in touch' };
const NavigationUI = () => {
 const { currentRoom, isInRoom, requestExit, hasEntered } = useScene();
 const [isExiting, setIsExiting] = useState(false);
 const [isUIHidden, setIsUIHidden] = useState(false);
 const [roomHint, setRoomHint] = useState(null);
 useEffect(() => { const h = e => setIsUIHidden(e.detail); window.addEventListener('inspectChange', h); return () => window.removeEventListener('inspectChange', h); }, []);
 useEffect(() => {
  if (!isInRoom || !currentRoom) { setRoomHint(null); return; }
  const hint = ROOM_HINTS[currentRoom], key = `portfolio_room_hint_${currentRoom}`;
  try { if (!hint || localStorage.getItem(key)) return; localStorage.setItem(key, 'seen'); } catch { if (!hint) return; }
  setRoomHint(hint); const t = window.setTimeout(() => setRoomHint(null), 4200); return () => window.clearTimeout(t);
 }, [currentRoom, isInRoom]);
 useEffect(() => { if (!isInRoom) setIsExiting(false); }, [isInRoom]);
 return <div className="navigation-ui">
  {roomHint && <div className="room-hint" role="status"><span className="room-hint__indicator" aria-hidden="true" />{roomHint}</div>}
  {hasEntered && isInRoom && <button className={`nav-btn back-btn ${isExiting ? 'exiting' : ''} ${isUIHidden ? 'ui-hidden' : ''}`} onClick={() => { setIsExiting(true); requestExit(); }} aria-label="Back to corridor"><svg viewBox="0 0 24 24" className="icon-back"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>}
 </div>;
};
export default NavigationUI;
