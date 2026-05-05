'use client';

import * as React from 'react';
import type { Notification } from '@/lib/types';
import { AppShell } from '@/components/AppShell';
import { NotificationTable } from '@/components/NotificationTable';
import { loadViewedIds, saveViewedIds } from '@/lib/viewed';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch('/api/notifications', { cache: 'no-store' });
  if (!res.ok) {
    let details = '';
    try {
      const j = (await res.json()) as any;
      details = j?.error ? `: ${j.error}` : `: ${JSON.stringify(j)}`;
    } catch {
      try {
        details = `: ${await res.text()}`;
      } catch {
        details = '';
      }
    }
    throw new Error(`Failed to load notifications (HTTP ${res.status})${details}`);
  }
  const data = (await res.json()) as { notifications: Notification[] };
  return data.notifications || [];
}

export default function Page() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Notification[]>([]);
  const [viewedIds, setViewedIds] = React.useState<Set<string>>(() => loadViewedIds());

  React.useEffect(() => {
    let alive = true;
    fetchNotifications()
      .then((n) => {
        if (!alive) return;
        setRows(n);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const onToggleViewed = (id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveViewedIds(next);
      return next;
    });
  };

  return (
    <AppShell title="Notifications (All)">
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Tip: “Mark Viewed” to distinguish new vs seen. (Stored in your browser.)
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Loading…</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <NotificationTable rows={rows} viewedIds={viewedIds} onToggleViewed={onToggleViewed} />
      )}
    </AppShell>
  );
}
