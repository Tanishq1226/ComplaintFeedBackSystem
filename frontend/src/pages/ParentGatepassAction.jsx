import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const ParentGatepassAction = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const processAction = async () => {
            const id = searchParams.get('id');
            const action = searchParams.get('action');

            if (!id || !action) {
                setStatus('error');
                setMessage('Invalid link parameters.');
                return;
            }

            try {
                await api.post('/gatepass/parent-action', { id, action });
                setStatus('success');
                setMessage(action === 'approve'
                    ? 'You have successfully approved the gatepass request. It has been forwarded to the Warden.'
                    : 'You have rejected the gatepass request.');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to process request. It may have already been processed.');
            }
        };

        processAction();
    }, [searchParams]);

    return (
        <div className="auth-container">
            <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
                <h2>Parent Action Portal</h2>

                {status === 'loading' && <p>Processing request...</p>}

                {status === 'success' && (
                    <div style={{ color: 'green', marginTop: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                        <p>{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ color: 'red', marginTop: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
                        <p>{message}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentGatepassAction;
