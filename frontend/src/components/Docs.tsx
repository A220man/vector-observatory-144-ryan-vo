import React from 'react';
import { Github, ExternalLink, Code, Database, Zap, Shield, FileText, ArrowRight } from 'lucide-react';

export function Docs() {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: FileText,
      content: (
        <div>
          <p style={styles.paragraph}>
            Vector Observatory 144 is a token compression observatory for coding agents implementing
            caveman-style compression. It provides tools to compress, analyze, and manage token usage
            for AI coding agents like Claude Code, OpenCode, and others.
          </p>
          <p style={styles.paragraph}>
            The system uses a deterministic compression algorithm that replaces technical vocabulary
            with simplified "caveman" equivalents, achieving approximately 65% token reduction while
            maintaining code readability and recoverability.
          </p>
        </div>
      ),
    },
    {
      id: 'compression',
      title: 'Compression Engine',
      icon: Zap,
      content: (
        <div>
          <h3 style={styles.subHeading}>Caveman Vocabulary</h3>
          <p style={styles.paragraph}>
            The compression engine replaces common technical terms with simplified alternatives:
          </p>
          <ul style={styles.list}>
            <li><code>function</code> → <code>do</code></li>
            <li><code>async</code> → <code>wait</code></li>
            <li><code>await</code> → <code>wait</code></li>
            <li><code>return</code> → <code>give</code></li>
            <li><code>const</code> / <code>let</code> / <code>var</code> → <code>set</code></li>
            <li><code>if</code> / <code>else</code> → <code>when</code> / <code>not</code></li>
            <li><code>for</code> / <code>while</code> → <code>loop</code></li>
            <li><code>try</code> / <code>catch</code> → <code>try</code> / <code>oops</code></li>
            <li>And 200+ more mappings...</li>
          </ul>
          <h3 style={styles.subHeading}>Compression Profiles</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Profile</th>
                <th style={styles.th}>Reduction</th>
                <th style={styles.th}>Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}><strong>Full Safe</strong></td>
                <td style={styles.td}>~45%</td>
                <td style={styles.td}>Production code, maximum recoverability</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>Balanced</strong></td>
                <td style={styles.td}>~65%</td>
                <td style={styles.td}>General purpose, good balance</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>Aggressive</strong></td>
                <td style={styles.td}>~75%</td>
                <td style={styles.td}>Maximum compression, advisory recovery only</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: Code,
      content: (
        <div>
          <h3 style={styles.subHeading}>Base URL</h3>
          <code style={styles.codeBlock}>http://localhost:8000/api/v1</code>

          <h3 style={styles.subHeading}>Endpoints</h3>
          <div style={styles.endpointList}>
            <div style={styles.endpoint}>
              <span style={styles.methodPost}>POST</span>
              <code>/compress</code>
              <span>Compress text using caveman vocabulary</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodPost}>POST</span>
              <code>/sessions</code>
              <span>Create a new agent session</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodGet}>GET</span>
              <code>/sessions</code>
              <span>List all sessions with pagination</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodGet}>GET</span>
              <code>/sessions/&#123;id&#125;</code>
              <span>Get session details</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodGet}>GET</span>
              <code>/sessions/&#123;id&#125;/records</code>
              <span>Get compression records for a session</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodGet}>GET</span>
              <code>/stats</code>
              <span>Get aggregate statistics</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodPost}>POST</span>
              <code>/policies</code>
              <span>Create a compression policy</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodGet}>GET</span>
              <code>/policies</code>
              <span>List all policies</span>
            </div>
            <div style={styles.endpoint}>
              <span style={styles.methodGet}>GET</span>
              <code>/health</code>
              <span>Health check endpoint</span>
            </div>
          </div>

          <h3 style={styles.subHeading}>Request/Response Types</h3>
          <p style={styles.paragraph}>
            Full TypeScript definitions available in <code>frontend/src/types/api.ts</code>
          </p>
        </div>
      ),
    },
    {
      id: 'architecture',
      title: 'Architecture',
      icon: Database,
      content: (
        <div>
          <h3 style={styles.subHeading}>Backend (FastAPI)</h3>
          <ul style={styles.list}>
            <li><strong>app/main.py</strong> - FastAPI application entrypoint with lifespan</li>
            <li><strong>app/api/routes.py</strong> - REST API endpoints</li>
            <li><strong>app/services/compression.py</strong> - Caveman compression engine</li>
            <li><strong>app/models/</strong> - SQLAlchemy models (sessions, records, policies, audit)</li>
            <li><strong>app/core/</strong> - Configuration and database setup</li>
          </ul>

          <h3 style={styles.subHeading}>Frontend (React + TypeScript + Vite)</h3>
          <ul style={styles.list}>
            <li><strong>src/components/</strong> - Page components (Dashboard, Compression, Sessions, Policies, Docs)</li>
            <li><strong>src/api/</strong> - Axios client with interceptors</li>
            <li><strong>src/types/</strong> - TypeScript type definitions</li>
            <li><strong>src/main.tsx</strong> - Application entrypoint</li>
          </ul>

          <h3 style={styles.subHeading}>Database (SQLite)</h3>
          <ul style={styles.list}>
            <li><code>compression_records</code> - Individual compression operations</li>
            <li><code>session_records</code> - Agent session metadata</li>
            <li><code>compression_policies</code> - Named compression configurations</li>
            <li><code>audit_logs</code> - Security and operational audit trail</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'deployment',
      title: 'Deployment',
      icon: Shield,
      content: (
        <div>
          <h3 style={styles.subHeading}>Docker Compose</h3>
          <pre style={styles.codeBlock}>{`version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/vector.db
      - FRONTEND_URL=http://localhost:5173
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    ports:
      - "8080:8080"
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
    command: start-dev
`}</pre>

          <h3 style={styles.subHeading}>Environment Variables</h3>
          <p style={styles.paragraph}>Copy <code>.env.example</code> to <code>.env</code> and configure:</p>
          <ul style={styles.list}>
            <li><code>DATABASE_URL</code> - SQLite connection string</li>
            <li><code>FRONTEND_URL</code> - CORS origin for frontend</li>
            <li><code>VITE_API_URL</code> - Backend API base URL</li>
            <li><code>KEYCLOAK_*</code> - Keycloak configuration (future)</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'links',
      title: 'Links & Resources',
      icon: ExternalLink,
      content: (
        <div style={styles.linksGrid}>
          <a href="https://github.com/A220man/vector-observatory-144-ryan-vo" target="_blank" rel="noopener noreferrer" style={styles.linkCard}>
            <Github size={24} />
            <span>GitHub Repository</span>
            <ArrowRight size={18} />
          </a>
          <a href="https://fastapi.tiangolo.com" target="_blank" rel="noopener noreferrer" style={styles.linkCard}>
            <Code size={24} />
            <span>FastAPI Documentation</span>
            <ArrowRight size={18} />
          </a>
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer" style={styles.linkCard}>
            <Code size={24} />
            <span>React Documentation</span>
            <ArrowRight size={18} />
          </a>
          <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer" style={styles.linkCard}>
            <Zap size={24} />
            <span>Vite Documentation</span>
            <ArrowRight size={18} />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <ul style={styles.nav}>
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                style={styles.navLink}
              >
                <section.icon size={18} style={styles.navIcon} />
                <span>{section.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main style={styles.main}>
        {sections.map((section) => (
          <section key={section.id} id={section.id} style={styles.section}>
            <h1 style={styles.heading}>
              <section.icon size={28} style={styles.headingIcon} />
              {section.title}
            </h1>
            {section.content}
          </section>
        ))}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: 'calc(100vh - 80px)',
  },
  sidebar: {
    width: '240px',
    padding: '24px 16px',
    borderRight: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
    position: 'sticky',
    top: '80px',
    height: 'calc(100vh - 80px)',
    overflowY: 'auto',
  },
  nav: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s, color 0.2s',
  },
  navIcon: {
    flexShrink: 0,
    color: '#6b7280',
  },
  main: {
    flex: 1,
    padding: '32px 48px',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },
  section: {
    marginBottom: '48px',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb',
  },
  headingIcon: {
    color: '#3b82f6',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#374151',
    marginBottom: '16px',
  },
  subHeading: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    marginTop: '24px',
    marginBottom: '12px',
  },
  list: {
    paddingLeft: '20px',
    marginBottom: '16px',
  },
  codeBlock: {
    display: 'block',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.6',
    overflowX: 'auto',
    marginBottom: '16px',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f3f4f6',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
  },
  endpointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  endpoint: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px',
  },
  methodPost: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    width: '50px',
    textAlign: 'center',
  },
  methodGet: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    width: '50px',
    textAlign: 'center',
  },
  linksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#111827',
    transition: 'border-color 0.2s, background-color 0.2s, transform 0.2s',
  },
};

export default Docs;
