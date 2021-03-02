export type ERC20Unwrap = {
  id: string;
  source: string;
  token: string;
  ethereumDestination: string;
  operationId: string;
  status: string;
  amount: number;
}

export type ERC721Unwrap = {
  id: string;
  source: string;
  token: string;
  ethereumDestination: string;
  operationId: string;
  status: string;
  tokenId: number;
}
