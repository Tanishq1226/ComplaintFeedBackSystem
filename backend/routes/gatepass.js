import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    applyGatepass,
    parentAction,
    wardenAction,
    getMyGatepasses,
    getPendingGatepasses,
    getAllGatepasses
} from '../controllers/gatepassController.js';

const router = express.Router();

// Public route for parent action (No auth needed as they click email link)
// IMPORTANT: In a real app we'd use a signed token in the link to verify authenticity.
// For this MVP, we rely on the ID + Action body from the public frontend page.
router.post('/parent-action', parentAction);

// Student routes
router.post('/apply', authenticate, authorize('student'), applyGatepass);
router.get('/my', authenticate, authorize('student'), getMyGatepasses);

// Warden routes
router.get('/pending', authenticate, authorize('warden'), getPendingGatepasses);
router.get('/all', authenticate, authorize('warden'), getAllGatepasses);
router.put('/:id/action', authenticate, authorize('warden'), wardenAction);

export default router;
