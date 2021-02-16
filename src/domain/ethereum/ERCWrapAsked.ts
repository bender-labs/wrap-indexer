import { ethers } from 'ethers';

export class ERC20WrapAsked {
  constructor(
    source: string,
    token: string,
    amount: number,
    tezosDestination: string,
    transactionHash: string,
    blockHash: string,
    logIndex: number,
  ) {
    this.token = token;
    this.amount = amount;
    this.tezosDestination = tezosDestination;
    this.transactionHash = transactionHash;
    this.blockHash = blockHash;
    this.logIndex = logIndex;
    this.source = source;
  }

  table(): string {
    return 'erc20_wraps';
  }

  source: string;
  token: string;
  amount: number;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export class ERC721WrapAsked {
  constructor(
    source: string,
    token: string,
    tokenId: number,
    tezosDestination: string,
    transactionHash: string,
    blockHash: string,
    logIndex: number,
  ) {
    this.token = token;
    this.tokenId = tokenId;
    this.tezosDestination = tezosDestination;
    this.transactionHash = transactionHash;
    this.blockHash = blockHash;
    this.logIndex = logIndex;
    this.source = source;
  }

  table(): string {
    return 'erc721_wraps';
  }

  source: string;
  token: string;
  tokenId: number;
  tezosDestination: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export function buildERCEvent(log: ethers.providers.Log, iface: ethers.utils.Interface): ERC20WrapAsked | ERC721WrapAsked {
  const logDescription = iface.parseLog(log);
  if (logDescription.name === ERC20WrapAsked.name) {
    return new ERC20WrapAsked(logDescription.args['user'], logDescription.args['token'], logDescription.args['amount'].toString(), logDescription.args['tezosDestinationAddress'], log.transactionHash, log.blockHash, log.logIndex);
  }
  return new ERC721WrapAsked(logDescription.args['user'], logDescription.args['token'], logDescription.args['tokenId'].toString(), logDescription.args['tezosDestinationAddress'], log.transactionHash, log.blockHash, log.logIndex);
}
