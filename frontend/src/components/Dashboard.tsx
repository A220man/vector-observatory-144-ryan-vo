import React, { useEffect, useState } from 'react';
import { TrendingUp, Activity, Database, Zap, Loader2, AlertCircle } from 'lucide-react';
import { api, type SessionStats } from '@/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changePositive?: boolean;
}

function StatCard({ title, value, icon, change, changePositive }: StatCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        <div style={styles.cardIcon}>{icon}</div>
      </div>
      <div style={styles.cardValue}>{value}</div>
      {change && (
        <div style={{ ...styles.cardChange, color: changePositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {change}
        </div>
      )}
    </div>
  );
}

function LoadingCard({ title }: { title: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        <Loader2 size={20} className="spin" />
      </div>
      <div style={styles.loadingValue}>—</div>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={styles.grid}>
        <LoadingCard title="Total Sessions" />
        <LoadingCard title="Total Requests" />
        <LoadingCard title="Tokens Saved" />
        <LoadingCard title="Compression Ratio" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <AlertCircle size={32} />
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const totalSessions = stats?.total_sessions || 0;
  const totalRequests = stats?.total_requests || 0;
  const tokensSaved = stats?.total_tokens_saved || 0;
  const avgRatio = stats?.average_compression_ratio || 1;
  const savingsPercent = ((1 - avgRatio) * 100).toFixed(1);

  return (
    <div>
      <div style={styles.grid}>
        <StatCard
          title="Total Sessions"
          value={totalSessions.toLocaleString()}
          icon={<Database size={28} />}
        />
        <StatCard
          title="Total Requests"
          value={totalRequests.toLocaleString()}
          icon={<Activity size={28} />}
        />
        <StatCard
          title="Tokens Saved"
          value={tokensSaved.toLocaleString()}
          icon={<TrendingUp size={28} />}
          change={`${savingsPercent}% reduction`}
          changePositive={true}
        />
        <StatCard
          title="Avg Compression"
          value={`${(avgRatio * 100).toFixed(1)}%`}
          icon={<Zap size={28} />}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>By Framework</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Framework</th>
                <th style={styles.alignRight}>Sessions</th>
                <th style={styles.alignRight}>Tokens Saved</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats?.by_framework || {}).map(([framework, data]) => (
                <tr key={framework}>
                  <td style={styles.frameworkCell}>
                    <span style={styles.frameworkBadge}>{framework}</span>
                  </td>
                  <td style={styles.alignRight}>{data.sessions}</td>
                  <td style={styles.alignRight}>{data.tokens_saved.toLocaleString()}</td>
                </tr>
              ))}
              {Object.keys(stats?.by_framework || {}).length === 0 && (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>No data yet. Start compressing to see analytics.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>By Session Type</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Session Type</th>
                <th style={styles.alignRight}>Sessions</th>
                <th style={styles.alignRight}>Tokens Saved</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats?.by_session_type || {}).map(([type, data]) => (
                <tr key={type}>
                  <td style={styles.frameworkCell}>
                    <span style={styles.frameworkBadge}>{type}</span>
                  </td>
                  <td style={styles.alignRight}>{data.sessions}</td>
                  <td style={styles.alignRight}>{data.tokens_saved.toLocaleString()}</td>
                </tr>
              ))}
              {Object.keys(stats?.by_session_type || {}).length === 0 && (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>No session type data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>By Compression Mode</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Mode</th>
                <th style={styles.alignRight}>Sessions</th>
                <th style={styles.alignRight}>Tokens Saved</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats?.by_mode || {}).map(([mode, data]) => (
                <tr key={mode}>
                  <td style={styles.frameworkCell}>
                    <span style={styles.frameworkBadge}>{mode}</span>
                  </td>
                  <td style={styles.alignRight}>{data.sessions}</td>
                  <td style={styles.alignRight}>{data.tokens_saved.toLocaleString()}</td>
                </tr>
              ))}
              {Object.keys(stats?.by_mode || {}).length === 0 && (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>No mode data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  card: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardIcon: {
    color: 'var(--color-primary)',
    opacity: 0.8,
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 1.2,
  },
  cardChange: {
    marginTop: '8px',
    fontSize: '12px',
    fontWeight: 500,
  },
  loadingValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
  },
  section: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '16px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  alignRight: {
    textAlign: 'right',
  },
  frameworkCell: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)',
  },
  frameworkBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
  },
  emptyCell: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    gap: '16px',
    color: 'var(--color-danger)',
    textAlign: 'center',
  },
  retryBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
  },
};