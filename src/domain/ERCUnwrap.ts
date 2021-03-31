export type ERCUnwrapStatus = 'asked' | 'finalized';

export interface ERC20Unwrap {
  id: string;
  source: string;
  token: string;
  ethereumDestination: string;
  operationHash: string;
  level: number;
  status: ERCUnwrapStatus;
  amount: string;
  finalizedAtLevel: number;
}

export interface ERC721Unwrap {
  id: string;
  source: string;
  token: string;
  ethereumDestination: string;
  operationHash: string;
  level: number;
  status: ERCUnwrapStatus;
  tokenId: string;
  finalizedAtLevel: number;
}
