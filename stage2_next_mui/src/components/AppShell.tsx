'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';

export function AppShell(props: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0b1020', color: 'white' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(10, 15, 30, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {props.title}
          </Typography>
          <Button component={Link} href="/" color="inherit">
            All
          </Button>
          <Button component={Link} href="/priority" color="inherit">
            Priority
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>{props.children}</Container>
    </Box>
  );
}

