const { connectionAws } = require("../config/awsConfig");
const fs = require('fs');
const { uploadOneImage } = require("../Utilities/upload");
const { saveUrlsModel } = require("../models/aws.model");


// const uploadImages = async (req, res) => {
//     try {
//         const files = req.files;

//         const s3 = connectionAws();

//         if (!files || files.length === 0) {
//             return res.status(400).send('No files uploaded');
//         }
//         // Crear un buffer con los datos leídos
//         const uploadPromises = files.map(file => {
    
//             const imgData = fs.readFileSync(file.path);

//             return uploadOneImage(
//                 Buffer.from(imgData),
//                 file.originalname,
//                 process.env.BUCKET_PTOS_URL,
//                 file.mimetype, 
//                 s3
//             ).then(uploadedImage => {
//                 fs.unlinkSync(file.path);

//                 return {
//                     img_key: uploadedImage.Key,
//                     img_url: uploadedImage.Location
//                 };
//             });
//         });

//         // Ejecutar todas las promesas en paralelo
//         const img_urlResults = await Promise.all(uploadPromises);
//         console.log(img_urlResults);

//         res.send({
//             data: img_urlResults,
//             message: 'Files uploaded successfully'
//         });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             msg: error.message,
//         });
//     }
// }
const uploadImages = async (req, res) => {
    try {
        const files = req.files;

        const s3 = connectionAws();

        if (!files || files.length === 0) {
            return res.status(400).send('No files uploaded');
        }

        // Función para dividir el array de archivos
        const chunkArray = (array, size) => {
            const result = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        };

        // Divide los archivos en chunks de hasta 150
        const fileChunks = chunkArray(files, 150);       

        // Función para esperar 10 segundos
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        let allResults = [];

        // Recorremos cada chunk de archivos
        for (const chunk of fileChunks) {
            // Crear un buffer con los datos leídos y subir cada imagen
            const uploadPromises = chunk.map(file => {
                const imgData = fs.readFileSync(file.path);

                return uploadOneImage(
                    Buffer.from(imgData),
                    file.originalname,
                    process.env.BUCKET_PTOS_URL,
                    file.mimetype, 
                    s3
                ).then(uploadedImage => {
                    fs.unlinkSync(file.path);

                    return {
                        img_key: uploadedImage.Key,
                        img_url: uploadedImage.Location
                    };
                });
            });

            // Esperar a que todas las imágenes del chunk se suban
            const img_urlResults = await Promise.all(uploadPromises);
            console.log(`Chunk uploaded: ${img_urlResults.length} images`);

            // Almacenar los resultados del chunk actual
            allResults = [...allResults, ...img_urlResults];

            // Esperar 10 segundos antes de procesar el siguiente chunk
            await delay(20000);
        }

        res.send({
            data: allResults,
            message: 'All files uploaded successfully'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: error.message,
        });
    }
};

// const saveUrls = async (req, res) => {
//     try {
//         const { mockup, img_url } = req.body;
        
//         // Define las tallas posibles
//         const sizes = ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"];
        
//         // Obtén el mockup sin la talla
//         const mockupBase = mockup.slice(0, -3);

//         // Array para almacenar las promesas de inserción
//         const insertPromises = [];

//         // Inserta el mockup con cada talla
//         for (const size of sizes) {
//             const newMockup = mockupBase + size;

//             insertPromises.push(saveUrlsModel(newMockup, img_url));
//         }

//         const data = await Promise.all(insertPromises);

//         res.send({
//             data
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             error: error.message
//         });
//     }
// };
const saveUrls = async (req, res) => {
    try {
        const { mockup, img_url } = req.body;
        const [data] = await saveUrlsModel(mockup, img_url);

        res.send({
            data
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: error.message
        });
    }
}

module.exports = {
    uploadImages,
    saveUrls
}