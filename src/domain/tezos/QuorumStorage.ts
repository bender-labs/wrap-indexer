import { Storage } from '../../tools/tezos/bcdProvider';
import { TezosQuorum } from './TezosQuorum';

export type TezosSigner = {
  ipnsKey: string,
  publicKey: string
}

export function extractQuorum(storage: Storage): TezosQuorum {
  const admin = storage.children.find(c => c.name == 'admin').value as string;
  const threshold = storage.children.find(c => c.name == 'threshold').value as number;
  const signers = storage.children.find(c => c.name == 'signers').children.map(c => ({ipnsKey: c.name, publicKey: c.value as string}));
  return new TezosQuorum(admin, threshold, signers);
}
