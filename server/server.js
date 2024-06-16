const express = require('express');
const bodyParser = require('body-parser');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const fetch = require('node-fetch');

// Configure canvas for face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

const app = express();
const port = 3000;

app.use(bodyParser.json({ limit: '50mb' }));

// Load face-api.js models
const loadModels = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
};

// Endpoint to process the base64 image
app.post('/analyze', async (req, res) => {
    const { base64Image } = req.body;

    try {
        const img = new Image();
        img.src = base64Image;

        img.onload = async () => {
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (detections) {
                res.json({ descriptor: detections.descriptor });
            } else {
                res.status(400).json({ error: 'No face detected' });
            }
        };

        img.onerror = (error) => {
            res.status(500).json({ error: 'Failed to load the image' });
        };
    } catch (error) {
        res.status(500).json({ error: 'Failed to process the image' });
    }
});

// Start the server after models are loaded
loadModels().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(error => {
    console.error('Failed to load models:', error);
});
