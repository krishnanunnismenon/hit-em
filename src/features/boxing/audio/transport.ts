/** Audio-clock scheduler: bounded lookahead, no burst of stale notes after a stalled tab. */
export class MusicClock {
  private next = -1;
  private index = 0;
  reset(now: number) {
    this.next = now + 0.03;
    this.index = 0;
  }
  plan(now: number, tempo: number) {
    if (this.next < now - 0.035) this.next = now + 0.03;
    const out: Array<{ at: number; step: number }> = [];
    const duration = 60 / tempo / 4;
    while (this.next < now + 0.13 && out.length < 3) {
      out.push({ at: this.next, step: this.index++ });
      this.next += duration;
    }
    return out;
  }
}
export class EventGate {
  private last = 0;
  accept(id: number) {
    if (id <= this.last) return false;
    this.last = id;
    return true;
  }
  reset() {
    this.last = 0;
  }
}
