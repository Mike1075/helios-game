// Next.js API route that proxies to Python backend
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Call the Python function
      const { chat } = await import('../../../api/main.py');
      const result = await chat(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ 
        reply: '服务器错误，请稍后重试',
        error: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}