// setup-media.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadFile = (url, destination) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(destination);
      reject(err);
    });
  });
};

async function setupMedia() {
  // Create directories
  const dirs = [
    'public/videos',
    'public/images/gallery',
    'public/images/posts',
    'public/images/profiles',
    'public/images/banners'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Download sample video
  console.log('Downloading sample video...');
  await downloadFile(
    'https://storage.googleapis.com/webfundamentals-assets/videos/chrome.mp4',
    'public/videos/sample.mp4'
  );

  // Download sample images
  const imageUrls = {
    'public/images/banners/banner.jpg': 'https://picsum.photos/1200/400',
    'public/images/profiles/profile.jpg': 'https://picsum.photos/400/400',
    'public/images/posts/video-thumb.jpg': 'https://picsum.photos/800/450',
    'public/images/gallery/image1.jpg': 'https://picsum.photos/800/600?random=1',
    'public/images/gallery/image2.jpg': 'https://picsum.photos/800/600?random=2',
    'public/images/gallery/image3.jpg': 'https://picsum.photos/800/600?random=3',
    'public/images/gallery/image4.jpg': 'https://picsum.photos/800/600?random=4',
  };

  console.log('Downloading sample images...');
  for (const [dest, url] of Object.entries(imageUrls)) {
    await downloadFile(url, dest);
    console.log(`Downloaded ${dest}`);
  }

  console.log('Media setup complete!');
}

setupMedia().catch(console.error);