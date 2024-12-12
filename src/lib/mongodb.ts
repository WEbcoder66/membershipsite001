// src/lib/mongodb.ts
import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI not set in environment variables.');
}

const MONGODB_URI = process.env.MONGODB_URI;
let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    console.log('Using cached database connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new database connection promise...');
    cached.promise = mongoose.connect(MONGODB_URI!).then((m) => m);
  }

  cached.conn = await cached.promise;
  console.log('New database connection established.');
  return cached.conn;
}

export default dbConnect;
