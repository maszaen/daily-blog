'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  // Get user details from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');

    if (storedUsername && storedEmail) {
      setUsername(storedUsername);
      setEmail(storedEmail);
    } else {
      router.push('/login'); // Redirect to login if user not logged in
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }
  
    setIsSubmitting(true);
    setError('');
  
    try {
      const token = localStorage.getItem('token'); // Fetch the JWT token
  
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CREATE_POST',
          title,
          content,
          token, // Send the token in the request
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
  
      // Redirect to dashboard after success
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  return (
    <div className='text-black containernop flex flex-col justify-start md:justify-start items-start w-full h-screen'>
      <div className='pageInfo'>
        <h1 className='text-3xl font-semibold px-4 pb-6 pt-3'>Create Post <p className='text-sm'>You can post your content here</p></h1>
      </div>
      <form className='authForm h-screen px-2 items-center w-full' onSubmit={handleSubmit}>
        <div className='w-full items-start'>
          <label>
            <input
              className='input'
              id="title"
              type="text"
              placeholder=""
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <span>Title</span>
          </label>
          <hr className='mb-2'/>
          <label>
            <textarea
              id="content"
              placeholder="Write content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </label>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
        <div className='flex flex-row justify-between items-center pl-5 px-2 py-2 absolute border-secondary rounded-full bottom-[3%] gap-[100px]'>
          <p className='text-md'>
            Login as: {email}
          </p>
          <div>
            <button type="submit" disabled={isSubmitting} className='submit'>
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
