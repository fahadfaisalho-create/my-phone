'use client';

type IconName = 'stores' | 'technicians' | 'orders' | 'invoices' | 'coupons' | 'ads' | 'support' | 'reports';

const ICONS: Record<IconName, JSX.Element> = {
  stores: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  ),
  technicians: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 8.5a3 3 0 1 1 3.5 3M21.5 20a5.5 5.5 0 0 0-4.5-5.4" />
    </svg>
  ),
  orders: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  ),
  invoices: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  coupons: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 21 11l-9.5 9.5a2 2 0 0 1-2.8 0L2 13.8V5a3 3 0 0 1 3-3Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
  ads: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5 1-.5-1.6-4.5H11l8 4V6l-8 4H6a2 2 0 0 0-2 2Z" />
      <path d="M19 9v6" />
    </svg>
  ),
  support: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v10H8l-4 4Z" />
    </svg>
  ),
  reports: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
};

const LogoutIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
  </svg>
);

export interface SidebarGroup {
  label: string;
  items: { key: string; icon: IconName; label: string; badge?: number }[];
}

export default function Sidebar({
  brandTitle,
  brandSubtitle,
  groups,
  activeKey,
  onSelect,
  userName,
  roleLabel,
  onExit,
}: {
  brandTitle: string;
  brandSubtitle: string;
  groups: SidebarGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
  userName: string;
  roleLabel: string;
  onExit: () => void;
}) {
  return (
    <div className="shell-sidebar">
      <div className="sidebar-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.svg" alt={brandTitle} className="mark" />
        <div>
          <div className="name">{brandTitle}</div>
          <div className="sub">{brandSubtitle}</div>
        </div>
      </div>

      <div className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-item ${activeKey === item.key ? 'on' : ''}`}
                onClick={() => onSelect(item.key)}
              >
                {ICONS[item.icon]}
                {item.label}
                {item.badge != null && item.badge > 0 && <span className="badge-count">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-profile">
        <div className="avatar">{userName.trim()[0] || 'م'}</div>
        <div className="info">
          <div className="n">{userName}</div>
          <div className="r">{roleLabel}</div>
        </div>
        <button type="button" onClick={onExit} aria-label="exit" title={roleLabel}>
          {LogoutIcon}
        </button>
      </div>
    </div>
  );
}
