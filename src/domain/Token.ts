export type Token = {
  type: "ERC20" | "ERC721";
  ethereumSymbol: string;
  ethereumName: string;
  ethereumContractAddress: string;
  decimals: string;
  tezosWrappingContract: string;
  tezosTokenId?: string;
  tezosSymbol: string;
  tezosName: string;
}
