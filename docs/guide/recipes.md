# Recipes

## 自定义跳转策略

<ReactDemo src="advanced" />

```tsx
const router = createRouter({
  rootRoute: '/',
  history: 'hash',
  customNavigation(evt, stack, def) {
    if (evt.action === 'navigateTo') {
      // 同 path 不重复入栈
      if (stack.some((r) => r.path === evt.payload.path)) return stack;
    }
    return def(evt, stack);
  },
});
```

## 公共布局（renderCommon）

```tsx
<NavRouter
  router={router}
  render={(p) => <Page path={p} />}
  renderCommon={(children, path) => (
    <div className="shell">
      <header>当前：{path}</header>
      <main>{children}</main>
    </div>
  )}
/>
```

## 嵌套 NavStack

外层 `NavRouter` 接管浏览器 history（一个页面内只允许一个）。
内层用裸 `NavStack` 控制子页面栈，不传 `history` 配置。
