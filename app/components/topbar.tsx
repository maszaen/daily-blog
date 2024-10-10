import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import jwt from 'jsonwebtoken';

interface TopbarProps {
  onSearch: (value: string) => void;
}

const Topbar: React.FC<TopbarProps> = ({ onSearch }) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [menu, setMenu] = useState(false);
  const [delayMenu, setDelayMenu] = useState(false);

  useEffect(() => {
    if (menu) {
      const timer = setTimeout(() => setDelayMenu(true), 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setDelayMenu(false), 50);
      return () => clearTimeout(timer);
    }
  }, [menu]);

  const [searchInput, setSearchInput] = useState('');
  
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');

    if (storedUsername && storedEmail) {
      setUsername(storedUsername);
      setEmail(storedEmail);
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const token = localStorage.getItem('token');

    if (token) {
      const decodedToken: any = jwt.decode(token);
      if (decodedToken && decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        alert('Session expired. Please log in again.');
        router.push('/');
      }
    }

    if (storedUsername && storedEmail) {
      setUsername(storedUsername);
      setEmail(storedEmail);
    } else {
      router.push('/');
    }
  }, [router]);

  const removeSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    alert('You have been logged out');
    router.push('/');
  };

  const toggleMenu = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMenu(event.target.checked);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    onSearch(value);
  };

  return (
    <div className="w-full h-full">
      <div className='topbar'>
        <div className='searchContainer'>
          <label>
            <input onChange={handleInputChange} value={searchInput} type='text' placeholder='' className='w-full p-[18px]' />
            <span className=' rounded-full'>Search</span>
          </label>
        </div>
        <label className="z-30 hamburger w-[50px] h-[40px] bg-white rounded-[7px]">
          <input type="checkbox" onChange={toggleMenu} />
          <svg viewBox="0 0 32 32">
            <path
              className="line line-top-bottom"
              d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
            ></path>
            <path className="line" d="M7 16 27 16"></path>
          </svg>
        </label>
      </div>
      <div className={`h-full w-full hidden animated ${menu ? 'flexing' : ''}`}>
        <div className={`backMenu animate-default opacity-0 animated ${delayMenu ? 'opacity-100 animate-card' : ''}`}>
          <div className='menu'>
            <div>
              <div className='flex flex-row justify-between items-start'>
                <h1 className='font-semibold text-xl md:text-2xl'>{username}</h1>
              </div>
              <p className='text-xs md:text-base'>{email}{menu === true ? 'true' : 'false'}</p>
              <hr className='mt-3' />
              <div className='text-sm mt-2 flex flex-row justify-between gap-5'>
                <div className='flex flex-col w-[100px]'>
                  <Link href='/dashboard'>
                    <p className='navItems'>Dashboard</p>
                  </Link>
                  <Link href='/create'>
                    <p className='navItems'>Create Post</p>
                  </Link>
                </div>
                <div className='flex flex-col w-[100px]'>
                  <Link href='/dashboard'>
                    <p className='navItems'>Accessibility</p>
                  </Link>
                  <Link href='/create'>
                    <p className='navItems'>Accounts</p>
                  </Link>
                </div>
                <div className='flex flex-col w-[100px]'>
                  <Link href='/dashboard'>
                    <p className='navItems'>Privacy Policy</p>
                  </Link>
                  <Link href='/create'>
                    <p className='navItems'>Settings</p>
                  </Link>
                </div>
              </div>
            </div>
            <button 
              onClick={removeSession} 
              className='mt-4 mb-2 border-secondary font-semibold hover:font-bold bg-white text-black hover:text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors duration-300'
              >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;