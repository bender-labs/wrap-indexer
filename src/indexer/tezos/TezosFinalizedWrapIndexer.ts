import { Logger } from 'tslog';
import { TezosConfig } from '../../configuration';
import { BcdProvider } from '../../infrastructure/tezos/bcdProvider';
import Knex from 'knex';
import { ErcWrapDAO } from '../../dao/ErcWrapDAO';
import { ERC20Wrap, ERC721Wrap } from '../../domain/ERCWrap';

type FinalizedUnwrap = {
  blockHash: string,
  logIndex: number
}

export class TezosFinalizedWrapIndexer {

  constructor(logger: Logger, tezosConfiguration: TezosConfig, bcd: BcdProvider, dbClient: Knex) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._bcd = bcd;
    this._dbClient = dbClient;
    this._wrapDao = new ErcWrapDAO(this._dbClient);
  }

  async index(): Promise<void> {
    const allMints = await this._getAllMints();
    const erc20Wraps = await this._wrapDao.getNotFinalizedERC20();
    this._logger.info(`${erc20Wraps.length} pending erc20 wraps to watch`);
    const erc721Wraps = await this._wrapDao.getNotFinalizedERC721();
    this._logger.info(`${erc721Wraps.length} pending erc721 wraps to watch`);
    const finalizedERC20 = erc20Wraps.filter(w => allMints.includes(w));
    const finalizedERC721 = erc721Wraps.filter(w => allMints.includes(w));
    for (const erc20wrap of finalizedERC20) {
      await this._updateWrapState(erc20wrap);
    }
    for (const erc721wrap of finalizedERC721) {
      await this._updateWrapState(erc721wrap);
    }
  }

  private async _updateWrapState(wrap: ERC20Wrap | ERC721Wrap): Promise<void> {
    let transaction;
    try {
      transaction = await this._dbClient.transaction();
      await this._wrapDao.setAsFinalized(wrap, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process pending wrap ${wrap.transactionHash} ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private async _getAllMints(): Promise<FinalizedUnwrap[]> {
    //TODO: find a way to calculate big map keys to query by keys
    const bigmapId = await this._getMintsBigMapId();
    const content = await this._bcd.getBigMapContent(bigmapId);
    return content.map(r => {
      const keys = r.data.key.children;
      return {
        blockHash: keys.find(k => k.name === 'block_hash').value as string,
        logIndex: keys.find(k => k.name === 'log_index').value as number,
      };
    });
  }

  private async _getMintsBigMapId(): Promise<number> {
    const storage = await this._bcd.getStorage(this._tezosConfiguration.minterContractAddress);
    return storage.children.find(c => c.name === 'assets').children.find(c => c.name === 'mints').value as number;
  }

  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
  private _wrapDao: ErcWrapDAO;
  private _dbClient: Knex;
}
