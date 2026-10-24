// @flow
/**
 * Side-effect module imported FIRST by src/index.js (YC-HOOK), so the network
 * guard is in place before any other module evaluates and starts requests.
 */
import { bootstrapYoungCreators } from './bootstrap';

bootstrapYoungCreators();
