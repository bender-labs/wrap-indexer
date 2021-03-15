import { TezosConfig } from '../../configuration';
import { TezosToolkit } from '@taquito/taquito';
import { Tzip12Module } from '@taquito/tzip12';

export function createTezosToolkit(configuration: TezosConfig): TezosToolkit {
  const tezosToolkit = new TezosToolkit(configuration.rpc);
  tezosToolkit.addExtension(new Tzip12Module());
  return tezosToolkit;
}
