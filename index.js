require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folderPath = path.join(__dirname, 'images');

fs.readdir(folderPath, (err, files) => {
  if (err) {
    return console.error('Failed to list directory:', err);
  }

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

    if (!fs.lstatSync(filePath).isFile()) return; // skip subfolders

    cloudinary.uploader.upload(filePath, {
      folder: 'github-images', // optional: folder in your Cloudinary account
    })
    .then(result => {
      console.log(`Uploaded: ${file} → ${result.secure_url}`);
    })
    .catch(error => {
      console.error(`Failed to upload ${file}:`, error.message);
    });
  });
});
