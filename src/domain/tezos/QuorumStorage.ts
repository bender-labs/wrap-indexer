import { MichelsonMap } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

export interface QuorumStorage {
  admin: string,
  signers: MichelsonMap<string, string>,
  threshold: BigNumber
}

export interface TezosSigner {
  ipnsKey: string,
  publicKey: string
}

export function extractSigners(storage: QuorumStorage): TezosSigner[] {
  const signers: TezosSigner[] = [];
  storage.signers.forEach((val: string, key: string) => {
    signers.push({ ipnsKey: key, publicKey: val});
  });
  return signers;
}
