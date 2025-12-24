import Gatepass from '../models/Gatepass.js';
import User from '../models/User.js';
import {
    sendGatepassRequestToParent,
    sendGatepassInfoToStudent,
    sendGatepassStatusToStudent
} from '../utils/mailer.js';

// Apply for gatepass
export const applyGatepass = async (req, res) => {
    try {
        const { fromDate, toDate, reason } = req.body;

        if (!fromDate || !toDate || !reason) {
            return res.status(400).json({ message: 'Please provide all details' });
        }

        const user = await User.findById(req.user._id);

        if (!user.parentEmail) {
            return res.status(400).json({ message: 'Parent email is missing. Please update profile.' });
        }

        const gatepass = new Gatepass({
            student: req.user._id,
            fromDate,
            toDate,
            reason,
            status: 'pending_parent',
            parentApprovalStatus: 'pending'
        });

        await gatepass.save();

        // Construct approval/rejection links (In production use real frontend URL)
        // Here we assume frontend runs on localhost:5173 or similar.
        // We'll direct them to a frontend page that calls the API.
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const approvalLink = `${frontendUrl}/gatepass-action?id=${gatepass._id}&action=approve`;
        const rejectionLink = `${frontendUrl}/gatepass-action?id=${gatepass._id}&action=reject`;

        console.log('--- Gatepass Link Debugging ---');
        console.log('Frontend URL:', frontendUrl);
        console.log('Generated Approval Link:', approvalLink);
        console.log('Generated Rejection Link:', rejectionLink);
        console.log('-------------------------------');

        const gatepassDetails = { fromDate, toDate, reason };

        // Email parent
        await sendGatepassRequestToParent(user.parentEmail, user.name, gatepass._id, approvalLink, rejectionLink, gatepassDetails);

        // Email student
        await sendGatepassInfoToStudent(user.email, user.name, gatepassDetails);
        // Also email guardian if exists? (Optional requirement, sticking to parent for now as per prompt)

        res.status(201).json({ message: 'Gatepass requested. Waiting for parent approval.', gatepass });

    } catch (error) {
        console.error('Apply gatepass error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Parent Action (Public endpoint or token based? Prompt implies email button)
export const parentAction = async (req, res) => {
    try {
        const { id, action } = req.body;
        // Action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const gatepass = await Gatepass.findById(id).populate('student');
        if (!gatepass) {
            return res.status(404).json({ message: 'Gatepass not found' });
        }

        if (gatepass.status !== 'pending_parent' || gatepass.parentApprovalStatus !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        if (action === 'reject') {
            gatepass.status = 'rejected';
            gatepass.parentApprovalStatus = 'rejected';
            gatepass.rejectionReason = 'Rejected by Parent';
            await gatepass.save();

            // Notify student
            await sendGatepassStatusToStudent(gatepass.student.email, 'rejected', 'Rejected by Parent');

            return res.json({ message: 'Request rejected successfully' });
        }

        // If approved
        gatepass.status = 'pending_warden';
        gatepass.parentApprovalStatus = 'approved';
        await gatepass.save();

        // Notify Wardens
        // User requested to remove Warden Email and use Dashboard only.

        // Notify student (optional at this stage, but good to know)
        // await sendGatepassStatusToStudent(gatepass.student.email, 'pending_warden', 'Approved by parent, pending warden');

        // Notify student (optional at this stage, but good to know)
        // await sendGatepassStatusToStudent(gatepass.student.email, 'pending_warden', 'Approved by parent, pending warden');

        res.json({ message: 'Request approved successfully. Forwarded to Warden.' });

    } catch (error) {
        console.error('Parent action error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Warden Action
export const wardenAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        // status: 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const gatepass = await Gatepass.findById(id).populate('student');
        if (!gatepass) {
            return res.status(404).json({ message: 'Gatepass not found' });
        }

        if (gatepass.status !== 'pending_warden') {
            return res.status(400).json({ message: 'Request is not pending warden approval' });
        }

        gatepass.status = status;
        gatepass.wardenApprovalStatus = status;
        if (status === 'rejected') {
            gatepass.rejectionReason = rejectionReason || 'Rejected by Warden';
        }
        gatepass.approvedBy = req.user._id;

        await gatepass.save();

        // Notify student and parent? Prompt says "mail to parents also which contains button... if any rejects... student got a mail"
        // So final status should be mailed to student. Maybe parent too.

        await sendGatepassStatusToStudent(gatepass.student.email, status, gatepass.rejectionReason);

        // Notify parent of final decision (Optional but good UX)
        // sendEmailSafe({ to: gatepass.student.parentEmail, ... }) // Simplification: skip for now unless requested

        res.json({ message: `Gatepass ${status} successfully`, gatepass });

    } catch (error) {
        console.error('Warden action error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get My Gatepasses (Student)
export const getMyGatepasses = async (req, res) => {
    try {
        const gatepasses = await Gatepass.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json({ gatepasses });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Pending Gatepasses (Warden)
export const getPendingGatepasses = async (req, res) => {
    try {
        const gatepasses = await Gatepass.find({ status: 'pending_warden' })
            .populate('student', 'name email studentId parentName parentPhone')
            .sort({ createdAt: 1 });
        res.json({ gatepasses });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllGatepasses = async (req, res) => {
    try {
        const gatepasses = await Gatepass.find()
            .populate('student', 'name email studentId')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ gatepasses });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}
