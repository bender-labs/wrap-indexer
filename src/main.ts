import { loadConfiguration } from './configuration';
import { httpServer } from './web/Server';
import { bootstrap } from './bootstrap';
import { scheduleJobs } from './jobs';

const configuration = loadConfiguration();
const ethereumConfiguration = configuration.ethereum.networks[configuration.ethereum.currentNetwork];
const tezosConfiguration = configuration.tezos.networks[configuration.tezos.currentNetwork];
const dependencies = bootstrap(configuration, ethereumConfiguration, tezosConfiguration);

scheduleJobs(dependencies).start();

httpServer(dependencies).listen(configuration.http.port, () => {
  dependencies.logger.info(`Express server started on port: ${configuration.http.port}`);
});


