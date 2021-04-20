export interface MintingFailedEvent {
  wrapId: string;
  type: 'Erc20MintingFailed' | 'Erc721MintingFailed';
  owner: string;
  level: number;
  reason: string;
  erc: string;
  amount?: string;
  tokenId?: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}
