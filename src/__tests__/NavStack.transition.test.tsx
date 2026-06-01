import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NavStack } from '../NavStack';
import { installRaf, uninstallRaf, flushRaf } from '../../tests/utils/raf';

beforeEach(() => {
  installRaf();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
  uninstallRaf();
});

type Item = { id: string };
const renderText = (item: Item) => (
  <div data-testid={'p-' + item.id}>p{item.id}</div>
);

function getParentStyle(testId: string) {
  return screen.getByTestId(testId).parentElement!.style;
}

describe('NavStack - push 动画时序', () => {
  it('双 rAF 后新页到达结束态，timer 后回稳态（无 transform）', () => {
    const a: Item = { id: 'a' };
    const b: Item = { id: 'b' };
    const { rerender } = render(<NavStack stack={[a]} render={renderText} />);

    // push b
    rerender(<NavStack stack={[a, b]} render={renderText} />);

    // 第一 rAF schedule 第二 rAF
    act(() => flushRaf());
    // 第二 rAF setTransitioning(true)
    act(() => flushRaf());

    // 过渡结束态：b 应可见（无 display:none）且 transform 为居中（PopOutStart）
    const bStyle = getParentStyle('p-b');
    expect(bStyle.display).not.toBe('none');

    // 推进 timer（transitionDuration 250 + 50 缓冲 = 300ms）
    act(() => vi.advanceTimersByTime(300));

    // 稳态：新栈顶 b 显示正常，无过渡 transform
    const bStyleFinal = getParentStyle('p-b');
    expect(bStyleFinal.transform).toBe('');
    expect(bStyleFinal.display).not.toBe('none');
  });

  it('动画未结束又变 stack：丢弃中间态，以新 stack 为基线', () => {
    const a: Item = { id: 'a' };
    const b: Item = { id: 'b' };
    const c: Item = { id: 'c' };
    const { rerender } = render(<NavStack stack={[a]} render={renderText} />);

    // push b
    rerender(<NavStack stack={[a, b]} render={renderText} />);
    act(() => {
      flushRaf();
      flushRaf();
    });

    // 动画未结束，再 push c
    rerender(<NavStack stack={[a, b, c]} render={renderText} />);
    act(() => {
      flushRaf();
      flushRaf();
      vi.advanceTimersByTime(300);
    });

    // 最终 c 是稳态栈顶，transform 为空
    const cStyle = getParentStyle('p-c');
    expect(cStyle.transform).toBe('');
  });
});
