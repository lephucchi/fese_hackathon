'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/utils/constants/api';

interface HealthStatus {
  status: 'checking' | 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}

export function APIStatus() {
  const [health, setHealth] = useState<HealthStatus>({ status: 'checking', message: 'Checking...' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setHealth({
            status: data.status || 'healthy',
            message: `API ${data.version || '1.0.0'} - ${data.status || 'healthy'}`,
          });
        } else {
          setHealth({ status: 'degraded', message: 'API responding with errors' });
        }
      } catch (error) {
        setHealth({ status: 'unhealthy', message: 'Cannot connect to API' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    switch (health.status) {
      case 'checking':
        return <Loader2 size={14} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />;
      case 'healthy':
        return <CheckCircle size={14} style={{ color: '#10b981' }} />;
      case 'degraded':
        return <AlertCircle size={14} style={{ color: '#f59e0b' }} />;
      case 'unhealthy':
        return <AlertCircle size={14} style={{ color: '#ef4444' }} />;
      default:
        return <Activity size={14} style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const getColor = () => {
    switch (health.status) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'unhealthy':
        return '#ef4444';
      default:
        return 'var(--text-tertiary)';
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        background: 'var(--background)',
        border: '1px solid var(--border)',
        color: getColor(),
      }}
      title={health.message}
    >
      {getIcon()}
      <span style={{ fontWeight: 500 }}>Backend</span>
    </div>
  );
}
