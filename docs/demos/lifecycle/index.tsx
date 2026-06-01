import React, { useState } from 'react';
import {
  createRouter,
  NavRouter,
  NavView,
  useNavRoute,
} from 'react-nav-router';
import { Button } from '../_shared/Button';
import { Page } from '../_shared/Page';

const router = createRouter({ rootRoute: '/home' });

type Counts = {
  willAppear: number;
  didAppear: number;
  willDisappear: number;
  didDisappear: number;
};

const counters: Record<string, Counts> = {};

function getOrInit(path: string): Counts {
  if (!counters[path]) {
    counters[path] = {
      willAppear: 0,
      didAppear: 0,
      willDisappear: 0,
      didDisappear: 0,
    };
  }
  return counters[path];
}

function PageView({ path }: { path: string }) {
  const { navigateTo, navigateBack, length } = useNavRoute();
  const [, force] = useState(0);
  const bump = (k: keyof Counts) => {
    getOrInit(path)[k]++;
    force((n) => n + 1);
  };

  return (
    <NavView
      willAppear={() => bump('willAppear')}
      didAppear={() => bump('didAppear')}
      willDisappear={() => bump('willDisappear')}
      didDisappear={() => bump('didDisappear')}
    >
      <Page title={path}>
        <pre
          data-testid={`counters-${path}`}
          style={{ fontSize: 13, lineHeight: 1.6 }}
        >
          {JSON.stringify(getOrInit(path), null, 2)}
        </pre>
        <Button onClick={() => navigateTo('/detail?id=' + Date.now())}>
          Push
        </Button>
        <Button onClick={() => navigateBack()} disabled={length <= 1}>
          Back
        </Button>
      </Page>
    </NavView>
  );
}

export default function LifecycleDemo() {
  return <NavRouter router={router} render={(p) => <PageView path={p} />} />;
}
