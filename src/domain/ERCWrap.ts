export type WrapStatus = 'asked' | 'finalized' | 'reverted';
export type ERCType = 'ERC20' | 'ERC721';

export interface ERCWrap {
  id: string;
  source: string;
  token: string;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
  level: number;
  amount?: string;
  tokenId?: string;
  finalizedAtLevel: number;
  status: WrapStatus;
  type: ERCType;
}
