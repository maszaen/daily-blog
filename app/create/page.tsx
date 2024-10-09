'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<{ alignment: string | null; segments: { text: string; isBold: boolean; }[] }[]>([]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.docx$/, ''));
      setCategory(''); 
    }
  };

  const handleFileUpload = async () => {
    if (!category) {
      setError('Category is required before uploading a file.');
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
          let alignment = alignmentNode ? alignmentNode.getAttribute("w:val") : null;
  
          const validAlignments = ['left', 'right', 'center', 'justify'];
          if (!validAlignments.includes(alignment || '')) {
            alignment = null;
          }
  
          const segments = textNodes
            .map(node => {
              const parent = node.parentNode; 
              const isBold = parent && (parent as Element).getElementsByTagName("w:b").length > 0; 
              return { text: node.textContent || '', isBold: isBold || false }; 
            })
            .filter(segment => segment.text.trim() !== '');
  
          return {
            segments,
            alignment,
          };
        }).filter(item => item.segments.length > 0);
        
        setContent(contentArray);
        setError('');
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
    }));
  
    if (!title || !category || !formattedContent.length || formattedContent.some(item => !item.segments.length || !item.segments.some(seg => seg.text.trim()))) {
      setError('Title, category, and valid content are required.');
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
          content: formattedContent,
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
      <div className='pageInfo'>
        <h1 className='text-3xl font-semibold px-4 pb-6 pt-3'>Create Post <p className='text-sm'>You can post your content here</p></h1>
      </div>
      <form className='authForm lg:flex-col h-screen px-2 items-center w-full' onSubmit={handleSubmit}>
        <div className='w-full items-start'>
          <label className="drop-container" id="dropcontainer">
            <p className="drop-title">Drop files here</p>
            or
            <input type="file" id="images" accept=".docx" onChange={handleFileChange} required/>
          </label>
          <button type='button' onClick={handleFileUpload} className='rounded-[5px] items-center justify-center w-full'>Upload Docx</button>
          <hr className='my-7'/>
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
          {content.length > 0 && (
            <div className='mt-4 border rounded-[3px]' style={{ margin: 'auto', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <h3 className='font-semibold mb-4 mt-4'>Preview Content:</h3>
              <div style={{ border: '1px solid #ccc', padding: '25px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                {content.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      textAlign: (item.alignment as React.CSSProperties['textAlign']) || 'left',
                      margin: '10px 0',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {item.segments.map((segment, segIndex) => (
                      segment.isBold ? (
                        <strong key={segIndex}>{segment.text}</strong>
                      ) : (
                        <span key={segIndex}>{segment.text}</span>
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className='flex flex-row px-4 py-8 w-full '>
          <div className='flex flex-row items-center justify-between pl-5 px-2 py-2 border-secondary rounded-full w-full'>
            <p className='text-md'>User: {email}</p>
            <div>
              <button type="submit" disabled={isSubmitting} className='submit'>
                {isSubmitting ? 'Creating ...' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
