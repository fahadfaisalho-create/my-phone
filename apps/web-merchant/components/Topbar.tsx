import Logo from './Logo';

export default function Topbar({
  title,
  roleLabel,
  onExit,
}: {
  title: string;
  roleLabel: string;
  onExit: () => void;
}) {
  return (
    <div className="topbar">
      <div className="brandrow">
        <Logo />
        <h1>{title}</h1>
      </div>
      <div className="right">
        <span className="role">{roleLabel}</span>
        <button onClick={onExit}>خروج</button>
      </div>
    </div>
  );
}
