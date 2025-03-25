import mongoose from 'mongoose';
import Logger from '../core/Logger';
import { db, environment } from '../config';
import { ApiKeyModel, DOCUMENT_NAME } from './model/ApiKey';

// Seed document
const seedApiKey = {
  _id: new mongoose.Types.ObjectId('66ea9919dd4e764a994d0292'),
  key: 'da76b42eac9a7f4865a08ae8e6f11bf372a162a9d0e1a2990898ba8296e3433d',
  version: 1,
  permissions: ['ADMIN', 'GENERAL'],
  comments: [],
  status: true,
  createdAt: new Date(parseInt('1726650649487')), // Convert timestamp to Date
  updatedAt: new Date(parseInt('1726650649487')),
};

// Function to check and seed the database
const seedDatabase = async () => {
  try {
    const count = await ApiKeyModel.countDocuments();
    if (count === 0) {
      await ApiKeyModel.create(seedApiKey);
      Logger.info(`Seed data inserted in ${DOCUMENT_NAME} collection.`);
    } else {
      Logger.info(
        `${DOCUMENT_NAME} collection already contains data. No seeding needed.`,
      );
    }
  } catch (error) {
    Logger.error('Error seeding database:', error);
  }
};

// Build the connection string
export const mongoDBURI = `mongodb+srv://${db.user}:${encodeURIComponent(db.password)}@${
  db.host
}/?retryWrites=true&w=majority&appName=${db.appName}`;
const dbURI = mongoDBURI;

const options = {
  autoIndex: true,
  minPoolSize: db.minPoolSize, // Maintain up to x socket connections
  maxPoolSize: db.maxPoolSize, // Maintain up to x socket connections
  connectTimeoutMS: 120000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

Logger.debug(dbURI);

function setRunValidators() {
  this.setOptions({ runValidators: true });
}

mongoose.set('strictQuery', true);

// Create the database connection
mongoose
  .plugin((schema: any) => {
    schema.pre('findOneAndUpdate', setRunValidators);
    schema.pre('updateMany', setRunValidators);
    schema.pre('updateOne', setRunValidators);
    schema.pre('update', setRunValidators);
  })
  .connect(dbURI, options)
  .then(() => {
    seedDatabase();
    Logger.info('Mongoose connection done');
  })
  .catch((e) => {
    Logger.info('Mongoose connection error');
    Logger.error(e);
  });

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
  Logger.debug('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  Logger.error('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  Logger.info('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close().finally(() => {
    Logger.info(
      'Mongoose default connection disconnected through app termination',
    );
    process.exit(0);
  });
});

export const connection = mongoose.connection;
