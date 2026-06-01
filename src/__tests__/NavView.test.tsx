import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { NavView } from '../NavView';
import { AppearStatus, NavViewContext } from '../NavViewContext';

function setup(initialStatus: number) {
  const will = vi.fn();
  const did = vi.fn();
  const willD = vi.fn();
  const didD = vi.fn();

  const Wrapper = ({ status }: { status: number }) => (
    <NavViewContext.Provider value={{ appearStatus: status, path: null }}>
      <NavView
        willAppear={will}
        didAppear={did}
        willDisappear={willD}
        didDisappear={didD}
      >
        <div>content</div>
      </NavView>
    </NavViewContext.Provider>
  );

  const utils = render(<Wrapper status={initialStatus} />);
  return { ...utils, Wrapper, will, did, willD, didD };
}

describe('NavView 生命周期', () => {
  it('首帧直接 Normal：补发 willAppear + didAppear', () => {
    const { will, did } = setup(AppearStatus.Normal);
    expect(will).toHaveBeenCalledTimes(1);
    expect(did).toHaveBeenCalledTimes(1);
  });

  it('Hidden → PushInStart(entering) 触发 willAppear', () => {
    const { rerender, Wrapper, will } = setup(AppearStatus.Hidden);
    expect(will).not.toHaveBeenCalled();
    act(() => rerender(<Wrapper status={AppearStatus.PushInStart} />));
    expect(will).toHaveBeenCalledTimes(1);
  });

  it('entering → Normal 触发 didAppear（willAppear 不重复）', () => {
    const { rerender, Wrapper, will, did } = setup(AppearStatus.Hidden);
    act(() => rerender(<Wrapper status={AppearStatus.PushInStart} />));
    act(() => rerender(<Wrapper status={AppearStatus.Normal} />));
    expect(will).toHaveBeenCalledTimes(1);
    expect(did).toHaveBeenCalledTimes(1);
  });

  it('Normal → 动画值(leaving) 触发 willDisappear', () => {
    const { rerender, Wrapper, willD } = setup(AppearStatus.Normal);
    act(() => rerender(<Wrapper status={AppearStatus.PushOutEnd} />));
    expect(willD).toHaveBeenCalledTimes(1);
  });

  it('leaving → Hidden 触发 didDisappear', () => {
    const { rerender, Wrapper, didD } = setup(AppearStatus.Normal);
    act(() => rerender(<Wrapper status={AppearStatus.PushOutEnd} />));
    act(() => rerender(<Wrapper status={AppearStatus.Hidden} />));
    expect(didD).toHaveBeenCalledTimes(1);
  });

  it('卸载时若仍可见：补发 didDisappear', () => {
    const { unmount, didD } = setup(AppearStatus.Normal);
    unmount();
    expect(didD).toHaveBeenCalledTimes(1);
  });

  it('卸载时若已 hidden：不补发 didDisappear', () => {
    const { unmount, didD } = setup(AppearStatus.Hidden);
    unmount();
    expect(didD).not.toHaveBeenCalled();
  });

  it('回调用 ref 读最新值：换 prop 不重跑 effect', () => {
    const will1 = vi.fn();
    const will2 = vi.fn();

    const makeComp = (cb: () => void, status: number) => (
      <NavViewContext.Provider value={{ appearStatus: status, path: null }}>
        <NavView willAppear={cb}>
          <div />
        </NavView>
      </NavViewContext.Provider>
    );

    // 初始 Hidden，先换回调为 will2
    const { rerender } = render(makeComp(will1, AppearStatus.Hidden));
    rerender(makeComp(will2, AppearStatus.Hidden));

    // 触发 entering
    act(() => rerender(makeComp(will2, AppearStatus.PushInStart)));

    expect(will1).not.toHaveBeenCalled();
    expect(will2).toHaveBeenCalledTimes(1);
  });
});
