'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topbar, Loader } from '../export';
import Image from 'next/image';
import downArr from '../assets/down-arrow.svg';

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conn, setConn] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setConn(true);
      try {
        const response = await fetch(`/api?action=GET_POSTS&query=${encodeURIComponent(search)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        setConn(false);
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
    return `${date.toLocaleTimeString('en-US', options)}`;
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const deletePost = async (postId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_POST', postId, token: localStorage.getItem('token') }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
        alert('Post deleted successfully');
      } else {
        console.error('Failed to delete post:', data.error);
        alert('Error deleting post');
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  return (
    <div className='text-black justify-start w-full h-full flex flex-col containernop'>
      <Topbar onSearch={handleSearch} />
      
      {loading ? (
        <div className='flex flex-col w-full justify-center items-center h-screen select-none'>
          <Loader conn={conn} />
        </div>
      ) : (
        <div className='flex flex-col w-full h-screen select-none'>
          {posts.length > 0 ? (
            <div className='flex w-full h-full p-2 sm:p-0 sm:pt-2'>
              <ul className='w-full flex flex-col gap-2'>
                {posts.map((post) => (
                  
                    <li
                      className='w-full relative border-[1px] border-secondary rounded-[10px] px-4 py-2 flex flex-col hover:bg-gray-200 active:bg-gray-300'
                      key={post._id}>
                      <div className='w-full flex flex-row justify-between'>
                        <Link href={`/post/${post._id}`} key={post._id}>
                          <p className='text-xs'>Posted by @{post.userId?.username || 'Unknown'} | {formatDate(post.createdAt)}</p>
                          <h3 className='font-semibold'>{post.title}</h3>
                        </Link>
                        <div
                          className='text-red-500 hover:text-red-700 text-sm'
                          onClick={() => deletePost(post._id)}>
                            <Image src={downArr} width={20} height={20} alt={'Menu'}/>
                        </div>
                      </div>
                      <hr className='my-2'/>
                      <div className='text-xs flex flex-row justify-between'>
                        <p>Category: {post.category || "General"}</p>
                        <p>Comments: {post.comments.length}</p>
                      </div>
                      <div className='flex justify-end'>
                    </div>

                    <div className='flex absolute top-0 right-0 px-3 w-[40%] py-1 border-secondary rounded-[7px] bg-white mr-1 mt-1'>
                      <div>
                        <h1>Options</h1>
                        <div>
                          <p>Delete</p>
                          <p>Edit</p>
                          <p></p>
                        </div>
                      </div>
                    </div>

                    </li>
                  
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
