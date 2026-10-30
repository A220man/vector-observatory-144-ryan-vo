import React, { useState } from 'react';
import { Loader2, Copy, Check, AlertCircle, Download, Zap } from 'lucide-react';
import { api, type CompressionRequest, type CompressionResponse } from '@/api';

const SAMPLE_TEXT = `/**
 * This function implements a complex algorithm for processing
 * large datasets with multiple configuration parameters.
 * It handles initialization, validation, transformation,
 * and aggregation of data streams.
 */
async function processDataset(config: Configuration): Promise<Result> {
  // Initialize the processing pipeline
  const pipeline = await initializePipeline(config);
  
  // Validate input parameters
  if (!validateConfig(config)) {
    throw new Error('Invalid configuration');
  }
  
  // Process each data stream
  const results = [];
  for (const stream of config.streams) {
    const transformed = await transformStream(stream, config.transformOptions);
    const aggregated = await aggregateData(transformed, config.aggregationRules);
    results.push(aggregated);
  }
  
  // Return final combined result
  return combineResults(results);
}`;

export function Compression() {
  const [inputText, setInputText] = useState(SAMPLE_TEXT);
  const [result, setResult] = useState<CompressionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'compress' | 'ultracave' | 'passthrough'>('compress');
  const [profile, setProfile] = useState<'full-safe' | 'balanced' | 'aggressive'>('full-safe');
  const [framework, setFramework] = useState<'claude-code' | 'opencode' | 'antigravity-cli' | 'other'>('claude-code');
  const [sessionType, setSessionType] = useState<'interactive' | 'print' | 'unknown'>('interactive');

  const handleCompress = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to compress');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CompressionRequest = {
        text: inputText,
        agent_framework: framework,
        session_type: sessionType,
        mode,
        profile,
      };
      const response = await api.compress(request);
      setResult(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Compression failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.compressed_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${result.request_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tokensBefore = result?.tokens_before || 0;
  const tokensAfter = result?.tokens_after || 0;
  const tokensSaved = result?.tokens_saved || 0;
  const ratio = result?.compression_ratio || 1;
  const savingsPercent = ((1 - ratio) * 100).toFixed(1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Token Compression Engine</h2>
        <p style={styles.subtitle}>
          Caveman-style vocabulary reduction for coding agents. Reduces tokens by ~65% deterministically.
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.inputPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Input</h3>
            <div style={styles.controls}>
              <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} style={styles.select}>
                <option value="compress">Compress</option>
                <option value="ultracave">Ultracave</option>
                <option value="passthrough">Passthrough</option>
              </select>
              <select value={profile} onChange={(e) => setProfile(e.target.value as typeof profile)} style={styles.select}>
                <option value="full-safe">Full Safe</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
              <select value={framework} onChange={(e) => setFramework(e.target.value as typeof framework)} style={styles.select}>
                <option value="claude-code">Claude Code</option>
                <option value="opencode">OpenCode</option>
                <option value="antigravity-cli">Antigravity CLI</option>
                <option value="other">Other</option>
              </select>
              <select value={sessionType} onChange={(e) => setSessionType(e.target.value as typeof sessionType)} style={styles.select}>
                <option value="interactive">Interactive</option>
                <option value="print">Print Mode</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={styles.textarea}
            placeholder="Enter code or text to compress..."
            rows={20}
            spellCheck={false}
          />
          <button
            onClick={handleCompress}
            disabled={loading || !inputText.trim()}
            style={{ ...styles.btnPrimary, ...(loading || !inputText.trim() ? styles.btnDisabled : {}) }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Compressing...
              </>
            ) : (
              <>
                <Zap size={16} />
                Compress
              </>
            )}
          </button>
        </div>

        <div style={styles.outputPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Compressed Output</h3>
            <div style={styles.outputActions}>
              {result && (
                <>
                  <button onClick={() => handleCopy(result.compressed_text)} style={styles.btnIcon} title="Copy to clipboard">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button onClick={handleDownload} style={styles.btnIcon} title="Download">
                    <Download size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {result ? (
            <pre style={styles.outputText}>{result.compressed_text}</pre>
          ) : (
            <pre style={{ ...styles.outputText, color: 'var(--color-text-muted)' }}>
              Compressed output will appear here...
            </pre>
          )}
        </div>
      </div>

      {result && (
        <div style={styles.metrics}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Tokens Before</span>
            <span style={styles.metricValue}>{tokensBefore.toLocaleString()}</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Tokens After</span>
            <span style={styles.metricValue}>{tokensAfter.toLocaleString()}</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Tokens Saved</span>
            <span style={{ ...styles.metricValue, color: 'var(--color-success)' }}>{tokensSaved.toLocaleString()}</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Compression Ratio</span>
            <span style={styles.metricValue}>{(ratio * 100).toFixed(1)}%</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Reduction</span>
            <span style={{ ...styles.metricValue, color: 'var(--color-success)' }}>{savingsPercent}%</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Recovery Ref</span>
            <span style={{ ...styles.metricValue, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{result.recovery_ref}</span>
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
    gap: '24px',
  },
  header: {},
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  inputPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  outputPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-tertiary)',
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  controls: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    padding: '6px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
  },
  textarea: {
    flex: 1,
    padding: '16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: 1.6,
    resize: 'vertical',
    minHeight: '300px',
    outline: 'none',
  },
  btnPrimary: {
    margin: '16px',
    padding: '12px 20px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color var(--transition-fast)',
  },
  btnDisabled: {
    backgroundColor: 'var(--color-text-muted)',
    cursor: 'not-allowed',
  },
  btnIcon: {
    padding: '8px',
    color: 'var(--color-text-secondary)',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast), background-color var(--transition-fast)',
  },
  outputText: {
    flex: 1,
    padding: '16px',
    margin: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'var(--color-text)',
    overflow: 'auto',
    minHeight: '300px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    margin: '16px',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-danger)',
    fontSize: '13px',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  metric: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
  },
  metricLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-sans)',
  },
};