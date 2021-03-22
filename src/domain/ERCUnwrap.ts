export type ERCUnwrapStatus = 'asked' | 'finalized';

export type ERC20Unwrap = {
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

export type ERC721Unwrap = {
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
