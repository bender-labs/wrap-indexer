import { loadConfiguration } from '../configuration';
import { createKnexConfiguration } from '../infrastructure/dbClient';

module.exports = createKnexConfiguration(loadConfiguration());
