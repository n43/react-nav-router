# History Mode

目前支持 `history: 'hash'`，行为：

- **初始化**：若 url 已有 `#/path`，从 hash 恢复路由（与 `rootRoute` 重复时不重复 push）
- **navigateTo / navigateBack**：写入 `history.pushState`，state 中保存当前栈的序列化形式
- **浏览器后退**：`popstate` 触发，使用 state 中保存的栈反序列化恢复
- **用户手动改 hash**：`hashchange` 触发，**视为整页跳转**，路由栈替换为单路由

> ⚠️ 同一页面内只能有一个 `Router` 开启 `history`。
> 嵌套场景下，子 Router 不传 `history` 配置。
