import { CronJob } from 'cron';
import { Dependencies } from '../bootstrap';
import { Logger } from 'tslog';

export class Crontab {
  constructor(dependencies: Dependencies) {
    this._logger = dependencies.logger;
  }

  register(job: () => Promise<void>, pattern: string): void {
    let taskRunning = false;
    this._jobs.push(
      new CronJob({
        cronTime: pattern,
        onTick: async () => {
          if (taskRunning) {
            this._logger.debug('Task already running');
            return;
          }
          taskRunning = true;
          try {
            await job();
          } finally {
            taskRunning = false;
          }
        },
        runOnInit: true,
      })
    );
  }

  start(): void {
    this._jobs.forEach((j) => j.start());
  }

  stop(): void {
    this._jobs.forEach((j) => j.stop());
  }

  private _jobs: CronJob[] = [];
  private _logger: Logger;
}
