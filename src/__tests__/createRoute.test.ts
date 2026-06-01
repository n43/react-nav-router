import { describe, it, expect } from 'vitest';
import { createRoute, createLocation } from '../router';

describe('createRoute', () => {
  it('字符串输入：仅 path', () => {
    const r = createRoute('/home');
    expect(r.path).toBe('/home');
    expect(r.params).toBeUndefined();
  });

  it('字符串输入：path 自带标准 query', () => {
    const r = createRoute('/page?a=1&b=2');
    expect(r.path).toBe('/page');
    expect(r.params).toEqual({ a: '1', b: '2' });
  });

  it('字符串输入：path 自带 JSON-encoded query', () => {
    const q = encodeURIComponent(JSON.stringify({ n: 1, b: true, s: 'x' }));
    const r = createRoute('/p?' + q);
    expect(r.path).toBe('/p');
    expect(r.params).toEqual({ n: 1, b: true, s: 'x' });
  });

  it('对象输入：path 中的 query 覆盖对象的 params', () => {
    const r = createRoute({ path: '/p?a=1', params: { ignore: 'me' } });
    expect(r.path).toBe('/p');
    expect(r.params).toEqual({ a: '1' });
  });

  it('对象输入：无 query 时保留传入 params', () => {
    const r = createRoute({ path: '/p', params: { x: 'y' } });
    expect(r.params).toEqual({ x: 'y' });
  });

  it('不修改入参', () => {
    const src = { path: '/p?a=1', params: { x: 'y' } };
    createRoute(src);
    expect(src).toEqual({ path: '/p?a=1', params: { x: 'y' } });
  });

  it('toString 等价于 createLocation', () => {
    const r = createRoute({ path: '/p', params: { a: 'b' } });
    expect(String(r)).toBe(createLocation(r));
  });

  it('空 query 字符串视为无 params', () => {
    const r = createRoute('/p?');
    expect(r.params).toBeUndefined();
  });
});

describe('createLocation', () => {
  it('无 params：仅返回 path', () => {
    expect(createLocation({ path: '/x' })).toBe('/x');
  });

  it('空 params 对象：不输出 ?', () => {
    expect(createLocation({ path: '/x', params: {} })).toBe('/x');
  });

  it('全 string params：输出标准 query string', () => {
    expect(createLocation({ path: '/x', params: { a: '1', b: '2' } })).toBe(
      '/x?a=1&b=2',
    );
  });

  it('含非 string params：输出 JSON-encoded', () => {
    const url = createLocation({ path: '/x', params: { n: 1, b: true } });
    expect(url.startsWith('/x?')).toBe(true);
    const json = decodeURIComponent(url.substring('/x?'.length));
    expect(JSON.parse(json)).toEqual({ n: 1, b: true });
  });

  it('round-trip：createRoute(createLocation(r)) 等价于原 route（string params）', () => {
    const src = { path: '/x', params: { a: '1' } };
    const round = createRoute(createLocation(src));
    expect(round.path).toBe(src.path);
    expect(round.params).toEqual(src.params);
  });

  it('round-trip：非 string params 通过 JSON-encoded 保类型', () => {
    const src = { path: '/x', params: { n: 42, b: false } };
    const round = createRoute(createLocation(src));
    expect(round.params).toEqual(src.params);
  });
});
