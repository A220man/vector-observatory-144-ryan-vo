import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Plus, Edit, Trash2, Save, X, Shield, Lock, FileText } from 'lucide-react';
import { api, type PolicyResponse, type PolicyCreate, type AgentFramework } from '@/api';

export function Policies() {
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyResponse | null>(null);
  const [formData, setFormData] = useState<PolicyCreate>({
    name: '',
    description: '',
    mode: 'compress',
    profile: 'full-safe',
    target_frameworks: [] as AgentFramework[],
    min_tokens_threshold: 0,
    max_output_tokens: 0,
    enabled: true,
    is_default: false,
  });

  const fetchPolicies = async () => {
    try {
      const data = await api.listPolicies();
      setPolicies(data);
    } catch (err) {
      setError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        // For now, just recreate - API doesn't have update endpoint
        await api.createPolicy(formData);
      } else {
        await api.createPolicy(formData);
      }
      setShowForm(false);
      setEditingPolicy(null);
      resetForm();
      fetchPolicies();
    } catch (err) {
      setError('Failed to save policy');
    }
  };

  const handleEdit = (policy: PolicyResponse) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      mode: policy.mode,
      profile: policy.profile,
      target_frameworks: policy.target_frameworks ? policy.target_frameworks.split(',').map(s => s.trim() as AgentFramework).filter(Boolean) : [] as AgentFramework[],
      min_tokens_threshold: policy.min_tokens_threshold,
      max_output_tokens: policy.max_output_tokens,
      enabled: policy.enabled,
      is_default: policy.is_default,
    });
    setShowForm(true);
  };

  const handleDelete = async (_policyId: number) => {
    if (!confirm('Delete this policy?')) return;
    try {
      // Note: API doesn't have delete endpoint yet
      setError('Delete not implemented yet');
    } catch (err) {
      setError('Failed to delete policy');
    }
  };

  const handleNew = () => {
    setEditingPolicy(null);
    resetForm();
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      mode: 'compress',
      profile: 'full-safe',
      target_frameworks: [],
      min_tokens_threshold: 0,
      max_output_tokens: 0,
      enabled: true,
      is_default: false,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPolicy(null);
    resetForm();
  };

  if (loading && policies.length === 0) {
    return (
      <div style={styles.loading}>
        <Loader2 className="spin" size={32} />
        <p>Loading policies...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Compression Policies</h1>
        <button style={styles.btnPrimary} onClick={handleNew}>
          <Plus size={18} />
          <span>New Policy</span>
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div style={styles.modalOverlay} onClick={handleCancel}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingPolicy ? 'Edit Policy' : 'Create Policy'}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Name *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={64}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: '80px' }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={256}
                />
              </div>
              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Mode</label>
                  <select
                    style={styles.select}
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                  >
                    <option value="compress">Compress</option>
                    <option value="ultracave">Ultra Cave</option>
                    <option value="passthrough">Passthrough</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Profile</label>
                  <select
                    style={styles.select}
                    value={formData.profile}
                    onChange={(e) => setFormData({ ...formData, profile: e.target.value as any })}
                  >
                    <option value="full-safe">Full Safe</option>
                    <option value="balanced">Balanced</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>
              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Min Tokens Threshold</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={formData.min_tokens_threshold}
                    onChange={(e) => setFormData({ ...formData, min_tokens_threshold: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Max Output Tokens</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={formData.max_output_tokens}
                    onChange={(e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Target Frameworks (comma-separated)</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={(formData.target_frameworks || []).join(', ')}
                    onChange={(e) => setFormData({ ...formData, target_frameworks: e.target.value.split(',').map(s => s.trim() as AgentFramework).filter(Boolean) as AgentFramework[] })}
                    placeholder="claude-code, opencode, cursor"
                  />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Enabled</label>
                <div style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <span>Policy is active</span>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Default Policy</label>
                <div style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                  <span>Set as default compression policy</span>
                </div>
              </div>
              <div style={styles.actions}>
                <button type="button" style={styles.btnSecondary} onClick={handleCancel}>
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  <Save size={16} />
                  <span>{editingPolicy ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Name</th>
              <th style={styles.headerCell}>Mode</th>
              <th style={styles.headerCell}>Profile</th>
              <th style={styles.headerCell}>Default</th>
              <th style={styles.headerCell}>Created</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.emptyCell}>
                  <FileText size={32} style={styles.emptyIcon} />
                  <p>No policies yet. Create your first compression policy.</p>
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.id} style={styles.row}>
                  <td style={styles.cell}>
                    <div style={styles.policyName}>
                      <Shield size={16} style={styles.icon} />
                      <span>{policy.name}</span>
                    </div>
                    {policy.description && <div style={styles.desc}>{policy.description}</div>}
                  </td>
                  <td style={styles.cell}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: policy.mode === 'compress' ? '#3b82f6' : policy.mode === 'ultracave' ? '#8b5cf6' : '#6b7280',
                    }}>
                      {policy.mode}
                    </span>
                  </td>
                  <td style={styles.cell}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: policy.profile === 'full-safe' ? '#22c55e' : policy.profile === 'balanced' ? '#f59e0b' : '#ef4444',
                    }}>
                      {policy.profile}
                    </span>
                  </td>
                  <td style={styles.cell}>
                    {policy.is_default && (
                      <span style={styles.defaultBadge}>
                        <Lock size={14} />
                        Default
                      </span>
                    )}
                  </td>
                  <td style={styles.cell}>{new Date(policy.created_at).toLocaleDateString()}</td>
                  <td style={styles.cell}>
                    <div style={styles.actions}>
                      <button style={styles.iconBtn} onClick={() => handleEdit(policy)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => handleDelete(policy.id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 600,
    color: '#111827',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    marginBottom: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalTitle: {
    margin: '0 0 24px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    backgroundColor: '#f9fafb',
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
  },
  row: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.1s',
  },
  cell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
  },
  policyName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 500,
  },
  icon: {
    color: '#6b7280',
  },
  desc: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
  },
  defaultBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#1d4ed8',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '48px 16px',
    color: '#6b7280',
  },
  emptyIcon: {
    margin: '0 auto 12px',
    opacity: 0.5,
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
    color: '#6b7280',
  },
};

export default Policies;
