import React, { ReactNode } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Settings, BarChart2, FileText, HelpCircle } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/compression', label: 'Compression', icon: GitBranch },
  { path: '/sessions', label: 'Sessions', icon: BarChart2 },
  { path: '/policies', label: 'Policies', icon: Settings },
  { path: '/docs', label: 'Docs', icon: FileText },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🗿</span>
          <span style={styles.logoText}>Vector Observatory</span>
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive: active }) => ({
                  ...styles.navLink,
                  ...(active ? styles.navLinkActive : {}),
                })}
              >
                <Icon size={18} style={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div style={styles.footer}>
          <span style={styles.version}>v1.0.0</span>
          <a href="https://github.com/A220man/vector-observatory-144-ryan-vo" target="_blank" rel="noopener noreferrer" style={styles.githubLink}>
            <HelpCircle size={16} />
            GitHub
          </a>
        </div>
      </aside>
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>{getPageTitle(location.pathname)}</h1>
        </header>
        <div style={styles.content}>
          {children}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function getPageTitle(path: string): string {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/compression': 'Token Compression',
    '/sessions': 'Session Analytics',
    '/policies': 'Compression Policies',
    '/docs': 'Documentation',
  };
  for (const [key, value] of Object.entries(titles)) {
    if (path === key || (key !== '/' && path.startsWith(key))) {
      return value;
    }
  }
  return 'Vector Observatory';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--color-bg-secondary)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  logo: {
    padding: '20px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--color-border)',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  nav: {
    flex: 1,
    padding: '16px 8px',
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
    marginBottom: '4px',
  },
  navLinkActive: {
    backgroundColor: 'var(--color-bg-tertiary)',
    color: 'var(--color-primary)',
  },
  navIcon: {
    flexShrink: 0,
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  version: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  githubLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '24px 32px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  content: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
};