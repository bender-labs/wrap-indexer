import * as IPFS from 'ipfs-http-client';
import { Config } from '../configuration';

export interface IpfsClient {
  resolve(value: string): Promise<string>
  dag: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(value: string): Promise<any>
  }
}

export function createIpfsClient(configuration: Config): IpfsClient {
  return IPFS({url: configuration.ipfs.nodeUrl});
}
