import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    phone: '',
    address: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await api.post('/auth/signup', signupData);

      // Don't set auth yet, ask for OTP
      setUserId(response.data.userId);
      setShowOtpModal(true);

    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { userId, otp });
      setAuth(response.data.token, response.data.user);

      const role = response.data.user.role;
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'librarian') navigate('/librarian/dashboard');
      else if (role === 'teacher') navigate('/teacher/dashboard');
      else if (role === 'warden') navigate('/warden/dashboard');
      else navigate('/');

    } catch (err) {
      setError(err.response?.data?.message || 'OTP Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card signup-card card-animate">
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="signup-grid">

          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} placeholder="Min 6 chars" />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" />
          </div>

          <div className="form-group full-width">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="student">Student</option>
              <option value="librarian">Librarian</option>
              <option value="teacher">Teacher</option>
              <option value="warden">Warden</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="form-group full-width">
                <label>Student ID</label>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required />
              </div>

              <h4 className="full-width" style={{ marginTop: '10px', color: 'var(--primary-600)', paddingBottom: '5px', borderBottom: '1px solid #eee' }}>Parent Details</h4>

              <div className="form-group">
                <label>Parent Name *</label>
                <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Parent Phone *</label>
                <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required />
              </div>

              <div className="form-group full-width">
                <label>Parent Email *</label>
                <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} required />
              </div>

              <h4 className="full-width" style={{ marginTop: '10px', color: 'var(--primary-600)', paddingBottom: '5px', borderBottom: '1px solid #eee' }}>Guardian Details (Optional)</h4>

              <div className="form-group">
                <label>Guardian Name</label>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Guardian Phone</label>
                <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} />
              </div>

              <div className="form-group full-width">
                <label>Guardian Email</label>
                <input type="email" name="guardianEmail" value={formData.guardianEmail} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Personal Phone (Optional)</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>Address (Optional)</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="2" style={{ resize: 'none' }} />
          </div>

          <button type="submit" disabled={loading} className="full-width" style={{ marginTop: '10px' }}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      {showOtpModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content glass-card" style={{ padding: '30px', maxWidth: '400px', width: '100%', background: 'white' }}>
            <h3>Enter Verification Code</h3>
            <p>We have sent a verification code to {formData.email}</p>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;

