import cron from 'node-cron';
import Logger from '../core/Logger';
import refillUserWaves from './wavesRefillJob';

export default function initScheduler(): void {
  Logger.info('Initializing scheduler');

  // Schedule wave refill check to run at midnight every day
  // The job itself will check if 30 days have passed since last refill
  cron.schedule('0 0 * * *', async () => {
    Logger.info('Running scheduled wave refill check job');
    await refillUserWaves();
  });

  Logger.info('Scheduler initialized successfully');
}
