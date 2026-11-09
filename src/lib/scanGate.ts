/** Lets one scan through at a time. Synchronous, so it holds even when the camera reports a code several times before React re-renders. */
export function createScanGate() {
  let busy = false;
  return {
    enter(): boolean {
      if (busy) return false;
      busy = true;
      return true;
    },
    release(): void {
      busy = false;
    },
  };
}
