const download = require("image-downloader");
const {
  saveMockupDynamicModel,
  searchSimilar,
  saveMockupToDatabase,
  selectColorByStyleModel,
} = require("../models/mockup-generator.model");
const { uploadImagesAWS } = require("../Utilities/upload");

//TODO  - Funcion para llamar a la API de Dynamic y obtener todos los mockups y guardarlos en la BD
const getMockupsFromDynamic = async (req, res) => {
  try {
    const response = await fetch(process.env.DYNAMIC_URL_MOCKUPS, {
      method: "GET",
      headers: {
        "x-api-key": process.env.DYNAMIC_TOKEN,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error en la API de Dynamic: ${response.statusText}`);
    }

    const { data } = await response.json();
    console.log(data);

    const mockupsToSave = [];
    data.forEach((mockup) => {
      const firstSmartObject =
        mockup.smart_objects.length > 0 ? mockup.smart_objects[0] : null;

      if (firstSmartObject) {
        mockupsToSave.push({
          uuid: mockup.uuid,
          mockup_name: mockup.name,
          smart_obj_uuid: firstSmartObject.uuid,
          smart_obj_type: firstSmartObject.name,
          smart_obj_size_w: firstSmartObject.size.width,
          smart_obj_size_h: firstSmartObject.size.height,
          smart_obj_position_top: firstSmartObject.position.top,
          smart_obj_position_left: firstSmartObject.position.left,
          collection_uuid:
            mockup.collections.length > 0 ? mockup.collections[0].uuid : null,
          collection:
            mockup.collections.length > 0 ? mockup.collections[0].name : null,
        });
      }
    });

    // Insertar o actualizar en la BD
    for (const mockup of mockupsToSave) {
      await saveMockupDynamicModel(mockup);
    }

    res.status(200).json({
      message: "Mockups procesados correctamente",
      total: mockupsToSave.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

//TODO  - Obtener de la tabla, la informacion de los mockups que se van a generar
//      - Funcion para enviar las URL a la API de Dynamic y generar los mockups (limitar la taza a 300/min)
//      - Guardar la URL de descarga de los mockups
//      - Descargar los mockups
//      - Devolver los nombre de los mockups para identificarlos en la carpeta de descarga y viualizarlo en el front
const sendToRenderMockups = async (req, res) => {
  try {
    // Recibir del cuerpo del req las características del mockup { category, type, printArea, color, amount}
    const { category, type, printArea, colors, amount } = JSON.parse(
      req.body.data
    );

    // Crear una estructura con category, type, printArea unidos por "_", ejemplo: woman_tshirt_pocket
    const searchKey = `${category}_${type}_${printArea}`;
    let unisexKey;
    if (category === "men" || category === "women") {
      unisexKey = `adult-unisex_${type}_${printArea}`;
    } else if (category.startsWith("youth")) {
      unisexKey = `youth-unisex_${type}_${printArea}`;
    } else if (category.startsWith("toddler")) {
      unisexKey = `toddler-unisex_${type}_${printArea}`;
    } else if (category.startsWith("baby")) {
      unisexKey = `infant-unisex_${type}_${printArea}`;
    } else {
      unisexKey = `${category}_${type}_${printArea}`;
    }

    // Buscar en la tabla si hay valores que incluyan esta cadena, límite especificado por amount
    const mockupsInfo = await searchSimilar(searchKey, unisexKey, amount);
    console.log(mockupsInfo[0]);

    if (mockupsInfo[0].length == 0) {
      return res.status(400).json({
        msg: `No se encontraron Mockups con estas especificaciones`,
      });
    }

    // Obtener las URL de AWS
    const allResults = await uploadImagesAWS(req, process.env.BUCKET_DESIGNS);
    console.log(allResults);

    // Aquí almacenaremos las URLs generadas
    const generatedMockups = [];

    // Función para pausar la ejecución por un tiempo (en milisegundos)
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const requestDelay = 200; // 200 ms entre peticiones para cumplir con el límite de 300 por minuto

    //Funcion para descragar las imagenes
    const saveImageLocally = async (imageUrl, filename) => {
      const options = {
        url: imageUrl,
        dest: `C:/Users/loren/Documents/0-MOCKUPS GENERATOR/${filename}.jpg`,
      };
      try {
        await download.image(options);
      } catch (err) {
        console.error(err);
      }
    };

    // Función para procesar las peticiones en lotes
    const processBatch = async (batch) => {
      const promises = batch.map(async (image, i) => {
        const { img_url, img_key } = image;
        const parts = img_key.split("-");
        const fileName = parts[1].split(".")[0];

        const batchPromises = mockupsInfo[0].flatMap((mockup, j) => {
          return colors.map(async (color, k) => {
            console.log(
              `Procesando: Diseño=${fileName}, Mockup=${mockup.mockup_name}, Color=${color}`
            );

            const response = await fetch(process.env.DYNAMIC_URL_RENDER, {
              method: "POST",
              headers: {
                "x-api-key": process.env.DYNAMIC_TOKEN,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mockup_uuid: mockup.uuid,
                export_label: `mockup${fileName} ${j + 1}_${k}`,
                export_options: {
                  image_format: "jpg",
                  //   image_size: 1500,
                },
                smart_objects: [
                  {
                    uuid: mockup.smart_obj_uuid,
                    asset: { url: img_url },
                    color: color,
                  },
                ],
              }),
            });

            const data = await response.json();

            if (data.success) {
              const { export_path } = data.data;

              generatedMockups.push({
                design: fileName,
                design_path: img_url,
                mockup_name: data.data.export_label,
                download_path: export_path,
              });

              await saveMockupToDatabase({
                mockup_name: data.data.export_label,
                download_path: export_path,
                design_path: img_url,
              });

              await saveImageLocally(
                export_path,
                `mockup${fileName} ${j + 1}_${k}`
              );

              console.log(
                `✅ Mockup generado: ${mockup.mockup_name} - Color ${color}: ${export_path}`
              );
            } else {
              console.error(
                `❌ Error al generar mockup para ${mockup.mockup_name} con color ${color}: ${data.message}`
              );
            }

            // Pausa entre peticiones
            await sleep(requestDelay);
          });
        });

        await Promise.all(batchPromises);
      });

      await Promise.all(promises);
    };

    // const processBatch = async (batch) => {
    //   const promises = batch.map(async (image, i) => {
    //     const { img_url } = image;
    //     const parts = image.img_key.split("-");
    //     const fileName = parts[1].split(".")[0];

    //     const batchPromises = mockupsInfo[0].map(async (mockup, j) => {
    //       const response = await fetch(process.env.DYNAMIC_URL_RENDER, {
    //         method: "POST",
    //         headers: {
    //           "x-api-key": process.env.DYNAMIC_TOKEN,
    //           Accept: "application/json",
    //           "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //           mockup_uuid: mockup.uuid, // Usamos el UUID del mockup de la base de datos
    //           export_label: `mockup${fileName} ${j + 1}`,
    //           export_options: {
    //             image_format: "jpg",
    //             image_size: 1500,
    //           },
    //           smart_objects: [
    //             {
    //               uuid: mockup.smart_obj_uuid, // Usamos el UUID del smart object
    //               asset: {
    //                 url: img_url, // Usamos el URL de la imagen de AWS
    //               },
    //               color: color, // Usamos un color por defecto o el que recibas
    //             },
    //           ],
    //         }),
    //       });

    //       const data = await response.json();

    //       if (data.success) {
    //         const { export_path } = data.data;

    //         // Guardamos la URL del mockup generado en el array de resultados
    //         generatedMockups.push({
    //           design: fileName,
    //           design_path: img_url,
    //           mockup_name: data.data.export_label,
    //           download_path: export_path,
    //         });

    //         // Aquí puedes guardar la URL en la base de datos, por ejemplo:
    //         await saveMockupToDatabase({
    //           mockup_name: data.data.export_label,
    //           download_path: export_path,
    //           design_path: img_url,
    //         });

    //         await saveImageLocally(export_path, `mockup${fileName} ${j + 1}`);

    //         console.log(
    //           `Mockup generado para ${mockup.mockup_name}: ${export_path}`
    //         );
    //       } else {
    //         console.error(
    //           `Error al generar el mockup para ${mockup.mockup_name}: ${data.message}`
    //         );
    //       }

    //       // Pausar entre cada petición dentro de la promesa
    //       if (j !== mockupsInfo.length - 1 || i !== allResults.length - 1) {
    //         await sleep(requestDelay); // Pausar entre peticiones
    //       }
    //     });

    //     await Promise.all(batchPromises);
    //   });

    //   await Promise.all(promises);
    // };

    // Dividir las imágenes en lotes para controlar las peticiones
    const batchSize = 10; // Número de imágenes a procesar por lote
    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      await processBatch(batch); // Procesar el lote

      // Pausar entre lotes para no superar el límite de peticiones
      if (i + batchSize < allResults.length) {
        await sleep(requestDelay * batchSize); // Pausa entre lotes
      }
    }

    // Responder al cliente con los mockups generados
    res.status(200).json({
      msg: "Mockups generados correctamente",
      generatedMockups: generatedMockups,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const selectColorByStyle = async (req, res) => {
  try {
    const { style } = req.body;

    if (!style) {
      throw new Error(`No esta definido el Style`);
    }

    const colors = await selectColorByStyleModel(style);

    res.status(200).json({
      colors: colors[0].map(c => c.color)
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  getMockupsFromDynamic,
  sendToRenderMockups,
  selectColorByStyle,
};
