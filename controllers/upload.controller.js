
const uploadImages = async (req, res) => {
    try {
        const files = req.files;
        const filteredFiles = files.filter((file) => {
            if (file.originalname.includes('__')) {
                const number = file.originalname.split('.')[0].split('__')[1];
                return number === '101';
            }
            return file;
        });

        console.log(filteredFiles);

        if (!files) {
          return res.status(400).send({ message: 'Please upload a file.' });
        }
        res.send({
            filteredFiles
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: error.message
        });
    }
};

module.exports = {
    uploadImages,
}