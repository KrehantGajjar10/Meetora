import { useEffect, useState } from 'react';
import { API_BASE_URL, getHealthStatus, type HealthResponse } from '@/lib/api';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to Meetora API');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '20px',
            }}
          >
            M
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Meetora
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Smart Event &amp; Workshop Management Platform
            </p>
          </div>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #dcdcfe',
            }}
          >
            Chapter 1: Project Foundation
          </span>
        </div>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Foundation setup completed. Frontend and backend structures are ready for parallel development.
        </p>
      </header>

      {/* Main Status Grid */}
      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {/* API Health Card */}
        <section
          style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Backend API Health Check
            </h2>
            <button
              onClick={fetchHealth}
              disabled={loading}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Pinging API...' : 'Ping API Again'}
            </button>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Testing endpoint: <code style={{ backgroundColor: 'var(--app-bg)', padding: '2px 6px', borderRadius: '4px' }}>{API_BASE_URL}/api/health</code>
          </p>

          {loading && (
            <div style={{ padding: '16px', backgroundColor: 'var(--app-bg)', borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Connecting to Meetora backend...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FFF0F0',
                border: '1px solid #FFD4D4',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                color: 'var(--status-danger)',
              }}
            >
              <strong>API Offline or Unreachable:</strong> {error}
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Start the backend in another terminal with: <code style={{ backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>cd backend; uv run uvicorn app.main:app --reload</code>
              </div>
            </div>
          )}

          {health && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#F0F9F5',
                border: '1px solid #D4EFE4',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-success)',
                  }}
                />
                <strong style={{ fontSize: '14px', color: 'var(--status-success)' }}>
                  Backend is Healthy &amp; Connected
                </strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>Service:</strong> {health.service}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>Version:</strong> {health.version}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>Environment:</strong> {health.environment}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>Status:</strong> {health.status}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Foundation Modules */}
        <section
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Frontend Foundation
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            React 19 + TypeScript + Vite. Configured with path aliases, centralized API client, and approved Meetora design tokens.
          </p>
        </section>

        <section
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Backend Foundation
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Python + FastAPI + Uvicorn + SQLAlchemy engine. Managed with uv package manager and Pydantic settings.
          </p>
        </section>

        <section
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Database &amp; Orchestration
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Docker Compose configuration ready for PostgreSQL 16 service with persistent volume and health checking.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
