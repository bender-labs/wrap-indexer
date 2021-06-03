import { Logger } from 'tslog';
import Knex from 'knex';
import * as _ from 'lodash';
import { Dependencies } from '../../bootstrap';
import { TezosStakingContractsRepository } from '../../repository/TezosStakingContractsRepository';
import { BcdProvider, Operation } from '../../infrastructure/tezos/bcdProvider';
import { AppState } from '../state/AppState';
import BigNumber from 'bignumber.js';
import { TezosStakingContractUserBalanceRepository } from '../../repository/TezosStakingContractUserBalanceRepository';

export class TezosStakingContractsUserBalancesIndexer {
  constructor({ logger, bcd, dbClient }: Dependencies) {
    this._logger = logger;
    this._bcd = bcd;
    this._dbClient = dbClient;
    this._appState = new AppState(this._dbClient);
    this._userBalances = new TezosStakingContractUserBalanceRepository(
      this._dbClient
    );
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing staking contracts user balance`);
    let transaction;
    try {
      const contracts = await new TezosStakingContractsRepository(
        this._dbClient
      ).getStakingContracts();
      transaction = await this._dbClient.transaction();
      for (const contract of contracts) {
        const maxLevelProcessed = await this._appState.getStakingContractLevelProcessed(
          contract.contract
        );
        const operations = await this._getAllOperationsUntilLevel(
          contract.contract,
          maxLevelProcessed ? maxLevelProcessed + 1 : maxLevelProcessed
        );
        const groups = _.groupBy(operations, 'source');
        for (const address of Object.keys(groups)) {
          const operations = groups[address] as Operation[];
          const balanceDiff = operations.reduce((acc, value) => {
            let amount = new BigNumber(value.parameters[0].value);
            if (value.parameters[0].name === 'withdraw') {
              amount = amount.negated();
            }
            return acc.plus(amount);
          }, new BigNumber('0'));
          const existingBalance = await this._userBalances.getBalance(
            contract.contract,
            address
          );
          await this._userBalances.save(
            {
              contract: contract.contract,
              tezosAddress: address,
              balance: existingBalance
                ? new BigNumber(existingBalance.balance)
                    .plus(balanceDiff)
                    .toString(10)
                : balanceDiff.toString(10),
            },
            transaction
          );
        }
        if (operations.length > 0) {
          await this._appState.setStakingContractLevelProcessed(
            contract.contract,
            operations[0].level,
            transaction
          );
        }
      }
      await transaction.commit();
    } catch (e) {
      this._logger.error(
        `Can't process tezos staking contracts user balance ${e.message}`
      );
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private async _getAllOperationsUntilLevel(
    contract: string,
    level: number
  ): Promise<Operation[]> {
    const operations: Operation[] = [];
    let lastProcessedId = undefined;
    let inProgress = true;
    do {
      const currentOperations = await this._bcd.getContractOperations(
        contract,
        ['stake', 'withdraw'],
        lastProcessedId
      );
      if (
        currentOperations.operations.length === 0 ||
        currentOperations.operations[currentOperations.operations.length - 1]
          .level < level
      ) {
        inProgress = false;
      } else {
        lastProcessedId = currentOperations.last_id;
      }
      operations.push(
        ...currentOperations.operations.filter(
          (o) => o.status == 'applied' && !o.mempool && o.level >= level
        )
      );
    } while (inProgress);
    return operations;
  }

  private _logger: Logger;
  private _dbClient: Knex;
  private _bcd: BcdProvider;
  private _appState: AppState;
  private _userBalances: TezosStakingContractUserBalanceRepository;
}
