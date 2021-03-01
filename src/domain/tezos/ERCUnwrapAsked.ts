import Knex from 'knex';
import { Operation } from '../../tools/tezos/bcdProvider';

export class ERC20UnwrapAsked {
  constructor(
    id: string,
    source: string,
    token: string,
    amount: number,
    ethereumDestination: string,
    operationId: string
  ) {
    this.id = id;
    this.source = source;
    this.token = token;
    this.amount = amount;
    this.ethereumDestination = ethereumDestination;
    this.operationId = operationId;
  }

  async save(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('erc20_unwraps').transacting(transaction).insert(this);
  }

  id: string;
  source: string;
  token: string;
  amount: number;
  ethereumDestination: string;
  operationId: string;
}

export class ERC721UnwrapAsked {
  constructor(
    id: string,
    source: string,
    token: string,
    tokenId: number,
    ethereumDestination: string,
    operationId: string
  ) {
    this.id = id;
    this.source = source;
    this.token = token;
    this.tokenId = tokenId;
    this.ethereumDestination = ethereumDestination;
    this.operationId = operationId;
  }

  async save(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('erc721_unwraps').transacting(transaction).insert(this);
  }

  id: string;
  source: string;
  token: string;
  tokenId: number;
  ethereumDestination: string;
  operationId: string;
}

export function parseERCUnwrap(operation: Operation, operationId: string): ERC20UnwrapAsked | ERC721UnwrapAsked | null {
  if (operation.entrypoint === 'unwrap_erc20') {
    return new ERC20UnwrapAsked(
      operation.id,
      operation.source,
      operation.parameters.children.find(c => c.name == "erc_20").value as string,
      operation.parameters.children.find(c => c.name == "amount").value as number,
      operation.parameters.children.find(c => c.name == "destination").value as string,
      operationId)
  } else if (operation.entrypoint === 'unwrap_erc721') {
    return new ERC721UnwrapAsked(
      operation.id,
      operation.source,
      operation.parameters.children.find(c => c.name == "erc_721").value as string,
      operation.parameters.children.find(c => c.name == "token_id").value as number,
      operation.parameters.children.find(c => c.name == "destination").value as string,
      operationId)
  }
  return null;
}
