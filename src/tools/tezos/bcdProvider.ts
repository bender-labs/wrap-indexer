import axios from 'axios';

export type Storage = {
  prim: string,
  type: string,
  name?: string,
  value?: string | number,
  children?: Array<Storage>
}

export class BcdProvider {
  constructor(tezosNetwork: string) {
    this._tezosNetwork = tezosNetwork;
  }

  async getContractOperations(contractAddress: string, entrypoints: string[]) {
    const response = await axios.get(`${BcdProvider.BCD_URL}/v1/contract/${this._tezosNetwork}/${contractAddress}/operations\\?entrypoints\\=${entrypoints.join(',')}`);
    console.log(response);
    return response;
  }

  async getStorage(contractAddress: string): Promise<Storage> {
    const response = await axios.get<Storage>(`${BcdProvider.BCD_URL}/v1/contract/${this._tezosNetwork}/${contractAddress}/storage`);
    return response.data;
  }

  private _tezosNetwork: string;
  static readonly BCD_URL = 'https://api.better-call.dev';
}

export function createBcd(tezosNetwork: string): BcdProvider {
  return new BcdProvider(tezosNetwork);
}
