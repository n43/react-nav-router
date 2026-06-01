import React from 'react';
import { createRouter, NavRouter, useNavRoute } from 'react-nav-router';
import { Button } from '../_shared/Button';
import { Page } from '../_shared/Page';

const router = createRouter({ rootRoute: '/home', history: 'hash' });

function PageView({ path }: { path: string }) {
  const { navigateTo, navigateBack, length } = useNavRoute();
  return (
    <Page title={path}>
      <p>Stack depth: {length}</p>
      <Button onClick={() => navigateTo('/detail?id=' + Date.now())}>
        Push detail
      </Button>
      <Button onClick={() => navigateTo('/profile')}>Push profile</Button>
      <Button onClick={() => navigateBack()} disabled={length <= 1}>
        Back
      </Button>
    </Page>
  );
}

export default function BasicDemo() {
  return <NavRouter router={router} render={(p) => <PageView path={p} />} />;
}
