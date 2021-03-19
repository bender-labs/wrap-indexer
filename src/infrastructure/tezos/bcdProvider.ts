import axios from 'axios';

export type MichelineNode = {
  prim: string;
  type: string;
  name?: string;
  value?: string | number;
  children?: Array<MichelineNode>;
}

export type Operation = {
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

export type Operations = {
  operations: Array<Operation>;
  last_id: string;
}

export class BcdProvider {
  constructor(tezosNetwork: string) {
    this._tezosNetwork = tezosNetwork;
  }

  async getContractOperations(contractAddress: string, entrypoints: string[], lastId?: string): Promise<Operations> {
    const response = await axios.get<Operations>(`${BcdProvider.BCD_URL}/v1/contract/${this._tezosNetwork}/${contractAddress}/operations\\?entrypoints\\=${entrypoints.join(',')}${lastId ? '&last_id=' + lastId : ''}`);
    return {
      last_id: response.data.last_id,
      operations: response.data.operations.filter(o => entrypoints.includes(o.entrypoint)),
    };
  }

  async getStorage(contractAddress: string): Promise<MichelineNode> {
    const response = await axios.get<MichelineNode>(`${BcdProvider.BCD_URL}/v1/contract/${this._tezosNetwork}/${contractAddress}/storage`);
    return response.data;
  }

  async getTokenMetadata(contractAddress: string, tokenId: string): Promise<MichelineNode> {
    const response = await axios.post<MichelineNode>(`${BcdProvider.BCD_URL}/v1/contract/${this._tezosNetwork}/${contractAddress}/views/execute`, {
      name: 'token_metadata',
      implementation: 0,
      data: { '0': parseInt(tokenId) },
    });
    console.log(response.data);
    return response.data;
  }

  private _tezosNetwork: string;
  private static readonly BCD_URL = 'https://api.better-call.dev';
}

export function createBcd(tezosNetwork: string): BcdProvider {
  return new BcdProvider(tezosNetwork);
}
