import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { payFine, payHostelAllotment } from '../controllers/paymentController.js';

const router = express.Router();

// All payment routes are for students
router.use(authenticate);
router.use(authorize('student'));

// Pay a fine
router.post('/fines/:fineId/pay', payFine);

// Pay for hostel allotment
router.post('/hostel/:allotmentId/pay', payHostelAllotment);

export default router;


