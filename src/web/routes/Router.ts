import { Router } from 'express';
import PendingWrapsRouter from './PendingWrapsRouter';
import PendingUnwrapsRouter from './PendingUnwrapsRouter';
import { Dependencies } from '../../bootstrap';
import ConfigurationRouter from './ConfigurationRouter';

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.use('/wraps/pending', PendingWrapsRouter(dependencies));
  router.use('/unwraps/pending', PendingUnwrapsRouter(dependencies));
  router.use('/configuration', ConfigurationRouter(dependencies));
  return router;
}

export default build;
