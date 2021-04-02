export interface WrapSignature {
  wrapId: string;
  signer: string;
  signerAddress: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount?: string;
  tokenId?: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export interface UnwrapSignature {
  id: string;
  wrapId: string;
  signer: string;
  signerAddress: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount?: string;
  tokenId?: string;
  operationId: string;
}
