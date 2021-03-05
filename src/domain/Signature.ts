export type Erc20MintingSignature = {
  wrapId: string;
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
  wrapId: string;
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
  id: string;
  wrapId: string;
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
  id: string;
  wrapId: string;
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
