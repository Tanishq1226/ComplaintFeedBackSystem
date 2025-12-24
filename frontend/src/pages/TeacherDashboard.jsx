import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { clearAuth } from '../utils/auth';

const TeacherDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [fines, setFines] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('complaints');
  const [showFineForm, setShowFineForm] = useState(false);
  const [fineForm, setFineForm] = useState({
    studentId: '',
    amount: '',
    reason: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsRes, finesRes] = await Promise.all([
        api.get('/teacher/complaints'),
        api.get('/teacher/fines')
      ]);
      setComplaints(complaintsRes.data.complaints);
      setFines(finesRes.data.fines);
      // fetch feedbacks
      try {
        const fb = await api.get('/teacher/feedback');
        setFeedbacks(fb.data.feedbacks);
      } catch (e) {
        // ignore
      }
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

  const handleStatusUpdate = async (complaintId, status, adminResponse = '') => {
    try {
      await api.put(`/teacher/complaints/${complaintId}`, { status, adminResponse });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update complaint');
    }
  };

  const handleFineSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/fines', fineForm);
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
      await api.delete(`/teacher/fines/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete fine');
    }
  };

  const handleFeedbackDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await api.delete(`/teacher/feedback/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete feedback');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-wrapper">
        <div className="dashboard-panel glass-card card-animate">
          <header className="dashboard-header">
            <h1>Teacher Dashboard</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </header>

          <nav className="dashboard-nav">
            <button onClick={() => setActiveTab('complaints')} className={activeTab === 'complaints' ? 'active' : ''}>
              Complaints
            </button>
            <button onClick={() => setActiveTab('fines')} className={activeTab === 'fines' ? 'active' : ''}>
              Fines
            </button>
            <button onClick={() => setActiveTab('feedback')} className={activeTab === 'feedback' ? 'active' : ''}>
              Feedback
            </button>
          </nav>

          <main className="dashboard-content">
            {activeTab === 'complaints' && (
              <div className="complaints-section glass-card card-animate">
                <h2>Academic Complaints</h2>
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
                  <h2>Academic Fines</h2>
                  <button onClick={() => setShowFineForm(!showFineForm)} className="btn-primary">
                    {showFineForm ? 'Cancel' : 'Impose Fine'}
                  </button>
                </div>

                {showFineForm && (
                  <form onSubmit={handleFineSubmit} className="fine-form glass-card">
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

                <div className="fines-list stagger-list">
                  {fines.length === 0 ? (
                    <p>No fines</p>
                  ) : (
                    fines.map((fine) => (
                      <div key={fine._id} className="fine-card glass-card stagger-item">
                        <div className="fine-header">
                          <span className={`status-badge status-${fine.status}`}>
                            {fine.status}
                          </span>
                          <div className="fine-actions-top" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="amount">₹{fine.amount}</span>
                            <button onClick={() => handleFineDelete(fine._id)} className="btn-icon-delete" title="Delete Fine">
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p><strong>Student:</strong> {fine.student?.name} ({fine.student?.studentId})</p>
                        <p><strong>Reason:</strong> {fine.reason}</p>
                        <small>Imposed: {new Date(fine.createdAt).toLocaleDateString()}</small>
                      </div>
                    ))
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

