const download = require("image-downloader");
const { v4: uuidv4 } = require("uuid");

const {
    getImageMetadata,
    insertImageCommercialMetadata,
    insertImageEditorialMetadata,
    insertOrderShutterstockReport
} = require("../models/shutterstock.model");

const importCsv = async (stream) => {
    return new Promise((resolve, reject) => {
        let listOfIds = [];

        stream.on("data", (row) => {
            listOfIds.push({
                shutterstock_id: row.id,
            });
        });
        stream.on("end", () => resolve(listOfIds));
    });
};

// Funcion Factory que alberga las funciones principales del proceso de shutterstock
const factoryShutterstock = (credentials = {}) => {
    const headers = {
        "Content-type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${credentials}`,
    };

    // Esta funcion permite obtener toda la informacion de la imagen, que luego sera 
    // utilizada para mostrar en la tabla
    const getImageDataWithCredentials = async (imageId, imageType) => {
        try {
            if (imageType === "Commercial") {
                const getImageData = await fetch(
                    `${process.env.API_URL_BASE}images/${imageId}`,
                    {
                        headers,
                    }
                );
                return await getImageData.json();
            } else {
                const params = new URLSearchParams();
                params.append("country", "USA");
                const getImageData = await fetch(
                    `${process.env.API_URL_BASE
                    }editorial/images/${imageId}?${params.toString()}`,
                    {
                        headers,
                    }
                );
                return await getImageData.json();
            }
        } catch (error) {
            console.error(error.message);
            //return null;
        }
    };

    // Esta funcion es la encargada de licenciar las imagenes de ingestion para obtener la URL
    // de descarga, esta usa las credenciales de ingestion, las cuales no generan credito. 
    // esta devuelve un JSON con toda la informacion de licencia
    const licenseImageToDownload = async (imageId, imageType) => {
        try {
            if (imageType === "Commercial") {
                const bodyData = {
                    images: [
                        {
                            image_id: imageId,
                            subscription_id: process.env.SUBSCRIPTION_ID_INGESTION_COMMERCIAL,
                            price: 0,
                            metadata: {
                                // customer_id: "",
                                shipping_cost: "0",
                                purchase_order: uuidv4()
                            },
                        },
                    ],
                };
                const body = JSON.stringify(bodyData);
                const licenseOfimage = await fetch(
                    `${process.env.API_URL_SANDBOX}images/licenses`,
                    {
                        headers,
                        method: "POST",
                        body,
                    }
                );

                return await licenseOfimage.json();
            } else {
                const order_idRandom = uuidv4();
                const bodyData = {
                    editorial: [
                        {
                            editorial_id: imageId,
                            license: "premier_editorial_comp",
                            metadata: {
                                order_id: order_idRandom,
                            },
                        },
                    ],
                    country: "USA",
                };
                const body = JSON.stringify(bodyData);
                const licenseOfimage = await fetch(
                    `${process.env.API_URL_BASE}editorial/images/licenses`,
                    {
                        headers,
                        method: "POST",
                        body,
                    }
                );
                // if (credentials === process.env.SHUTTERSTOCK_EDITORIAL_TOKEN) {
                //     const bodyData = {
                //         editorial: [
                //             {
                //                 editorial_id: imageId,
                //                 license: "premier_editorial_all_media",
                //                 metadata: {
                //                     order_id: order_idRandom,
                //                 },
                //             },
                //         ],
                //         country: "USA",
                //     };
                //     const body = JSON.stringify(bodyData);
                //     licenseOfimage = await fetch(
                //         `${process.env.API_URL_BASE}editorial/images/licenses`,
                //         {
                //             headers,
                //             method: "POST",
                //             body,
                //         }
                //     );
                // } else {
                //     const bodyData = {
                //         editorial: [
                //             {
                //                 editorial_id: imageId,
                //                 license: "premier_editorial_comp",
                //                 metadata: {
                //                     order_id: order_idRandom,
                //                 },
                //             },
                //         ],
                //         country: "USA",
                //     };
                //     const body = JSON.stringify(bodyData);
                //     licenseOfimage = await fetch(
                //         `${process.env.API_URL_BASE}editorial/images/licenses`,
                //         {
                //             headers,
                //             method: "POST",
                //             body,
                //         }
                //     );
                // }

                return await licenseOfimage.json();
            }
        } catch (error) {
            console.error(error.message);
            return null;
        }
    };

    // Funcion encargada de realizar la validad de la imagen para determinar si la imagen esta 
    // disponible para licenicarse o no
    const isAvailableToLicense = async (imageId) => {
        try {
            const params = new URLSearchParams({ view: 'full', id: imageId });

            const imageStatus = await fetch(
                `${process.env.API_URL_BASE}images?${params.toString()}`,
                {
                    headers,
                    method: 'GET'
                }
            );

            return await imageStatus.json();

        } catch (error) {
            console.error(error.message);
            return null;
        }
    }

    // Esta es la funcion encargada de licenciar automaticamente las ordenes que se registren en el dia
    const licenseImageToReport = async (order) => {
        try {   
            if(/[a-zA-Z]/.test(order.shutterstock_id) === false){
                // Esta parte licencia las imagenes comerciales
                const headers2 = {
                    "Content-type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${process.env.SHUTTERSTOCK_COMMERCIAL_LICENSOR_TOKEN}`,
                  };
                const bodyData = {
                    images: [
                      {
                        image_id: order.shutterstock_id,
                        subscription_id: process.env.SUBSCRIPTION_ID_LICENSE_COMMERCIAL,
                        price: order.unit_price,
                        metadata: {
                          shipping_cost: "0",
                          purchase_order: uuidv4(),
                        //   job: "",
                        //   client: "",
                        //   other: ""
                        },
                      },
                    ],
                  };
                  const body = JSON.stringify(bodyData);
                  const licenseOfimage = await fetch(
                    `${process.env.API_URL_BASE}images/licenses`, // Cambiar el sandbox
                    {
                      headers: headers2,
                      method: "POST",
                      body,
                    }
                  );
              
                  return await licenseOfimage.json();
            }else{
                // Esta parte licencia las imagenes editoriales
                const headers2 = {
                    "Content-type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${process.env.SHUTTERSTOCK_EDITORIAL_LICENSOR_TOKEN}`,
                  };
                const bodyData = {
                  editorial: [
                    {
                      editorial_id: order.shutterstock_id,
                      license: "premier_editorial_all_media",
                      metadata: {
                        order_id: uuidv4(),
                      },
                    },
                  ],
                  country: "USA",
                };
                const body = JSON.stringify(bodyData);
                licenseOfimage = await fetch(
                  `${process.env.API_URL_BASE}editorial/images/licenses`,
                  {
                    headers: headers2,
                    method: "POST",
                    body,
                  }
                );
            
                return await licenseOfimage.json();

                // return {message: "Esto es una imagen Editorial"};   // Comentar 
            }

        } catch (error) {
            console.error(error.message);
            return null;
        }
    }

    return {
        getImageDataWithCredentials,
        licenseImageToDownload,
        isAvailableToLicense,
        licenseImageToReport
    };
};
// ---------------------------------------------------------------------------------------------------------------------------------------
// Esta funcion es la encargada de registrar la metadata de los diseños licenciados en la base de datos, 
// primero verifica si ya ese diseño se encuentra previamente registrado en la BD, de no ser asi, lo inserta
const insertDB = async (imageMetadata, imageType) => {
    try {
        if (imageMetadata !== null) {
            const [result] = await getImageMetadata(imageMetadata.shutterstock_id);
            if (!result[0]) {
                if (imageType === "Commercial") {
                    const [data] = await insertImageCommercialMetadata(imageMetadata);
                } else {
                    const [data] = await insertImageEditorialMetadata(imageMetadata);
                }
                return `El registro con ID: ${imageMetadata.shutterstock_id} se guardo satisfactoriamente en la BD`;
            }
            return `El registro con ID: ${imageMetadata.shutterstock_id} ya existe en la BD`;
        }

    } catch (error) {
        if (error.code && error.code === 'ER_DUP_ENTRY') {
            return "Entrada de archivo duplicada, el archivo ya existe en la BD"
        } else {
            return `Error al procesar el archivo con ID: ${imageMetadata.shutterstock_id}`;
        }
    }
};

// Esta es la funcion encargada de descargar las imagenes y almacenarlas en una ruta especifica de la PC
const saveImages = async (imageUrl) => {
    const imageId = getImageIdFromUrl(imageUrl.url);
    const options = {
        url: imageUrl.url,
        dest: `C:/Users/loren/Documents/Proyectos Angular/Troubleshooting_Bknd/download/${imageId}.jpg`,
    };
    try {
        const { filename } = await download.image(options);
        return `Saved to ${filename}`;
        //console.log("Saved to", filename);
    } catch (err) {
        console.error(err);
    }
};

// Funcion auxiliar para obtener el id de la imagen a partir de su URL para luego devolver este id
const getImageIdFromUrl = (imageUrl) => {
    const parts = imageUrl.split('/');
    let name = parts[parts.length - 1].split('.')[0];

    if (!name.startsWith("shutterstock_")) {
        return `shutterstock_${name}`;
    }
    return name;
};

// Funcion auxiliar para obtener el dia correspondiente a 30 dias atras
const get30DaysAgoDate = () => {
    const fechaActual = new Date();
    fechaActual.setDate(fechaActual.getDate() - 30);

    const year = fechaActual.getFullYear();
    const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const day = String(fechaActual.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Funcion encargada de registrar el Reporte en la BD
const insertDBReport = async (order) => {
    try {
        const result = await insertOrderShutterstockReport(order);

        if(result.affectedRows !== 0)
            return { status: "registered"};
        else
            return { status: "unregistered"}
        
    } catch (error) {
        console.log(error);
    }
};

// Funcion encargada de aleatorizar una lista
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


module.exports = {
    getImageIdFromUrl,
    importCsv,
    factoryShutterstock,
    insertDB,
    saveImages,
    get30DaysAgoDate,
    insertDBReport,
    shuffle
}