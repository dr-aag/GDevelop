// @flow
import { getYcConfig, type YcMode } from './config';

/**
 * Panel rules per age mode. The editor keeps its components; a mode only
 * decides which ones are shown. Add a rule here, then wire it in with a
 * small `// YC-HOOK` where upstream decides what to render.
 *
 * Spike scope (M0-01): two home page panels, "Shop" and "Play", are hidden
 * below Pro mode. M1-07 replaces these placeholder rules with the real
 * Junior/Creator/Advanced/Pro panel lists from the spec.
 */
type PanelRules = {|
  hiddenHomeTabs: Array<string>,
|};

const RULES: { [YcMode]: PanelRules } = {
  little: { hiddenHomeTabs: ['shop', 'play'] },
  junior: { hiddenHomeTabs: ['shop', 'play'] },
  creator: { hiddenHomeTabs: ['shop', 'play'] },
  advanced: { hiddenHomeTabs: ['shop', 'play'] },
  pro: { hiddenHomeTabs: [] },
};

export const getPanelRulesForMode = (mode: YcMode): PanelRules =>
  RULES[mode] || RULES.creator;

export const isHomeTabHidden = (tab: string): boolean =>
  getPanelRulesForMode(getYcConfig().mode).hiddenHomeTabs.includes(tab);
