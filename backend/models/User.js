import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'librarian', 'teacher', 'warden'],
    required: true
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but enforces uniqueness when present
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  hostelRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelRoom',
    default: null
  },
  // Parent/Guardian Info (Required for Students)
  parentName: { type: String, trim: true },
  parentEmail: { type: String, trim: true, lowercase: true },
  parentPhone: { type: String, trim: true },
  guardianName: { type: String, trim: true },
  guardianEmail: { type: String, trim: true, lowercase: true },
  guardianPhone: { type: String, trim: true },

  // Auth Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

