import axios from 'axios';

type NotificationType = 'Placement' | 'Result' | 'Event';

type Notification = {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string; // e.g. "2026-04-22 17:51:30"
};

type ApiResponse = {
  notifications: Notification[];
};

type Ranked = {
  n: Notification;
  score: number;
  recencyScore: number;
  typeWeight: number;
  tsMs: number;
};

function parseTimestampMs(ts: string): number {
  // API uses "YYYY-MM-DD HH:mm:ss". Convert to ISO-ish for Date parsing.
  // Treat as local time; relative ordering is what we need for priority.
  const isoLike = ts.replace(' ', 'T');
  const ms = Date.parse(isoLike);
  if (Number.isNaN(ms)) {
    throw new Error(`Unparseable Timestamp: "${ts}"`);
  }
  return ms;
}

function typeWeight(t: NotificationType): number {
  // placement > result > event (as per prompt)
  switch (t) {
    case 'Placement':
      return 3;
    case 'Result':
      return 2;
    case 'Event':
      return 1;
  }
}

function recencyScore(nowMs: number, tsMs: number): number {
  // Exponential decay keeps recency bounded and comparable across types.
  // halfLifeHours controls how quickly old notifications lose importance.
  const halfLifeHours = 24;
  const ageHours = Math.max(0, (nowMs - tsMs) / (1000 * 60 * 60));
  return Math.pow(0.5, ageHours / halfLifeHours); // (0, 1]
}

function priorityScore(tWeight: number, rScore: number): number {
  // Weight dominates (per prompt), recency breaks ties.
  // Max score ~ 3 + 1 = 4, min ~ 1 + ~0.
  return tWeight + rScore;
}

class MinHeap<T> {
  private a: T[] = [];
  private less: (x: T, y: T) => boolean;
  constructor(less: (x: T, y: T) => boolean) {
    this.less = less;
  }
  size() {
    return this.a.length;
  }
  peek(): T | undefined {
    return this.a[0];
  }
  push(x: T) {
    this.a.push(x);
    this.bubbleUp(this.a.length - 1);
  }
  pop(): T | undefined {
    if (this.a.length === 0) return undefined;
    const top = this.a[0];
    const last = this.a.pop()!;
    if (this.a.length > 0) {
      this.a[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  toArray(): T[] {
    return [...this.a];
  }
  private bubbleUp(i: number) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!this.less(this.a[i], this.a[p])) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }
  private bubbleDown(i: number) {
    const n = this.a.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.less(this.a[l], this.a[m])) m = l;
      if (r < n && this.less(this.a[r], this.a[m])) m = r;
      if (m === i) break;
      [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
      i = m;
    }
  }
}

function topNByStreamingHeap(items: Ranked[], n: number): Ranked[] {
  const heap = new MinHeap<Ranked>((x, y) => x.score < y.score);
  for (const it of items) {
    if (heap.size() < n) {
      heap.push(it);
      continue;
    }
    const min = heap.peek()!;
    if (it.score > min.score) {
      heap.pop();
      heap.push(it);
    }
  }
  return heap
    .toArray()
    .sort((a, b) => b.score - a.score || b.tsMs - a.tsMs);
}

function formatRow(r: Ranked, idx: number): string {
  const { n, score, recencyScore: rScore, typeWeight: w } = r;
  const s = score.toFixed(6);
  const rs = rScore.toFixed(6);
  return `${String(idx + 1).padStart(2, '0')}. [${n.Type.padEnd(9)}] score=${s} (w=${w}, r=${rs})  ${n.Timestamp}  ${n.Message}  id=${n.ID}`;
}

async function main() {
  const baseUrl =
    process.env.NOTIFICATION_API_URL ||
    'http://20.207.122.201/evaluation-service/notifications';
  const token = process.env.AUTH_TOKEN;
  const topN = Number(process.env.TOP_N || 10);

  if (!token) {
    throw new Error(
      'Missing AUTH_TOKEN. Set env var AUTH_TOKEN="Bearer <access_token>" or just "<access_token>".'
    );
  }

  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  const res = await axios.get<ApiResponse>(baseUrl, {
    headers: { Authorization: authHeader },
    timeout: 10_000,
  });

  const nowMs = Date.now();
  const ranked: Ranked[] = res.data.notifications.map((n) => {
    const tsMs = parseTimestampMs(n.Timestamp);
    const w = typeWeight(n.Type);
    const r = recencyScore(nowMs, tsMs);
    const score = priorityScore(w, r);
    return { n, score, recencyScore: r, typeWeight: w, tsMs };
  });

  const top = topNByStreamingHeap(ranked, topN);

  console.log(`Priority Inbox (top ${topN})`);
  console.log(`Fetched: ${ranked.length} notifications`);
  console.log('---');
  top.forEach((r, i) => console.log(formatRow(r, i)));
}

main().catch((e) => {
  console.error('[Stage1] Failed:', e?.message || e);
  process.exitCode = 1;
});

