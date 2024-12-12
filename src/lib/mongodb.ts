// src/lib/mongodb.ts
import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Ensure we don't re-initiate a Mongoose connection in dev mode's HMR.
  // This variable is used to cache the connection.
  var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;
let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    // If already connected, return the cached connection.
    return cached.conn;
  }

  if (!cached.promise) {
    // Create a new connection promise if one doesn’t exist yet.
    cached.promise = mongoose.connect(MONGODB_URI!).then((m) => m);
  }

  // Await the connection and cache it.
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
