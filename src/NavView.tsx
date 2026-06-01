import React, { useContext, useEffect, useRef } from 'react';
import { AppearStatus, NavViewContext } from './NavViewContext';

/**
 * Nav 页面生命周期回调
 *
 * 四个回调对应页面可见性的四个时机，与 iOS UIViewController 的
 * viewWillAppear / viewDidAppear / viewWillDisappear / viewDidDisappear 语义一致：
 *
 *   hidden ── willAppear ──► entering ── didAppear ──► visible
 *                                                       │
 *                                                  willDisappear
 *                                                       ▼
 *                                 hidden ◄── didDisappear ── leaving
 *
 * @public
 */
export interface NavViewProps {
  /**
   * 页面即将可见：从隐藏状态进入过渡动画的第一帧时触发一次
   */
  willAppear?: () => void;
  /**
   * 页面完全可见：过渡动画结束、进入稳态（AppearStatus.Normal）时触发一次
   */
  didAppear?: () => void;
  /**
   * 页面即将不可见：从稳态开始播放离开动画的第一帧时触发一次
   */
  willDisappear?: () => void;
  /**
   * 页面完全不可见：离开动画结束、回到隐藏态（AppearStatus.Hidden）时触发一次
   */
  didDisappear?: () => void;
  /**
   * 页面内容
   */
  children: React.ReactNode;
}

/**
 * 根据 appearStatus 推断视图所处的生命周期阶段
 *
 * 由于单一 appearStatus 无法区分"进入动画"和"离开动画"（都表现为非 0/1 的正负值），
 * 需要结合「上一次 appearStatus」来推断方向。
 *
 * 推断规则：
 *  - cur === Hidden(0)           → 'hidden'
 *  - cur === Normal(1)           → 'visible'
 *  - cur 为其他值（动画中）      → 根据 prev 决定方向：
 *      · prev 为 Hidden 或本身就是进入态的动画值（与当前同方向） → 'entering'
 *      · prev 为 Normal 或离开态的动画值                        → 'leaving'
 *      · 无法判断时保持前一次的方向
 */
type LifecyclePhase = 'hidden' | 'entering' | 'visible' | 'leaving';

function resolvePhase(
  current: number,
  prev: number,
  prevPhase: LifecyclePhase,
): LifecyclePhase {
  if (current === AppearStatus.Hidden) {
    return 'hidden';
  }
  if (current === AppearStatus.Normal) {
    return 'visible';
  }

  // current 处于动画中间态（±2 / ±3 / ±4），根据 prev 判断方向
  if (prev === AppearStatus.Hidden) {
    return 'entering';
  }
  if (prev === AppearStatus.Normal) {
    return 'leaving';
  }
  // prev 本身也在动画中：沿用之前的方向；若无前一阶段则默认按
  // "从动画起点朝稳态推进"理解 —— 正值（结束态）视作进入，负值（开始态）视作进入起点
  if (prevPhase === 'hidden' || prevPhase === 'leaving') {
    return 'entering';
  }
  if (prevPhase === 'visible' || prevPhase === 'entering') {
    return 'leaving';
  }
  return prevPhase;
}

/**
 * Nav 页面组件
 *
 * 包裹页面内容，并根据父级 NavStack 注入的 {@link NavViewContext} 中的
 * `appearStatus` 变化，在合适的时机触发 willAppear / didAppear /
 * willDisappear / didDisappear 回调。
 *
 * 典型使用：
 * ```tsx
 * <NavView
 *   willAppear={() => stat('show', 'claw_d_xxx')}
 *   didDisappear={() => cleanup()}
 * >
 *   <PageContent />
 * </NavView>
 * ```
 *
 * 实现说明：
 *  - 使用 ref 保存"上一次 appearStatus"以推断动画方向；初始值为 `null`，
 *    这样首次 effect 能识别出"从无到有"的阶段变化（如首帧就是 Normal 的栈顶页面，
 *    会被认定为 entering → visible，并触发 willAppear + didAppear）
 *  - 回调通过 ref 读取最新引用，避免依赖 willAppear 等 prop 导致 effect 频繁重跑
 *
 * @public
 */
export const NavView = React.memo<NavViewProps>((props) => {
  const { children, willAppear, didAppear, willDisappear, didDisappear } =
    props;
  const { appearStatus } = useContext(NavViewContext);

  /**
   * 回调引用。放入 effect 同步更新而非渲染期更新，避免 Concurrent 模式下
   * 渲染被丢弃时污染 ref。
   */
  const callbacksRef = useRef({
    willAppear,
    didAppear,
    willDisappear,
    didDisappear,
  });
  useEffect(() => {
    callbacksRef.current = {
      willAppear,
      didAppear,
      willDisappear,
      didDisappear,
    };
  });

  /** 上一次 appearStatus；null 表示尚未初始化（首次 effect 前） */
  const prevStatusRef = useRef<number | null>(null);
  /** 上一次推断出的阶段；null 表示尚未初始化 */
  const prevPhaseRef = useRef<LifecyclePhase | null>(null);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const prevPhase = prevPhaseRef.current;
    const callbacks = callbacksRef.current;

    // 推断本次阶段
    const phase: LifecyclePhase = resolvePhase(
      appearStatus,
      // 首次 effect 时 prev 不存在，视为"从 Hidden 起步"
      prevStatus ?? AppearStatus.Hidden,
      prevPhase ?? 'hidden',
    );

    // 阶段未变化（例如动画中间态的样式切换但方向未变）不触发回调
    if (prevPhase !== phase) {
      if (phase === 'entering') {
        // 只有从 hidden 进入 entering 才算"即将可见"；entering→entering 已在外层过滤
        if (prevPhase === null || prevPhase === 'hidden') {
          callbacks.willAppear?.();
        }
      } else if (phase === 'visible') {
        // 若之前不在可见/进入路径上，补发 willAppear（例如首帧直接渲染 Normal，
        // 跳过了 entering 阶段）
        if (
          prevPhase === null ||
          prevPhase === 'hidden' ||
          prevPhase === 'leaving'
        ) {
          callbacks.willAppear?.();
        }
        callbacks.didAppear?.();
      } else if (phase === 'leaving') {
        // 只有从 visible 进入 leaving 才算"即将不可见"
        if (prevPhase === 'visible') {
          callbacks.willDisappear?.();
        }
      } else if (phase === 'hidden') {
        // 只有从 leaving/visible 进入 hidden 才算"已不可见"
        if (prevPhase === 'leaving' || prevPhase === 'visible') {
          callbacks.didDisappear?.();
        }
      }
    }

    prevStatusRef.current = appearStatus;
    prevPhaseRef.current = phase;
  }, [appearStatus]);

  // 组件卸载时：若页面还处于可见/进入中阶段，补发 didDisappear
  // 典型场景：NavStack 直接卸载 NavView（例如整个 Router 被移除）
  useEffect(() => {
    return () => {
      const phase = prevPhaseRef.current;
      if (phase === 'visible' || phase === 'entering' || phase === 'leaving') {
        callbacksRef.current.didDisappear?.();
      }
    };
  }, []);

  return <>{children}</>;
});

NavView.displayName = 'NavView';

export default NavView;
