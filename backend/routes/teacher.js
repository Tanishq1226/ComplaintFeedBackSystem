import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getComplaints,
  updateComplaint,
  imposeFine,
  getFines,
  deleteFine,
  getFeedbacks,
  deleteFeedback
} from '../controllers/teacherController.js';

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticate);
router.use(authorize('teacher'));

// Get academic complaints
router.get('/complaints', getComplaints);

// Update complaint status
router.put('/complaints/:id', updateComplaint);

// Impose fine
router.post('/fines', imposeFine);

// Get all academic fines
router.get('/fines', getFines);
router.delete('/fines/:id', deleteFine);

// Get academic feedback
router.get('/feedback', getFeedbacks);
router.delete('/feedback/:id', deleteFeedback);

export default router;
