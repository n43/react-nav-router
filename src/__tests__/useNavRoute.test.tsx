import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useNavRoute } from '../NavRouterContext';
import { NavRouter } from '../NavRouter';
import { createRouter } from '../router';

describe('useNavRoute', () => {
  it('NavRouter 外：默认值，navigateTo 为 no-op', () => {
    function Probe() {
      const { route, navigateTo } = useNavRoute();
      return (
        <div>
          <span data-testid="route">{String(route)}</span>
          <button data-testid="btn" onClick={() => navigateTo('/x')}>
            go
          </button>
        </div>
      );
    }
    render(<Probe />);
    expect(screen.getByTestId('route')).toHaveTextContent('null');
    expect(() => screen.getByTestId('btn').click()).not.toThrow();
  });

  it('NavRouter 内：返回当前 route 与可用 navigate', () => {
    const router = createRouter({ rootRoute: '/a' });
    const spy = vi.spyOn(router, 'navigateTo');

    function Probe() {
      const { route, navigateTo } = useNavRoute();
      return (
        <div>
          <span data-testid="r">{route?.path}</span>
          <button data-testid="btn" onClick={() => navigateTo('/b')}>
            go
          </button>
        </div>
      );
    }

    render(<NavRouter router={router} render={() => <Probe />} />);
    expect(screen.getByTestId('r')).toHaveTextContent('/a');

    act(() => {
      screen.getByTestId('btn').click();
    });
    expect(spy).toHaveBeenCalledWith('/b');
  });
});
