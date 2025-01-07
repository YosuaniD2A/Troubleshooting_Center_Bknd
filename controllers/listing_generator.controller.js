const { log } = require("console");
const {
  getPtosListModel,
  getPTOModel,
  getMockupsModel,
  saveMockupDetailModel,
  getPriceRelationshipModel,
} = require("../models/listing_generator.model");
const { sizeMapping } = require("../Utilities/general.utilities");
const { uploadImagesAWS } = require("../Utilities/upload");
const fs = require("fs").promises;

const getPtosList = async (req, res) => {
  try {
    const [data] = await getPtosListModel();

    res.send({
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getPTO = async (req, res) => {
  try {
    const { pto } = req.params;
    const [data] = await getPTOModel(pto);

    res.send({
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getMockups = async (req, res) => {
  try {
    const { pto } = req.params;
    const [data] = await getMockupsModel(pto);

    const result = Object.values(
      data.reduce((acc, row) => {
        const key = `${row.parent_sku}${row.color}`;
        if (!acc[key]) {
          acc[key] = {
            classification: row.classification,
            color: row.color,
            design: row.design.slice(2), // Remove brand prefix
            brand: row.design.slice(0, 2), // Extract brand
            parent_sku: row.parent_sku,
            product: row.product,
            sku: `${row.parent_sku}${row.color}`,
            paths: [],
          };
        }
        acc[key].paths.push(row.path);
        return acc;
      }, {})
    );

    res.send({
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getMockupURLs = async (req, res) => {
  try {
    const { mockups } = req.body;
    if (!mockups || mockups.length === 0) {
      return res.status(400).send("No mockups provided");
    }

    // Procesa cada mockup y genera la lista con las tallas disponibles
    const result = await Promise.all(
      mockups.map(async (mockup) => {
        const {
          brand,
          design,
          classification,
          product,
          paths,
          sku,
          color,
          parent_sku,
        } = mockup;

        // Implementar el proceso de subida a AWS y utilizar las URL
        //const uploadedImages = await uploadImagesAWS({ body: { urls: paths } });

        // Obtiene las tallas disponibles para la clasificación y el producto
        const sizes =
          sizeMapping[classification] && sizeMapping[classification][product]
            ? sizeMapping[classification][product]
            : [];

        // Genera un array con las URLs para cada talla
        const sizesWithDetails = sizes.map((size, index) => ({
          full_sku: `${sku}${size}`,
          color,
          size,
          //urls: uploadedImages.map((image) => image.img_url),
          urls: paths,
        }));

        // Retorna un nuevo objeto con las tallas disponibles y las URLs mapeadas
        return {
          parent_sku,
          brand,
          design,
          classification,
          product,
          sizes: sizesWithDetails,
        };
      })
    );

    res.send({
      data: result,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: error.message,
    });
  }
};

const saveMockupDetails = async (req, res) => {
  try {
    const { mockupData } = req.body;

    if (!Array.isArray(mockupData)) {
      return res.status(400).json({
        message: "El cuerpo de la solicitud debe ser un array de objetos.",
      });
    }

    // Validación y mapeo de datos
    const allInsertions = mockupData.flatMap((item) => {
      const { brand, classification, design, parent_sku, product, sizes } = item;

      if (!sizes || !Array.isArray(sizes)) {
        throw new Error("El campo sizes debe ser un array.");
      }

      return sizes.map((sizeData) => {
        const { full_sku, color, size, urls } = sizeData;

        if (!Array.isArray(urls) || urls.length < 3) {
          throw new Error("Cada size debe incluir un array de 3 URLs.");
        }

        return saveMockupDetailModel({
          parent_sku,
          brand,
          design,
          classification,
          product,
          sku: full_sku,
          color,
          size,
          img1: urls[0],
          img2: urls[1],
          img3: urls[2],
        });
      });
    });

    // Ejecutar todas las inserciones en paralelo
    await Promise.all(allInsertions);

    res.status(201).json({ message: "Datos registrados con éxito." });
  } catch (error) {
    console.error("Error al registrar los datos:", error);
    res.status(500).json({
      message: "Ocurrió un error al registrar los datos.",
      error: error.message,
    });
  }
};

const getPriceRelationship = async (req, res) => {
  try {
    const { mockupData } = req.body;

    if (!mockupData.brand || !mockupData.classification || !mockupData.product || !Array.isArray(mockupData.sizes)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const updatedSizes = await Promise.all(
      mockupData.sizes.map(async (sizeObj) => {
        const { color, size } = sizeObj;
        const [priceResult] = await getPriceRelationshipModel({
          brand: mockupData.brand, 
          classification: mockupData.classification, 
          product: mockupData.product, 
          color, 
          size
        })
        console.log(priceResult);
        
        return {
          ...sizeObj,
          price: priceResult[0] ? priceResult[0].final_price : null // Si no hay resultado, price será null
        };
      }));

      return res.json({
       ...mockupData,
        sizes: updatedSizes
      });
  } catch (error) {
    console.error("Error al intentar relacionar los precios:", error);
    res.status(500).json({
      message: "Ocurrió un error al intentar relacionar los precios.",
      error: error.message,
    });
  }
}

module.exports = {
  getPtosList,
  getPTO,
  getMockups,
  getMockupURLs,
  saveMockupDetails,
  getPriceRelationship
};
