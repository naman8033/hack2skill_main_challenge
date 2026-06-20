import dotenv from 'dotenv';
dotenv.config();

const listModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in environment variables.');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('=== Gemini API Models response ===');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Request failed:', error);
  }
};

listModels();
