// src/lib/mongodb.ts
import mongoose from 'mongoose';

// Define the cached mongoose connection type
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Declare global types
declare global {
  var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local')
}

const MONGODB_URI = process.env.MONGODB_URI;

// Initialize the cached variable with a default value
let cached: MongooseCache = global.mongoose ?? {
  conn: null,
  promise: null,
};

// If global mongoose is undefined, set it
if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  // Cache is now guaranteed to be initialized
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;