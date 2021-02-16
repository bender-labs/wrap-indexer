import { TezosToolkit } from '@taquito/taquito';
import { TezosConfig } from '../../configuration';

export function createTezosToolkit(configuration: TezosConfig): TezosToolkit {
  return new TezosToolkit(configuration.rpc);
}
