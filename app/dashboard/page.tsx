'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topbar } from '../export';

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);

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
      <Topbar />
      
      <div className='flex flex-col w-full h-screen select-none'>
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
