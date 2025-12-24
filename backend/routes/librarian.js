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
} from '../controllers/librarianController.js';

const router = express.Router();

// All routes require authentication and librarian role
router.use(authenticate);
router.use(authorize('librarian'));

// Get library complaints
router.get('/complaints', getComplaints);

// Update complaint status
router.put('/complaints/:id', updateComplaint);

// Impose fine
router.post('/fines', imposeFine);

// Get all library fines
router.get('/fines', getFines);
router.delete('/fines/:id', deleteFine);

// Get library feedback
router.get('/feedback', getFeedbacks);
router.delete('/feedback/:id', deleteFeedback);

export default router;
