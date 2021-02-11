require('ts-node/register');
import { loadConfiguration} from '../configuration';
import {createKnexConfiguration} from '../tools/dbClient';

module.exports = createKnexConfiguration(loadConfiguration());
