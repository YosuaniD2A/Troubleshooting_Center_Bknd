const express = require('express');
const multer = require('multer');
const { uploadImages, getAllFile, initAuthentication, auth, getMembersList } = require('../controllers/dropbox.controller');
const router = express.Router();

const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });

router.post('/uploadImage/:image_type', upload.array("files"), uploadImages);

router.get('/initAuthentication', initAuthentication);

router.get('/auth', auth);

router.get('/getAllFile/:user_id', getAllFile);

router.get('/membersList', getMembersList);

module.exports = router;