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

  private _tzKtApiUrl: string;
}

export function createTzKt(tzKtApiUrl: string): TzktProvider {
  return new TzktProvider(tzKtApiUrl);
}
