const express = require('express');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
const path = require('path');

// เรียกใช้ TensorFlow.js backend
require('@tensorflow/tfjs-node');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Monkey patching canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
    const modelPath = path.join(__dirname, 'models');
    console.log('Loading models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log('Models loaded successfully.');
}

function formatDescriptor(descriptor) {
    const base64String = Buffer.from(descriptor).toString('base64');
    return base64String;
}

async function detectFacesAndDescriptors(base64Image) {
    try {
        console.log("Running Try")
        const img = new Image();
        const buffer = Buffer.from(base64Image, 'base64');
        img.src = buffer;
        console.log("buffer : ", buffer);

        await new Promise((resolve, reject) => {
            console.log("Running");
            img.onload = async () => {
                try {
                    console.log("Running");
                    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                    
                    if (detection && detection.descriptor) {
                        console.log("Running in if");
                        const formattedDescriptor = formatDescriptor(detection.descriptor);
                        console.log('Face descriptor:', formattedDescriptor);
                        // Send the formatted descriptor to the client or process further
                        resolve();
                    } else {
                        console.log("Running in else");
                        reject(new Error('Face not detected or descriptor not found'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
                                
            img.onerror = (err) => {
                console.log("Running Error");
                reject(new Error(`Failed to load image: ${err.message}`));
            };
        });
        return true;
    } catch (error) {
        throw new Error(`Error processing image: ${error.message}`);
    }
}

app.post('/analyze', async (req, res) => {
    console.log('Received an analyze request.');

    // Log base64 image data received from client
    const base64Image = req.body.image;
    console.log('Base64 image data length:', base64Image.length);

    try {
        // Ensure models are loaded before proceeding
        if (!(faceapi.nets.ssdMobilenetv1.isLoaded &&
              faceapi.nets.faceLandmark68Net.isLoaded &&
              faceapi.nets.faceRecognitionNet.isLoaded)) {
            throw new Error('Face detection models not loaded');
        }

        // Detect faces and descriptors from base64 image
        await detectFacesAndDescriptors(base64Image);

        // Respond with success or appropriate data
        res.send('Image processed successfully');
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send({ error: error.message });
    }
});

// Load models and start the server
loadModels().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
