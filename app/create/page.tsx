'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');

    if (storedUsername && storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !category) {
      setError('Title and content are required.');
      return;
    }
  
    setIsSubmitting(true);
    setError('');
  
    try {
      const token = localStorage.getItem('token');
  
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CREATE_POST',
          title,
          content,
          category,
          token,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className='text-black containernop flex flex-col justify-start items-start w-full h-full'>
      {/* topbar */}
      <div className='pageInfo'>
        <h1 className='text-3xl font-semibold px-4 pb-6 pt-3'>Create Post <p className='text-sm'>You can post your content here</p></h1>
      </div>
      <form className='authForm lg:flex-col h-screen px-2 items-center w-full' onSubmit={handleSubmit}>
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
          <label>
            <input
              className='input'
              id="title"
              type="text"
              placeholder=""
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <span>Category</span>
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
        </div>
        <div className='flex flex-row px-4 absolute bottom-[3%] w-full '>
        <div className='flex flex-row items-center justify-between pl-5 px-2 py-2 border-secondary rounded-full w-full'>
          <p className='text-md'>
            User: {email} {error && <p style={{ color: 'red' }}>{error}</p>}
          </p>
          <div>
            <button type="submit" disabled={isSubmitting} className='submit'>
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </div>
        </div>

      </form>
    </div>
  );
}
