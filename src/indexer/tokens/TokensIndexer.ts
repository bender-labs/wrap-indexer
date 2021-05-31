import { Logger } from 'tslog';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TokenRepository } from '../../repository/TokenRepository';
import { Token } from '../../domain/Token';
import { compose, TezosToolkit } from '@taquito/taquito';
import { tzip12 } from '@taquito/tzip12';
import { tzip16 } from '@taquito/tzip16';

interface TokenDefinition {
  type: 'ERC20' | 'ERC721';
  ethereumContractAddress: string;
  tezosWrappingContract: string;
  tezosTokenId?: string;
}

export class TokensIndexer {
  constructor({
    logger,
    tezosToolkit,
    tezosConfiguration,
    dbClient,
  }: Dependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._tezosToolkit = tezosToolkit;
    this._minterContractAddress = tezosConfiguration.minterContractAddress;
    this._tokenDao = new TokenRepository(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing tokens`);
    const minterTokenDefinitions = await this._getMinterTokens();
    for (const definition of minterTokenDefinitions) {
      let transaction;
      try {
        const token = await this._getTokenMetadata(definition);
        transaction = await this._dbClient.transaction();
        await this._tokenDao.save(token, transaction);
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process token ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getMinterTokens(): Promise<TokenDefinition[]> {
    const minterContract = await this._tezosToolkit.contract.at(
      this._minterContractAddress
    );
    const storage = await minterContract.storage();
    const tokens = [];
    for (const token of storage['assets']['erc20_tokens'].entries()) {
      tokens.push({
        type: 'ERC20',
        ethereumContractAddress: '0x' + token[0],
        tezosWrappingContract: token[1]['0'],
        tezosTokenId: token[1]['1'].toString(),
      });
    }
    for (const token of storage['assets']['erc721_tokens'].entries()) {
      tokens.push({
        type: 'ERC721',
        ethereumContractAddress: '0x' + token[0],
        tezosWrappingContract: token[1],
      });
    }
    return tokens;
  }

  private async _getTokenMetadata(definition: TokenDefinition): Promise<Token> {
    if (definition.type === 'ERC20') {
      const contract = await this._tezosToolkit.contract.at(
        definition.tezosWrappingContract,
        compose(tzip16, tzip12)
      );
      const metadata = await contract
        .tzip12()
        .getTokenMetadata(parseInt(definition.tezosTokenId));
      return {
        type: definition.type,
        ethereumContractAddress: definition.ethereumContractAddress,
        tezosWrappingContract: definition.tezosWrappingContract,
        tezosTokenId: definition.tezosTokenId,
        decimals: metadata.decimals.toString(),
        ethereumSymbol: metadata['eth_symbol'],
        ethereumName: metadata['eth_name'],
        tezosName: metadata.name,
        tezosSymbol: metadata.symbol,
        thumbnailUri: metadata['thumbnailUri'],
      };
    }
    const contract = await this._tezosToolkit.contract.at(
      definition.tezosWrappingContract
    );
    const storage = await contract.storage();
    const tokenInfo = storage['assets']['token_info'];
    return {
      type: definition.type,
      ethereumContractAddress: definition.ethereumContractAddress,
      tezosWrappingContract: definition.tezosWrappingContract,
      tezosTokenId: definition.tezosTokenId,
      decimals: '0',
      ethereumSymbol: Buffer.from(
        tokenInfo.get('eth_symbol'),
        'hex'
      ).toString(),
      ethereumName: Buffer.from(tokenInfo.get('eth_name'), 'hex').toString(),
      tezosName: Buffer.from(tokenInfo.get('name'), 'hex').toString(),
      tezosSymbol: Buffer.from(tokenInfo.get('symbol'), 'hex').toString(),
    };
  }

  private _logger: Logger;
  private _dbClient: Knex;
  private _tokenDao: TokenRepository;
  private _minterContractAddress: string;
  private _tezosToolkit: TezosToolkit;
}
