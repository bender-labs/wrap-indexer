export type Erc20MintingSignature = {
  signer: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount: number;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export type Erc721MintingSignature = {
  signer: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  tokenId: number;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export type Erc20UnwrapSignature = {
  signer: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount: number;
  operationId: string;
}

export type Erc721UnwrapSignature = {
  signer: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  tokenId: number;
  operationId: string;
}
