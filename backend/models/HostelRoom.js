import mongoose from 'mongoose';

const hostelRoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  floor: {
    type: Number,
    required: true
  },
  block: {
    type: String,
    required: true,
    trim: true
  },
  amenities: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual to check if room is full
hostelRoomSchema.virtual('isFull').get(function() {
  return this.currentOccupancy >= this.capacity;
});

// Update availability based on occupancy
hostelRoomSchema.pre('save', function(next) {
  this.isAvailable = this.currentOccupancy < this.capacity;
  next();
});

export default mongoose.model('HostelRoom', hostelRoomSchema);

