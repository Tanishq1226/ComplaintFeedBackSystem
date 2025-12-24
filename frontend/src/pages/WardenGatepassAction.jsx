import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isAuthenticated, getUserRole } from '../utils/auth';

const WardenGatepassAction = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error, unauthorized
    const [message, setMessage] = useState('');

    useEffect(() => {
        const processAction = async () => {
            if (!isAuthenticated()) {
                setStatus('unauthorized');
                return;
            }

            const role = getUserRole();
            if (role !== 'warden') {
                setStatus('error');
                setMessage('Unauthorized: You must be a warden to perform this action.');
                return;
            }

            const id = searchParams.get('id');
            const action = searchParams.get('action'); // approve or reject

            if (!id || !action) {
                setStatus('error');
                setMessage('Invalid link parameters.');
                return;
            }

            const apiStatus = action === 'approve' ? 'approved' : 'rejected';

            try {
                await api.put(`/gatepass/${id}/action`, {
                    status: apiStatus,
                    rejectionReason: action === 'reject' ? 'Rejected via Email Action' : undefined
                });
                setStatus('success');
                setMessage(action === 'approve'
                    ? 'You have successfully approved the gatepass request.'
                    : 'You have rejected the gatepass request.');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to process request.');
            }
        };

        processAction();
    }, [searchParams]);

    if (status === 'unauthorized') {
        return (
            <div className="auth-container">
                <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
                    <h2>Warden Action</h2>
                    <p>You need to be logged in as a Warden to process this request.</p>
                    <button onClick={() => navigate('/login')} style={{ marginTop: '15px' }}>
                        Go to Login
                    </button>
                    <p style={{ fontSize: '0.8em', marginTop: '10px' }}>After logging in, please click the email link again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
                <h2>Warden Action Portal</h2>

                {status === 'loading' && <p>Processing request...</p>}

                {status === 'success' && (
                    <div style={{ color: 'green', marginTop: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                        <p>{message}</p>
                        <button onClick={() => navigate('/warden/dashboard')} style={{ marginTop: '15px' }}>
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ color: 'red', marginTop: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
                        <p>{message}</p>
                        <button onClick={() => navigate('/warden/dashboard')} style={{ marginTop: '15px' }}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WardenGatepassAction;
