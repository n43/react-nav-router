# Getting Started

## 安装

```bash
pnpm add react-nav-router
# or
npm i react-nav-router
```

需要 `react@>=18` 与 `react-dom@>=18` 作为 peer dependency。

## 最小示例

```tsx
import { createRouter, NavRouter } from 'react-nav-router';

const router = createRouter({ rootRoute: '/', history: 'hash' });

function Page({ path }: { path: string }) {
  return <div>Now at {path}</div>;
}

export default function App() {
  return <NavRouter router={router} render={(p) => <Page path={p} />} />;
}
```

## 跳转与回退

```tsx
import { useNavRoute } from 'react-nav-router';

function Home() {
  const { navigateTo, navigateBack } = useNavRoute();
  return (
    <>
      <button onClick={() => navigateTo('/detail?id=1')}>Open detail</button>
      <button onClick={() => navigateBack()}>Back</button>
    </>
  );
}
```

## 在线演示

<ReactDemo src="basic" />
