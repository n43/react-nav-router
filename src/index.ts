/**
 * 页面路由
 *
 * 本模块提供一套轻量级的 SPA 路由方案，分为三层：
 *
 *  1. **数据层** `router.ts`
 *     - {@link createRouter} 创建路由控制器，管理路由栈、浏览器历史联动
 *     - {@link Route}、{@link Router} 核心类型
 *
 *  2. **视图层** `NavStack.tsx` / `NavView.tsx`
 *     - {@link NavStack} 通用页面栈容器，负责 push/pop/replace 过渡动画
 *     - {@link NavView} 页面组件，提供 willAppear/didAppear 等生命周期钩子
 *
 *  3. **集成层** `NavRouter.tsx`
 *     - {@link NavRouter} 把 Router 与 NavStack 桥接起来
 *     - {@link useNavRoute} 在页面组件内获取当前路由、调用导航方法
 *
 * 典型使用（大多数场景只需核心 API）：
 * ```tsx
 * const router = createRouter({ rootRoute: '/', history: 'hash' });
 * <NavRouter
 *   router={router}
 *   render={(path) => <Page path={path} />}
 * />
 *
 * // 页面内：
 * const { route, navigateTo, navigateBack } = useNavRoute();
 * ```
 *
 * @packageDocumentation
 */

// ==========================================================================
// 核心 API —— 绝大多数调用方只需要这些
// ==========================================================================

export { createRouter } from './router';
export type { Route, Router, RouterOptions } from './router';

export { NavRouter } from './NavRouter';
export type { NavRouterProps } from './NavRouter';

export { useNavRoute, NavRouteContext } from './NavRouterContext';
export type { NavRouteContextValue } from './NavRouterContext';

// ==========================================================================
// 进阶 API —— 通常不需要，特殊场景下可用
// ==========================================================================

/** 路由工具函数：URL ↔ Route 对象互转，一般只在需要手工拼接 URL 时使用 */
export { createRoute, createLocation } from './router';

/** 路由事件类型，常用于 customNavigation 或自定义 listener */
export type { RouterAction, RouterEvent, RouterListener } from './router';

// ==========================================================================
// 底层 API —— 构建自定义栈式容器时使用，常规业务代码一般不会触达
// ==========================================================================

/** 通用页面栈容器（不绑定 Router，可承载任意 object[] 形态的栈） */
export { NavStack } from './NavStack';
export type { NavStackProps } from './NavStack';

/** 页面组件与其生命周期 */
export { NavView } from './NavView';
export type { NavViewProps } from './NavView';

/** 视图外观状态（由 NavStack 写入 NavViewContext） */
export { AppearStatus, NavViewContext } from './NavViewContext';
export type { NavViewContextValue } from './NavViewContext';
