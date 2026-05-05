import { NextResponse } from 'next/server';
import type { NotificationsResponse } from '@/lib/types';

const UPSTREAM_URL =
  process.env.NOTIFICATION_API_URL ||
  'http://20.207.122.201/evaluation-service/notifications';

export async function GET(request: Request) {
  const token = process.env.EVAL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing EVAL_ACCESS_TOKEN in server env (.env.local).' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get('limit');
  const page = url.searchParams.get('page');
  const notification_type = url.searchParams.get('notification_type');

  const upstream = new URL(UPSTREAM_URL);
  if (limit) upstream.searchParams.set('limit', limit);
  if (page) upstream.searchParams.set('page', page);
  if (notification_type) upstream.searchParams.set('notification_type', notification_type);

  const res = await fetch(upstream.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { error: 'Upstream error', status: res.status, body: text },
      { status: 502 }
    );
  }

  const data = JSON.parse(text) as NotificationsResponse;
  return NextResponse.json(data);
}

