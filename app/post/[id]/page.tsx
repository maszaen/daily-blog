'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import send from '../../assets/send.svg';
import downArr from '../../assets/down-arrow.svg';

export default function PostDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        try {
          const response = await fetch('/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_POST_BY_ID', postId: id }),
          });

          const data = await response.json();
          if (data.post) {
            setPost(data.post);
          } else {
            setError(data.error || 'Post not found');
          }
        } catch (error) {
          console.error('Error fetching post:', error);
          setError('Error fetching post');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPost();
  }, [id]);

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

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }

  const formatContent = (content: any) => {
    if (!Array.isArray(content)) {
      console.error('Invalid content format:', content);
      return <p>No content available</p>;
    }
  
    return content.map((item: any, index: number) => {
      if (!item.segments || !Array.isArray(item.segments)) {
        console.error('Invalid segments in content:', item);
        return <p key={index}>Invalid content segment format</p>;
      }
  
      const style: React.CSSProperties = {
        textAlign: item.alignment || 'left',
        margin: '10px 0',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
      };
  
      return (
        <p key={index} style={style}>
          {item.segments.map((segment: { isBold: boolean; text: string }, segIndex: number) => (
            segment.isBold ? (
              <strong key={segIndex}>{segment.text}</strong>
            ) : (
              <span key={segIndex}>{segment.text}</span>
            )
          ))}
        </p>
      );
    });
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
    return `${date.toLocaleTimeString('en-US', options)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content || !post?._id) {
      setError('Content is required.');
      return;
    }
    setError('');
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('User is not authenticated.');
        return;
      }
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CREATE_COMMENT',
          content,
          token,
          postId: post._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      } else {
        setPost((prevPost: any) => ({
          ...prevPost,
          comments: [...prevPost.comments, data.comment],
        }));
        setContent('');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred.');
    }
  };

  const toggleMenu = (commentId: string) => {
    setMenuOpen(prevMenuOpen => (prevMenuOpen === commentId ? null : commentId));
  };

  const deleteComment = async (postId: string, commentId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this comment?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_COMMENT', postId, commentId, token: localStorage.getItem('token') }),
      });

      const data = await response.json();
      if (response.ok) {
        setPost((prevPost: any) => ({
          ...prevPost,
          comments: prevPost.comments.filter((comment: { _id: string }) => comment._id !== commentId),
        }));
        alert('Comment deleted successfully');
        setMenuOpen(null);
      } else {
        console.error('Failed to delete comment:', data.error);
        alert('Error deleting comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment');
    }
  };

  return (
    <div className='containernop w-full text-black h-screen'>
      <div className='p-4 w-full'>
        <h1 className='text-4xl mb-2'>{post.title}</h1>
        <div className='flex mb-4 flex-col lg:flex-row lg:gap-4 w-full'>
          <p className='text-sm lg:text-md'>{post.category || 'General'}</p>
          <p className='text-sm lg:text-md'>{formatDate(post.createdAt)}</p>
          <p className='text-sm lg:text-md'>Posted by: {post.userId?.username || 'Unknown'}</p>
        </div>
        <hr className='mb-3' />
        <div className='w-full'>{formatContent(post.content)}</div>
        <div className='pt-4'>
          <form onSubmit={handleSubmit}>
            <div className='searchContainer flex-row items-center h-full'>
              <label className='w-full'>
                <input 
                  value={content} 
                  type='text' 
                  placeholder='Write your comment...' 
                  className='w-full p-[18px] pr-[50px]'
                  onChange={(e) => setContent(e.target.value)}
                />
              </label>
              <div className='flex justify-center absolute top-0 mb-auto items-center right-0 w-[50px] h-[36px] rounded-full'>
                <button type='submit' className='bg-transparent hover:bg-transparent'>
                  <Image src={send} alt="Send" className='w-[25px] h-[25px] hover:fillblue' />
                </button>
              </div>
            </div>
          </form>
          <p>Comments: {post.comments.length}</p>
          <hr className='mt-4' />
          <div className='flex w-full py-2'>
            <ol className='w-full flex flex-col gap-2'>
              {post.comments.length > 0 ? (
                post.comments.map((comment: any) => (
                  <li key={comment._id} className='w-full relative border-[1px] border-secondary rounded-[10px] px-4 py-2 flex flex-col hover:bg-gray-200 active:bg-gray-300'>
                    <div className='w-full flex flex-row justify-between'>
                      <p className='text-sm text-gray-600'>
                        @{comment.userId?.username || username} at {formatDate(comment.createdAt)}
                      </p>
                      <div className='text-red-500 hover:text-red-700 text-sm cursor-pointer' onClick={() => toggleMenu(comment._id)}>
                        <Image src={downArr} width={20} height={20} alt={'Menu'} />
                      </div>
                    </div>
                    {comment.content || 'No content available'}
                    {menuOpen === comment._id && (
                      <div className='absolute z-30 top-0 right-0 px-3 w-[50%] py-1 border-secondary rounded-[7px] bg-white mr-1 mt-1 shadow-md'>
                        <div className='w-full'>
                          <div className='flex flex-row w-full justify-between items-end'>
                            <h1 className='text-xs'>Options</h1>
                            <h1 className='text-xs text-red-600 hover:font-semibold cursor-pointer' onClick={() => toggleMenu(comment._id)}>Close</h1>
                          </div>
                          <hr className='mt-1' />
                          <div className='w-full flex flex-col gap-2 mt-1 text-sm'>
                            {post.userId.email === email && (
                              <div className='gap-2 flex flex-col'>
                                <p onClick={() => deleteComment(post._id, comment._id)} className='cursor-pointer hover:font-semibold hover:text-red-600'>Delete Comment</p>
                                <p className='cursor-pointer hover:font-semibold'>Edit Comment</p>
                              </div>
                            )}
                            <p className='cursor-pointer hover:font-semibold'>Profile @{post.userId.username} {post.userId.username === username ? "(You)" : ""}</p>
                            <p className='cursor-pointer hover:font-semibold hover:text-green-600'>Copy Text</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))
              ) : (
                <li>No comments yet.</li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
