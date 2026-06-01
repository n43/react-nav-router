import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../router';

describe('createRouter - 基础', () => {
  it('无 rootRoute：初始栈为空', () => {
    const r = createRouter();
    expect(r.getNavStack()).toEqual([]);
  });

  it('rootRoute 初始化：字符串形式', () => {
    const r = createRouter({ rootRoute: '/home' });
    expect(r.getNavStack()).toHaveLength(1);
    expect(r.getNavStack()[0].path).toBe('/home');
  });

  it('rootRoute 初始化：对象形式', () => {
    const r = createRouter({ rootRoute: { path: '/x', params: { a: '1' } } });
    expect(r.getNavStack()[0].params).toEqual({ a: '1' });
  });
});

describe('createRouter - navigateTo / navigateBack', () => {
  it('navigateTo 默认追加栈顶', () => {
    const r = createRouter({ rootRoute: '/' });
    r.navigateTo('/a');
    r.navigateTo('/b');
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/', '/a', '/b']);
  });

  it('navigateBack 默认回退一层（-1）', () => {
    const r = createRouter({ rootRoute: '/' });
    r.navigateTo('/a');
    r.navigateTo('/b');
    r.navigateBack();
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/', '/a']);
  });

  it('navigateBack(正整数 N) 保留前 N 个', () => {
    const r = createRouter({ rootRoute: '/' });
    r.navigateTo('/a');
    r.navigateTo('/b');
    r.navigateTo('/c');
    r.navigateBack(1);
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/']);
  });

  it('navigateBack(-N) 回退 N 层', () => {
    const r = createRouter({ rootRoute: '/' });
    r.navigateTo('/a');
    r.navigateTo('/b');
    r.navigateBack(-2);
    expect(r.getNavStack().map((x) => x.path)).toEqual(['/']);
  });
});

describe('createRouter - listen', () => {
  it('navigateTo 触发 listener，payload 是目标 route', () => {
    const r = createRouter();
    const spy = vi.fn();
    r.listen(spy);
    r.navigateTo('/a');
    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.action).toBe('navigateTo');
    expect(evt.payload.path).toBe('/a');
  });

  it('navigateBack 触发 listener，payload 是 lastIndex', () => {
    const r = createRouter({ rootRoute: '/' });
    const spy = vi.fn();
    r.listen(spy);
    r.navigateBack(-1);
    expect(spy.mock.calls[0][0]).toEqual({
      action: 'navigateBack',
      payload: -1,
    });
  });

  it('返回的 unsubscribe 取消监听', () => {
    const r = createRouter();
    const spy = vi.fn();
    const off = r.listen(spy);
    off();
    r.navigateTo('/a');
    expect(spy).not.toHaveBeenCalled();
  });

  it('unsubscribe 幂等：多次调用不抛错', () => {
    const r = createRouter();
    const off = r.listen(() => {});
    off();
    expect(() => off()).not.toThrow();
  });

  it('fire 期间 listener 取消自己不影响本轮其他 listener', () => {
    const r = createRouter();
    const order: string[] = [];
    const off1 = r.listen(() => {
      order.push('a');
      off1();
    });
    r.listen(() => order.push('b'));
    r.navigateTo('/x');
    expect(order).toEqual(['a', 'b']);
  });
});

describe('createRouter - customNavigation', () => {
  it('customNavigation 决定最终栈', () => {
    const r = createRouter({
      customNavigation(evt, stack, def) {
        if (evt.action === 'navigateTo') {
          // 同 path 去重
          if (stack.some((x) => x.path === evt.payload.path)) return stack;
        }
        return def(evt, stack);
      },
    });
    r.navigateTo('/a');
    r.navigateTo('/a');
    expect(r.getNavStack()).toHaveLength(1);
  });

  it('customNavigation 接收 defaultNavigation 引用', () => {
    const defSeen = vi.fn();
    const r = createRouter({
      customNavigation(evt, stack, def) {
        defSeen(typeof def);
        return def(evt, stack);
      },
    });
    r.navigateTo('/a');
    expect(defSeen).toHaveBeenCalledWith('function');
  });
});
