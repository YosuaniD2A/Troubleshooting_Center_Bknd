const { Upload } = require('@aws-sdk/lib-storage');
const { connectionAws } = require("../config/awsConfig");
const fs = require('fs');

const uploadOneImage = async (imgBuffer, productName, bucket, contentType, s3) => {
    const paramsImg = {
        Bucket: bucket,
        Key: `${Date.now().toString()}-${productName}`,
        Body: imgBuffer,
        ContentType: contentType // Cambia esto según el tipo de imagen
    };

    const parallelUploads3 = new Upload({ client: s3, params: paramsImg }); 
    const result = await parallelUploads3.done();
    
    return result;
};

// const uploadImagesAWS = async (req) => {
//     try {
//         const { urls } = req.body; // Lista de URLs opcional
//         const files = req.files; // Archivos opcionales recibidos en la solicitud

//         if ((!files || files.length === 0) && (!urls || urls.length === 0)) {
//             return res.status(400).send('No files or URLs provided');
//         }

//         const baseUrl = 'http://localhost:3005/images/';
//         const s3 = connectionAws();

//         // Función para dividir el array en chunks
//         const chunkArray = (array, size) => {
//             const result = [];
//             for (let i = 0; i < array.length; i += size) {
//                 result.push(array.slice(i, i + size));
//             }
//             return result;
//         };

//         // Función para esperar un tiempo especificado
//         const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//         let allResults = [];

//         // Proceso para manejar archivos
//         if (files && files.length > 0) {
//             const fileChunks = chunkArray(files, 150);

//             for (const chunk of fileChunks) {
//                 const uploadPromises = chunk.map(file => {
//                     const imgData = fs.readFileSync(file.path);

//                     return uploadOneImage(
//                         Buffer.from(imgData),
//                         file.originalname,
//                         process.env.BUCKET_PTOS_URL,
//                         file.mimetype,
//                         s3
//                     ).then(uploadedImage => {
//                         fs.unlinkSync(file.path); // Eliminar archivo local

//                         return {
//                             img_key: uploadedImage.Key,
//                             img_url: uploadedImage.Location,
//                         };
//                     });
//                 });

//                 const imgResults = await Promise.all(uploadPromises);
//                 console.log(`Chunk uploaded: ${imgResults.length} images`);

//                 allResults = [...allResults, ...imgResults];
//                 await delay(20000); // Esperar antes de procesar el siguiente chunk
//             }
//         }

//         // Proceso para manejar URLs
//         if (urls && urls.length > 0) {
//             const completeUrls = urls.map(url => `${baseUrl}${url}`); // Construir URLs completas
//             const urlChunks = chunkArray(completeUrls, 150);

//             for (const chunk of urlChunks) {
//                 const uploadPromises = chunk.map(async (url) => {
//                     const response = await fetch(url);

//                     if (!response.ok) {
//                         throw new Error(`Failed to fetch image from URL: ${url}`);
//                     }

//                     const imageBuffer = await response.arrayBuffer();
//                     const filename = url.split('/').pop();
//                     const mimetype = response.headers.get('content-type');

//                     return uploadOneImage(
//                         Buffer.from(imageBuffer),
//                         filename,
//                         process.env.BUCKET_PTOS_URL,
//                         mimetype,
//                         s3
//                     ).then(uploadedImage => {
//                         return {
//                             img_key: uploadedImage.Key,
//                             img_url: uploadedImage.Location,
//                         };
//                     });
//                 });

//                 const urlResults = await Promise.all(uploadPromises);
//                 console.log(`Chunk uploaded: ${urlResults.length} images`);

//                 allResults = [...allResults, ...urlResults];
//                 await delay(20000); // Esperar antes de procesar el siguiente chunk
//             }
//         }

//         return allResults;

//     } catch (error) {
//         console.error(error);
//     }
// };
const uploadImagesAWS = async (req, bucket) => {
    try {
        const pLimit = (await import('p-limit')).default;
        const { urls } = req.body; // Lista de URLs opcional
        const files = req.files; // Archivos opcionales recibidos en la solicitud

        if ((!files || files.length === 0) && (!urls || urls.length === 0)) {
            return res.status(400).send('No files or URLs provided');
        }

        const baseUrl = 'http://localhost:3005/images/';
        const s3 = connectionAws();

        const limit = pLimit(10); // Limitar concurrencia a 10 operaciones simultáneas
        let allResults = [];

        // Subir archivos locales
        if (files && files.length > 0) {
            const fileUploads = files.map((file) =>
                limit(async () => {
                    const imgData = fs.readFileSync(file.path);

                    const uploadedImage = await uploadOneImage(
                        Buffer.from(imgData),
                        file.originalname,
                        bucket,
                        file.mimetype,
                        s3
                    );

                    fs.unlinkSync(file.path); // Eliminar archivo local

                    return {
                        img_key: uploadedImage.Key,
                        img_url: uploadedImage.Location,
                    };
                })
            );

            const fileResults = await Promise.all(fileUploads);
            console.log(`Uploaded ${fileResults.length} files.`);
            allResults = [...allResults, ...fileResults];
        }

        // Subir imágenes desde URLs
        if (urls && urls.length > 0) {
            const urlUploads = urls.map((url) =>
                limit(async () => {
                    const completeUrl = `${baseUrl}${url}`;
                    const response = await fetch(completeUrl);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch image from URL: ${completeUrl}`);
                    }

                    const imageBuffer = await response.arrayBuffer();
                    const filename = completeUrl.split('/').pop();
                    const mimetype = response.headers.get('content-type');

                    const uploadedImage = await uploadOneImage(
                        Buffer.from(imageBuffer),
                        filename,
                        bucket,
                        mimetype,
                        s3
                    );

                    return {
                        img_key: uploadedImage.Key,
                        img_url: uploadedImage.Location,
                    };
                })
            );

            const urlResults = await Promise.all(urlUploads);
            console.log(`Uploaded ${urlResults.length} URLs.`);
            allResults = [...allResults, ...urlResults];
        }

        return allResults;
    } catch (error) {
        console.error(error);
        throw error;
    }
};


module.exports = {
    uploadOneImage,
    uploadImagesAWS
}