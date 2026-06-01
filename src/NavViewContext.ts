import { createContext } from 'react';

/**
 * Nav 视图外观状态编码
 *
 * 由 NavStack 写入、NavView 消费。用于描述视图在过渡动画各阶段的样式/可见性状态。
 *
 * 取值约定：
 *  - 正数：动画「结束态」（transition 生效后的目标样式）
 *  - 负数：动画「开始态」（transition 生效前的初始样式）
 *  - 0 / 1：非动画稳态（分别对应 隐藏 / 显示）
 *
 * 方向语义需要结合"上一次 appearStatus"推断（从 0 出发 = 进入；从 1 出发 = 离开）。
 * 具体语义参见下表：
 *
 * | 值 | 含义                                                      |
 * |----|-----------------------------------------------------------|
 * |  0 | 完全隐藏（display: none），不参与布局                     |
 * |  1 | 正常显示（无 transform / opacity 修饰）                   |
 * |  2 | 淡入结束 / 淡出开始：opacity = 1                          |
 * | -2 | 淡入开始 / 淡出结束：opacity = 0                          |
 * |  3 | pop 新页结束 / push 旧页开始：居中、不透明                |
 * | -3 | pop 新页开始 / push 旧页结束：左移 50%、透明              |
 * |  4 | pop 旧页开始 / push 新页结束：居中、不透明                |
 * | -4 | pop 旧页结束 / push 新页开始：右移 100%（屏幕外）、透明   |
 *
 * @public
 */
export const AppearStatus = {
  Hidden: 0,
  Normal: 1,
  FadeInEnd: 2,
  FadeInStart: -2,
  PopInEnd: 3,
  PushOutEnd: -3,
  PopOutStart: 4,
  PushInStart: -4,
} as const;

/**
 * Nav 页面上下文值
 *
 * 由 NavStack 在每个页面视图外层注入，用于通知 NavView（或其它消费者）
 * 该视图当前所处的外观状态与对应的栈元素标识。
 *
 * @public
 */
export interface NavViewContextValue {
  /**
   * 视图当前的外观状态
   *
   * 取值见 {@link AppearStatus}；为了兼容未定义枚举的场景，类型保留为 `number`。
   */
  appearStatus: number;
  /**
   * 视图对应的栈元素标识（即 NavStack 中 stack 数组的对应元素）
   *
   * 默认上下文（无 NavStack 包裹时）为 null。
   */
  path: object | null;
}

/**
 * Nav 页面上下文
 *
 * 默认值表示"未被 NavStack 包裹"的空壳状态：视图隐藏、无栈元素。
 * 实际值由 NavStack 注入。
 *
 * @public
 */
export const NavViewContext = createContext<NavViewContextValue>({
  appearStatus: AppearStatus.Hidden,
  path: null,
});
