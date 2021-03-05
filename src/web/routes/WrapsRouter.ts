import { Request, Response, Router } from 'express';
import { Dependencies } from '../../bootstrap';
import { ERC20Wrap } from '../../domain/ERCWrap';
import Knex from 'knex';
import { Erc20MintingSignature } from '../../domain/Signature';

type ERC20WrapWithSignatures = {
  source: string;
  destination: string;
  token: string;
  amount: string;
  transactionHash: string;
  signatures: string[];
}

function buildModel(wraps: ERC20Wrap[], signatures: Erc20MintingSignature[]) {
  const result: ERC20WrapWithSignatures[] = [];
  for (const wrap of wraps) {
    const relatedSignatures = signatures.filter(s => s.wrapId == wrap.id).map(s => s.signature);
    result.push({
      source: wrap.source,
      destination: wrap.tezosDestination,
      token: wrap.token,
      amount: wrap.amount.toString(),
      transactionHash: wrap.transactionHash,
      signatures: relatedSignatures
    });
  }
  return result;
}

async function findWraps(tezosAddress: string, ethereumAddress: string, dbClient: Knex): Promise<ERC20WrapWithSignatures[]> {
  const wraps = await dbClient
    .table<ERC20Wrap>('erc20_wraps')
    .where({status: 'asked'})
    .andWhere(function() {
      if (ethereumAddress && tezosAddress) {
        this.where( {source: ethereumAddress} ).orWhere({tezosDestination: tezosAddress});
      } else if (ethereumAddress) {
        this.where({source: ethereumAddress});
      } else {
        this.where({tezosDestination: tezosAddress});
      }
    });
  const signatures = await dbClient.table<Erc20MintingSignature>('signatures').whereIn('wrap_id', wraps.map(w => w.id));
  return buildModel(wraps, signatures);
}


function build(dependencies: Dependencies): Router {
  const router = Router();
  router.get('/', async (req: Request, res: Response) => {
    const tezosAddress = req.query.tezosAddress as string;
    const ethereumAddress = req.query.ethereumAddress as string;
    if (!tezosAddress && !ethereumAddress) {
      return res.status(400).json({message: 'MISSING_ADDRESS'});
    }
    const wraps = await findWraps(tezosAddress, ethereumAddress, dependencies.dbClient);
    return res.json({ erc20Wraps: wraps });
  });
  return router;
}

export default build;
