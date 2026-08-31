'use client';

type IconName =
  | 'branches'
  | 'services'
  | 'products'
  | 'inventory'
  | 'technicians'
  | 'bookings'
  | 'orders'
  | 'taxInvoices'
  | 'coupons'
  | 'ads'
  | 'messages'
  | 'stats'
  | 'support'
  | 'settings';

const ICONS: Record<IconName, JSX.Element> = {
  branches: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  services: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-3 3-2-2Z" />
    </svg>
  ),
  products: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
  inventory: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <rect x="3" y="15" width="18" height="5" rx="1" />
      <path d="M7 9v6M17 9v6" />
    </svg>
  ),
  technicians: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 8.5a3 3 0 1 1 3.5 3M21.5 20a5.5 5.5 0 0 0-4.5-5.4" />
    </svg>
  ),
  bookings: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  orders: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  ),
  taxInvoices: (
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
  messages: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v10H8l-4 4Z" />
    </svg>
  ),
  stats: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
  support: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="m5.6 5.6 3 3M18.4 5.6l-3 3M5.6 18.4l3-3M18.4 18.4l-3-3" />
    </svg>
  ),
  settings: (
    <svg className="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
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
  items: { key: string; icon: IconName; label: string; locked?: boolean; lockTitle?: string }[];
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
        <div className="mark">M</div>
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
                className={`sidebar-item ${activeKey === item.key ? 'on' : ''} ${item.locked ? 'locked' : ''}`}
                onClick={() => onSelect(item.key)}
                title={item.lockTitle}
              >
                {ICONS[item.icon]}
                {item.label}
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
