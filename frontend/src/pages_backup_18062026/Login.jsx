import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://recruitment.inceptarc.com';

export default function Login({ onLogin }) {
  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/google`, {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user_email', res.data.email);
      localStorage.setItem('user_name', res.data.name);
      onLogin();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      alert(msg);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f0f2f5'
    }}>
      <div style={{
        background: 'white', padding: '48px', borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '8px', color: '#1a1a2e' }}>Inceptarc</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>AI Recruitment System</p>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={(err) => {
            console.error('Google error:', err);
            alert('Google login failed. Please allow popups for this site.');
          }}
        />
      </div>
    </div>
  );
}
