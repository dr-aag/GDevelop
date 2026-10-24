// @flow
/**
 * Network guard: blocks every request that does not go to our own origin
 * (or to localhost during development), so the editor never talks to the
 * upstream online services (accounts, cloud projects, AI, asset store,
 * builds, analytics). Blocked attempts are recorded on
 * window.__YC_BLOCKED_REQUESTS__ so tests and reports can list them.
 *
 * Installed once, before the editor boots (see the YC-HOOK in src/index.js).
 * The studio host also sends a Content-Security-Policy header, so requests
 * this guard cannot see (CSS images, fonts) are refused by the browser.
 * Later milestones replace blocked features with calls through YoungCreators/bridge.
 */

export type BlockedRequest = {| kind: string, url: string, at: number |};

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
const MAX_RECORDED = 1000;
const MAX_LOGGED = 20;

export const isAllowedUrl = (rawUrl: string, pageHref: string): boolean => {
  let url;
  try {
    url = new URL(rawUrl, pageHref);
  } catch (error) {
    return true; // Malformed: the browser will fail it on its own.
  }
  if (['blob:', 'data:', 'about:'].includes(url.protocol)) return true;
  if (url.origin === new URL(pageHref).origin) return true;
  return LOCAL_HOSTNAMES.includes(url.hostname);
};

const allowed = (rawUrl: string): boolean =>
  isAllowedUrl(rawUrl, window.location.href);

const record = (kind: string, url: string) => {
  const list = (window.__YC_BLOCKED_REQUESTS__ =
    window.__YC_BLOCKED_REQUESTS__ || []);
  if (list.length < MAX_RECORDED) list.push({ kind, url, at: Date.now() });
  if (list.length <= MAX_LOGGED) {
    console.warn(`[YoungCreators] Blocked ${kind} request to ${url}`);
  }
};

const blockedError = (url: string) =>
  new TypeError(`Blocked by the Young Creators network guard: ${url}`);

const guardFetch = () => {
  const originalFetch = window.fetch;
  if (!originalFetch) return;
  // $FlowFixMe[missing-this-annot]
  window.fetch = function(input: any, init: any) {
    const url =
      typeof input === 'string' ? input : input && input.url ? input.url : '';
    if (!allowed(url)) {
      record('fetch', url);
      return Promise.reject(blockedError(url));
    }
    return originalFetch.call(this, input, init);
  };
};

const guardXhr = () => {
  const XHR = window.XMLHttpRequest;
  if (!XHR || !XHR.prototype) return;
  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;
  // $FlowFixMe[missing-this-annot]
  XHR.prototype.open = function(method: string, url: string, ...rest: any) {
    this.__ycBlockedUrl = allowed(String(url)) ? null : String(url);
    return originalOpen.call(
      this,
      method,
      this.__ycBlockedUrl ? 'about:blank' : url,
      ...rest
    );
  };
  // $FlowFixMe[missing-this-annot]
  XHR.prototype.send = function(body: any) {
    if (this.__ycBlockedUrl) {
      record('xhr', this.__ycBlockedUrl);
      setTimeout(() => {
        this.dispatchEvent(new Event('error'));
        this.dispatchEvent(new Event('loadend'));
      }, 0);
      return;
    }
    return originalSend.call(this, body);
  };
};

const guardWebSocket = () => {
  const OriginalWebSocket = window.WebSocket;
  if (!OriginalWebSocket) return;
  const GuardedWebSocket = function(url: string, protocols: any) {
    if (!allowed(String(url))) {
      record('websocket', String(url));
      throw blockedError(String(url));
    }
    return protocols === undefined
      ? new OriginalWebSocket(url)
      : new OriginalWebSocket(url, protocols);
  };
  GuardedWebSocket.prototype = OriginalWebSocket.prototype;
  ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(key => {
    // $FlowFixMe[prop-missing]
    GuardedWebSocket[key] = OriginalWebSocket[key];
  });
  // $FlowFixMe[cannot-write]
  window.WebSocket = GuardedWebSocket;
};

const guardBeacon = () => {
  const nav = window.navigator;
  if (!nav || !nav.sendBeacon) return;
  const originalSendBeacon = nav.sendBeacon.bind(nav);
  // $FlowFixMe[cannot-write]
  nav.sendBeacon = (url: string, data: any) => {
    if (!allowed(String(url))) {
      record('beacon', String(url));
      return false;
    }
    return originalSendBeacon(url, data);
  };
};

const guardElementSrc = (ElementClass: any, kind: string) => {
  if (!ElementClass || !ElementClass.prototype) return;
  const proto = ElementClass.prototype;
  const descriptor: any = Object.getOwnPropertyDescriptor(proto, 'src');
  if (descriptor && descriptor.set) {
    const originalSetter = descriptor.set;
    // $FlowFixMe[missing-this-annot]
    const guardedSetter = function(value: any) {
      if (!allowed(String(value))) {
        record(kind, String(value));
        return;
      }
      originalSetter.call(this, value);
    };
    Object.defineProperty(proto, 'src', { ...descriptor, set: guardedSetter });
  }
  const originalSetAttribute = proto.setAttribute;
  // $FlowFixMe[missing-this-annot]
  proto.setAttribute = function(name: string, value: string) {
    if (name === 'src' && !allowed(String(value))) {
      record(kind, String(value));
      return;
    }
    return originalSetAttribute.call(this, name, value);
  };
};

let installed = false;

export const installNetworkGuard = () => {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  guardFetch();
  guardXhr();
  guardWebSocket();
  guardBeacon();
  guardElementSrc(window.HTMLScriptElement, 'script');
  guardElementSrc(window.HTMLIFrameElement, 'iframe');
  console.info(
    '[YoungCreators] Network guard installed: only same-origin and localhost requests are allowed.'
  );
};

export const getBlockedRequests = (): Array<BlockedRequest> =>
  (typeof window !== 'undefined' && window.__YC_BLOCKED_REQUESTS__) || [];
