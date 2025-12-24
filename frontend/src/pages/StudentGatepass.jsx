import { useState, useEffect } from 'react';
import api from '../utils/api';

const StudentGatepass = () => {
    const [gatepasses, setGatepasses] = useState([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchGatepasses();
    }, []);

    const fetchGatepasses = async () => {
        try {
            const res = await api.get('/gatepass/my');
            setGatepasses(res.data.gatepasses);
        } catch (error) {
            console.error('Error fetching gatepasses', error);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/gatepass/apply', { fromDate, toDate, reason });
            fetchGatepasses();
            setFromDate('');
            setToDate('');
            setReason('');
            alert('Gatepass requested successfully! Please ask your parent to approve via email.');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to apply');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gatepass-section glass-card card-animate" style={{ marginTop: '2rem' }}>
            <div className="section-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '15px' }}>
                <h2>Gatepass Management</h2>
            </div>

            <div className="apply-section" style={{ marginBottom: '3rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>New Application</h3>
                <form onSubmit={handleApply} className="gatepass-form glass-muted" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563' }}>From Date</label>
                            <input type="datetime-local" value={fromDate} onChange={e => setFromDate(e.target.value)} required style={{ height: '45px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563' }}>To Date</label>
                            <input type="datetime-local" value={toDate} onChange={e => setToDate(e.target.value)} required style={{ height: '45px' }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563' }}>Reason for Leave</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} required rows="2" style={{ resize: 'none' }} placeholder="Please specify the reason..." />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px 30px' }}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="gatepass-history staggered-list">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Request History</h3>

                {gatepasses.length === 0 ? (
                    <div className="glass-muted" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                        No gatepass requests found.
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Applied On</th>
                                    <th>Duration</th>
                                    <th style={{ width: '30%' }}>Reason</th>
                                    <th>Status</th>
                                    <th>Approvals</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gatepasses.map(gp => (
                                    <tr key={gp._id}>
                                        <td style={{ fontSize: '0.9rem', color: '#666' }}>
                                            {new Date(gp.createdAt || gp.fromDate).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{new Date(gp.fromDate).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>To {new Date(gp.toDate).toLocaleDateString()}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {gp.reason}
                                            </div>
                                            {gp.rejectionReason && (
                                                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', fontStyle: 'italic' }}>
                                                    Note: {gp.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${gp.status}`}>
                                                {gp.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#666' }}>Parent: </span>
                                                    <span style={{
                                                        color: gp.parentApprovalStatus === 'approved' ? '#166534' :
                                                            gp.parentApprovalStatus === 'rejected' ? '#991b1b' : '#854d0e',
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize'
                                                    }}>{gp.parentApprovalStatus}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#666' }}>Warden: </span>
                                                    <span style={{
                                                        color: gp.wardenApprovalStatus === 'approved' ? '#166534' :
                                                            gp.wardenApprovalStatus === 'rejected' ? '#991b1b' : '#854d0e',
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize'
                                                    }}>{gp.wardenApprovalStatus || 'Pending'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentGatepass;
