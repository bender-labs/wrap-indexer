import { MichelsonMap } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

export interface QuorumStorage {
  admin: string,
  signers: MichelsonMap<string, string>,
  threshold: BigNumber
}

export interface Signer {
  ipnsKey: string,
  publicKey: string
}

export function extractSigners(storage: QuorumStorage): Signer[] {
  const signers: Signer[] = [];
  storage.signers.forEach((val: string, key: string) => {
    signers.push({ ipnsKey: key, publicKey: val});
  });
  return signers;
}
