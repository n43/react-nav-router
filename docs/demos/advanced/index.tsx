import React from 'react';
import { createRouter, NavRouter, useNavRoute } from 'react-nav-router';
import { Button } from '../_shared/Button';
import { Page } from '../_shared/Page';

// 同 path 去重的自定义策略
const router = createRouter({
  rootRoute: '/home',
  customNavigation(evt, stack, def) {
    if (evt.action === 'navigateTo') {
      if (stack.some((r) => r.path === evt.payload.path)) return stack;
    }
    return def(evt, stack);
  },
});

function PageView({ path }: { path: string }) {
  const { navigateTo, navigateBack, length } = useNavRoute();
  return (
    <Page title={path}>
      <p data-testid="depth">Stack depth: {length}</p>
      <Button onClick={() => navigateTo('/a')}>Push /a (dedup)</Button>
      <Button onClick={() => navigateTo('/b')}>Push /b</Button>
      <Button onClick={() => navigateBack()} disabled={length <= 1}>
        Back
      </Button>
    </Page>
  );
}

export default function AdvancedDemo() {
  return (
    <NavRouter
      router={router}
      render={(p) => <PageView path={p} />}
      renderCommon={(children, path) => (
        <div
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <header
            data-testid="header"
            style={{
              padding: '8px 16px',
              background: '#f0f0f0',
              borderBottom: '1px solid #ccc',
              flexShrink: 0,
            }}
          >
            Top bar — current: {path}
          </header>
          <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
        </div>
      )}
    />
  );
}
