import { createContext, useContext } from 'react';
import { Route, Router } from './router';

/**
 * Nav 路由上下文值
 *
 * 通过 {@link useNavRoute} 在路由视图组件中获取。
 *
 * @public
 */
export interface NavRouteContextValue {
  /**
   * 当前激活的路由
   *
   * 在 NavRouter 的 render 分支（具体页面渲染）中一定有值；
   * 在 renderCommon 分支（公共布局壳）中，若路由栈恰好为空则为 `null`。
   */
  route: Route | null;
  /**
   * 当前路由栈的长度
   *
   * 可用于判断"是否可以回退"：`length > 1` 表示栈中除当前页外还有上一层。
   */
  length: number;
  /**
   * 跳转到指定路由，等价于 {@link Router.navigateTo}
   */
  navigateTo: Router['navigateTo'];
  /**
   * 回退路由，等价于 {@link Router.navigateBack}
   */
  navigateBack: Router['navigateBack'];
}

/**
 * Nav 路由上下文
 *
 * 默认值表示"未被 NavRouter 包裹"的空壳状态：无路由、栈长度为 0、
 * navigate 方法为 no-op。实际使用中，值由 NavRouter 注入。
 *
 * @public
 */
export const NavRouteContext = createContext<NavRouteContextValue>({
  route: null,
  length: 0,
  navigateTo() {},
  navigateBack() {},
});

/**
 * 获取当前路由上下文
 *
 * 通常在受 NavRouter 控制的页面组件中使用，可读取当前 route、调用
 * navigateTo / navigateBack 进行跳转。
 *
 * @returns 路由上下文
 *
 * @public
 */
export function useNavRoute(): NavRouteContextValue {
  return useContext(NavRouteContext);
}
