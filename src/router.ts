/**
 * 路由跳转类型
 * @public
 */
export type RouterAction = 'navigateTo' | 'navigateBack' | 'historyPop';

/**
 * 路由信息
 * @public
 */
export interface Route {
  /**
   * 路由路径，对应一个固定的页面
   */
  path: string;
  /**
   * 路由传参
   */
  params?: Record<string, unknown>;
}

/**
 * 路由事件，路由跳转时触发
 *
 * 使用 Discriminated Union 表达不同 action 对应的 payload 语义：
 *  - `navigateTo`   → payload 为目标 {@link Route}
 *  - `navigateBack` → payload 为回退后的新栈长度（见 {@link Router.navigateBack}）
 *  - `historyPop`   → 由浏览器 `popstate` 触发，无 payload
 *
 * @public
 */
export type RouterEvent =
  | { action: 'navigateTo'; payload: Route }
  | { action: 'navigateBack'; payload: number }
  | { action: 'historyPop'; payload: undefined };

/**
 * 路由监听器
 * @public
 */
export type RouterListener = (evt: RouterEvent) => void;

/**
 * 生成路由对象
 * @param location - URL地址或路由对象
 * @returns 路由对象（始终是一个新对象，不会修改入参）
 *
 * @public
 *
 * Query 解析协议（按顺序尝试，命中即用）：
 *   1. JSON-encoded（params 含非 string 值时 `createLocation` 的输出形态）：
 *      `?<encodeURIComponent(JSON.stringify(params))>`
 *      → 解析后 `params` 保持原始 JSON 类型（数字、布尔、嵌套对象等）。
 *   2. 标准 query string（params 全为 string 值时 `createLocation` 的输出形态，
 *      也兼容外部调用方如 CLI 直接拼接的 URL）：
 *      `?key=value&key2=value2`
 *      → 解析后所有 value 均为 string。同名键多次出现时取最后一个。
 *
 * 两种格式同时仅支持其一；`createLocation` 会优先选择 query string，仅当
 * 存在非 string 值（类型会丢失）时回退到 JSON-encoded。
 *
 * 注意：当 `location` 是对象且 `path` 中已包含 `?`，以 `path` 中的 query 为准，
 * 会覆盖对象上显式的 `params` 字段。本函数不会修改入参对象。
 */
export function createRoute(location: string | Route): Route {
  // 读取源数据但始终构造新对象返回，避免对外部传入的 Route 产生副作用
  const src: Route =
    typeof location === 'string' ? { path: location } : location;

  let path = src.path;
  let params = src.params;

  const sIdx = path.indexOf('?');
  if (sIdx !== -1) {
    // path 中自带 query 时，以其解析结果为准
    params = parseQuery(path.substring(sIdx + 1));
    path = path.substring(0, sIdx);
  }

  const route: Route = { path };
  if (params) {
    route.params = params;
  }

  // 覆写 toString 以便 `String(route)` 等价于 createLocation(route)
  route.toString = function () {
    return createLocation(this);
  };

  return route;
}

/**
 * 按「JSON-encoded 优先、标准 query string 兜底」的策略解析 query 字符串
 *
 * @param sParams - `?` 之后的子串（不含 `?` 本身）
 * @returns 解析得到的 params；空串或解析失败返回 `undefined`
 */
function parseQuery(sParams: string): Record<string, unknown> | undefined {
  // 空 query 视为无参数，保证与 createLocation 的 round-trip 对称
  if (!sParams) {
    return undefined;
  }

  // 优先尝试 JSON-encoded 协议（兼容前端内部跳转生成的 URL）
  try {
    const decoded = decodeURIComponent(sParams);
    // 仅当解码后看起来是 JSON 对象时才尝试 parse，避免把
    // 标准 query 字符串（如 `code=XXX`）误判为 JSON。
    // 因为标准 query 中的 `{` 通常会被 encode 为 `%7B`，
    // 以 `{` 起首的解码串几乎可以稳定识别为 JSON-encoded 形态。
    if (decoded.startsWith('{')) {
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    }
  } catch {
    // 解码或 JSON.parse 失败时，落到下面的标准 query string 解析
  }

  // 回退到标准 query string 解析（所有 value 都是 string）
  const params: Record<string, string> = {};
  const usp = new URLSearchParams(sParams);
  for (const [key, value] of usp) {
    params[key] = value;
  }
  return params;
}

/**
 * 生成URL地址
 * @param route - 路由对象
 * @returns URL地址
 *
 * @public
 *
 * 输出策略（与 `parseQuery` 对称）：
 *   1. 当 `params` 所有 value 均为 string 时，输出标准 query string。
 *      此形态 round-trip 无损，且对外部调用方（浏览器、CLI、日志等）更友好。
 *   2. 否则（存在 number / boolean / null / object / array 等非 string 值）
 *      输出 JSON-encoded 形态，保证类型信息不丢失。
 *
 * 空对象 `{}` 视为无参数，不输出 `?`。
 */
export function createLocation(route: Route): string {
  let location = route.path;

  const { params } = route;
  if (params) {
    const keys = Object.keys(params);
    if (keys.length > 0) {
      if (canUseQueryString(params)) {
        const usp = new URLSearchParams();
        for (const key of keys) {
          usp.append(key, params[key] as string);
        }
        location += '?' + usp.toString();
      } else {
        location += '?' + encodeURIComponent(JSON.stringify(params));
      }
    }
  }

  return location;
}

/**
 * 判断 params 是否可以安全地以标准 query string 形式输出，且能被
 * `parseQuery` 无歧义地解析回来。
 *
 * 条件：所有 value 必须为 string 类型。
 * - 非 string 值（number/boolean/null/object/array）走 query string 会丢失类型。
 * - 全 string 值时，`URLSearchParams.toString()` 的产物 decode 后形如
 *   `key=value&...`，不会以 `{` 开头，因此不会被 `parseQuery` 误判为
 *   JSON-encoded 分支。
 */
function canUseQueryString(params: Record<string, unknown>): boolean {
  for (const key of Object.keys(params)) {
    if (typeof params[key] !== 'string') {
      return false;
    }
  }
  return true;
}

/**
 * 默认导航策略
 *
 * - `navigateTo`:   将目标 route 追加到栈顶（不做去重）
 * - `navigateBack`: 以 `payload` 作为 `slice(0, payload)` 的第二参数裁剪栈
 *   - 传入正整数 N → 保留前 N 个路由
 *   - 传入负整数 -N → 回退 N 层（`slice(0, -N)` 语义）
 *   - 从 {@link Router.navigateBack} 默认调用时传入 -1，恰好回退一层
 * - `historyPop`:   由浏览器历史触发，栈由外部直接替换，这里不做处理
 */
function defaultNavigation(evt: RouterEvent, navStack: Route[]): Route[] {
  if (evt.action === 'navigateTo') {
    return navStack.concat(evt.payload);
  }
  if (evt.action === 'navigateBack') {
    return navStack.slice(0, evt.payload);
  }
  return navStack;
}

/**
 * 路由控制器
 * @public
 */
export interface Router {
  /**
   * 跳转到指定路由
   * @param to - 要跳转到的路由
   */
  navigateTo(to: Route | string): void;
  /**
   * 回退路由
   *
   * 语义是 `Array.prototype.slice(0, lastIndex)`：
   * - 传入正整数 N：保留前 N 个路由（相当于跳到栈中第 N 个位置）
   * - 传入负整数 -N：从栈顶回退 N 层
   * - 不传时默认 -1，即回退一层
   *
   * @param lastIndex - 目标栈裁剪位置，默认 `-1`
   */
  navigateBack(lastIndex?: number): void;
  /**
   * 监听路由变化
   * @param listener - 路由事件回调
   * @returns 取消监听函数（幂等，可多次调用）
   */
  listen(listener: RouterListener): () => void;
  /**
   * 获取当前路由栈
   */
  getNavStack(): Route[];
}

/**
 * 路由控制器创建配置
 * @public
 */
export interface RouterOptions {
  /**
   * 根路由
   */
  rootRoute?: Route | string;
  /**
   * 自定义路由跳转规则
   * @param evt - 路由跳转事件
   * @param navStack - 跳转前的路由栈
   * @param defaultNavigation - 默认的跳转规则
   * @returns 跳转后的路由栈
   */
  customNavigation?(
    evt: RouterEvent,
    navStack: Route[],
    defaultNavigation: (evt: RouterEvent, navStack: Route[]) => Route[],
  ): Route[];
  /**
   * 是否使用浏览器历史记录（不支持 IE）
   *
   * 注意：全局 `popstate` 与 `history.state` 是整页共享的，同一页面中
   * 同时启用多个开启了 `history` 的 Router 会互相干扰。当前约定只允许
   * 最外层 Router 启用 `history`，内部嵌套 Router 不应传入此配置。
   */
  history?: 'hash';
}

/**
 * 创建路由控制器
 * @param options - 创建配置
 * @returns 路由控制器
 *
 * @public
 */
export function createRouter(options: RouterOptions = {}): Router {
  const { rootRoute, customNavigation, history } = options;
  const listeners: RouterListener[] = [];
  let navStack: Route[] = [];
  const globalHistory = window.history;

  // 1) 初始化 rootRoute
  if (rootRoute) {
    navStack = navigate(
      { action: 'navigateTo', payload: createRoute(rootRoute) },
      navStack,
    );
  }

  // 2) 根据 history 配置初始化浏览器历史联动
  if (history) {
    initFromHistory();

    if (navStack.length > 0) {
      navHistorySave();
    }

    window.addEventListener('popstate', ({ state }) => {
      if (state && state.navStack) {
        navStack = state.navStack.map((route: string) => createRoute(route));
        fire({ action: 'historyPop', payload: undefined });
      }
    });

    // 监听用户在地址栏手动修改 hash / 外部代码赋值 `location.hash`
    // 触发的变化。`history.pushState` 不会触发 hashchange，所以此处
    // 不会与 navigateTo/navigateBack 自身写入 hash 的行为冲突。
    window.addEventListener('hashchange', onHashChange);
  }

  /**
   * 处理地址栏手动改 hash 的场景
   *
   * 语义：视作"整页跳转"，完全替换路由栈为新 hash 对应的单路由，
   * 丢失之前的后退历史。这与本 Router 在 App 层的默认用法一致
   * （customNavigation 里 navigateTo 也是 `return [route]`）。
   *
   * 注意事项：
   *  - 若 hash 与当前栈顶一致（例如 navigateTo 已经写入了相同 hash，
   *    或用户手动改成相同值），直接忽略，避免多余刷新。
   *  - 手动改 hash 时浏览器不会调用 pushState，`history.state` 依然是
   *    旧值。我们在这里补写一次 state，让后续 popstate 能正确恢复栈。
   *  - 清空 hash（改成 `#` 或删掉 hash）时不做处理，避免误替换为空栈。
   */
  function onHashChange() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
      return;
    }

    const top = navStack[navStack.length - 1];
    if (top && createLocation(top) === hash) {
      return;
    }

    navStack = [createRoute(hash)];

    // 手动改 hash 时浏览器已经创建了一条新的 history 条目，
    // 这里用 replaceState 把 state 补写到该条目上，避免 pushState
    // 造成历史翻倍（否则用户点一次后退等于没退）
    navHistorySave(true);
    // 使用 historyPop 事件：语义上表达"栈已被外部因素整体替换"，
    // 与后退按钮触发的事件一致，避免被上层当作常规 navigateTo 重复埋点。
    fire({ action: 'historyPop', payload: undefined });
  }

  /**
   * 从当前 URL 的 hash 中恢复路由栈
   *
   * 若 rootRoute 恰好已经对应当前 hash（例如刷新后首次加载），
   * 则跳过重复 push，避免同一路由在栈中出现两次。
   */
  function initFromHistory() {
    /* v8 ignore next 3 */
    if (history !== 'hash') {
      return;
    }

    let hash = window.location.hash;
    if (!hash) {
      return;
    }
    hash = hash.substring(1);

    if (navStack.length > 0) {
      const lastRoute = navStack[navStack.length - 1];
      if (hash === createLocation(lastRoute)) {
        return;
      }
    }

    navStack = navigate(
      { action: 'navigateTo', payload: createRoute(hash) },
      navStack,
    );
  }

  /**
   * 触发事件
   *
   * 遍历前复制一份 listeners 快照，防止某个 listener 在回调中
   * 订阅/取消订阅时修改数组导致本轮遍历异常。
   */
  function fire(evt: RouterEvent) {
    for (const handler of listeners.slice()) {
      handler(evt);
    }
  }

  /**
   * 将当前路由栈写入浏览器 history
   *
   * state 中保存的是序列化后的路由字符串数组，`popstate` 时再用
   * {@link createRoute} 反序列化回 Route 对象。
   *
   * @param replace - 若为 true，使用 `replaceState` 替换当前条目而不是新增一条。
   *   主要用于 hashchange 场景：浏览器已为手动改 hash 创建了新条目，
   *   此时只需把 state 补写到该条目上，而不是再 push 一条造成历史翻倍。
   */
  function navHistorySave(replace = false) {
    const top = navStack[navStack.length - 1];
    // 目前 history 仅支持 'hash' 模式，hash 永远指向栈顶路由
    const url = top ? '#' + createLocation(top) : '';

    const state = {
      navStack: navStack.map((route) => createLocation(route)),
    };

    if (replace) {
      globalHistory.replaceState(state, '', url);
    } else {
      globalHistory.pushState(state, '', url);
    }
  }

  function navigate(evt: RouterEvent, navStack: Route[]): Route[] {
    return customNavigation
      ? customNavigation(evt, navStack, defaultNavigation)
      : defaultNavigation(evt, navStack);
  }

  const router: Router = {
    getNavStack() {
      return navStack;
    },
    navigateTo(to) {
      const evt: RouterEvent = {
        action: 'navigateTo',
        payload: createRoute(to),
      };

      navStack = navigate(evt, navStack);

      if (history) {
        navHistorySave();
      }
      fire(evt);
    },
    navigateBack(lastIndex = -1) {
      const evt: RouterEvent = { action: 'navigateBack', payload: lastIndex };

      navStack = navigate(evt, navStack);

      if (history) {
        navHistorySave();
      }
      fire(evt);
    },
    listen(listener) {
      listeners.push(listener);

      return () => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) {
          listeners.splice(idx, 1);
        }
      };
    },
  };

  return router;
}
