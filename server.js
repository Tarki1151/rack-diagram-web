const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  const originalName = req.file.originalname;

  fs.renameSync(filePath, path.join(__dirname, 'uploads', originalName));

  exec(`python3 process_excel.py "uploads/${originalName}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Python hatası:', stderr);
      return res.status(500).json({ error: 'Dosya işlenirken hata oluştu: ' + stderr });
    }
    console.log('Python çıktısı:', stdout); // Çıktıyı logla
    try {
      const data = JSON.parse(stdout);
      res.json(data);
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError);
      res.status(500).json({ error: 'JSON parse hatası: ' + parseError.message });
    }
  });
});

app.listen(3001, () => {
  console.log('Sunucu 3001 portunda çalışıyor');
});