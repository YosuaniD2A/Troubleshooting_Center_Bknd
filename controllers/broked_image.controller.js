const { getImage, changeImage } = require("../models/broked_image.model");

const getImageByDesign = async (req, res) => {
    try {
        const design = req.body.design;
        const [data] = await getImage(design);

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const updateImage = async (req, res) => {
    try {
        const url = req.body.url;
        const id = req.body.id;

        const data = await changeImage(url, id);

        res.send({
            data
        })
        
    } catch (error) {
        res.status(500).json({
            msg: error.code
        })
    }
}

module.exports = {
    getImageByDesign,
    updateImage
}