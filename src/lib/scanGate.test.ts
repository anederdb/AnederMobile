import { createScanGate } from './scanGate';

describe('createScanGate', () => {
  it('lets only the first of several rapid scans through', () => {
    const gate = createScanGate();
    expect([gate.enter(), gate.enter(), gate.enter()]).toEqual([true, false, false]);
  });

  it('lets the next scan through after release', () => {
    const gate = createScanGate();
    gate.enter();
    gate.release();
    expect(gate.enter()).toBe(true);
  });
});
