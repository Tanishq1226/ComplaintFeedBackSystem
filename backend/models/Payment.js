import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['fine', 'hostel_allotment'],
    required: true
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Fine', 'HostelAllotment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success' // simulate successful payments for now
  },
  provider: {
    type: String,
    default: 'mock'
  },
  providerPaymentId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);


