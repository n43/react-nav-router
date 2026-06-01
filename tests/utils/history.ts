/** 触发 popstate，模拟浏览器后退/前进 */
export function firePopState(state: unknown) {
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
}

/** 触发 hashchange，模拟用户手动改 hash */
export function fireHashChange(newHash: string) {
  const oldURL = window.location.href;
  window.location.hash = newHash;
  window.dispatchEvent(
    new HashChangeEvent('hashchange', {
      oldURL,
      newURL: window.location.href,
    }),
  );
}

/** 复位 history 与 location.hash 到初始状态，供 afterEach 调用 */
export function resetHistory() {
  window.history.replaceState(null, '', '/');
}
