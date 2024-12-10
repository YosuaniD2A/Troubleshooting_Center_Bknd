const {
  getPtosListModel,
  getPTOModel,
  getMockupsModel,
} = require("../models/listing_generator.model");
const { sizeMapping } = require("../Utilities/general.utilities");
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
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getMockupURLs = async (req, res) => {
    try{
        const { mockups } = req.body;
        // Procesa cada mockup y genera la lista con las tallas disponibles
        const result = mockups.map((mockup) => {
            const { classification, product, paths, sku, parent_sku } = mockup;
            // Implementar el proceso de subida a AWS y utilizar las URL

            // Obtiene las tallas disponibles para la clasificación y el producto
            const sizes =
                sizeMapping[classification] && sizeMapping[classification][product]
                    ? sizeMapping[classification][product]
                    : [];

            // Genera un array con las URLs para cada talla
            const sizesWithDetails = sizes.map((size, index) => ({
                size,
                full_sku: `${sku}${size}`, 
                urls: paths, 
            }));

            // Retorna un nuevo objeto con las tallas disponibles y las URLs mapeadas
            return {
                parent_sku,
                sizes: sizesWithDetails, 
            };
        });

        res.send({
            data: result
        });
    }catch(error){
        console.log(error.message);
        res.status(500).json({
            error: error.message
        });
    }

}

module.exports = {
  getPtosList,
  getPTO,
  getMockups,
  getMockupURLs,
};
