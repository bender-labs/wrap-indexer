import Knex from 'knex';
import { Signer } from '../tezos/QuorumStorage';

export abstract class Signature {
  protected constructor(
    signer: string,
    cid: string,
    type: string,
    signature: string,
    owner: string,
    level: number
  ) {
    this.signer = signer;
    this.cid = cid;
    this.type = type;
    this.signature = signature;
    this.owner = owner;
    this.level = level;
  }

  async save(dbClient: Knex, transaction: Knex.Transaction): Promise<void> {
    await dbClient('signatures')
      .transacting(transaction)
      .insert(this);
  }

  signer: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
}

export class Erc20MintingSignature extends Signature {

  constructor(
    signer: string,
    cid: string,
    signature: string,
    owner: string,
    level: number,
    erc: string,
    amount: number,
    transactionHash: string,
    blockHash: string,
    logIndex: number
  ) {
    super(signer, cid, 'Erc20MintingSigned', signature, owner, level);
    this.erc = erc;
    this.amount = amount;
    this.transactionHash = transactionHash;
    this.blockHash = blockHash;
    this.logIndex = logIndex;
  }

  erc: string;
  amount: number;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export class Erc721MintingSignature extends Signature {

  constructor(
    signer: string,
    cid: string,
    signature: string,
    owner: string,
    level: number,
    erc: string,
    token_id: number,
    transactionHash: string,
    blockHash: string,
    logIndex: number
  ) {
    super(signer, cid, 'Erc721MintingSigned', signature, owner, level);
    this.erc = erc;
    this.tokenId = token_id;
    this.transactionHash = transactionHash;
    this.blockHash = blockHash;
    this.logIndex = logIndex;
  }

  erc: string;
  tokenId: number;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export class Erc20UnwrapSignature extends Signature {
  constructor(
    signer: string,
    cid: string,
    signature: string,
    owner: string,
    level: number,
    erc: string,
    amount: number,
    operationId: string
  ) {
    super(signer, cid, 'Erc20UnwrapSigned', signature, owner, level);
    this.erc = erc;
    this.amount = amount;
    this.operationId = operationId;

  }

  erc: string;
  amount: number;
  operationId: string;
}

export class Erc721UnwrapSignature extends Signature {
  constructor(
    signer: string,
    cid: string,
    signature: string,
    owner: string,
    level: number,
    erc: string,
    tokenId: number,
    operationId: string
  ) {
    super(signer, cid, 'Erc721UnwrapSigned', signature, owner, level);
    this.erc = erc;
    this.tokenId = tokenId;
    this.operationId = operationId;

  }

  erc: string;
  tokenId: number;
  operationId: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function parseSignature(signer: Signer, cid: string, value: any): Signature {
  if (value.type === 'Erc20MintingSigned') {
    return new Erc20MintingSignature(
      signer.ipnsKey,
      cid,
      value.payload.signature,
      value.payload.parameters.owner,
      value.payload.level,
      value.payload.parameters.erc20,
      value.payload.parameters.amount,
      value.payload.transactionHash,
      value.payload.parameters.blockHash,
      value.payload.parameters.logIndex
    );
  } else if (value.type === 'Erc721MintingSigned') {
    return new Erc721MintingSignature(
      signer.ipnsKey,
      cid,
      value.payload.signature,
      value.payload.parameters.owner,
      value.payload.level,
      value.payload.parameters.erc721,
      value.payload.parameters.tokenId,
      value.payload.transactionHash,
      value.payload.parameters.blockHash,
      value.payload.parameters.logIndex
    );
  } else if (value.type === 'Erc20UnwrapSigned') {
    return new Erc20UnwrapSignature(
      signer.ipnsKey,
      cid,
      value.payload.signature,
      value.payload.parameters.owner,
      value.payload.level,
      value.payload.parameters.erc20,
      value.payload.parameters.amount,
      value.payload.parameters.operationId
    );
  } else if (value.type === 'Erc721UnwrapSigned') {
    return new Erc721UnwrapSignature(
      signer.ipnsKey,
      cid,
      value.payload.signature,
      value.payload.parameters.owner,
      value.payload.level,
      value.payload.parameters.erc721,
      value.payload.parameters.tokenId,
      value.payload.parameters.operationId
    );
  }
  return null;
}
