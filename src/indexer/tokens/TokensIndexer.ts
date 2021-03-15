import { Logger } from 'tslog';
import Knex from 'knex';
import { Dependencies } from '../../bootstrap';
import { TokenDao } from '../../dao/TokenDao';
import { BcdProvider, MichelineNode } from '../../infrastructure/tezos/bcdProvider';
import { Token } from '../../domain/Token';

type TokenDefinition = {
  type: 'ERC20' | 'ERC721';
  ethereumContractAddress: string;
  tezosWrappingContract: string;
  tezosTokenId?: string;
}

export class TokensIndexer {
  constructor({ logger, bcd, tezosConfiguration, dbClient }: Dependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._bcd = bcd;
    this._minterContractAddress = tezosConfiguration.minterContractAddress;
    this._tokenDao = new TokenDao(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.info(`Indexing tokens`);
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
    const storage = await this._bcd.getStorage(this._minterContractAddress);
    const assets = storage[0].children.find(c => c.name === 'assets');
    const erc20Tokens: TokenDefinition[] = assets.children.find(c => c.name === 'erc20_tokens').children.map(c => ({
      type: 'ERC20',
      ethereumContractAddress: '0x' + c.name.toLowerCase(),
      tezosWrappingContract: c.children[0].value as string,
      tezosTokenId: c.children[1].value as string,
    }));
    const erc721Tokens: TokenDefinition[] = assets.children.find(c => c.name === 'erc721_tokens').children.map(c => ({
      type: 'ERC721',
      ethereumContractAddress: '0x' + c.name.toLowerCase(),
      tezosWrappingContract: c.value as string,
    }));
    return erc20Tokens.concat(erc721Tokens);
  }

  private async _getTokenMetadata(definition: TokenDefinition): Promise<Token> {
    let fa2Metadata;
    if (definition.type == 'ERC20') {
      fa2Metadata = (await this._bcd.getTokenMetadata(definition.tezosWrappingContract, definition.tezosTokenId)).children[1];
    } else {
      const storage = await this._bcd.getStorage(definition.tezosWrappingContract);
      fa2Metadata = storage[0].children.find(c => c.name == 'assets').children.find(c => c.name == 'token_info');
    }
    const decimals = this._extractValueFromMetadata(fa2Metadata, 'decimals') as string;
    const ethereumSymbol = this._extractValueFromMetadata(fa2Metadata, 'eth_symbol') as string;
    const ethereumName = this._extractValueFromMetadata(fa2Metadata, 'eth_name') as string;
    const tezosName = this._extractValueFromMetadata(fa2Metadata, 'name') as string;
    const tezosSymbol = this._extractValueFromMetadata(fa2Metadata, 'symbol') as string;
    return {
      type: definition.type,
      ethereumContractAddress: definition.ethereumContractAddress,
      tezosWrappingContract: definition.tezosWrappingContract,
      tezosTokenId: definition.tezosTokenId,
      decimals,
      ethereumSymbol,
      ethereumName,
      tezosName,
      tezosSymbol,
    };
  }

  private _extractValueFromMetadata(fa2Metadata: MichelineNode, name: string): string | number {
    return fa2Metadata.children.find(c => c.name == name).value;
  }

  private _logger: Logger;
  private _dbClient: Knex;
  private _tokenDao: TokenDao;
  private _minterContractAddress: string;
  private _bcd: BcdProvider;
}
