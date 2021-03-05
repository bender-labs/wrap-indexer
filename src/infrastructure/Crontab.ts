import { CronJob } from 'cron';

export class Crontab {

  register(job: () => Promise<void>, pattern: string): void {
    this._jobs.push(new CronJob({ cronTime: pattern, onTick: job, runOnInit: true }));
  }

  start(): void {
    this._jobs.forEach(j => j.start());
  }

  stop(): void {
    this._jobs.forEach(j => j.stop());
  }

  private _jobs: CronJob[] = [];
}
