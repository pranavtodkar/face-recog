// backend/server.js
const express = require('express');
const multer = require('multer');
const { recognizeFace } = require('./models/RecognizedPerson');

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', async (req, res) => {
  res.json({message: "hellop"});
}) 

app.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const recognizedName = await recognizeFace(imageBuffer);

    if (recognizedName) {
      res.json({ name: recognizedName });
    } else {
      res.json({ name: null });
    }
  } catch (error) {
    console.error('Error recognizing face:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
