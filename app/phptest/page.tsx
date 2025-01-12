import { useState, useEffect } from 'react';

interface Data {
  message: string;
}

export default function Home() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch('https://admin.madanisyariah.com/api/data.php')
      .then((response) => response.json())
      .then((data: Data) => setData(data))
      .catch((error) => console.error('Error:', error));
  }, []);

  return (
    <div>
      <h1>Data from PHP API</h1>
      {data ? <p>{data.message}</p> : <p>Loading...</p>}
    </div>
  );
}
