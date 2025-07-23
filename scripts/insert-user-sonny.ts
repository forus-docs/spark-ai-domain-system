import { connectToDatabase } from '../app/lib/database';
import User from '../app/models/User';
import mongoose from 'mongoose';

async function insertUser() {
  try {
    await connectToDatabase();
    
    console.log('🌱 Inserting user...');

    // Create the user
    const user = await User.create({
      email: "sonny@forus.digital",
      password: "$2b$10$OX/m6b53WkMJQfzo3ApjcO8G4MlfiYF3cJPN.IcKmz5tnmkRMh4je",
      name: "Sonny Fisher",
      username: "sonny",
      role: "user",
      identity: {
        isVerified: false
      },
      domains: [],
      apiKeys: [],
      createdAt: new Date("2025-07-22T09:55:38.569Z"),
      updatedAt: new Date("2025-07-22T09:55:38.569Z"),
      __v: 0
    });

    console.log('✅ User inserted successfully!');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);

  } catch (error) {
    console.error('❌ Error inserting user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the insert script
insertUser();