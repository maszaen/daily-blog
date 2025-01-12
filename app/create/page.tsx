'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JSZip from 'jszip';
import { IContentItem } from '@/models/schema';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<IContentItem[]>([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [action, setAction] = useState<'CREATE_POST' | 'UPDATE_POST'>('CREATE_POST');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const postId = searchParams.get('id');

    if (storedUsername && storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push('/login');
    }
    if (postId) {
      setAction('UPDATE_POST');
      fetchPostData(postId);
    } else {
      setAction('CREATE_POST');
    }
  }, [router, searchParams]);

  const fetchPostData = async (postId: string) => {
    try {
        const response = await fetch(`/api`, 
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'GET_POST_BY_ID',
              postId: postId,
            }),
          });
        const data = await response.json();
        console.log(data);

        if (response.ok) {
            setTitle(data.post?.title);
            setCategory(data.post?.category);
            setShowPreview(true);
            console.log('Title:', title);
            console.log('Category:', category);
        } else {
            setError(data.error || 'Error fetching post');
        }
    } catch (err) {
        console.error('Error fetching post:', err);
        setError('Error fetching post data');
    }};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.docx$/, ''));
      setCategory('');
      setShowPreview(false);
    }
  };
  
  const handleFileUpload = async () => {
    if (!category) {
      setError('Please complete all form fields.');
      return;
    }
  
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docFile = zip.file("word/document.xml");
  
        if (!docFile) {
          throw new Error('Document file not found in the ZIP archive.');
        }
        const doc = await docFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(doc, "application/xml");
  
        const paragraphs = xmlDoc.getElementsByTagName("w:p");
        const contentArray = Array.from(paragraphs).map(paragraph => {
          const textNodes = Array.from(paragraph.getElementsByTagName("w:t"));
          const alignmentNode = paragraph.getElementsByTagName("w:jc")[0];
          const spacingNode = paragraph.getElementsByTagName("w:spacing")[0];
          const bulletNode = paragraph.getElementsByTagName("w:numPr")[0];
          const firstLineIndentNode = paragraph.getElementsByTagName("w:ind")[0];
  
          let alignment = alignmentNode ? alignmentNode.getAttribute("w:val") as "center" | "left" | "right" : "left";
          const spacing = spacingNode ? parseFloat(spacingNode.getAttribute("w:after") || '0') : null;
  
          const bullet = bulletNode && bulletNode.getElementsByTagName("w:ilvl").length > 0;
  
          let firstLineIndent = firstLineIndentNode ? parseFloat(firstLineIndentNode.getAttribute("w:firstLine") || '0') : 0;
  
          firstLineIndent = firstLineIndent / 10;
  
          const validAlignments = ['left', 'right', 'center', 'justify'];
          if (!validAlignments.includes(alignment || '')) {
            alignment = 'left';
          }
  
          const segments = [];
          let currentSegment = { text: '', isBold: false };
  
          textNodes.forEach((node) => {
            const parent = node.parentNode;
            const isBold = parent && (parent as Element).getElementsByTagName("w:b").length > 0;
            const textContent = node.textContent || '';
  
            if (currentSegment.isBold !== isBold) {
              if (currentSegment.text.trim() !== '') {
                segments.push(currentSegment);
              }
              currentSegment = { text: textContent, isBold: isBold || false };
            } else {
              currentSegment.text += textContent;
            }
          });
  
          if (currentSegment.text.trim() !== '') {
            segments.push(currentSegment);
          }
  
          return {
            alignment,
            segments,
            spacing,
            firstLineIndent,
            bullet,
            lineCount: segments.length,
          };
        }).filter(item => item.segments.length > 0);
  
        setContent(contentArray as IContentItem[]);
        setError('');
        setShowPreview(true);
      } catch (err) {
        setError('Error reading the file. Please try again.');
        console.error('Error reading file:', err);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedContent = content.map(item => ({
      alignment: item.alignment,
      segments: item.segments.map(segment => ({
        isBold: segment.isBold,
        text: segment.text,
      })),
      spacing: item.spacing,
      firstLineIndent: item.firstLineIndent,
      bullet: item.bullet,
      lineCount: item.lineCount,
    }));

    if (!title || !category || !formattedContent.length || formattedContent.some(item => !item.segments.length || !item.segments.some(seg => seg.text.trim()))) {
      setError('Title, category, and valid content are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const actionType = action === 'CREATE_POST' ? 'CREATE_POST' : 'UPDATE_POST';
      const postId = searchParams.get('id');

      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType,
          title,
          content: formattedContent,
          category,
          token,
          ...(actionType === 'UPDATE_POST' && { postId })
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

  const formatEmail = (email: string) => {
    if (!email) return '';
  
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Kembali ke email asli jika format tidak benar
  
    const [domainName, tld] = domain.split('.');
    const formattedLocalPart = `${localPart.charAt(0)}${'*'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}`;
    const formattedDomain = `${domainName.charAt(0)}${'*'.repeat(domainName.length - 1)}.${tld}`;
  
    return `${formattedLocalPart}@${formattedDomain}`;
  };

  const formattedEmail = formatEmail(email);

  return (
    <div className='text-black containernop flex flex-col justify-start items-start w-full h-full'>
      <div className='pageInfo'>
        <h1 className='text-3xl font-semibold px-4 pb-6 pt-3'>Create Post <p className='text-sm'>You can post your content here</p></h1>
      </div>
      <form className='authForm lg:flex-col h-screen px-2 items-center w-full' onSubmit={handleSubmit}>
        <div className='w-full items-start'>
          <label className="drop-container" id="dropcontainer">
            <p className="drop-title">Drop files here</p>
            or
            <input type="file" id="images" accept=".docx" onChange={handleFileChange} required />
          </label>
          <hr className='my-7' />
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
              id="category"
              type="text"
              placeholder=""
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <span>Category</span>
          </label>

          {error && <p className='font-semibold text-center' style={{ color: 'red' }}>{error}</p>}
          {content.length > 0 && showPreview && (
            <div className='mt-4 border rounded-[4px]' style={{ margin: 'auto' }}>
              <h3 className='font-semibold mb-4 mt-4'>Preview Content:</h3>
              <div className='text-sm' style={{ border: '1px solid #ccc', padding: '25px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '4px' }}>
              {content.map((item, index) => {
              const isBullet = item.bullet;

              return (
                <div
                  key={index}
                  style={{
                    textAlign: (item.alignment as React.CSSProperties['textAlign']) || 'left',
                    margin: '10px 0',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    textIndent: item.firstLineIndent ? `${item.firstLineIndent}px` : '0px', // First line indent
                  }}
                >
                  {isBullet ? (
                    <ul className="ul">
                      <li className="li">
                        {item.segments.map((segment, segIndex) => (
                          segment.isBold ? (
                            <strong key={segIndex}>{segment.text}</strong>
                          ) : (
                            <span key={segIndex}>{segment.text}</span>
                          )
                        ))}
                      </li>
                    </ul>
                  ) : (
                    <div>
                      {item.segments.map((segment, segIndex) => (
                        segment.isBold ? (
                          <strong key={segIndex}>{segment.text}</strong>
                        ) : (
                          <span key={segIndex}>{segment.text}</span>
                        )
                      ))}
                    </div>
                  )}

                  {/* Add line breaks based on lineCount */}
                  {Array(item.lineCount - 1).fill(null).map((_, lineIdx) => (
                    <br key={`line-${index}-${lineIdx}`} />
                  ))}
                </div>
              );
              })}
              </div>
            </div>
          )}
        </div>
        <div className='flex flex-row px-4 py-8 w-full '>
          <div className='flex flex-row items-center justify-between pl-5 px-2 py-2 border-secondary rounded-full w-full'>
            <p className='text-md'>{formattedEmail}</p>
            <div>
              <button 
                type="button" 
                onClick={showPreview ? handleSubmit : handleFileUpload}
                disabled={isSubmitting} 
                className='submit'
              >
                {isSubmitting ? 'Creating ...' : (showPreview ? (action === 'UPDATE_POST' ? 'Update' : 'Upload') : 'Preview')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
