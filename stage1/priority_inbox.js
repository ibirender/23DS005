const axios = require('axios');

/**
 * Notification schema (from API)
 * { ID, Type: "Placement"|"Result"|"Event", Message, Timestamp: "YYYY-MM-DD HH:mm:ss" }
 */

function parseTimestampMs(ts) {
  const isoLike = ts.replace(' ', 'T');
  const ms = Date.parse(isoLike);
  if (Number.isNaN(ms)) throw new Error(`Unparseable Timestamp: "${ts}"`);
  return ms;
}

function typeWeight(t) {
  switch (t) {
    case 'Placement':
      return 3;
    case 'Result':
      return 2;
    case 'Event':
      return 1;
    default:
      return 0;
  }
}

function recencyScore(nowMs, tsMs) {
  const halfLifeHours = 24;
  const ageHours = Math.max(0, (nowMs - tsMs) / (1000 * 60 * 60));
  return Math.pow(0.5, ageHours / halfLifeHours);
}

function priorityScore(w, r) {
  return w + r;
}

class MinHeap {
  constructor(less) {
    this.a = [];
    this.less = less;
  }
  size() {
    return this.a.length;
  }
  peek() {
    return this.a[0];
  }
  push(x) {
    this.a.push(x);
    this.bubbleUp(this.a.length - 1);
  }
  pop() {
    if (this.a.length === 0) return undefined;
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length > 0) {
      this.a[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  toArray() {
    return [...this.a];
  }
  bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!this.less(this.a[i], this.a[p])) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }
  bubbleDown(i) {
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

function topNStreaming(items, n) {
  const heap = new MinHeap((x, y) => x.score < y.score);
  for (const it of items) {
    if (heap.size() < n) {
      heap.push(it);
      continue;
    }
    const min = heap.peek();
    if (it.score > min.score) {
      heap.pop();
      heap.push(it);
    }
  }
  return heap
    .toArray()
    .sort((a, b) => b.score - a.score || b.tsMs - a.tsMs);
}

function formatRow(r, idx) {
  const n = r.n;
  const s = r.score.toFixed(6);
  const rs = r.recencyScore.toFixed(6);
  return `${String(idx + 1).padStart(2, '0')}. [${String(n.Type).padEnd(
    9
  )}] score=${s} (w=${r.typeWeight}, r=${rs})  ${n.Timestamp}  ${n.Message}  id=${n.ID}`;
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

  const res = await axios.get(baseUrl, {
    headers: { Authorization: authHeader },
    timeout: 10000,
  });

  const notifications = (res.data && res.data.notifications) || [];
  const nowMs = Date.now();

  const ranked = notifications.map((n) => {
    const tsMs = parseTimestampMs(n.Timestamp);
    const w = typeWeight(n.Type);
    const r = recencyScore(nowMs, tsMs);
    const score = priorityScore(w, r);
    return { n, score, recencyScore: r, typeWeight: w, tsMs };
  });

  const top = topNStreaming(ranked, topN);

  console.log(`Priority Inbox (top ${topN})`);
  console.log(`Fetched: ${ranked.length} notifications`);
  console.log('---');
  top.forEach((r, i) => console.log(formatRow(r, i)));
}

main().catch((e) => {
  const msg = e && e.response && e.response.data ? JSON.stringify(e.response.data) : e?.message || String(e);
  console.error('[Stage1] Failed:', msg);
  process.exitCode = 1;
});

