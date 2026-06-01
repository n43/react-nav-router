import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { NavStack, NavStackProps } from './NavStack';
import { Route, Router } from './router';
import { NavRouteContext, NavRouteContextValue } from './NavRouterContext';

/**
 * Nav路由控制器组件
 * @public
 */
export interface NavRouterProps {
  /**
   * 路由控制器
   */
  router: Router;
  /**
   * 根据指定的路由路径渲染页面
   * @param path - 指定的路由路径
   * @returns 对应的页面组件
   */
  render: (path: string) => React.ReactNode;
  /**
   * 渲染公共布局容器，用于包裹路由视图
   *
   * 此函数允许在路由视图外层包裹自定义的公共布局（如页眉、侧边栏等），
   * 使得所有路由页面都能共享相同的外层结构。与 NavStack 的 renderCommon 不同，
   * 此函数还能访问当前路由的路径信息，可以根据路由动态调整布局。
   *
   * @param children - 路由视图容器（包含当前激活的页面视图）
   * @param path - 当前激活路由的路径；若路由栈为空则为 `undefined`
   * @returns 包含公共布局的完整组件
   *
   * @example
   * ```tsx
   * <NavRouter
   *   router={router}
   *   render={(path) => <PageComponent path={path} />}
   *   renderCommon={(children, path) => (
   *     <div className="layout">
   *       <Header currentPath={path} />
   *       <aside className="sidebar">
   *         <Navigation activeRoute={path} />
   *       </aside>
   *       <main className="content">
   *         {children}
   *       </main>
   *     </div>
   *   )}
   * />
   * ```
   */
  renderCommon?: (
    children: React.ReactElement,
    path?: string,
  ) => React.ReactElement;
}

/**
 * Nav 路由控制器组件
 *
 * 职责：
 *  1. 订阅 {@link Router} 的路由栈变化，驱动视图重渲染
 *  2. 把路由栈交给 {@link NavStack} 负责堆叠渲染与过渡动画
 *  3. 为每个路由视图注入 {@link NavRouteContext}，让页面组件可通过
 *     `useNavRoute()` 读取当前路由、调用 navigateTo / navigateBack
 *
 * 设计说明：
 *  - 使用 `useSyncExternalStore` 订阅 router：
 *    · 天然解决 React 18 并发模式下 useEffect 订阅时机晚于首次 render
 *      导致丢更新的问题
 *    · 订阅函数 `subscribe` 与 router 绑定，router 不变则订阅不会重挂
 *  - 订阅函数使用 `useCallback` 稳定引用，避免 StrictMode 等场景下
 *    subscribe 引用变化触发重复订阅
 *  - navigate 方法对外暴露的引用在同一个 router 实例上是稳定的，
 *    因此 Context value 的 navigate 部分用 `useMemo` 固化，
 *    降低 Context 消费者（AppAside 等）不必要的重渲染
 *
 * @public
 */
export const NavRouter = React.memo<NavRouterProps>((props) => {
  const { router, render, renderCommon } = props;

  // router 不变时订阅函数保持稳定引用，避免 useSyncExternalStore 重新订阅
  const subscribe = useCallback(
    (onStoreChange: () => void) => router.listen(onStoreChange),
    [router],
  );
  const getSnapshot = useCallback(() => router.getNavStack(), [router]);

  // 订阅路由栈：router.listen 接受无参 callback（与 RouterListener 签名一致）
  const stack = useSyncExternalStore(subscribe, getSnapshot);

  // navigate 方法在同一 router 上引用稳定，这里固化一次即可供多个 Provider 复用
  const navActions = useMemo(
    () => ({
      navigateTo: router.navigateTo,
      navigateBack: router.navigateBack,
    }),
    [router],
  );

  return useMemo(() => {
    const navStackProps: NavStackProps<Route> = {
      stack,
      render(route) {
        const value: NavRouteContextValue = {
          route,
          length: stack.length,
          ...navActions,
        };

        return (
          <NavRouteContext.Provider value={value}>
            {render(route.path)}
          </NavRouteContext.Provider>
        );
      },
    };

    if (renderCommon) {
      navStackProps.renderCommon = (children) => {
        // renderCommon 在路由栈"外壳"渲染，此时当前路由取自栈顶；
        // 栈为空属于边界场景（例如刚构造完且无 rootRoute），此时 route 为 null
        const top = stack.length > 0 ? stack[stack.length - 1] : null;

        const value: NavRouteContextValue = {
          route: top,
          length: stack.length,
          ...navActions,
        };

        return (
          <NavRouteContext.Provider value={value}>
            {renderCommon(children, top?.path)}
          </NavRouteContext.Provider>
        );
      };
    }

    return <NavStack {...navStackProps} />;
  }, [stack, navActions, render, renderCommon]);
});

NavRouter.displayName = 'NavRouter';

export default NavRouter;
