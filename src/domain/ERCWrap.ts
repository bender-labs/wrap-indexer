export type ERCWrapStatus = 'asked' | 'finalized';

export interface ERC20Wrap {
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

export interface ERC721Wrap {
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
