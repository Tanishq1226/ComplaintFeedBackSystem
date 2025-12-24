import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { clearAuth } from '../utils/auth';

const WardenDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [fines, setFines] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showFineForm, setShowFineForm] = useState(false);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    capacity: '',
    floor: '',
    block: '',
    amenities: ''
  });
  const [fineForm, setFineForm] = useState({
    studentId: '',
    amount: '',
    reason: ''
  });
  const [gatepassTab, setGatepassTab] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, allotmentsRes, complaintsRes, finesRes] = await Promise.all([
        api.get('/warden/rooms'),
        api.get('/warden/allotments'),
        api.get('/warden/complaints'),
        api.get('/warden/fines')
      ]);
      setRooms(roomsRes.data.rooms);
      setAllotments(allotmentsRes.data.allotments);
      setComplaints(complaintsRes.data.complaints);
      setFines(finesRes.data.fines);
      try {
        const fb = await api.get('/warden/feedback');
        setFeedbacks(fb.data.feedbacks);
      } catch (e) { }

      try {
        const gp = await api.get('/gatepass/all'); // Use 'all' or 'pending' depending on need, 'all' for history
        setGatepasses(gp.data.gatepasses);
      } catch (e) { }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warden/rooms', {
        ...roomForm,
        capacity: parseInt(roomForm.capacity),
        floor: parseInt(roomForm.floor),
        amenities: roomForm.amenities.split(',').map(a => a.trim()).filter(a => a)
      });
      setShowRoomForm(false);
      setRoomForm({ roomNumber: '', capacity: '', floor: '', block: '', amenities: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add room');
    }
  };

  const handleAllotmentUpdate = async (allotmentId, status, rejectionReason = '') => {
    try {
      await api.put(`/warden/allotments/${allotmentId}`, { status, rejectionReason });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update allotment');
    }
  };

  const handleStatusUpdate = async (complaintId, status, adminResponse = '') => {
    try {
      await api.put(`/warden/complaints/${complaintId}`, { status, adminResponse });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update complaint');
    }
  };

  const handleFineSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warden/fines', fineForm);
      setShowFineForm(false);
      setFineForm({ studentId: '', amount: '', reason: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to impose fine');
    }
  };

  const handleFineDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fine?')) return;
    try {
      await api.delete(`/warden/fines/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete fine');
    }
  };

  const handleFeedbackDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await api.delete(`/warden/feedback/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const handleGatepassAction = async (id, status) => {
    let reason = '';
    if (status === 'rejected') {
      reason = prompt('Reason for rejection:');
      if (!reason) return;
    }

    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

    try {
      await api.put(`/gatepass/${id}/action`, { status, rejectionReason: reason });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-wrapper">
        <div className="dashboard-panel glass-card card-animate">
          <header className="dashboard-header">
            <h1>Warden Dashboard</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </header>

          <nav className="dashboard-nav">
            <button onClick={() => setActiveTab('rooms')} className={activeTab === 'rooms' ? 'active' : ''}>
              Rooms
            </button>
            <button onClick={() => setActiveTab('allotments')} className={activeTab === 'allotments' ? 'active' : ''}>
              Allotments
            </button>
            <button onClick={() => setActiveTab('complaints')} className={activeTab === 'complaints' ? 'active' : ''}>
              Complaints
            </button>
            <button onClick={() => setActiveTab('fines')} className={activeTab === 'fines' ? 'active' : ''}>
              Fines
            </button>
            <button onClick={() => setActiveTab('feedback')} className={activeTab === 'feedback' ? 'active' : ''}>
              Feedback
            </button>
            <button onClick={() => setActiveTab('gatepass')} className={activeTab === 'gatepass' ? 'active' : ''}>
              Gatepass
            </button>
          </nav>

          <main className="dashboard-content">
            {activeTab === 'rooms' && (
              <div className="rooms-section glass-card card-animate">
                <div className="section-header">
                  <h2>Hostel Rooms</h2>
                  <button onClick={() => setShowRoomForm(!showRoomForm)} className="btn-primary">
                    {showRoomForm ? 'Cancel' : 'Add Room'}
                  </button>
                </div>

                {showRoomForm && (
                  <form onSubmit={handleRoomSubmit} className="room-form">
                    <input
                      type="text"
                      placeholder="Room Number"
                      value={roomForm.roomNumber}
                      onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                      required
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Floor"
                      value={roomForm.floor}
                      onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Block"
                      value={roomForm.block}
                      onChange={(e) => setRoomForm({ ...roomForm, block: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Amenities (comma-separated)"
                      value={roomForm.amenities}
                      onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                    />
                    <button type="submit">Add Room</button>
                  </form>
                )}

                <div className="rooms-grid stagger-list">
                  {rooms.map((room) => (
                    <div key={room._id} className="room-card glass-card stagger-item">
                      <h4>Room {room.roomNumber}</h4>
                      <p>Block: {room.block}</p>
                      <p>Floor: {room.floor}</p>
                      <p>Capacity: {room.capacity}</p>
                      <p>Occupied: {room.currentOccupancy}/{room.capacity}</p>
                      <p className={room.isAvailable ? 'available' : 'full'}>
                        {room.isAvailable ? 'Available' : 'Full'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'allotments' && (
              <div className="allotments-section glass-card card-animate">
                <h2>Hostel Allotments</h2>
                <div className="allotments-list stagger-list table-container">
                  {allotments.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No allotment applications</p>
                  ) : (
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Room Requested</th>
                          <th>Applied On</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allotments.map((allotment) => (
                          <tr key={allotment._id}>
                            <td>
                              <div style={{ fontWeight: 'bold' }}>{allotment.student?.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>{allotment.student?.studentId}</div>
                            </td>
                            <td>
                              {allotment.room ? (
                                <div>
                                  <div style={{ fontWeight: 500 }}>Room {allotment.room.roomNumber}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Block {allotment.room.block}, Floor {allotment.room.floor}</div>
                                </div>
                              ) : <span style={{ color: '#aaa' }}>N/A</span>}
                            </td>
                            <td>{new Date(allotment.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge status-${allotment.status}`}>
                                {allotment.status}
                              </span>
                              {allotment.rejectionReason && (
                                <div style={{ fontSize: '0.75rem', color: 'red', marginTop: '4px' }}>Reason: {allotment.rejectionReason}</div>
                              )}
                            </td>
                            <td>
                              {allotment.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleAllotmentUpdate(allotment._id, 'approved')} className="btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                    Approve
                                  </button>
                                  <button onClick={() => {
                                    const reason = prompt('Rejection Reason:');
                                    if (reason) handleAllotmentUpdate(allotment._id, 'rejected', reason);
                                  }} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic' }}>{allotment.status === 'approved' ? 'Allotted' : 'Resolved'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="complaints-section glass-card card-animate">
                <h2>Hostel Complaints</h2>
                <div className="complaints-list stagger-list">
                  {complaints.length === 0 ? (
                    <p>No complaints</p>
                  ) : (
                    complaints.map((complaint) => (
                      <div key={complaint._id} className="complaint-card glass-card stagger-item">
                        <div className="complaint-header">
                          <span className={`status-badge status-${complaint.status}`}>
                            {complaint.status}
                          </span>
                          <span>Student: {complaint.student?.name} ({complaint.student?.studentId})</span>
                        </div>
                        <h3>{complaint.subject}</h3>
                        <p>{complaint.description}</p>
                        {complaint.status === 'pending' && (
                          <div className="action-buttons">
                            <button onClick={() => {
                              const response = prompt('Admin Response (optional):');
                              handleStatusUpdate(complaint._id, 'resolved', response || '');
                            }} className="btn-success">
                              Resolve
                            </button>
                            <button onClick={() => {
                              const response = prompt('Rejection Reason:');
                              handleStatusUpdate(complaint._id, 'rejected', response || '');
                            }} className="btn-danger">
                              Reject
                            </button>
                          </div>
                        )}
                        {complaint.adminResponse && (
                          <div className="admin-response">
                            <strong>Your Response:</strong> {complaint.adminResponse}
                          </div>
                        )}
                        <small>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fines' && (
              <div className="fines-section glass-card card-animate">
                <div className="section-header">
                  <h2>Hostel Fines</h2>
                  <button onClick={() => setShowFineForm(!showFineForm)} className="btn-primary">
                    {showFineForm ? 'Cancel' : 'Impose Fine'}
                  </button>
                </div>

                {showFineForm && (
                  <form onSubmit={handleFineSubmit} className="fine-form">
                    <input
                      type="text"
                      placeholder="Student ID"
                      value={fineForm.studentId}
                      onChange={(e) => setFineForm({ ...fineForm, studentId: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={fineForm.amount}
                      onChange={(e) => setFineForm({ ...fineForm, amount: e.target.value })}
                      required
                      min="1"
                    />
                    <textarea
                      placeholder="Reason"
                      value={fineForm.reason}
                      onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value })}
                      required
                      rows="3"
                    />
                    <button type="submit">Impose Fine</button>
                  </form>
                )}

                <div className="fines-list stagger-list table-container">
                  {fines.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No fines records</p>
                  ) : (
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Imposed On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fines.map((fine) => (
                          <tr key={fine._id}>
                            <td>
                              <div style={{ fontWeight: 'bold' }}>{fine.student?.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>{fine.student?.studentId}</div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: '#dc3545' }}>₹{fine.amount}</span>
                            </td>
                            <td style={{ maxWidth: '250px' }}>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fine.reason}>
                                {fine.reason}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge status-${fine.status}`}>
                                {fine.status}
                              </span>
                            </td>
                            <td>{new Date(fine.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button onClick={() => handleFineDelete(fine._id)} className="btn-icon-delete" title="Delete Fine">
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="feedback-section glass-card card-animate">
                <h2>Feedback</h2>
                <div className="feedback-list stagger-list">
                  {feedbacks.length === 0 ? (
                    <p>No feedback</p>
                  ) : (
                    feedbacks.map((fb) => (
                      <div key={fb._id} className="feedback-card stagger-item">
                        <div className="feedback-header">
                          <div className="feedback-student">{fb.student?.name} • {fb.student?.studentId}</div>
                          <div className="feedback-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="feedback-meta">{new Date(fb.createdAt).toLocaleString()}</div>
                            <button onClick={() => handleFeedbackDelete(fb._id)} className="btn-icon-delete" title="Delete Feedback">
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="feedback-subject">{fb.subject}</div>
                        <div className="feedback-message">{fb.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'gatepass' && (
              <div className="gatepass-section glass-card card-animate">
                <h2>Gatepass Requests</h2>

                <div className="dashboard-nav" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '10px' }}>
                  <button
                    onClick={() => setGatepassTab('pending')}
                    className={gatepassTab === 'pending' ? 'active' : ''}
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setGatepassTab('approved')}
                    className={gatepassTab === 'approved' ? 'active' : ''}
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setGatepassTab('rejected')}
                    className={gatepassTab === 'rejected' ? 'active' : ''}
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Rejected
                  </button>
                </div>

                <div className="gatepass-list stagger-list table-container">
                  {gatepasses.filter(gp => {
                    if (gatepassTab === 'pending') return gp.status === 'pending_warden';
                    if (gatepassTab === 'approved') return gp.status === 'approved';
                    if (gatepassTab === 'rejected') return gp.status === 'rejected' || gp.status === 'rejected_parent';
                    return false;
                  }).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No {gatepassTab} requests found.</div>
                  ) : (
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Date Range</th>
                          <th>Reason</th>
                          <th>Parent Status</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gatepasses
                          .filter(gp => {
                            if (gatepassTab === 'pending') return gp.status === 'pending_warden';
                            if (gatepassTab === 'approved') return gp.status === 'approved';
                            if (gatepassTab === 'rejected') return gp.status === 'rejected' || gp.status === 'rejected_parent';
                            return false;
                          })
                          .map(gp => (
                            <tr key={gp._id}>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{gp.student?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{gp.student?.studentId}</div>
                                {gp.student?.parentPhone && <div style={{ fontSize: '0.75rem', color: '#888' }}>Parent: {gp.student.parentPhone}</div>}
                              </td>
                              <td>
                                <div style={{ fontSize: '0.9rem' }}>{new Date(gp.fromDate).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>to {new Date(gp.toDate).toLocaleDateString()}</div>
                              </td>
                              <td style={{ maxWidth: '200px' }}>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={gp.reason}>
                                  {gp.reason}
                                </div>
                                {gp.rejectionReason && <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '4px' }}>Note: {gp.rejectionReason}</div>}
                              </td>
                              <td>
                                <span className={`status-badge status-${gp.parentApprovalStatus}`}>
                                  {gp.parentApprovalStatus}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge status-${gp.status === 'pending_warden' ? 'pending' : gp.status}`}>
                                  {gp.status.replace(/_/g, ' ')}
                                </span>
                                {gp.approvedBy && <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>By: {gp.approvedBy.name}</div>}
                              </td>
                              <td>
                                {gp.status === 'pending_warden' ? (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={() => handleGatepassAction(gp._id, 'approved')}
                                      className="btn-success"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleGatepassAction(gp._id, 'rejected')}
                                      className="btn-danger"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic' }}>No actions</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;

