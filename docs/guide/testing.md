# Testing

## 在用户项目中 mock NavRouter

```tsx
import { NavRouteContext } from 'react-nav-router';

render(
  <NavRouteContext.Provider
    value={{
      route: { path: '/test', params: {} },
      length: 1,
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
    }}
  >
    <YourPage />
  </NavRouteContext.Provider>,
);
```

## 过渡动画

`NavStack` 的过渡用 `requestAnimationFrame` 双帧 + `setTimeout`，
在 jsdom 中需要手动 flush。
本仓库 `tests/utils/raf.ts` 提供参考实现。

## 生命周期演示

<ReactDemo src="lifecycle" />
