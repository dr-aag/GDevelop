// @flow
/**
 * Young Creators runtime configuration.
 *
 * Read once at startup, in priority order:
 *   1. URL query parameters prefixed with `yc_` (development and tests only),
 *   2. window.YC_CONFIG (injected by the studio host page),
 *   3. the defaults below.
 *
 * Everything Young Creators adds to the editor is driven by this object,
 * so the studio host decides the mode and upstream files stay untouched.
 */

export type YcMode = 'little' | 'junior' | 'creator' | 'advanced' | 'pro';

export type YcConfig = {|
  /** When true, every request that is not same-origin or localhost is blocked. */
  blockUpstreamServices: boolean,
  /** Age mode. Decides which panels are shown. */
  mode: YcMode,
|};

const DEFAULTS: YcConfig = {
  blockUpstreamServices: true,
  mode: 'pro',
};

const VALID_MODES: Array<YcMode> = [
  'little',
  'junior',
  'creator',
  'advanced',
  'pro',
];

const parseBoolean = (value: ?string, fallback: boolean): boolean => {
  if (value === null || value === undefined) return fallback;
  return value === '1' || value === 'true';
};

const parseMode = (value: ?string, fallback: YcMode): YcMode => {
  const found = VALID_MODES.find(mode => mode === value);
  return found || fallback;
};

let cachedConfig: ?YcConfig = null;

export const getYcConfig = (): YcConfig => {
  if (cachedConfig) return cachedConfig;

  const injected: Object =
    (typeof window !== 'undefined' && window.YC_CONFIG) || {};
  let params = null;
  try {
    params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
  } catch (error) {
    params = null;
  }
  const fromUrl = (name: string): ?string =>
    params ? params.get(`yc_${name}`) : null;

  cachedConfig = {
    blockUpstreamServices: parseBoolean(
      fromUrl('block'),
      typeof injected.blockUpstreamServices === 'boolean'
        ? injected.blockUpstreamServices
        : DEFAULTS.blockUpstreamServices
    ),
    mode: parseMode(fromUrl('mode'), parseMode(injected.mode, DEFAULTS.mode)),
  };
  return cachedConfig;
};

/** Test helper: forget the cached configuration. */
export const resetYcConfigForTests = () => {
  cachedConfig = null;
};
