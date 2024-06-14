const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const modelUrls = [
    'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
    'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard1',
    'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json',
    'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1',
    'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-weights_manifest.json',
    'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard1'
];

const modelPath = path.join(__dirname, 'models');

if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath);
}

modelUrls.forEach(url => {
    const filePath = path.join(modelPath, path.basename(url));
    fetch(url)
        .then(res => {
            const dest = fs.createWriteStream(filePath);
            res.body.pipe(dest);
        })
        .catch(err => console.error(`Failed to download ${url}: ${err.message}`));
});
