import { loadConfiguration as load } from '@arpinum/config';

type LogType = 'json' | 'pretty' | 'hidden';

export type EthereumConfig = {
  networkId: number;
  wrapContractAddress: string;
  rpc: string;
  firstBlockToIndex: number;
  wrapABI: string;
  confirmationsThreshold: number;
};

export type TezosConfig = {
  quorumContractAddress: string;
  minterContractAddress: string;
  confirmationsThreshold: number;
  rpc: string;
};

export type Config = {
  ethereum: {
    currentNetwork: string;
    networks: {
      [key: string]: EthereumConfig;
    };
  };
  tezos: {
    currentNetwork: string;
    networks: {
      [key: string]: TezosConfig;
    };
  };
  ipfs: {
    nodeUrl: string;
  };
  log: {
    format: LogType;
    level: 'info' | 'warn' | 'error';
  };
  postgres: {
    username: string;
    password: string;
    host: string;
    port: number;
    database: string;
  };
  http: {
    port: number;
  };
  node: {
    environment: string;
  };
};

export function loadConfiguration(): Config {
  return load({
    ethereum: {
      currentNetwork: {
        env: 'ETHEREUM_NETWORK',
        default: 'rinkeby',
      },
      networks: {
        rinkeby: {
          networkId: {
            env: 'ETHEREUM_NETWORK_ID',
            type: 'integer',
            default: '4',
          },
          rpc: {
            env: 'ETHEREUM_RPC',
            default:
              'https://rinkeby.infura.io/v3/fa01913603ac4f058ab8a0bfc0b2ba9a',
          },
          wrapContractAddress: {
            env: 'ETHEREUM_WRAP_CONTRACT_ADDRESS',
            default: '0xEEeeB7783786155A6471B23e84EE7f343f3B1032',
          },
          firstBlockToIndex: {
            env: 'ETHEREUM_FIRST_BLOCK_TO_INDEX',
            type: 'integer',
            default: 7997335,
          },
          wrapABI: {
            env: 'ETHEREUM_WRAP_ABI',
            default:
              '[{"inputs":[{"internalType":"address","name":"_administrator","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"AddedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"ChangedThreshold","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"tezosDestinationAddress","type":"string"}],"name":"ERC20WrapAsked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"string","name":"tezosDestinationAddress","type":"string"}],"name":"ERC721WrapAsked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"}],"name":"ExecutionFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"}],"name":"ExecutionSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"RemovedOwner","type":"event"},{"inputs":[],"name":"NAME","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"addOwnerWithThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"changeThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"domainSeparator","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAdministrator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwners","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"removeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"oldOwner","type":"address"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"swapOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"owners","type":"address[]"},{"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"setup","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"tezosAddress","type":"string"}],"name":"wrapERC20","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"string","name":"tezosAddress","type":"string"}],"name":"wrapERC721","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"string","name":"tezosOperation","type":"string"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"execTransaction","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"string","name":"tezosOperation","type":"string"}],"name":"encodeTransactionData","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"string","name":"tezosOperation","type":"string"}],"name":"getTransactionHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tezosOperation","type":"string"}],"name":"isTezosOperationProcessed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"}]',
          },
          confirmationsThreshold: {
            env: 'ETHEREUM_CONFIRMATIONS_THRESHOLD',
            type: 'integer',
            default: 10,
          },
        },
      },
    },
    tezos: {
      currentNetwork: {
        env: 'TEZOS_NETWORK',
        default: 'florencenet',
      },
      networks: {
        edo2net: {
          quorumContractAddress: {
            env: 'TEZOS_QUORUM_CONTRACT',
            default: 'KT1C5ftQmsS41bwS5wQKWRmEhUCyfk6kan2S',
          },
          minterContractAddress: {
            env: 'TEZOS_MINTER_CONTRACT',
            default: 'KT1RjHY3G7omtaohqnkEqCybQ73BqFeHkZh1',
          },
          confirmationsThreshold: {
            env: 'TEZOS_CONFIRMATIONS_THRESHOLD',
            type: 'integer',
            default: 10,
          },
          rpc: {
            env: 'TEZOS_RPC',
            default: 'https://edonet.smartpy.io/',
          },
        },
        florencenet: {
          quorumContractAddress: {
            env: 'TEZOS_QUORUM_CONTRACT',
            default: 'KT1Qjq1Yp27QUT8s8ECRbra48pbDmfWa1u2K',
          },
          minterContractAddress: {
            env: 'TEZOS_MINTER_CONTRACT',
            default: 'KT1KwYvgkaFDRroKqWf9C8dcDeyK1hUWt7se',
          },
          confirmationsThreshold: {
            env: 'TEZOS_CONFIRMATIONS_THRESHOLD',
            type: 'integer',
            default: 10,
          },
          rpc: {
            env: 'TEZOS_RPC',
            default: 'https://florencenet.smartpy.io/',
          },
        },
      },
    },
    ipfs: {
      nodeUrl: {
        env: 'IPFS_NODE',
        default: 'http://localhost:5001',
      },
    },
    log: {
      format: {
        env: 'LOG_FORMAT',
        default: 'pretty',
      },
      level: {
        env: 'LOG_LEVEL',
        default: 'debug',
      },
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
    http: {
      port: {
        env: 'HTTP_PORT',
        type: 'integer',
        default: 3000,
      },
    },
    node: {
      environment: {
        env: 'NODE_ENV',
        default: 'development',
      },
    },
  });
}
