import Complaint from '../models/Complaint.js';
import Fine from '../models/Fine.js';
import HostelRoom from '../models/HostelRoom.js';
import HostelAllotment from '../models/HostelAllotment.js';
import User from '../models/User.js';
import { sendFineEmail, sendHostelAllotmentEmail } from '../utils/mailer.js';
import Feedback from '../models/Feedback.js';

// Hostel Room Management

// Get all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await HostelRoom.find()
      .sort({ floor: 1, roomNumber: 1 });
    
    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add new room
export const addRoom = async (req, res) => {
  try {
    const { roomNumber, capacity, floor, block, amenities } = req.body;

    if (!roomNumber || !capacity || !floor || !block) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingRoom = await HostelRoom.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = new HostelRoom({
      roomNumber,
      capacity,
      floor,
      block,
      amenities: amenities || [],
      currentOccupancy: 0
    });

    await room.save();

    res.status(201).json({ message: 'Room added successfully', room });
  } catch (error) {
    console.error('Add room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update room
export const updateRoom = async (req, res) => {
  try {
    const { capacity, floor, block, amenities, currentOccupancy } = req.body;
    const { id } = req.params;

    const room = await HostelRoom.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (capacity !== undefined) room.capacity = capacity;
    if (floor !== undefined) room.floor = floor;
    if (block !== undefined) room.block = block;
    if (amenities !== undefined) room.amenities = amenities;
    if (currentOccupancy !== undefined) {
      if (currentOccupancy > room.capacity) {
        return res.status(400).json({ message: 'Occupancy cannot exceed capacity' });
      }
      room.currentOccupancy = currentOccupancy;
    }

    await room.save();

    res.json({ message: 'Room updated successfully', room });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await HostelRoom.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has any allotments
    const allotments = await HostelAllotment.find({ room: id, status: 'approved' });
    if (allotments.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active allotments' 
      });
    }

    await HostelRoom.findByIdAndDelete(id);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Hostel Allotment Management

// Get all allotment applications
export const getAllotments = async (req, res) => {
  try {
    const allotments = await HostelAllotment.find()
      .populate('student', 'name email studentId phone address')
      .populate('room', 'roomNumber block floor capacity currentOccupancy')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json({ allotments });
  } catch (error) {
    console.error('Get allotments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/reject allotment
export const updateAllotment = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }

    const allotment = await HostelAllotment.findById(id)
      .populate('room')
      .populate('student');

    if (!allotment) {
      return res.status(404).json({ message: 'Allotment not found' });
    }

    if (allotment.status !== 'pending') {
      return res.status(400).json({ message: 'Allotment already processed' });
    }

    if (status === 'approved') {
      // Check if room is still available
      if (!allotment.room.isAvailable) {
        return res.status(400).json({ message: 'Room is no longer available' });
      }

      // Check if room has space
      if (allotment.room.currentOccupancy >= allotment.room.capacity) {
        return res.status(400).json({ message: 'Room is full' });
      }

      // Update room occupancy
      allotment.room.currentOccupancy += 1;
      await allotment.room.save();

      // Update student's hostel room
      allotment.student.hostelRoom = allotment.room._id;
      await allotment.student.save();

      allotment.status = 'approved';
      allotment.approvedBy = req.user._id;
      allotment.approvedAt = new Date();
    } else {
      allotment.status = 'rejected';
      allotment.rejectionReason = rejectionReason || 'Application rejected';
    }

    await allotment.save();
    await allotment.populate('student', 'name email studentId');
    await allotment.populate('room', 'roomNumber block floor capacity currentOccupancy');
    await allotment.populate('approvedBy', 'name email role');

    // send email notification (non-blocking)
    sendHostelAllotmentEmail(allotment.student, allotment).catch(() => {});

    res.json({ message: `Allotment ${status} successfully`, allotment });
  } catch (error) {
    console.error('Update allotment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Hostel Complaints

// Get hostel complaints
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ department: 'hostel' })
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
      department: 'hostel' 
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
      department: 'hostel',
      amount,
      reason,
      imposedBy: req.user._id
    });

    await fine.save();
    await fine.populate('student', 'name email studentId');
    await fine.populate('imposedBy', 'name email role');

    // send notification email (non-blocking)
    sendFineEmail(student, fine).catch(() => {});

    res.status(201).json({ message: 'Fine imposed successfully', fine });
  } catch (error) {
    console.error('Impose fine error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all hostel fines
export const getFines = async (req, res) => {
  try {
    const fines = await Fine.find({ department: 'hostel' })
      .populate('student', 'name email studentId')
      .populate('imposedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json({ fines });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get hostel feedback
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ department: 'hostel' })
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
      department: 'hostel'
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
      department: 'hostel'
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
