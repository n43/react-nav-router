import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NavRouter } from '../NavRouter';
import { createRouter } from '../router';
import { installRaf, uninstallRaf, flushRaf } from '../../tests/utils/raf';

beforeEach(() => installRaf());
afterEach(() => uninstallRaf());

describe('NavRouter', () => {
  it('订阅 router：navigateTo 后页面切换', () => {
    const router = createRouter({ rootRoute: '/a' });
    render(
      <NavRouter
        router={router}
        render={(path) => <div data-testid="page">{path}</div>}
      />,
    );
    expect(screen.getByTestId('page')).toHaveTextContent('/a');

    act(() => router.navigateTo('/b'));
    act(() => {
      flushRaf();
      flushRaf();
    });

    const pages = screen.getAllByTestId('page');
    expect(pages[pages.length - 1]).toHaveTextContent('/b');
  });

  it('renderCommon 拿到栈顶 path', () => {
    const router = createRouter({ rootRoute: '/x' });
    render(
      <NavRouter
        router={router}
        render={(p) => <div>{p}</div>}
        renderCommon={(children, path) => (
          <div>
            <div data-testid="top">{path ?? 'null'}</div>
            {children}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId('top')).toHaveTextContent('/x');
  });

  it('栈空时 renderCommon 收到 path=undefined（route=null）', () => {
    const router = createRouter();
    render(
      <NavRouter
        router={router}
        render={(p) => <div>{p}</div>}
        renderCommon={(children, path) => (
          <div>
            <div data-testid="top">{String(path)}</div>
            {children}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId('top')).toHaveTextContent('undefined');
  });
});
