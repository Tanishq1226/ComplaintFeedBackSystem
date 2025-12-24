import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';

dotenv.config();

async function main() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const timestamp = Date.now();
    const testEmail = `e2e-test-${timestamp}@example.com`;

    // Create test student user
    const user = await User.create({
      name: 'E2E Test Student',
      email: testEmail,
      password: 'password123',
      role: 'student',
      studentId: `E2E${timestamp}`
    });
    console.log('Created test user:', user._id.toString());

    // Create feedback targeted at library
    const fb = await Feedback.create({
      student: user._id,
      department: 'library',
      subject: 'E2E Test Feedback',
      message: 'This feedback was created by the automated E2E script.'
    });
    console.log('Created feedback:', fb._id.toString());

    // Query feedbacks for library department and print
    const libraryFeedbacks = await Feedback.find({ department: 'library' }).populate('student', 'name email studentId').lean();
    console.log('Library feedbacks count:', libraryFeedbacks.length);
    console.log(JSON.stringify(libraryFeedbacks, null, 2));

    // Cleanup the test records
    await Feedback.deleteOne({ _id: fb._id });
    await User.deleteOne({ _id: user._id });
    console.log('Cleanup complete');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('E2E test error:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

main();
