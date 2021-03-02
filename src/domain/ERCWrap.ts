export type ERC20Wrap = {
  source: string;
  token: string;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
  status: string;
  amount: number;
}

export type ERC721Wrap = {
  source: string;
  token: string;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
  status: string;
  tokenId: number;
}
