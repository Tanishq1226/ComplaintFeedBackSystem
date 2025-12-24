import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { clearAuth } from '../utils/auth';

import StudentGatepass from './StudentGatepass';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [fines, setFines] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allotment, setAllotment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    department: 'library',
    subject: '',
    description: ''
  });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    department: 'library',
    subject: '',
    message: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, complaintsRes, finesRes, roomsRes, allotmentRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/student/complaints'),
        api.get('/student/fines'),
        api.get('/student/hostel/rooms'),
        api.get('/student/hostel/allotment').catch(() => ({ data: { allotment: null } }))
      ]);

      setUser(profileRes.data.user);
      setComplaints(complaintsRes.data.complaints);
      setFines(finesRes.data.fines);
      setRooms(roomsRes.data.rooms);
      setAllotment(allotmentRes.data.allotment);
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

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/student/complaints', complaintForm);
      setShowComplaintForm(false);
      setComplaintForm({ department: 'library', subject: '', description: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit complaint');
    }
  };

  const handleRoomApply = async (roomId) => {
    if (!confirm('Are you sure you want to apply for this room?')) return;

    try {
      await api.post('/student/hostel/apply', { roomId });
      alert('Application submitted successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply for room');
    }
  };

  const handleFinePay = async (fineId) => {
    if (!confirm('Proceed to pay this fine?')) return;

    try {
      await api.post(`/payments/fines/${fineId}/pay`);
      alert('Fine paid successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to pay fine');
    }
  };

  const handleHostelPayment = async () => {
    if (!allotment) return;
    if (!confirm('Proceed to pay hostel allotment fee?')) return;

    try {
      await api.post(`/payments/hostel/${allotment._id}/pay`, {
        amount: 5000
      });
      alert('Hostel payment successful');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to pay hostel fee');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-wrapper">
        <div className="dashboard-panel glass-card card-animate">
          <header className="dashboard-header">
            <h1>Student Dashboard</h1>
            <div>
              <span>Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </header>

          <nav className="dashboard-nav">
            <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
              Profile
            </button>
            <button onClick={() => setActiveTab('complaints')} className={activeTab === 'complaints' ? 'active' : ''}>
              Complaints
            </button>
            <button onClick={() => setActiveTab('fines')} className={activeTab === 'fines' ? 'active' : ''}>
              Fines
            </button>
            <button onClick={() => setActiveTab('hostel')} className={activeTab === 'hostel' ? 'active' : ''}>
              Hostel
            </button>
            <button onClick={() => setActiveTab('feedback')} className={activeTab === 'feedback' ? 'active' : ''}>
              Feedback
            </button>
            <button onClick={() => setActiveTab('gatepass')} className={activeTab === 'gatepass' ? 'active' : ''}>
              Gatepass
            </button>
          </nav>

          <main className="dashboard-content">
            {activeTab === 'profile' && (
              <div className="profile-section glass-card card-animate">
                <h2>My Profile</h2>
                <div className="profile-info">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Student ID:</strong> {user?.studentId}</p>
                  <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {user?.address || 'N/A'}</p>
                  {user?.hostelRoom && (
                    <p><strong>Hostel Room:</strong> {user.hostelRoom.roomNumber} - Block {user.hostelRoom.block}, Floor {user.hostelRoom.floor}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="complaints-section glass-card card-animate">
                <div className="section-header">
                  <h2>My Complaints</h2>
                  <button onClick={() => setShowComplaintForm(!showComplaintForm)} className="btn-primary">
                    {showComplaintForm ? 'Cancel' : 'Submit Complaint'}
                  </button>
                </div>

                {showComplaintForm && (
                  <form onSubmit={handleComplaintSubmit} className="complaint-form glass-card">
                    <select
                      value={complaintForm.department}
                      onChange={(e) => setComplaintForm({ ...complaintForm, department: e.target.value })}
                      required
                    >
                      <option value="library">Library</option>
                      <option value="academics">Academics</option>
                      <option value="hostel">Hostel</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={complaintForm.subject}
                      onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                      required
                    />
                    <textarea
                      placeholder="Description"
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      required
                      rows="4"
                    />
                    <button type="submit">Submit</button>
                  </form>
                )}

                <div className="complaints-list stagger-list">
                  {complaints.length === 0 ? (
                    <p>No complaints submitted</p>
                  ) : (
                    complaints.map((complaint) => (
                      <div key={complaint._id} className="complaint-card glass-card stagger-item">
                        <div className="complaint-header">
                          <span className={`status-badge status-${complaint.status}`}>
                            {complaint.status}
                          </span>
                          <span className="department-badge">{complaint.department}</span>
                        </div>
                        <h3>{complaint.subject}</h3>
                        <p>{complaint.description}</p>
                        {complaint.adminResponse && (
                          <div className="admin-response">
                            <strong>Admin Response:</strong> {complaint.adminResponse}
                          </div>
                        )}
                        <small>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="feedback-section glass-card card-animate">
                <div className="section-header">
                  <h2>Submit Feedback</h2>
                  <button onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="btn-primary">
                    {showFeedbackForm ? 'Cancel' : 'Give Feedback'}
                  </button>
                </div>

                {showFeedbackForm && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await api.post('/student/feedback', feedbackForm);
                      setShowFeedbackForm(false);
                      setFeedbackForm({ department: 'library', subject: '', message: '' });
                      alert('Feedback sent successfully');
                    } catch (error) {
                      alert(error.response?.data?.message || 'Failed to send feedback');
                    }
                  }} className="feedback-form glass-card stagger-item">
                    <div className="form-group">
                      <label>Department</label>
                      <select
                        value={feedbackForm.department}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, department: e.target.value })}
                        required
                      >
                        <option value="library">Library</option>
                        <option value="academics">Academics</option>
                        <option value="hostel">Hostel</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Subject</label>
                      <input
                        type="text"
                        placeholder="Brief subject"
                        value={feedbackForm.subject}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        placeholder="Write your feedback here"
                        value={feedbackForm.message}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                        required
                        rows="5"
                      />
                    </div>

                    <button type="submit" className="btn-primary">Send Feedback</button>
                  </form>
                )}

                <div className="feedback-hint">
                  <p>Choose the department to send your feedback to: <strong>Library</strong>, <strong>Academics (Teachers)</strong>, or <strong>Hostel (Warden)</strong>.</p>
                </div>
              </div>
            )}

            {activeTab === 'fines' && (
              <div className="fines-section glass-card card-animate">
                <h2>My Fines</h2>
                <div className="fines-summary">
                  <h3>Total Pending: ₹{fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)}</h3>
                </div>
                <div className="fines-list stagger-list table-container">
                  {fines.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No fines</p>
                  ) : (
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Imposed On</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fines.map((fine) => (
                          <tr key={fine._id}>
                            <td>
                              <span className="department-badge">{fine.department}</span>
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
                              {fine.status === 'pending' ? (
                                <button
                                  className="btn-primary btn-pay"
                                  onClick={() => handleFinePay(fine._id)}
                                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                                >
                                  Pay Now
                                </button>
                              ) : (
                                <span style={{ color: '#28a745', fontWeight: 600, fontSize: '0.85rem' }}>Paid</span>
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

            {activeTab === 'hostel' && (
              <div className="hostel-section">
                <h2>Hostel Management</h2>

                {allotment ? (
                  <div className="allotment-status">
                    <h3>Your Allotment Status</h3>
                    <div className={`status-badge status-${allotment.status}`}>
                      {allotment.status}
                    </div>
                    {allotment.room && (
                      <p><strong>Room:</strong> {allotment.room.roomNumber} - Block {allotment.room.block}, Floor {allotment.room.floor}</p>
                    )}
                    {allotment.rejectionReason && (
                      <p><strong>Reason:</strong> {allotment.rejectionReason}</p>
                    )}
                    {allotment.status === 'approved' && allotment.paymentStatus !== 'paid' && (
                      <button
                        className="btn-primary"
                        style={{ marginTop: '12px' }}
                        onClick={handleHostelPayment}
                      >
                        Pay Hostel Fee
                      </button>
                    )}
                    {allotment.paymentStatus === 'paid' && (
                      <p style={{ marginTop: '12px', color: '#28a745', fontWeight: 600 }}>
                        Hostel fee paid
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <h3>Available Rooms</h3>
                    <div className="rooms-grid stagger-list">
                      {rooms.length === 0 ? (
                        <p>No rooms available</p>
                      ) : (
                        rooms.map((room) => (
                          <div key={room._id} className="room-card glass-card stagger-item">
                            <h4>Room {room.roomNumber}</h4>
                            <p>Block: {room.block}</p>
                            <p>Floor: {room.floor}</p>
                            <p>Capacity: {room.capacity}</p>
                            <p>Available: {room.capacity - room.currentOccupancy} spots</p>
                            <button onClick={() => handleRoomApply(room._id)} className="btn-primary">
                              Apply
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'gatepass' && (
              <StudentGatepass />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

