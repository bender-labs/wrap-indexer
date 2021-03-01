import { loadConfiguration as load } from '@arpinum/config';

type LogType = "json" | "pretty" | "hidden";

export type EthereumConfig = {
  wrapContractAddress: string;
  rpc: string;
  firstBlockToIndex: number;
}

export type TezosConfig = {
  quorumContractAddress: string;
  minterContractAddress: string;
}

export type Config = {
  ethereum: {
    currentNetwork: string,
    networks: {
      [key: string]: EthereumConfig
    }
  };
  tezos: {
    currentNetwork: string,
    networks: {
      [key: string]: TezosConfig
    }
  }
  ipfs: {
    nodeUrl: string
  }
  log: {
    format: LogType
  };
  postgres: {
    username: string,
    password: string,
    host: string,
    port: number,
    database: string;
  };
  node: {
    environment: string
  };
}

export function loadConfiguration(): Config {
  return load({
    ethereum: {
      currentNetwork: {
        env: 'ETHEREUM_NETWORK',
        default: 'rinkeby'
      },
      networks: {
        rinkeby: {
          rpc: {
            env: 'ETHEREUM_RPC',
            default: 'https://rinkeby.infura.io/v3/fa01913603ac4f058ab8a0bfc0b2ba9a'
          },
          wrapContractAddress: {
            env: 'ETHEREUM_WRAP_CONTRACT_ADDRESS',
            default: '0x352488cAaDf763Acaa41fB05E4b5B3a45647C8D5'
          },
          firstBlockToIndex: {
            env: 'ETHEREUM_FIRST_BLOCK_TO_INDEX',
            type: 'integer',
            default: 7997335
          }
        }
      }
    },
    tezos: {
      currentNetwork: {
        env: 'TEZOS_NETWORK',
        default: 'edo2net'
      },
      networks: {
        edo2net: {
          quorumContractAddress: {
            env: 'TEZOS_QUORUM_CONTRACT',
            default: 'KT1Kc58SaARN63AMdoNfd8U2Y4mnQggwJHHR'
          },
          minterContractAddress: {
            env: 'TEZOS_MINTER_CONTRACT',
            default: 'KT1Hd1hiG1PhZ7xRi1HUVoAXM7i7Pzta8EHW'
          }
        }
      }
    },
    ipfs: {
      nodeUrl: {
        env: 'IPFS_NODE',
        default: 'http://localhost:5001'
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
    },
    node: {
      environment: {
        env: 'NODE_ENV',
        default: 'development'
      }
    }
  });
}


