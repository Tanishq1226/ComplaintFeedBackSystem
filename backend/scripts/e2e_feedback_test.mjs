import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_management';
console.log('Connecting to', MONGODB_URI);

try {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const { Schema } = mongoose;

  const userSchema = new Schema({
    name: String,
    email: String,
    studentId: String,
    role: { type: String, default: 'student' }
  }, { timestamps: true });

  const feedbackSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    department: { type: String, enum: ['library','academics','hostel'] },
    subject: String,
    message: String,
    read: { type: Boolean, default: false }
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

  const testUser = await User.create({ name: 'E2E Tester', email: 'e2e@example.test', studentId: 'E2E-001', role: 'student' });
  console.log('Created test user:', testUser._id.toString());

  const fb = await Feedback.create({ student: testUser._id, department: 'academics', subject: 'E2E Subject', message: 'This is an automated E2E test feedback' });
  console.log('Created feedback:', fb._id.toString());

  const found = await Feedback.findById(fb._id).populate('student', 'name email studentId');
  console.log('Found feedback (populated):');
  console.log(JSON.stringify(found, null, 2));

  await Feedback.deleteOne({ _id: fb._id });
  await User.deleteOne({ _id: testUser._id });
  console.log('Cleanup done.');

  await mongoose.disconnect();
  console.log('Disconnected. E2E feedback test completed successfully.');
} catch (err) {
  console.error('E2E test failed:', err);
  process.exitCode = 1;
}
