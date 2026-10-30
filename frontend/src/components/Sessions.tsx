import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Search, Filter, ChevronLeft, ChevronRight, Eye, Clock } from 'lucide-react';
import { api, type SessionResponse, type CompressionResponse } from '@/api';

export function Sessions() {
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    framework: '',
    sessionType: '',
    search: '',
  });
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [sessionRecords, setSessionRecords] = useState<CompressionResponse[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        agent_framework: filters.framework || undefined,
        session_type: filters.sessionType || undefined,
      };
      const data = await api.listSessions(params);
      setSessions(data);
      // Estimate total pages
      setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) + (data.length === pageSize ? 1 : 0)));
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, filters.framework, filters.sessionType]);

  const handleViewSession = async (session: SessionResponse) => {
    setSelectedSession(session);
    try {
      setRecordsLoading(true);
      const records = await api.getSessionRecords(session.session_id);
      setSessionRecords(records);
    } catch (err) {
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSession(null);
    setSessionRecords([]);
  };

  const frameworks = ['claude-code', 'opencode', 'antigravity-cli', 'cursor', 'windsurf', 'other'];
  const sessionTypes = ['interactive', 'print', 'unknown'];

  if (loading && sessions.length === 0) {
    return (
      <div style={styles.loading}>
        <Loader2 size={32} className="spin" />
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Session Analytics</h2>
        <p style={styles.subtitle}>Monitor agent compression sessions and token savings</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <Search size={16} style={styles.filterIcon} />
          <input
            type="text"
            placeholder="Search session ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={styles.filterInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <Filter size={16} style={styles.filterIcon} />
          <select
            value={filters.framework}
            onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Frameworks</option>
            {frameworks.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <select
            value={filters.sessionType}
            onChange={(e) => setFilters({ ...filters, sessionType: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Types</option>
            {sessionTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        {error && !loading && (
          <div style={styles.error}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchSessions} style={styles.retryBtn}>Retry</button>
          </div>
        )}
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Framework</th>
              <th>Type</th>
              <th>Mode</th>
              <th style={styles.alignRight}>Requests</th>
              <th style={styles.alignRight}>Eligible</th>
              <th style={styles.alignRight}>Tokens Saved</th>
              <th style={styles.alignRight}>Ratio</th>
              <th>Started</th>
              <th>Last Activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.filter(s => !filters.search || s.session_id.includes(filters.search)).map((session) => (
              <tr key={session.session_id} onClick={() => handleViewSession(session)} style={styles.row}>
                <td style={styles.sessionId}>
                  <code>{session.session_id}</code>
                </td>
                <td>
                  <span style={styles.badge}>{session.agent_framework}</span>
                </td>
                <td>
                  <span style={{ ...styles.badge, ...(session.session_type === 'print' && { backgroundColor: 'rgba(210, 153, 34, 0.2)', borderColor: 'var(--color-warning)' }) }}>
                    {session.session_type}
                  </span>
                </td>
                <td>
                  <span style={styles.badge}>{session.mode}</span>
                </td>
                <td style={styles.alignRight}>{session.total_requests}</td>
                <td style={styles.alignRight}>{session.eligible_requests}</td>
                <td style={styles.alignRight}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    {session.total_tokens_saved.toLocaleString()}
                  </span>
                </td>
                <td style={styles.alignRight}>
                  {session.total_tokens_before > 0
                    ? `${((session.total_tokens_after / session.total_tokens_before) * 100).toFixed(1)}%`
                    : '—'}
                </td>
                <td>
                  <Clock size={14} style={styles.icon} />
                  {new Date(session.started_at).toLocaleString()}
                </td>
                <td>
                  <Clock size={14} style={styles.icon} />
                  {session.last_activity_at ? new Date(session.last_activity_at).toLocaleString() : '—'}
                </td>
                <td>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewSession(session); }}
                    style={styles.viewBtn}
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={11} style={styles.emptyCell}>No sessions found. Create a session via the Compression page.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages}
          style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {selectedSession && (
        <div style={styles.modalOverlay} onClick={handleCloseDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Session Details: {selectedSession.session_id}</h3>
              <button onClick={handleCloseDetail} style={styles.closeBtn}><AlertCircle size={20} /></button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailGrid}>
                <div><strong>Framework:</strong> {selectedSession.agent_framework}</div>
                <div><strong>Type:</strong> {selectedSession.session_type}</div>
                <div><strong>Mode:</strong> {selectedSession.mode}</div>
                <div><strong>Profile:</strong> {selectedSession.profile}</div>
                <div><strong>Total Requests:</strong> {selectedSession.total_requests}</div>
                <div><strong>Eligible:</strong> {selectedSession.eligible_requests}</div>
                <div><strong>Tokens Before:</strong> {selectedSession.total_tokens_before.toLocaleString()}</div>
                <div><strong>Tokens After:</strong> {selectedSession.total_tokens_after.toLocaleString()}</div>
                <div><strong>Tokens Saved:</strong> {selectedSession.total_tokens_saved.toLocaleString()}</div>
                <div><strong>MCP Connected:</strong> {selectedSession.mcp_connected ? 'Yes' : 'No'}</div>
                <div><strong>Recovery via MCP:</strong> {selectedSession.recovery_via_mcp ? 'Yes' : 'No'}</div>
                <div><strong>Started:</strong> {new Date(selectedSession.started_at).toLocaleString()}</div>
                <div><strong>Ended:</strong> {selectedSession.ended_at ? new Date(selectedSession.ended_at).toLocaleString() : 'Active'}</div>
              </div>
              <div style={styles.recordsSection}>
                <h4>Compression Records</h4>
                {recordsLoading ? (
                  <div style={styles.loading}><Loader2 size={24} className="spin" /></div>
                ) : (
                  <table style={styles.recordsTable}>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Mode</th>
                        <th style={styles.alignRight}>Before</th>
                        <th style={styles.alignRight}>After</th>
                        <th style={styles.alignRight}>Saved</th>
                        <th style={styles.alignRight}>Ratio</th>
                        <th>Recovery Ref</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRecords.map((record) => (
                        <tr key={record.request_id}>
                          <td><code>{record.request_id}</code></td>
                          <td><span style={styles.badge}>{record.mode}</span></td>
                          <td style={styles.alignRight}>{record.tokens_before.toLocaleString()}</td>
                          <td style={styles.alignRight}>{record.tokens_after.toLocaleString()}</td>
                          <td style={styles.alignRight}><span style={{ color: 'var(--color-success)' }}>{record.tokens_saved.toLocaleString()}</span></td>
                          <td style={styles.alignRight}>{(record.compression_ratio * 100).toFixed(1)}%</td>
                          <td><code style={{ fontSize: '11px' }}>{record.recovery_ref}</code></td>
                          <td>{new Date().toLocaleString()}</td>
                        </tr>
                      ))}
                      {sessionRecords.length === 0 && (
                        <tr>
                          <td colSpan={8} style={styles.emptyCell}>No compression records for this session.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {},
  title: {
    fontSize: '24px',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    marginTop: '4px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterIcon: {
    color: 'var(--color-text-muted)',
  },
  filterInput: {
    padding: '8px 12px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    fontSize: '13px',
    width: '200px',
  },
  filterSelect: {
    padding: '8px 12px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    fontSize: '13px',
  },
  tableContainer: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  alignRight: {
    textAlign: 'right',
  },
  row: {
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  sessionId: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px',
    fontWeight: 500,
  },
  icon: {
    display: 'inline-block',
    marginRight: '4px',
    verticalAlign: 'middle',
  },
  viewBtn: {
    padding: '6px',
    color: 'var(--color-text-secondary)',
    borderRadius: 'var(--radius-sm)',
  },
  emptyCell: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    color: 'var(--color-danger)',
  },
  retryBtn: {
    marginLeft: 'auto',
    padding: '6px 12px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
  },
  pageBtn: {
    padding: '8px 12px',
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
  },
  closeBtn: {
    padding: '8px',
    color: 'var(--color-text-secondary)',
    borderRadius: 'var(--radius-sm)',
  },
  modalContent: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: '13px',
  },
  recordsSection: {
    borderTop: '1px solid var(--color-border)',
    paddingTop: '16px',
  },
  recordsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '32px',
    color: 'var(--color-text-muted)',
  },
};