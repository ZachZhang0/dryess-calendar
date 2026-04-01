import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'timeline-data.json');
const META_FILE = path.join(__dirname, 'data', 'meta.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get last modified time
function getLastModified() {
  try {
    if (fs.existsSync(META_FILE)) {
      const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
      return meta.lastModified || 0;
    }
  } catch (e) {
    console.error('Error reading meta file:', e);
  }
  return 0;
}

// Update last modified time
function updateLastModified() {
  try {
    fs.writeFileSync(META_FILE, JSON.stringify({ lastModified: Date.now() }, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing meta file:', e);
  }
}

// Default data
const defaultData = {
  rows: ['Common', 'TSL', 'NSLK', 'SK', 'CS', 'LYLK'],
  fiscalYears: [
    {
      name: 'FY2526',
      columns: ['Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      cells: {
        '0-0': { value: 'BU SDES', status: 'pending' },
        '0-1': { value: 'ESS SDES-8/8', status: 'pending' },
        '0-2': { value: 'NSS WS-9/15-19', status: 'pending' },
        '0-3': { value: 'ESS QBU 10/31\nPoe review-10/28', status: 'pending' },
        '0-4': { value: '洗涤行业展会\n11/12', status: 'pending' },
        '0-5': { value: 'TRL Workshop\n12/7,8,9\nWX benchmark visit\n12/18', status: 'pending' },
        '0-6': { value: 'ESS Offsite Meeting\n1/29\nPDD at CD 1/20\nPoe review-1/28', status: 'pending' },
        '0-8': { value: 'Poe QBU 3/2\nT&W Workshop-3/20\nNSS WS-3/31 & 4/1', status: 'pending' },
        '0-9': { value: 'ESS QBU\n4/24', status: 'pending' },
        '0-11': { value: 'PDD 6/11&12', status: 'pending' },
        '1-0': { value: 'Vaule\nCreation WS', status: 'pending' },
        '1-3': { value: 'TSL-POSM test\n10/20,21,22', status: 'pending' },
        '1-6': { value: 'Poe visit-1/13', status: 'pending' },
        '2-4': { value: 'Seema\nvisit-11/10', status: 'pending' },
        '2-6': { value: 'Poe visit-tbd', status: 'pending' },
        '2-10': { value: 'Value Creation WS\n时间TBD', status: 'pending' },
        '3-1': { value: 'Charles\nvisit-8/26', status: 'pending' },
        '3-4': { value: 'Charles\nvisit-11/25', status: 'pending' },
        '3-6': { value: 'SK QAC-1/7-1/9\nValue Creation WS 1/15', status: 'pending' },
        '3-8': { value: 'Charles Visit 3/24', status: 'pending' },
        '3-9': { value: 'Poe Visit-TBD', status: 'pending' },
        '4-1': { value: 'Poe visit-8/12', status: 'pending' },
        '4-4': { value: 'POSS\nRenew-11/13,14', status: 'pending' },
        '4-11': { value: 'Poe Visit-TBD', status: 'pending' }
      }
    }
  ]
};

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  console.log('Created default data file');
}

// GET - Read data
app.get('/api/data', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST - Save data
app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    updateLastModified();
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// GET - Get last modified time
app.get('/api/data/status', (req, res) => {
  try {
    res.json({ lastModified: getLastModified() });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Serve static files (for production)
app.use(express.static('dist'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
