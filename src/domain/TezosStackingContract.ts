export interface TezosStackingFee {
  cycle: number;
  blocksCount: number;
  ratio: number;
}

export interface TezosStackingContract {
  contract: string;
  totalStaked: string;
  startLevel: number;
  startTimestamp: string;
  totalRewards: string;
  duration: number;
  fees: {
    levels: Array<TezosStackingFee>
  };
}
