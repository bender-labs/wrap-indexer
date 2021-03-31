export interface Token {
  type: 'ERC20' | 'ERC721';
  ethereumSymbol: string;
  ethereumName: string;
  ethereumContractAddress: string;
  decimals: string;
  tezosWrappingContract: string;
  tezosTokenId?: string;
  tezosSymbol: string;
  tezosName: string;
  thumbnailUri?: string;
}
