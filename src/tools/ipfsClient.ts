import * as IPFS from 'ipfs-http-client';
import { Config } from '../configuration';

export type IpfsResolveOptions = {
  timeout: number
}

export interface IpfsClient {
  resolve(value: string, options: IpfsResolveOptions): Promise<string>;
  dag: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(value: string): Promise<any>
  };
  pin: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    add(value: string): Promise<any>
  }
}

export function createIpfsClient(configuration: Config): IpfsClient {
  return IPFS({url: configuration.ipfs.nodeUrl});
}
