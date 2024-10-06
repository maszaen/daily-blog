'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  function formatContent(content: string) {
    const paragraphs = content.split('\n');

    return paragraphs.map((paragraph, index) => {
      const isNumbered = /^\d+\.\s/.test(paragraph);
      
      return (
        <p key={index} style={{ margin: isNumbered ? '15px 0 0px 0' : '0px' }}>
          <span style={{ fontWeight: isNumbered ? 'bold' : 'normal' }}>
            {paragraph}
          </span>
        </p>
      );
    });
  }

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
    <div className='containernop w-full text-black h-screen'>
      <div className='p-4'>
        <h1 className='text-4xl mb-2'>{post.title}</h1>
        <div className='flex mb-4 flex-col lg:flex-row lg:gap-4 w-full justify-start items start'>
        <p className='text-sm lg:text-md'>{post.category}</p>
        <p className='text-sm lg:text-md'>{formatDate(post.createdAt)}</p>
        <p className='text-sm lg:text-md'>Posted by: {post.userId?.username || 'Unknown'}</p>
        </div>
        <hr className='mb-3'/>
        <div>{formatContent(post.content)}</div>
        <hr className='mt-4'/>      
        <div className='pt-4'>
          <p>Comments: {post.comments.length}</p>
        
          <ol>
            {post.comments.map((comment: any, index: number) => (
              <li key={comment._id} style={{ margin: '10px 0' }}>
                {comment.content}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
