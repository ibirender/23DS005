'use client';

import * as React from 'react';
import type { Notification } from '@/lib/types';
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function typeColor(t: Notification['Type']) {
  switch (t) {
    case 'Placement':
      return 'success';
    case 'Result':
      return 'info';
    case 'Event':
      return 'warning';
  }
}

export function NotificationTable(props: {
  rows: Notification[];
  viewedIds: Set<string>;
  onToggleViewed: (id: string) => void;
  showScore?: (id: string) => React.ReactNode;
}) {
  return (
    <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>Type</TableCell>
            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>Message</TableCell>
            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>Timestamp</TableCell>
            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>Status</TableCell>
            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>Action</TableCell>
            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }} align="right">
              Score
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.rows.map((n) => {
            const viewed = props.viewedIds.has(n.ID);
            return (
              <TableRow key={n.ID} hover sx={{ opacity: viewed ? 0.65 : 1 }}>
                <TableCell>
                  <Chip size="small" label={n.Type} color={typeColor(n.Type)} />
                </TableCell>
                <TableCell sx={{ color: 'white' }}>{n.Message}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>{n.Timestamp}</TableCell>
                <TableCell>
                  <Chip size="small" label={viewed ? 'Viewed' : 'New'} color={viewed ? 'default' : 'primary'} />
                </TableCell>
                <TableCell>
                  <Typography
                    component="button"
                    onClick={() => props.onToggleViewed(n.ID)}
                    sx={{
                      bgcolor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
                    }}
                  >
                    {viewed ? 'Mark New' : 'Mark Viewed'}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
                  {props.showScore ? props.showScore(n.ID) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

