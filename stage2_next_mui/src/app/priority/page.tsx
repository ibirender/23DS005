'use client';

import * as React from 'react';
import type { Notification, NotificationType } from '@/lib/types';
import { AppShell } from '@/components/AppShell';
import { NotificationTable } from '@/components/NotificationTable';
import { loadViewedIds, saveViewedIds } from '@/lib/viewed';
import { rankNotifications, topNByStreamingHeap } from '@/lib/priority';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

async function fetchNotifications(typeFilter: string): Promise<Notification[]> {
  const qs = new URLSearchParams();
  if (typeFilter && typeFilter !== 'All') qs.set('notification_type', typeFilter);
  const res = await fetch(`/api/notifications?${qs.toString()}`, { cache: 'no-store' });
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

  const [topN, setTopN] = React.useState<number>(10);
  const [typeFilter, setTypeFilter] = React.useState<'All' | NotificationType>('All');

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchNotifications(typeFilter)
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
  }, [typeFilter]);

  const onToggleViewed = (id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveViewedIds(next);
      return next;
    });
  };

  const ranked = React.useMemo(() => rankNotifications(rows), [rows]);
  const rankedById = React.useMemo(() => new Map(ranked.map((r) => [r.n.ID, r])), [ranked]);
  const unreadRanked = React.useMemo(() => ranked.filter((r) => !viewedIds.has(r.n.ID)), [ranked, viewedIds]);
  const top = React.useMemo(() => topNByStreamingHeap(unreadRanked, Math.max(1, Math.min(50, topN))), [unreadRanked, topN]);
  const topRows = React.useMemo(() => top.map((r) => r.n), [top]);

  return (
    <AppShell title="Priority Inbox">
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="Top N"
          type="number"
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value || 10))}
          slotProps={{ input: { inputProps: { min: 1, max: 50 } } }}
          size="small"
          sx={{ minWidth: 120 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="type-filter">Notification type</InputLabel>
          <Select
            labelId="type-filter"
            label="Notification type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Showing unread only. Mark items viewed to remove them from Priority.
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Loading…</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <NotificationTable
          rows={topRows}
          viewedIds={viewedIds}
          onToggleViewed={onToggleViewed}
          showScore={(id) => {
            const r = rankedById.get(id);
            return r ? r.score.toFixed(6) : '—';
          }}
        />
      )}
    </AppShell>
  );
}

