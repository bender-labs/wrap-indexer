import { Logger } from 'tslog';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TezosToolkit } from '@taquito/taquito';
import { TzktProvider } from '../../infrastructure/tezos/tzktProvider';
import { TokenRepository } from '../../repository/TokenRepository';
import { TezosNFTsRepository } from '../../repository/TezosNFTsRepository';

export class TezosNFTsIndexer {
  constructor({
    logger,
    tezosToolkit,
    tzkt,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._tezosToolkit = tezosToolkit;
    this._tzkt = tzkt;
    this._dbClient = dbClient;
    this._tokensRepository = new TokenRepository(this._dbClient);
    this._tezosNFTsRepository = new TezosNFTsRepository(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing NFTs on Tezos`);
    const managedNfts = await this._tokensRepository.allByType('ERC721');
    for (const managedNft of managedNfts) {
      let transaction;
      try {
        const nftContract = await this._tezosToolkit.contract.at(
          managedNft.tezosWrappingContract
        );
        const storage = await nftContract.storage();
        const ledgerBigMapId = storage['assets']['ledger'].id.toString(10);
        const bigMapValues = await this._tzkt.getBigMapContent(ledgerBigMapId);
        const tokens = bigMapValues.map((v) => ({
          contract: managedNft.tezosWrappingContract,
          owner: v.value as string,
          tokenId: v.keyString
        }))
        transaction = await this._dbClient.transaction();
        await this._tezosNFTsRepository.saveAll(
          tokens,
          managedNft.tezosWrappingContract,
          transaction
        );
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process NFT ${managedNft.tezosWrappingContract}: ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private _logger: Logger;
  private _dbClient: Knex;
  private _tezosToolkit: TezosToolkit;
  private _tzkt: TzktProvider;
  private _tokensRepository: TokenRepository;
  private _tezosNFTsRepository: TezosNFTsRepository;
}
