const express = require('express');
const { getImageByDesign, updateImage } = require('../controllers/broked_image.controller');
const router = express.Router();

router.post('/getImagenByDesign', getImageByDesign);

router.patch('/updateImage', updateImage)

module.exports = router;