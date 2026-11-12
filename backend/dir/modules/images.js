import ci from "../config/filter.js";
const uploadToCloudinary = (buffer, options) => new Promise((resolve, reject) => {
    const stream = ci.uploader.upload_stream(options, (error, result) => {
        if (error)
            return reject(error);
        if (!result)
            return reject(new Error("Cloudinary returned no result"));
        resolve(result);
    });
    stream.end(buffer);
});
const image = {
    put: async (file) => {
        const result = await uploadToCloudinary(file.buffer, {
            folder: "images",
            resource_type: "image",
        });
        return {
            id: result.public_id,
            url: result.secure_url,
            originalUrl: result.secure_url,
        };
    },
    sign: () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const params = { timestamp, folder: "images" };
        return {
            timestamp,
            signature: ci.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET),
        };
    }
};
export default image;
