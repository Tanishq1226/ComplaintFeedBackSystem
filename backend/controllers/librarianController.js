import Complaint from '../models/Complaint.js';
import Fine from '../models/Fine.js';
import User from '../models/User.js';
import { sendFineEmail } from '../utils/mailer.js';
import Feedback from '../models/Feedback.js';

// Get library complaints
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ department: 'library' })
      .populate('student', 'name email studentId')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update complaint status
export const updateComplaint = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }

    const complaint = await Complaint.findOne({
      _id: id,
      department: 'library'
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    if (adminResponse) {
      complaint.adminResponse = adminResponse;
    }

    if (status === 'resolved' || status === 'rejected') {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();
    await complaint.populate('student', 'name email studentId');
    await complaint.populate('resolvedBy', 'name email role');

    res.json({ message: 'Complaint updated successfully', complaint });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Impose fine
export const imposeFine = async (req, res) => {
  try {
    const { studentId, amount, reason } = req.body;

    if (!studentId || !amount || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Find student strictly by studentId to avoid ObjectId cast errors
    const student = await User.findOne({
      studentId,
      role: 'student'
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fine = new Fine({
      student: student._id,
      department: 'library',
      amount,
      reason,
      imposedBy: req.user._id
    });

    await fine.save();
    await fine.populate('student', 'name email studentId');
    await fine.populate('imposedBy', 'name email role');

    // send notification email (non-blocking)
    sendFineEmail(student, fine).catch(() => { });

    res.status(201).json({ message: 'Fine imposed successfully', fine });
  } catch (error) {
    console.error('Impose fine error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all library fines
export const getFines = async (req, res) => {
  try {
    const fines = await Fine.find({ department: 'library' })
      .populate('student', 'name email studentId')
      .populate('imposedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ fines });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get library feedback
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ department: 'library' })
      .populate('student', 'name email studentId')
      .sort({ createdAt: -1 });

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Delete fine
export const deleteFine = async (req, res) => {
  try {
    const { id } = req.params;

    const fine = await Fine.findOneAndDelete({
      _id: id,
      department: 'library'
    });

    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    res.json({ message: 'Fine deleted successfully' });
  } catch (error) {
    console.error('Delete fine error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOneAndDelete({
      _id: id,
      department: 'library'
    });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
