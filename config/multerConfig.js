const multer = require("multer");
const path = require("path");

// Configurar Multer para procesar el archivo CSV
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Configuración del almacenamiento en memoria (para evitar archivos temporales)
//const storage = multer.memoryStorage();

module.exports = {
  storage,
};
