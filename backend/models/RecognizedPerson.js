// backend/models/RecognizedPerson.js
const faceapi = require('face-api.js');
const fs = require('fs').promises;
const path = require('path');

async function loadFaceModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, 'models'));
  await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, 'models'));
  await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, 'models'));
}

async function recognizeFace(imageBuffer) {
  try {
    await loadFaceModels();

    const base64Image = imageBuffer.toString('base64');
    const image = await faceapi.bufferToImage(Buffer.from(base64Image, 'base64'));

    const labeledDescriptors = await loadLabeledDescriptors();
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    const recognizedFaces = detections.map((d) => faceMatcher.findBestMatch(d.descriptor));

    for (const recognizedFace of recognizedFaces) {
      if (recognizedFace.label !== 'unknown') {
        return recognizedFace.label;
      }
    }

    return null; // If no recognized face
  } catch (error) {
    console.error('Error recognizing face:', error);
    throw error;
  }
}

async function loadLabeledDescriptors() {
  const labeledDescriptors = [];

  const persons = await fs.readdir(path.join(__dirname, 'models'));
  for (const person of persons) {
    if (person.endsWith('.json')) {
      const personName = path.parse(person).name;
      const descriptor = JSON.parse(await fs.readFile(path.join(__dirname, 'models', person), 'utf-8'));
      labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(personName, [descriptor]));
    }
  }

  return labeledDescriptors;
}

module.exports = { recognizeFace };
