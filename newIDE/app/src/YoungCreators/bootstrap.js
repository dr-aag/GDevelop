// @flow
import { getYcConfig } from './config';
import { installNetworkGuard } from './networkGuard';

/** Called from the YC-HOOK in src/index.js, before the editor boots. */
export const bootstrapYoungCreators = () => {
  const config = getYcConfig();
  if (config.blockUpstreamServices) installNetworkGuard();
  console.info('[YoungCreators] mode:', config.mode);
};

/** True when upstream analytics and telemetry must not start. */
export const shouldDisableUpstreamTelemetry = (): boolean =>
  getYcConfig().blockUpstreamServices;
