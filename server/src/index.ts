import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Oscar Pool API' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
