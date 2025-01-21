export class IntervalManager {
  private intervals: Set<number> = new Set();

  /**
   * Sets an interval and tracks it for cleanup
   * @param callback Function to execute on interval
   * @param delay Time in milliseconds between executions
   * @returns Interval ID
   */
  public setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * Clears a specific interval
   * @param id Interval ID to clear
   */
  public clearInterval(id: number): void {
    if (this.intervals.has(id)) {
      window.clearInterval(id);
      this.intervals.delete(id);
    }
  }

  /**
   * Clears all tracked intervals
   */
  public clearAll(): void {
    this.intervals.forEach((id) => {
      window.clearInterval(id);
    });
    this.intervals.clear();
  }
}
