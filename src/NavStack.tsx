import React, { useEffect, useRef, useState } from 'react';
import { AppearStatus, NavViewContext } from './NavViewContext';

/** 过渡动画持续时间（毫秒），需与 CSS transitionDuration 一致 */
const transitionDuration = 250;

/** 外层容器样式：使用 flex + 负 margin 让所有视图重叠在同一位置，形成"页面栈" */
const wrapperStyle: React.CSSProperties = {
  overflow: 'hidden',
  display: 'flex',
  width: '100%',
  height: '100%',
};

/** 视图基础样式：每个页面占满容器，通过负 margin 实现重叠 */
const baseViewStyle: React.CSSProperties = {
  flex: '0 0 100%',
  width: '100%',
  height: '100%',
  overflow: 'auto',
  marginRight: '-100%', // 关键：使所有页面重叠在同一位置
  transitionProperty: 'opacity, transform',
  transitionDuration: `${transitionDuration}ms`,
  opacity: 1,
};

/**
 * 根据 appearStatus 返回对应的样式
 *
 * @see AppearStatus
 */
function getViewStyle(appearStatus: number): React.CSSProperties {
  const style: React.CSSProperties = { ...baseViewStyle };

  if (appearStatus === AppearStatus.Hidden) {
    // 完全隐藏，不参与布局
    style.display = 'none';
  } else if (appearStatus === AppearStatus.FadeInEnd) {
    style.opacity = 1;
  } else if (appearStatus === AppearStatus.FadeInStart) {
    style.opacity = 0;
  } else if (appearStatus === AppearStatus.PopInEnd) {
    // pop 新页结束态 / push 旧页开始态
    style.transform = 'translate3d(0, 0, 0)';
    style.opacity = 1;
  } else if (appearStatus === AppearStatus.PushOutEnd) {
    // push 旧页结束态（左移 50%） / pop 新页开始态（同上）
    style.transform = 'translate3d(-50%, 0, 0)';
    style.opacity = 0;
  } else if (appearStatus === AppearStatus.PopOutStart) {
    // pop 旧页开始态（在原位，准备右滑出） / push 新页结束态（同上）
    style.transform = 'translate3d(0, 0, 0)';
    style.opacity = 1;
  } else if (appearStatus === AppearStatus.PushInStart) {
    // push 新页开始态（右侧屏幕外） / pop 旧页结束态（同上）
    style.transform = 'translate3d(100%, 0, 0)';
    style.opacity = 0;
  }

  return style;
}

/** 推断出的过渡动作类型 */
type TransitionAction = 'push' | 'pop' | 'replace';

/**
 * Nav页面栈控制器组件 Props
 * @public
 */
export interface NavStackProps<T extends object = object> {
  /**
   * 页面标识栈；每个元素必须是**引用相等可比较**的对象
   * （同一页面在多次 render 间保持同一引用，才能被正确识别为"未变化"）
   */
  stack: T[];
  /**
   * 根据指定的页面标识渲染页面
   *
   * 注意：render 会在每次 NavStack 渲染时被重新调用，不会缓存返回值；
   * 组件实例通过 React key 保持稳定，不会因多次调用而被卸载重建。
   *
   * @param path - 指定的页面标识
   * @returns 对应的页面组件
   */
  render: (path: T) => React.ReactNode;
  /**
   * 渲染公共布局容器，用于包裹导航栈视图
   *
   * 此函数允许在导航栈外层包裹自定义的公共布局（如页眉、侧边栏等），
   * 使得所有页面都能共享相同的外层结构，而不需要在每个页面中重复定义
   *
   * @param children - 导航栈渲染的视图列表容器（包含所有页面视图）
   * @returns 包含公共布局的完整组件
   *
   * @example
   * ```tsx
   * <NavStack
   *   stack={navStack}
   *   render={(path) => <PageComponent path={path} />}
   *   renderCommon={(children) => (
   *     <div>
   *       <Header />
   *       {children}
   *       <Footer />
   *     </div>
   *   )}
   * />
   * ```
   */
  renderCommon?: (children: React.ReactElement) => React.ReactElement;
}

/**
 * Nav 页面栈控制器组件
 *
 * 维护一个「页面栈」，按栈顶渲染当前页面；在 stack 发生 push / pop / replace
 * 时同时渲染新旧两个页面，通过 CSS transition 实现 iOS 风格的过渡动画：
 *  - push：新页面从右滑入，旧页面左移 50% 淡出
 *  - pop： 旧页面向右滑出，新页面从左 50% 位置滑入
 *  - replace：新旧页面交叉淡入淡出
 *
 * 工作流程：
 *  1. stack 变化触发 effect，用**双 requestAnimationFrame** 保证浏览器
 *     先绘制一帧"开始态"，再切换到"结束态"——两帧间的样式差异是
 *     CSS transition 生效的必要条件（与 React 批处理无关；同步 DOM 写入
 *     会被合并为一次绘制，transition 不会触发）
 *  2. 动画跑满 transitionDuration 后把动画基线推进到新 stack，回到稳态
 *  3. 动画未结束前又发生 stack 变化：丢弃中间态，直接以当前 stack 作为
 *     新的动画基线（不累积动画队列，避免视觉错乱）
 *
 * @public
 */
export const NavStack = React.memo(function NavStack<T extends object>(
  props: NavStackProps<T>,
) {
  const { stack, render, renderCommon } = props;

  /** 是否处于过渡中（true = 正在播放动画的"结束态帧"） */
  const [transitioning, setTransitioning] = useState(false);

  /**
   * 动画基线栈：动画开始时的旧 stack，用于在渲染阶段与当前 stack 对比
   * 推断过渡动作（push / pop / replace）。动画结束后推进到最新 stack。
   */
  const animBaseStackRef = useRef(stack);

  /**
   * 视图 key 缓存：为同一 path 分配稳定的 React key，保证切回页面时
   * React 能复用组件实例（保留内部 state）。使用 WeakMap 让 path 对象
   * 被 GC 时 key 自动失效，避免泄漏。
   */
  const viewKeysRef = useRef(new WeakMap<object, number>());

  /** 本 NavStack 实例专属的 key 递增计数器，避免模块级全局共享 */
  const keyCounterRef = useRef(0);

  /**
   * 监听 stack 变化，调度过渡动画
   *
   * 双 rAF 的必要性：
   * - 首次 rAF 确保浏览器完成"开始态"这一帧的样式提交与绘制
   * - 二次 rAF 之后才切换到"结束态"，浏览器在两帧样式差异上触发 transition
   * 若只用单 rAF，某些浏览器会把两次样式写入合并，动画丢失。
   */
  useEffect(() => {
    // stack 未变（例如父组件重渲染但 stack 引用不变），不需要过渡
    if (animBaseStackRef.current === stack) {
      return;
    }

    let rafId1 = requestAnimationFrame(() => {
      const rafId2 = requestAnimationFrame(() => {
        rafId1 = 0;
        // 切换到结束态，触发 CSS transition
        setTransitioning(true);
      });
      rafId1 = rafId2;
    });

    // 动画结束后推进基线并退出过渡状态
    // 注意：timer 时长略大于 transitionDuration 以保证 CSS transition
    // 有充足时间完成（rAF 约 32ms 延迟 + transitionDuration）
    const timer = window.setTimeout(() => {
      animBaseStackRef.current = stack;
      setTransitioning(false);
    }, transitionDuration + 50);

    return () => {
      if (rafId1) {
        cancelAnimationFrame(rafId1);
      }
      window.clearTimeout(timer);
    };
  }, [stack]);

  // ==================== 渲染逻辑 ====================

  const animBaseStack = animBaseStackRef.current;
  const viewKeys = viewKeysRef.current;

  /**
   * 推断过渡动作
   *
   * - 栈顶相同：视为无变化，不做动画（对齐"同一页面重复设值"的优化）
   * - 栈变短且新栈顶等于旧栈对应位置元素：判定为 pop
   * - 栈变长且旧栈顶等于新栈对应位置元素：判定为 push
   * - 其他：replace（淡入淡出）
   *
   * 特殊情况：
   *  - 动画还未开始的第一帧（transitioning=false）：虽然 stack 已变化但还没触发 rAF，
   *    此时需要把新栈顶渲染为「开始态」，让后续 transition 有起点
   *  - stack 与 animBaseStack 引用相同：处于稳态，action=undefined
   */
  let action: TransitionAction | undefined;
  if (animBaseStack !== stack) {
    action = 'replace';

    if (animBaseStack.length > 0 && stack.length > 0) {
      const prevTop = animBaseStack[animBaseStack.length - 1];
      const curTop = stack[stack.length - 1];

      if (prevTop === curTop) {
        // 栈顶相同，忽略
        action = undefined;
      } else if (animBaseStack.length > stack.length) {
        // 栈变短 → 可能是 pop：新栈顶应该等于旧栈中同 index 的元素
        if (curTop === animBaseStack[stack.length - 1]) {
          action = 'pop';
        }
      } else if (animBaseStack.length < stack.length) {
        // 栈变长 → 可能是 push：旧栈顶应该等于新栈中同 index 的元素
        if (prevTop === stack[animBaseStack.length - 1]) {
          action = 'push';
        }
      }
    }
  }

  /** 为指定 path 分配/获取稳定的 React key */
  function getViewKey(path: T): number {
    let key = viewKeys.get(path);
    if (key === undefined) {
      key = ++keyCounterRef.current;
      viewKeys.set(path, key);
    }
    return key;
  }

  const list: React.ReactNode[] = [];

  // ==================== 渲染当前栈中的页面 ====================

  // animBaseTopIdx 标识旧栈顶在新栈中的预期位置，用于找到"被覆盖的旧栈顶"
  // 若新栈中存在同一引用的页面，走情况 1（做退出动画 / 保持在原位），
  // 否则在下面独立渲染（情况 4）做退出动画
  let animBaseTopIdx = animBaseStack.length - 1;

  for (let idx = 0; idx < stack.length; idx++) {
    const path = stack[idx];

    let appearStatus: number = AppearStatus.Hidden;

    if (
      action &&
      idx === animBaseTopIdx &&
      path === animBaseStack[animBaseTopIdx]
    ) {
      // 情况 1：当前页面是旧栈顶且仍存在于新栈中（push 场景的"被覆盖页"）
      if (action === 'push') {
        // push：旧栈顶向左滑出 50%
        appearStatus = transitioning
          ? AppearStatus.PushOutEnd
          : AppearStatus.PopInEnd;
      } else {
        // replace 场景下的旧栈顶（理论上不会走到这里，因为 replace 下
        // 栈顶必然不同；保留防御逻辑使用淡出）
        appearStatus = transitioning
          ? AppearStatus.FadeInStart
          : AppearStatus.FadeInEnd;
      }
      // 标记已处理，避免后面的"旧栈顶独立渲染"逻辑重复渲染
      animBaseTopIdx = -1;
    } else if (idx === stack.length - 1) {
      // 情况 2：当前页面是新栈顶（正在展示的页面）
      if (action === 'push') {
        // push：新页从右侧滑入
        appearStatus = transitioning
          ? AppearStatus.PopOutStart
          : AppearStatus.PushInStart;
      } else if (action === 'pop') {
        // pop：新页（被重新露出的旧页）从左侧 50% 滑入
        appearStatus = transitioning
          ? AppearStatus.PopInEnd
          : AppearStatus.PushOutEnd;
      } else if (action === 'replace') {
        // replace：淡入
        appearStatus = transitioning
          ? AppearStatus.FadeInEnd
          : AppearStatus.FadeInStart;
      } else {
        // 无动作，稳定显示
        appearStatus = AppearStatus.Normal;
      }
    }
    // 情况 3：非栈顶页面，保持 Hidden

    const key = getViewKey(path);
    list.push(
      <NavViewContext.Provider key={key} value={{ appearStatus, path }}>
        <div style={getViewStyle(appearStatus)}>{render(path)}</div>
      </NavViewContext.Provider>,
    );
  }

  // ==================== 渲染需要退出的旧栈顶页面 ====================
  // animBaseTopIdx >= 0 说明旧栈顶没在新栈中出现（pop / replace 场景），
  // 需要在新栈末尾额外渲染一份用于播放退出动画
  if (action && animBaseTopIdx >= 0) {
    const prevPath = animBaseStack[animBaseTopIdx];
    let appearStatus: number;

    if (action === 'pop') {
      // pop：旧栈顶向右滑出屏幕
      appearStatus = transitioning
        ? AppearStatus.PushInStart
        : AppearStatus.PopOutStart;
    } else {
      // replace：淡出
      appearStatus = transitioning
        ? AppearStatus.FadeInStart
        : AppearStatus.FadeInEnd;
    }

    const key = getViewKey(prevPath);
    list.push(
      <NavViewContext.Provider
        key={key}
        value={{ appearStatus, path: prevPath }}
      >
        <div style={getViewStyle(appearStatus)}>{render(prevPath)}</div>
      </NavViewContext.Provider>,
    );
  }

  // ==================== 包装并返回 ====================

  let ret: React.ReactElement = <div style={wrapperStyle}>{list}</div>;
  if (renderCommon) {
    ret = renderCommon(ret);
  }
  return ret;
}) as <T extends object = object>(
  props: NavStackProps<T>,
) => React.ReactElement;
// ↑ 此处的 as 断言是为了保留泛型参数 T。
// React.memo 的类型签名会吃掉泛型函数的类型参数，把 <T> 实例化为约束上界（object），
// 导致调用方（如 NavRouter 里 NavStackProps<Route>）因函数参数逆变规则
// （(path: object) => ... 不能赋给 (path: Route) => ...）而报错。
// 通过断言把 React.memo 的返回值重新声明为泛型函数签名，调用点可再次推断 T。

export default NavStack;
