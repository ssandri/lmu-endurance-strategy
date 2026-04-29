import { useState } from 'react';
import { auth } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = isRegister
        ? await auth.register(email, password)
        : await auth.login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>LMU Endurance Strategy</h1>
        <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <p className="toggle" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
}
