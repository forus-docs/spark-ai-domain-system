const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/spark-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, default: 'user' },
  identity: {
    isVerified: { type: Boolean, default: false }
  },
  domains: { type: Array, default: [] },
  apiKeys: { type: Array, default: [] },
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create new user
    const user = new User({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      username: 'testuser',
      role: 'user',
      identity: {
        isVerified: false
      },
      domains: [],
      apiKeys: []
    });

    await user.save();
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();