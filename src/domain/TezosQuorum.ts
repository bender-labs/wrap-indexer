import { TezosSigner } from './TezosSigner';

export interface TezosQuorum {
  admin: string;
  threshold: number;
  signers: TezosSigner[];
}
