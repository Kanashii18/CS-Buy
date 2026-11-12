export async function analyzeImage(imagePath, client) {
    const [result] = await client.safeSearchDetection(imagePath);
    if (!result.safeSearchAnnotation) {
        throw new Error('Google Vision SafeSearch information not recived');
    }
    return result.safeSearchAnnotation;
}
