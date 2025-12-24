import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  getAllotments,
  updateAllotment,
  getComplaints,
  updateComplaint,
  imposeFine,
  getFines,
  deleteFine,
  getFeedbacks,
  deleteFeedback
} from '../controllers/wardenController.js';

const router = express.Router();

// All routes require authentication and warden role
router.use(authenticate);
router.use(authorize('warden'));

// Hostel Room Management
router.get('/rooms', getRooms);
router.post('/rooms', addRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Hostel Allotment Management
router.get('/allotments', getAllotments);
router.put('/allotments/:id', updateAllotment);

// Hostel Complaints
router.get('/complaints', getComplaints);
router.put('/complaints/:id', updateComplaint);

// Hostel Fines
router.post('/fines', imposeFine);
router.get('/fines', getFines);
router.delete('/fines/:id', deleteFine);

// Get hostel feedback
router.get('/feedback', getFeedbacks);
router.delete('/feedback/:id', deleteFeedback);

export default router;
