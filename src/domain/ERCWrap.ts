export type ERCWrapStatus = 'asked' | 'finalized';

export type ERC20Wrap = {
  id: string;
  source: string;
  token: string;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
  level: number;
  status: ERCWrapStatus;
  amount: string;
  finalizedAtLevel: number;
}

export type ERC721Wrap = {
  id: string;
  source: string;
  token: string;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
  level: number;
  status: ERCWrapStatus;
  tokenId: string;
  finalizedAtLevel: number;
}
