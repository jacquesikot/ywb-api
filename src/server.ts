import Logger from './core/Logger';
import { port } from './config';
import app from './app';
import initScheduler from './scheduler';

// Initialize the scheduler for periodic tasks
initScheduler();

app
  .listen(port, () => {
    Logger.info(`server running on port : ${port}`);
  })
  .on('error', (e: any) => Logger.error(e));
