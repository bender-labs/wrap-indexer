import { Logger } from 'tslog';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { BcdProvider } from '../../infrastructure/tezos/bcdProvider';
import { TzktProvider } from '../../infrastructure/tezos/tzktProvider';
import BigNumber from 'bignumber.js';
import { TezosStakingContractRewardsRepository } from '../../repository/TezosStakingContractRewardsRepository';
import { TezosToolkit } from '@taquito/taquito';

interface StakingContractStorage {
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

export class TezosStakingContractsRewardsIndexer {
  constructor({ logger, bcd, tzkt, dbClient, tezosToolkit }: Dependencies) {
    this._logger = logger;
    this._bcd = bcd;
    this._tzkt = tzkt;
    this._dbClient = dbClient;
    this._tezosToolkit = tezosToolkit;
    this._rewardsRepository = new TezosStakingContractRewardsRepository(
      this._dbClient
    );
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing staking contracts pool status`);
    let transaction;
    try {
      const contracts = await new TezosStakingContractsRepository(
        this._dbClient
      ).getStakingContracts();
      transaction = await this._dbClient.transaction();
      for (const contract of contracts) {
        const operations = await this._bcd.getContractOperations(
          contract.contract,
          ['update_plan']
        );
        if (operations.operations.length > 0) {
          const lastUpdateLevel = operations.operations[0].level;
          const storage = await this._tzkt.getStorage<StakingContractStorage>(
            contract.contract,
            lastUpdateLevel + 1
          );
          let totalRewards = new BigNumber(storage.reward.reward_per_block)
            .multipliedBy(new BigNumber(storage.settings.duration));
          if (storage.reward.exponent) {
            totalRewards = totalRewards.shiftedBy(-(24 - parseInt(storage.reward.exponent)));
          }
          const duration = +storage.settings.duration;
          const startLevel = +storage.reward.period_end - duration;
          const blockHeader = await this._tezosToolkit.rpc.getBlockHeader({
            block: startLevel.toString()
          });
          await this._rewardsRepository.save(
            {
              contract: contract.contract,
              totalRewards: totalRewards.toString(10),
              startLevel,
              startTimestamp: blockHeader.timestamp,
              duration: duration
            },
            transaction
          );
        }
      }
      await transaction.commit();
    } catch (e) {
      this._logger.error(
        `Can't process tezos staking contracts pool status ${e.message}`
      );
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private _logger: Logger;
  private _dbClient: Knex;
  private _bcd: BcdProvider;
  private _tzkt: TzktProvider;
  private _tezosToolkit: TezosToolkit;
  private _rewardsRepository: TezosStakingContractRewardsRepository;
}
