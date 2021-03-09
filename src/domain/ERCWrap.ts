export type ERC20Wrap = {
  id: string;
  source: string;
  token: string;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
  level: number;
  status: 'asked' | 'finalized';
  amount: string;
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
  status: 'asked' | 'finalized';
  tokenId: string;
}
