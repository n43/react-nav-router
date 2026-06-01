import { vi } from 'vitest';

type RafCallback = (time: number) => void;

let queue: { id: number; cb: RafCallback }[] = [];
let nextId = 1;

/** 安装可控 rAF：所有 requestAnimationFrame 入队，调用 flushRaf 才执行 */
export function installRaf() {
  queue = [];
  nextId = 1;
  vi.stubGlobal('requestAnimationFrame', (cb: RafCallback) => {
    const id = nextId++;
    queue.push({ id, cb });
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue = queue.filter((item) => item.id !== id);
  });
}

/** 还原原生 rAF */
export function uninstallRaf() {
  vi.unstubAllGlobals();
  queue = [];
}

/** 执行队列里所有当前帧 callback（递归追加的将在下一次调用时执行） */
export function flushRaf() {
  const current = queue;
  queue = [];
  for (const { cb } of current) {
    cb(performance.now());
  }
}

/** 当前等待的 rAF 数 */
export function pendingRaf(): number {
  return queue.length;
}
