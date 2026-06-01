# Concepts

库分三层：

- **数据层** `createRouter` — 维护路由栈、与浏览器历史联动
- **视图层** `NavStack` / `NavView` — 栈渲染与过渡动画、页面生命周期
- **集成层** `NavRouter` / `useNavRoute` — 把上面两层粘起来

## 路由栈语义

- `navigateTo(to)` — 默认把目标 route 入栈
- `navigateBack(lastIndex = -1)` — 按 `Array.slice(0, lastIndex)` 裁栈
  - 正整数 N：保留前 N 个
  - 负整数 -N：回退 N 层
- 自定义跳转策略通过 `customNavigation` 注入

## AppearStatus 状态机

`NavStack` 内部为每个视图打 `appearStatus`，由 `NavView` 翻译成
will/did Appear/Disappear 四钩子。

| 值  | 含义                                    |
| --- | --------------------------------------- |
| 0   | Hidden（display: none）                 |
| 1   | Normal（稳态可见）                      |
| 2   | 淡入结束 / 淡出开始：opacity = 1        |
| -2  | 淡入开始 / 淡出结束：opacity = 0        |
| 3   | pop 新页结束 / push 旧页开始：居中      |
| -3  | pop 新页开始 / push 旧页结束：左移 50%  |
| 4   | pop 旧页开始 / push 新页结束：居中      |
| -4  | pop 旧页结束 / push 新页开始：右移 100% |

## React key 复用

`NavStack` 用 `WeakMap<stackItem, number>` 为每个 stack item 分配稳定 key，
相同引用的页面回到栈中时组件实例复用，内部 state 不丢。

> 因此 `stack` 数组的元素必须保持引用稳定 ——
> `createRouter` 内部已按这种方式构造 route 对象。
