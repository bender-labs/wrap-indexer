import axios from 'axios';

export interface BigMapValue {
  keyHash: string;
  keyString: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export class TzktProvider {
  constructor(tzKtApiUrl: string) {
    this._tzKtApiUrl = tzKtApiUrl;
  }

  async getBigMapContent(bigMapId: string): Promise<Array<BigMapValue>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axios.get<Array<any>>(
      `${this._tzKtApiUrl}/bigmaps/${bigMapId}/keys`
    );
    return response.data
      .filter((d) => d.active)
      .map((d) => {
        return {
          keyHash: d.hash,
          keyString: d.key,
          value: d.value,
        };
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getStorage<T = any>(
    contractAddress: string,
    level: number
  ): Promise<T> {
    const response = await axios.get<T>(
      `${this._tzKtApiUrl}/contracts/${contractAddress}/storage?level=${level}`
    );
    return response.data;
  }

  private _tzKtApiUrl: string;
}

export function createTzKt(tzKtApiUrl: string): TzktProvider {
  return new TzktProvider(tzKtApiUrl);
}
