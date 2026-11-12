import vision from '@google-cloud/vision';
const visionClient = new vision.ImageAnnotatorClient();
export async function loadModel() {
    return visionClient;
}
