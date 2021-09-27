import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { MichelsonMap, TezosToolkit } from '@taquito/taquito';
import { TezosStackingContractsRepository } from '../../repository/TezosStackingContractsRepository';
import { TezosStackingFee } from '../../domain/TezosStackingContract';
import BigNumber from 'bignumber.js';

type StackingContractStorage = {
  fees: {
    blocks_per_cycle: number;
    default_fees: number;
    fees_per_cycles: MichelsonMap<number, number>;
  };
  ledger: {
    total_supply: number;
  };
  reward: {
    exponent?: string;
    period_end: string;
    reward_per_block: string;
    last_block_update: string;
    accumulated_reward_per_token: string;
  };
  settings: {
    duration: string;
  };
}

export class TezosStackingContractsIndexer {
  constructor({
                logger,
                tezosConfiguration,
                tezosToolkit,
                dbClient
              }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._dbClient = dbClient;
  }

  private _feesLevels(storage: StackingContractStorage): Array<TezosStackingFee> {
    let lastLevel = undefined;
    const result: TezosStackingFee[] = [];
    for (const feesPerCycle of storage.fees.fees_per_cycles.entries()) {
      const level = {
        cycle: +feesPerCycle[0].toString(10),
        ratio: +feesPerCycle[1].toString(10),
        blocksCount: +feesPerCycle[0].toString(10) * storage.fees.blocks_per_cycle.valueOf()
      };
      if (lastLevel && (lastLevel.ratio !== level.ratio)) {
        result.push(lastLevel);
      }
      lastLevel = level;
    }
    result.push(lastLevel);
    return result;
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing stacking contracts`);
    let transaction;
    try {
      const stackingContract = await this._tezosToolkit.contract.at(
        this._tezosConfiguration.stackingContractAddress
      );
      const storage = await stackingContract.storage<StackingContractStorage>();
      const rewardsPerBlock = new BigNumber(storage.reward.reward_per_block);
      const duration = +storage.settings.duration;
      let totalRewards = new BigNumber(0);
      let startLevel = 0;
      let blockHeader = { timestamp: '' };
      if (!rewardsPerBlock.isZero()) {
        let totalRewards = rewardsPerBlock
          .multipliedBy(new BigNumber(storage.settings.duration));
        if (storage.reward.exponent) {
          totalRewards = totalRewards.shiftedBy(-(24 - parseInt(storage.reward.exponent)));
        }
        const startLevel = +storage.reward.period_end - duration;
        blockHeader = await this._tezosToolkit.rpc.getBlockHeader({
          block: startLevel.toString()
        });
      }
      transaction = await this._dbClient.transaction();
      await new TezosStackingContractsRepository(this._dbClient).saveAll(
        [{
          contract: this._tezosConfiguration.stackingContractAddress,
          totalStaked: storage.ledger.total_supply.toString(10),
          fees: { levels: this._feesLevels(storage), default: storage.fees.default_fees.toString(10) },
          duration,
          totalRewards: totalRewards.toString(10),
          startLevel,
          startTimestamp: blockHeader.timestamp
        }],
        transaction
      );
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process tezos stacking contracts ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _dbClient: Knex;
  private _tezosToolkit: TezosToolkit;
}
