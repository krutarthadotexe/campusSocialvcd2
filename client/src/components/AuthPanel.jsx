import { useState } from 'react';
import { useAuth } from '../state/AuthContext.jsx';

const initialRegister = {
  email: '',
  username: '',
  password: '',
  name: '',
  role: 'student',
  rolePassword: ''
};

export function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ emailOrUsername: '', password: '' });
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(loginForm);
      } else {
        await register(registerForm);
        setRegisterForm(initialRegister);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-panel">
      <div className="hero-copy">
        <p className="eyebrow">Campus Social</p>
        <h1>Share moments, build circles, and see your feed come alive through real-time-ready flows.</h1>
        <p className="hero-subtle">
          This React client is wired to your Express backend with JWT access tokens, refresh cookies,
          MongoDB-backed media uploads, and the Instagram-style feed surface you just built.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-switch">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Create account
          </button>
        </div>

        {mode === 'login' ? (
          <>
            <label>
              Email or username
              <input
                value={loginForm.emailOrUsername}
                onChange={(event) => setLoginForm({ ...loginForm, emailOrUsername: event.target.value })}
                placeholder="alice or alice@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Password123"
                required
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Name
              <input
                value={registerForm.name}
                onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Username
              <input
                value={registerForm.username}
                onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                required
              />
            </label>
            <label>
              Role
              <select
                value={registerForm.role}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    role: event.target.value,
                    rolePassword: event.target.value === 'teacher' ? registerForm.rolePassword : ''
                  })
                }
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </label>
            {registerForm.role === 'teacher' ? (
              <label>
                Teacher confirmation password
                <input
                  type="password"
                  value={registerForm.rolePassword}
                  onChange={(event) => setRegisterForm({ ...registerForm, rolePassword: event.target.value })}
                  placeholder="Enter teacher password"
                  required
                />
              </label>
            ) : null}
          </>
        )}

        {error ? <p className="error-banner">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </section>
  );
}
