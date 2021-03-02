import { TezosSigner } from './TezosSigner';

export type TezosQuorum = {
  admin: string;
  threshold: number;
  signers: TezosSigner[];
}
