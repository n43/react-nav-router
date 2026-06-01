import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NavStack } from '../NavStack';
import { installRaf, uninstallRaf, flushRaf } from '../../tests/utils/raf';

beforeEach(() => installRaf());
afterEach(() => uninstallRaf());

type Item = { id: string };

function renderText(item: Item) {
  return <div>page-{item.id}</div>;
}

describe('NavStack - 渲染基础', () => {
  it('单元素栈：渲染栈顶页面', () => {
    const stack: Item[] = [{ id: 'a' }];
    render(<NavStack stack={stack} render={renderText} />);
    expect(screen.getByText('page-a')).toBeInTheDocument();
  });

  it('多元素栈：非栈顶页面 display:none', () => {
    const stack: Item[] = [{ id: 'a' }, { id: 'b' }];
    render(<NavStack stack={stack} render={renderText} />);
    expect(screen.getByText('page-a').parentElement).toHaveStyle({
      display: 'none',
    });
    expect(screen.getByText('page-b').parentElement).not.toHaveStyle({
      display: 'none',
    });
  });

  it('renderCommon 包裹外层结构', () => {
    const stack: Item[] = [{ id: 'a' }];
    render(
      <NavStack
        stack={stack}
        render={renderText}
        renderCommon={(children) => <div data-testid="wrap">{children}</div>}
      />,
    );
    expect(screen.getByTestId('wrap')).toBeInTheDocument();
    expect(screen.getByTestId('wrap')).toContainElement(
      screen.getByText('page-a'),
    );
  });
});

describe('NavStack - 同 path 引用的 key 复用', () => {
  function Counter({ id }: { id: string }) {
    const [n, setN] = useState(0);
    return (
      <div>
        <span>
          {id}:{n}
        </span>
        <button
          onClick={() => setN((prev) => prev + 1)}
          data-testid={`btn-${id}`}
        >
          +
        </button>
      </div>
    );
  }

  it('相同对象引用再入栈：React key 稳定，组件 state 保留', () => {
    const a: Item = { id: 'a' };
    const b: Item = { id: 'b' };
    const { rerender } = render(
      <NavStack stack={[a]} render={({ id }) => <Counter id={id} />} />,
    );

    act(() => {
      screen.getByTestId('btn-a').click();
    });
    expect(screen.getByText('a:1')).toBeInTheDocument();

    // push b
    rerender(
      <NavStack stack={[a, b]} render={({ id }) => <Counter id={id} />} />,
    );
    act(() => {
      flushRaf();
      flushRaf();
    });

    // pop back to a
    rerender(<NavStack stack={[a]} render={({ id }) => <Counter id={id} />} />);
    act(() => {
      flushRaf();
      flushRaf();
    });

    expect(screen.getByText('a:1')).toBeInTheDocument();
  });
});
