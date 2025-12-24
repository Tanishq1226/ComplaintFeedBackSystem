import Complaint from '../models/Complaint.js';
import Fine from '../models/Fine.js';
import HostelRoom from '../models/HostelRoom.js';
import HostelAllotment from '../models/HostelAllotment.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';

// Get student profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('hostelRoom', 'roomNumber block floor capacity currentOccupancy');
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit complaint
export const submitComplaint = async (req, res) => {
  try {
    const { department, subject, description } = req.body;

    if (!department || !subject || !description) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['library', 'academics', 'hostel'].includes(department)) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const complaint = new Complaint({
      student: req.user._id,
      department,
      subject,
      description
    });

    await complaint.save();
    await complaint.populate('student', 'name email studentId');

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student's complaints
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student's fines
export const getFines = async (req, res) => {
  try {
    const fines = await Fine.find({ student: req.user._id })
      .populate('imposedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    const totalPending = fines
      .filter(fine => fine.status === 'pending')
      .reduce((sum, fine) => sum + fine.amount, 0);
    
    res.json({ fines, totalPending });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get available hostel rooms
export const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await HostelRoom.find({ isAvailable: true })
      .sort({ floor: 1, roomNumber: 1 });
    
    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Apply for hostel room
export const applyForHostel = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'Please provide room ID' });
    }

    // Check if student already has an allotment
    const existingAllotment = await HostelAllotment.findOne({ student: req.user._id });
    if (existingAllotment) {
      return res.status(400).json({ 
        message: 'You already have a hostel allotment application',
        allotment: existingAllotment 
      });
    }

    // Check if room exists and is available
    const room = await HostelRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Create allotment application
    const allotment = new HostelAllotment({
      student: req.user._id,
      room: roomId,
      status: 'pending'
    });

    await allotment.save();
    await allotment.populate('room', 'roomNumber block floor capacity');
    await allotment.populate('student', 'name email studentId');

    res.status(201).json({ 
      message: 'Hostel application submitted successfully', 
      allotment 
    });
  } catch (error) {
    console.error('Apply hostel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student's hostel allotment status
export const getAllotmentStatus = async (req, res) => {
  try {
    const allotment = await HostelAllotment.findOne({ student: req.user._id })
      .populate('room', 'roomNumber block floor capacity currentOccupancy')
      .populate('approvedBy', 'name email role');
    
    if (!allotment) {
      return res.json({ allotment: null });
    }

    res.json({ allotment });
  } catch (error) {
    console.error('Get allotment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit feedback (student -> department)
export const submitFeedback = async (req, res) => {
  try {
    const { department, subject, message } = req.body;

    if (!department || !subject || !message) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['library', 'academics', 'hostel'].includes(department)) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    const feedback = new Feedback({
      student: req.user._id,
      department,
      subject,
      message
    });

    await feedback.save();
    await feedback.populate('student', 'name email studentId');

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

