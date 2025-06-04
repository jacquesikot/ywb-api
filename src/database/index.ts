import mongoose from 'mongoose';
import { db } from '../config';
import Logger from '../core/Logger';
import { ApiKeyModel, DOCUMENT_NAME } from './model/ApiKey';
import {
  RoleModel,
  DOCUMENT_NAME as ROLE_DOCUMENT_NAME,
  RoleCode,
} from './model/Role';
import {
  SkillModel,
  DOCUMENT_NAME as SKILL_DOCUMENT_NAME,
} from './model/Skill';

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

// Seed roles
const seedRoles = [
  {
    code: RoleCode.CLIENT,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: RoleCode.BUSINESS,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: RoleCode.FREELANCER,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Seed skills
const seedSkills = [
  {
    name: 'FRONTEND',
    slug: 'frontend',
    description: '',
    createdAt: new Date('2025-04-28T17:11:28.745Z'),
    updatedAt: new Date('2025-04-28T17:11:28.745Z'),
  },
  {
    name: 'BACKEND',
    slug: 'backend',
    description: '',
    createdAt: new Date('2025-04-28T17:11:34.988Z'),
    updatedAt: new Date('2025-04-28T17:11:34.988Z'),
  },
  {
    name: 'PROJECT MANAGEMENT',
    slug: 'project-management',
    description: '',
    createdAt: new Date('2025-04-28T17:11:46.966Z'),
    updatedAt: new Date('2025-04-28T17:11:46.966Z'),
  },
  {
    name: 'UI',
    slug: 'ui',
    description: '',
    createdAt: new Date('2025-04-28T17:11:55.373Z'),
    updatedAt: new Date('2025-04-28T17:11:55.373Z'),
  },
];

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

// Function to seed roles
const seedRolesDatabase = async () => {
  try {
    const count = await RoleModel.countDocuments();
    if (count === 0) {
      await RoleModel.insertMany(seedRoles);
      Logger.info(`Seed data inserted in ${ROLE_DOCUMENT_NAME} collection.`);
    } else {
      Logger.info(
        `${ROLE_DOCUMENT_NAME} collection already contains data. No seeding needed.`,
      );
    }
  } catch (error) {
    Logger.error('Error seeding roles database:', error);
  }
};

// Function to seed skills
const seedSkillsDatabase = async () => {
  try {
    const count = await SkillModel.countDocuments();
    if (count === 0) {
      await SkillModel.insertMany(seedSkills);
      Logger.info(`Seed data inserted in ${SKILL_DOCUMENT_NAME} collection.`);
    } else {
      Logger.info(
        `${SKILL_DOCUMENT_NAME} collection already contains data. No seeding needed.`,
      );
    }
  } catch (error) {
    Logger.error('Error seeding skills database:', error);
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
    seedRolesDatabase();
    seedSkillsDatabase();
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
