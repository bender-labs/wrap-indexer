import { loadConfiguration as load } from '@arpinum/config';

type LogType = "json" | "pretty" | "hidden";

export interface Config {
  ethereum: {
    wrapContractAddress: string;
    rpc: string;
  };
  log: {
    format: LogType
  };
  postgres: {
    username: string;
    password: string;
    host: string;
    port: number;
    database: string;
  };
}

export function loadConfiguration(): Config {
  return load({
    ethereum: {
      rpc: {
        env: 'ETHEREUM_RPC',
        default: 'https://rinkeby.infura.io/v3/fa01913603ac4f058ab8a0bfc0b2ba9a'
      },
      wrapContractAddress: {
        env: 'ETHEREUM_WRAP_CONTRACT_ADDRESS',
        default: '0x9A0bfC0Aa91B58Ae07E2fFdfAb29904B7513a917'
      }
    },
    log: {
      format: {
        env: 'LOG_FORMAT',
        default: 'pretty'
      }
    },
    postgres: {
      username: {
        env: 'POSTGRES_DB_USER',
        default: 'postgres',
      },
      password: {
        env: 'POSTGRES_DB_PASSWORD',
        default: 'password',
      },
      host: {
        env: 'POSTGRES_DB_HOST',
        default: 'localhost',
      },
      port: {
        env: 'POSTGRES_DB_PORT',
        type: 'integer',
        default: 5432,
      },
      database: {
        env: 'POSTGRES_DB_NAME',
        default: 'indexer',
      },
    }
  });
}


