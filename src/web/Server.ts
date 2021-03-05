import helmet from 'helmet';
import * as express from 'express';
import { Express, NextFunction, Request, Response } from 'express';
import BaseRouter from './routes/Router';
import { Dependencies } from '../bootstrap';

export function httpServer(dependencies: Dependencies): Express {
  const { logger, configuration } = dependencies;
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
  if (configuration.node.environment === 'production') {
    app.use(helmet());
  }
  app.use('/v1', BaseRouter(dependencies));
  return app;
}



