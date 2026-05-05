import type { Notification, NotificationType } from './types';

export function parseTimestampMs(ts: string): number {
  const isoLike = ts.replace(' ', 'T');
  const ms = Date.parse(isoLike);
  if (Number.isNaN(ms)) throw new Error(`Unparseable Timestamp: "${ts}"`);
  return ms;
}

export function typeWeight(t: NotificationType): number {
  switch (t) {
    case 'Placement':
      return 3;
    case 'Result':
      return 2;
    case 'Event':
      return 1;
  }
}

export function recencyScore(nowMs: number, tsMs: number): number {
  const halfLifeHours = 24;
  const ageHours = Math.max(0, (nowMs - tsMs) / (1000 * 60 * 60));
  return Math.pow(0.5, ageHours / halfLifeHours);
}

export function priorityScore(tWeight: number, rScore: number): number {
  return tWeight + rScore;
}

export type RankedNotification = {
  n: Notification;
  score: number;
  recencyScore: number;
  typeWeight: number;
  tsMs: number;
};

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

export function rankNotifications(notifications: Notification[], nowMs = Date.now()): RankedNotification[] {
  return notifications.map((n) => {
    const tsMs = parseTimestampMs(n.Timestamp);
    const w = typeWeight(n.Type);
    const r = recencyScore(nowMs, tsMs);
    const score = priorityScore(w, r);
    return { n, score, recencyScore: r, typeWeight: w, tsMs };
  });
}

export function topNByStreamingHeap(ranked: RankedNotification[], n: number): RankedNotification[] {
  const heap = new MinHeap<RankedNotification>((x, y) => x.score < y.score);

  for (const it of ranked) {
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

