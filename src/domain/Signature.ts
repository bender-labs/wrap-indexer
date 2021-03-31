export interface Erc20MintingSignature {
  wrapId: string;
  signer: string;
  signerAddress: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export interface Erc721MintingSignature {
  wrapId: string;
  signer: string;
  signerAddress: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  tokenId: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export interface Erc20UnwrapSignature {
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
  amount: string;
  operationId: string;
}

export interface Erc721UnwrapSignature {
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
  tokenId: string;
  operationId: string;
}
