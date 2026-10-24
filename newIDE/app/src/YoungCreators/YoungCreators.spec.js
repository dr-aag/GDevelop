// @flow
import { getYcConfig, resetYcConfigForTests, type YcMode } from './config';
import { getPanelRulesForMode, isHomeTabHidden } from './modes';
import { isAllowedUrl } from './networkGuard';

const PAGE = 'http://localhost:3017/index.html';

const setLocation = (search: string) => {
  window.history.replaceState({}, '', `/${search}`);
  resetYcConfigForTests();
};

describe('YoungCreators config', () => {
  afterEach(() => {
    delete window.YC_CONFIG;
    setLocation('');
  });

  it('blocks upstream services and uses Pro mode by default', () => {
    setLocation('');
    expect(getYcConfig()).toEqual({ blockUpstreamServices: true, mode: 'pro' });
  });

  it('reads the mode injected by the studio host', () => {
    window.YC_CONFIG = { mode: 'junior' };
    setLocation('');
    expect(getYcConfig().mode).toBe('junior');
  });

  it('lets a yc_ URL parameter override the injected mode', () => {
    window.YC_CONFIG = { mode: 'junior' };
    setLocation('?yc_mode=creator');
    expect(getYcConfig().mode).toBe('creator');
  });

  it('ignores an unknown mode', () => {
    setLocation('?yc_mode=superuser');
    expect(getYcConfig().mode).toBe('pro');
  });
});

describe('YoungCreators modes', () => {
  afterEach(() => setLocation(''));

  it('hides the Shop and Play home panels below Pro mode', () => {
    const modes: Array<YcMode> = ['little', 'junior', 'creator', 'advanced'];
    modes.forEach(mode => {
      expect(getPanelRulesForMode(mode).hiddenHomeTabs).toEqual([
        'shop',
        'play',
      ]);
    });
  });

  it('shows every home panel in Pro mode', () => {
    expect(getPanelRulesForMode('pro').hiddenHomeTabs).toEqual([]);
  });

  it('applies the current mode', () => {
    setLocation('?yc_mode=creator');
    expect(isHomeTabHidden('shop')).toBe(true);
    expect(isHomeTabHidden('create')).toBe(false);
    setLocation('?yc_mode=pro');
    expect(isHomeTabHidden('shop')).toBe(false);
  });
});

describe('YoungCreators network guard', () => {
  it('allows same-origin, localhost, blob and data URLs', () => {
    expect(isAllowedUrl('/libGD.js', PAGE)).toBe(true);
    expect(isAllowedUrl('http://localhost:3017/x.json', PAGE)).toBe(true);
    expect(isAllowedUrl('http://127.0.0.1:9000/x', PAGE)).toBe(true);
    expect(isAllowedUrl('blob:http://localhost:3017/abc', PAGE)).toBe(true);
    expect(isAllowedUrl('data:image/png;base64,AAAA', PAGE)).toBe(true);
  });

  it('blocks upstream services and third-party trackers', () => {
    [
      'https://api.gdevelop.io/asset/asset-short-header',
      'https://resources.gdevelop-app.com/assets-database/x.json',
      'https://gd.games/app-embedded/v1/dark',
      'wss://api-ws.gdevelop.io/authorization',
      'https://us.i.posthog.com/flags/',
      'https://analytics.tiktok.com/api/v2/pixel',
      'https://gdevelop-services.firebaseapp.com/__/auth',
    ].forEach(url => expect(isAllowedUrl(url, PAGE)).toBe(false));
  });
});
