import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter } from '../router';
import {
  firePopState,
  fireHashChange,
  resetHistory,
} from '../../tests/utils/history';

describe('createRouter - history hash', () => {
  beforeEach(() => {
    resetHistory();
  });

  it('rootRoute + history: 写入 history.state 与 hash', () => {
    const r = createRouter({ rootRoute: '/home', history: 'hash' });
    expect(window.location.hash).toBe('#/home');
    expect(window.history.state).toEqual({ navStack: ['/home'] });
    expect(r.getNavStack()[0].path).toBe('/home');
  });

  it('navigateTo 触发 pushState 写入新栈', () => {
    const r = createRouter({ rootRoute: '/', history: 'hash' });
    r.navigateTo('/a');
    expect(window.location.hash).toBe('#/a');
    expect(window.history.state).toEqual({ navStack: ['/', '/a'] });
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/', '/a']);
  });

  it('popstate：栈被替换为 state 中保存的栈，触发 historyPop', () => {
    const r = createRouter({ rootRoute: '/', history: 'hash' });
    const spy = vi.fn();
    r.listen(spy);
    firePopState({ navStack: ['/', '/x'] });
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/', '/x']);
    expect(spy).toHaveBeenCalledWith({
      action: 'historyPop',
      payload: undefined,
    });
  });

  it('popstate：state 无 navStack 时忽略', () => {
    const r = createRouter({ rootRoute: '/', history: 'hash' });
    const before = r.getNavStack();
    firePopState(null);
    expect(r.getNavStack()).toBe(before);
  });

  it('initFromHistory：构造时 url 已有 hash，恢复对应路由', () => {
    window.location.hash = '#/restored';
    const r = createRouter({ history: 'hash' });
    expect(r.getNavStack()[0].path).toBe('/restored');
  });

  it('initFromHistory：rootRoute 与 hash 相同时不重复 push', () => {
    window.location.hash = '#/home';
    const r = createRouter({ rootRoute: '/home', history: 'hash' });
    expect(r.getNavStack()).toHaveLength(1);
  });

  it('hashchange 手动改 hash：整栈替换为单路由 + historyPop', () => {
    const r = createRouter({ rootRoute: '/', history: 'hash' });
    const spy = vi.fn();
    r.listen(spy);
    fireHashChange('#/manual');
    expect(r.getNavStack()).toHaveLength(1);
    expect(r.getNavStack()[0].path).toBe('/manual');
    expect(spy).toHaveBeenCalledWith({
      action: 'historyPop',
      payload: undefined,
    });
  });

  it('hashchange 与栈顶相同的 hash：忽略，不 fire', () => {
    const r = createRouter({ rootRoute: '/', history: 'hash' });
    r.navigateTo('/a');
    const spy = vi.fn();
    r.listen(spy);
    fireHashChange('#/a');
    expect(spy).not.toHaveBeenCalled();
  });

  it('hashchange 清空 hash：忽略', () => {
    const r = createRouter({ rootRoute: '/home', history: 'hash' });
    const before = r.getNavStack();
    fireHashChange('');
    expect(r.getNavStack()).toBe(before);
  });

  it('navigateBack 触发 pushState 并更新 hash 到新栈顶', () => {
    const r = createRouter({ rootRoute: '/', history: 'hash' });
    r.navigateTo('/a');
    r.navigateTo('/b');
    r.navigateBack();
    expect(window.location.hash).toBe('#/a');
    expect(window.history.state).toEqual({ navStack: ['/', '/a'] });
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/', '/a']);
  });
});
