const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'houseinventory' // Use the houseinventory database
});

db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API to save house data
app.post('/houses', upload.single('image'), (req, res) => {
  console.log(req.body);
  console.log(req.file);

  let {
    size,
    bedrooms,
    bathrooms,
    price,
    house_condition,
    house_type,
    year_built,
    parking_spaces,
    address
  } = req.body;

  // ตรวจสอบและแปลงปี พ.ศ. เป็น ค.ศ.
  year_built = parseInt(year_built, 10);
  if (year_built >= 2400) { // สมมติว่าถ้าปีมากกว่าหรือเท่ากับ 2400 ถือว่าเป็นปี พ.ศ.
    year_built -= 543;
  }

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = 'INSERT INTO houses (size, bedrooms, bathrooms, price, house_condition, house_type, year_built, parking_spaces, address, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [size, bedrooms, bathrooms, price, house_condition, house_type, year_built, parking_spaces, address, image_url];

  // Log the SQL query and values
  console.log(sql, values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error occurred while saving data:', err);
      return res.status(500).json({ error: err });
    }
    res.json({ message: 'House added successfully', id: result.insertId });
  });
});

// API to get all house data
app.get('/houses', (req, res) => {
  let sql = 'SELECT * FROM houses';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
