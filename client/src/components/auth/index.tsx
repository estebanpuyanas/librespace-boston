import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { SafeDatabaseUser } from 'shared/types/user';
import './index.css';

interface AuthPageProps {
  onLogin: (user: SafeDatabaseUser) => void;
}

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, handleLogin, handleRegister, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user =
      mode === 'login'
        ? await handleLogin(username, password)
        : await handleRegister(username, email, password);
    if (user) onLogin(user);
  };

  const switchMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    clearError();
  };

  return (
    <div className='auth-page'>
      <div className='auth-card card'>
        <h1 className='auth-title'>{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>

        {error && <p className='error-message'>{error}</p>}

        <form onSubmit={handleSubmit} className='auth-form'>
          <div className='form-group'>
            <label htmlFor='username'>Username</label>
            <input
              id='username'
              className='input'
              type='text'
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <div className='form-group'>
              <label htmlFor='email'>Email</label>
              <input
                id='email'
                className='input'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <input
              id='password'
              className='input'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type='submit'
            className='btn btn-primary auth-submit'
            disabled={loading}
          >
            {loading ? <span className='spinner' /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className='auth-switch'>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className='auth-switch-btn' onClick={switchMode} type='button'>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
