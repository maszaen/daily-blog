'use client'
import { SetStateAction, useEffect, useState } from 'react';
import Link from 'next/link';
import { Topbar, Loader } from '../export';

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conn, setConn] = useState(false);
  const [getPost, setGetPost] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api?action=GET_POSTS&query=${encodeURIComponent(search)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        setConn(data.conn);
        setGetPost(data.act);
        if (data.posts) {
          setLoading(false);
          setPosts(data.posts);
        } else {
          setLoading(false);
          console.error('Failed to fetch posts:', data.error);
        }
      } catch (error) {
        setLoading(false);
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, [search]);

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
    return `${date.toLocaleTimeString('en-US', options)}, ${date.toLocaleDateString('en-US', options)}`;
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  return (
    <div className='text-black justify-start w-full h-full flex flex-col containernop'>
      <Topbar onSearch={handleSearch} />
      
      {loading ? (
        <div className='flex flex-col w-full justify-center items-center h-screen select-none'>
          <Loader conn={conn} getPost={getPost} />
        </div>
      ) : (
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
                        <p>Category: {post.category}</p>
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
      )}
    </div>
  );
}
