'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jwt from 'jsonwebtoken';

export default function Dashboard() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    // Ambil data dari localStorage
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'GET_POSTS' }),
        });

        const data = await response.json();
        if (data.posts) {
          setPosts(data.posts);
        } else {
          console.error('Failed to fetch posts:', data.error);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour12: false,
    };
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const formattedDate = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${formattedTime}, ${formattedDate}`;
  };

  return (
    <div className='text-black justify-start w-full h-full flex flex-col containernop'> 
      <div className='topbar'>
        <div className='searchContainer'>
          <label>
            <input type='text' placeholder='' className='w-full' />
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
      {menu && (
        <div className='h-full w-full flex'>
          <div className='backMenu'>
          <div className='menu'>
            <div>
              <div className='flex flex-row justify-between items-start'>
                <h1 className='font-semibold text-xl md:text-2xl'>{username}</h1>
              </div>
              <p className='text-xs md:text-base'>{email}</p>
              <hr className='mt-3' />
              <div className='text-sm mt-2 flex flex-col'>
                <Link href='/dashboard'>
                  <p className='block py-1'>Dashboard</p>
                </Link>
                <Link href='/create'>
                  <p className='block py-1'>Create Post</p>
                </Link>
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
      )}
      
      <div className='flex flex-col w-full h-screen'>
        {posts.length > 0 ? (
          <div className='flex w-full h-full p-2 sm:p-0 sm:pt-2'>
            <ul className='w-full flex flex-col gap-2'>
              {posts.map((post) => (
                <Link href={`/post/${post._id}`} key={post._id}>
                    <li 
                    className='w-full border-[1px] border-secondary rounded-[10px] px-4 py-2 flex flex-col hover:bg-gray-200 active:bg-gray-300' 
                    key={post._id}
                    >  
                    <div className='w-full'>
                      <p className='text-xs'>Posted by @{post.userId?.username || 'Unknown'} | {formatDate(post.createdAt)}</p>
                      <h3 className='font-semibold'>{post.title}</h3>
                    </div>
                    <hr className='my-2'/>
                    <div className='text-xs flex flex-row justify-between'>
                      <p>Category: Algoritma & Pemrograman</p>
                      <p>Comments: {post.comments.length}</p>
                    </div>
                    </li>
                </Link>
              ))}
            </ul>
          </div>
        ) : (
          <div className='flex w-full h-full p-2 sm:p-0 sm:pt-2'>
            <p>No posts available.</p>
          </div>
        )}
      </div>


    </div>
  );
}
