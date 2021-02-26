import helmet from 'helmet';
import * as express from 'express';
import { Express, NextFunction, Request, Response } from 'express';
import BaseRouter from './routes/Router';
import { Logger } from 'tslog';
import { Config } from '../configuration';

export function httpServer(logger: Logger, configuration: Config): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url} ${res.statusCode}`)
    next();
  });
  if (configuration.node.environment === 'production') {
    app.use(helmet());
  }
  app.use('/v1', BaseRouter);
  return app;
}



