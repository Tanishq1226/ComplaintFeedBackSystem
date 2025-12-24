import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getProfile,
  submitComplaint,
  submitFeedback,
  getComplaints,
  getFines,
  getAvailableRooms,
  applyForHostel,
  getAllotmentStatus
} from '../controllers/studentController.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Get student profile
router.get('/profile', getProfile);

// Submit complaint
router.post('/complaints', submitComplaint);

// Submit feedback
router.post('/feedback', submitFeedback);

// Get student's complaints
router.get('/complaints', getComplaints);

// Get student's fines
router.get('/fines', getFines);

// Get available hostel rooms
router.get('/hostel/rooms', getAvailableRooms);

// Apply for hostel room
router.post('/hostel/apply', applyForHostel);

// Get student's hostel allotment status
router.get('/hostel/allotment', getAllotmentStatus);

export default router;
