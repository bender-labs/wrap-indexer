import axios from 'axios';

export interface MichelineNode {
  prim: string;
  type: string;
  name?: string;
  value?: string | number;
  children?: Array<MichelineNode>;
}

export interface Operation {
  level: number;
  counter: number;
  parameters: MichelineNode;
  timestamp: Date;
  id: string;
  protocol: string;
  hash: string;
  source: string;
  destination: string;
  status: string;
  entrypoint: string;
  internal: boolean;
  mempool: boolean;
}

export interface Operations {
  operations: Array<Operation>;
  last_id: string;
}

export interface BigMapValue {
  keyHash: string;
  keyString: string;
  value: MichelineNode;
}

export class BcdProvider {
  constructor(tezosNetwork: string) {
    this._tezosNetwork = tezosNetwork;
  }

  async getContractOperations(
    contractAddress: string,
    entrypoints: string[],
    lastId?: string
  ): Promise<Operations> {
    const response = await axios.get<Operations>(
      `${BcdProvider.BCD_URL}/v1/contract/${
        this._tezosNetwork
      }/${contractAddress}/operations\\?entrypoints\\=${entrypoints.join(',')}${
        lastId ? '&last_id=' + lastId : ''
      }`
    );
    return {
      last_id: response.data.last_id,
      operations: response.data.operations.filter((o) =>
        entrypoints.includes(o.entrypoint)
      ),
    };
  }

  async getBigMapContent(bigMapId: string): Promise<Array<BigMapValue>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axios.get<Array<any>>(
      `${BcdProvider.BCD_URL}/v1/bigmap/${this._tezosNetwork}/${bigMapId}/keys`
    );
    return response.data.map((d) => {
      return {
        keyHash: d.data.key_hash,
        keyString: d.data.key_string,
        value: d.data.value,
      };
    });
  }

  async getStorage(contractAddress: string): Promise<MichelineNode> {
    const response = await axios.get<MichelineNode>(
      `${BcdProvider.BCD_URL}/v1/contract/${this._tezosNetwork}/${contractAddress}/storage`
    );
    return response.data;
  }

  private _tezosNetwork: string;
  private static readonly BCD_URL = 'https://api.better-call.dev';
}

export function createBcd(tezosNetwork: string): BcdProvider {
  return new BcdProvider(tezosNetwork);
}
