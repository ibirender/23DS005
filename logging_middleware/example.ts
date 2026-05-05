import express from 'express';
import { Log } from './logger';

const app = express();
app.use(express.json());

// Express Logging Middleware
app.use((req, res, next) => {
  // Log every incoming request
  Log('backend', 'info', 'middleware', `Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  Log('backend', 'debug', 'handler', 'Processing root route logic');
  res.send('Hello World');
});

app.post('/api/data', (req, res) => {
  const { data } = req.body;
  if (!data) {
    Log('backend', 'warn', 'handler', 'Received missing data for /api/data');
    return res.status(400).send('Data is required');
  }

  Log('backend', 'success' as any, 'handler', 'Data processed successfully'); // Need to use appropriate level
  res.send('Data received');
});

// Example DB connection logic
async function connectDb() {
  try {
    // Simulate DB failure occasionally
    throw new Error('Connection Timeout');
  } catch (error) {
    Log('backend', 'fatal', 'db', 'Critical database connection failure.');
  }
}

connectDb();

app.listen(3000, () => {
  Log('backend', 'info', 'handler', 'Server started on port 3000');
});
