// app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import googleLogo from '../../assets/google.png';
import Image from 'next/image';

export default function Login() {
  const [login, setLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [note, setNote] = useState(false);
  const [ok, setOk] = useState(false);
  const [load, setLoad] = useState(false);
  const router = useRouter();

  // LOGIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoad(true);
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'LOGIN',
          email,
          password,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('all', JSON.stringify(data)); 
        alert('Login successful! If you are not redirected, refresh the page');
        router.push('/dashboard');
      } else {
        setError(data.error || 'An error occurred');
        setOk(false);
        setNote(true);
        setLoad(false);
      }
    } catch (error) {
      setError('An error occurred while trying to log in');
    }
  };

  // REGISTER
  const register = () => {
    setLogin(!login);
  }
  const handleRegist = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoad(true);
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'REGIST',
          username,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNote(true);
        setOk(true);
        setSuccess('Your account has been created successfully, now you can access additional features');
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        setError(data.error || 'An error occurred');
        setLoad(false);
        setOk(false);
      }
    } catch (error) {
      setError('An error occurred while trying to register');
    }
  };

  const closeToast = () => {
    if (ok) {
      setLogin(true);
      setLoad(false);
      setNote(false);
      setOk(false);
    } else {
      setNote(false);
    }
  };
  
  const testing = async () => {
    setError('');
    const typeEmail = async (email: string) => {
      for (let i = 1; i <= email.length; i++) {
        setEmail(email.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    };
    await typeEmail('exqeon@test.com');

    const typePassword = async (password: string) => {
      for (let i = 1; i <= password.length; i++) {
        setPassword(password.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    };
    await typePassword('Databasetesting209');
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      setLoad(true);
      const testEmail = 'exqeon@test.com';
      const testPassword = 'Databasetesting209';
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'LOGIN',
          email: testEmail,
          password: testPassword,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('all', JSON.stringify(data)); 
        router.push('/dashboard');
      } else {
        setError(data.error || 'An error occurred');
        setOk(false);
        setNote(true);
        setLoad(false);
      }
    } catch (error) {
      setError('An error occurred while trying to log in');
    }
  };
  
  return (
    <div className='container items-center justify-center'>
      {note &&
        <div className='backToast'>
          <div className='toast'>
            <div className='success'>
              <h1>{ok ? "Thanks for registering!" : "Error"}</h1>
              <p>{ok ? success : error}</p>
              <button onClick={closeToast} className='mt-3'>{ok ? "Go to login page" : "Back"}</button>
            </div>
          </div>
        </div>
      }
      {login ? (
      <form className='authForm' onSubmit={handleSubmit}>
        <div className='pageInfo'>
          <h1>Sign in</h1>
          <p>Use your Exqeon Account | <a onClick={testing}>Login with test account</a></p>
        </div>
        <div className='inputUser'>
          <label className='h-[50px] rounded-[3px]  hover:blue w-full flex flex-row items-center justify-center googleAuth'>
            <div className='flex flex-row'>
              <p className='flex flex-row font-bold items-center justify-center gap-2'><Image className='w-8 h-8 scale-[1.1]' src={googleLogo} alt="Google"/> Sign in with Google</p>
            </div>
          </label>
          <label>
            <input
              className='input'
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span>Email</span>
          </label>
          <label>
            <input
              className='input'
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span>Password</span>
          </label>
          <div className='action'>
            <div>
              <a onClick={register}>Create account</a>
            </div>
            <div>
              <button disabled={load} className='submit' type="submit">{load ? "Loading" : "Login"}</button>
            </div>
          </div>
        </div>
      </form>

      ) : (
        <form className='authForm' onSubmit={handleRegist}>
          <div className='pageInfo'>
            <h1>Sign up</h1>
            <p>Register and get full access.</p>
          </div>
          <div className='inputUser'>
            <label>
              <input
                type="text"
                placeholder=""
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <span>Username</span>
            </label>
            <label>
              <input
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span>Email</span>
            </label>
            <label>
              <input
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span>Password</span>
            </label>
            <div className='action'>
              <div>
                <a onClick={register}>Sign in</a>
              </div>
              <div>
                <button disabled={load} className='submit' type="submit">Register</button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );  
} 
