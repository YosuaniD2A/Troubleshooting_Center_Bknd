const {
  getIncomingOrdersModel,
  saveMockupModel,
  getMock,
  saveShippingLabelModel,
  getShipping,
  getArt,
  saveArtFrontModel,
  getArtInnerNeck,
  getArtOuterNeck,
  saveArtNeckModel,
  deleteArtNeckModel,
  saveSwiftPODOrderModal,
  getSwiftPODOrderModel,
  getSwiftPODOrdersStatusModel,
  updateSwiftPODOrderStatusModel,
  getOrdersWithoutUpdateModel,
  getSimilarMock,
  getSimilarArt,
  getSwiftpodBrandModel,
} = require("../models/swiftpod.model");
const https = require("https");
const { Dropbox } = require("dropbox");
const isoFetch = require("isomorphic-fetch");

const headers = {
  "Content-type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${process.env.SWIFTPOD_API_TOKEN_D2}`,
};

// --------------------------- SwiftPOD API -------------------------------------

// const sendOrderToSwift = async (req, res) => {
//   try {
//     const { data } = req.body;
//     const body = JSON.stringify(data);

//     const options = {
//       hostname: 'api.swiftpod.com',
//       path: '/v1/orders',
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.SWIFTPOD_API_TOKEN}`,
//       },
//     };

//     const sendOrder = () => {
//       return new Promise((resolve, reject) => {
//         const req = https.request(options, (res) => {
//           let data = '';

//           res.on('data', (chunk) => {
//             data += chunk;
//           });

//           res.on('end', () => {
//             resolve(JSON.parse(data));
//           });
//         });

//         req.on('error', (e) => {
//           reject(e);
//         });

//         req.write(body);
//         req.end();
//       });
//     };

//     const sendResponse = await sendOrder();
//     res.send({ response: sendResponse });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// };
const sendOrderToSwift = async (req, res) => {
  try {
    const { siteName } = req.params;
    const { data } = req.body;
    if(siteName === "Faire"){
      console.log('Orden destino Faire')
    }

    const body = JSON.stringify(data);
    console.log({
      siteName,
      body,
    });
    const sendOrder = await fetch(`${process.env.SWIFTPOD_BASE_URL}orders`, {
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
        Authorization:
          siteName === "Faire"
            ? `Bearer ${process.env.SWIFTPOD_API_TOKEN_SW}` // Token para "Faire"
            : `Bearer ${process.env.SWIFTPOD_API_TOKEN_D2}`, // Token general
      },
      method: "POST",
      body,
    });

    const sendResponse = await sendOrder.json();
    res.send({ response: sendResponse });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getOrderFromSwift = async (req, res) => {
  try {
    const { orderID } = req.params;

    const getOrder = await fetch(
      `${process.env.SWIFTPOD_BASE_URL}orders/${orderID}`,
      {
        headers,
        method: "GET",
      }
    );

    const getResponse = await getOrder.json();
    res.send({ response: getResponse });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const cancelOrderFromSwift = async (req, res) => {
  try {
    const { orderID } = req.params;

    const cancelOrder = await fetch(
      `${process.env.SWIFTPOD_BASE_URL}orders/${orderID}/cancel`,
      {
        headers,
        method: "POST",
      }
    );

    const cancelResponse = await cancelOrder.json();
    res.send({ response: cancelResponse });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// --------------------------- DB Relationship -------------------------------------

const getIncomingOrders = async (req, res) => {
  try {
    let orders = [];
    const [result] = await getIncomingOrdersModel();

    // Build Incoming Orders
    result.forEach((item) => {
      let existingOrder = orders.find(
        (order) => order.site_order_id === item.siteOrderId
      );

      if (!existingOrder) {
        existingOrder = {
          site_order_id: item.siteOrderId,
          site_name: item.siteName,
          order_id: item.orderId,
          order_date: item.orderDate,
          ship_to: item.shipTo,
          phone: item.phone,
          address_1: item.address_1,
          address_2: item.address_2,
          address_3: item.address_3,
          city: item.city,
          postal_code: item.postalCode,
          region: item.region,
          country: item.country,
          status: item.status,
          shipping_label: item.shippingLabelURL,
          carrier: item.carrier,
          tracking_code: item.trackingCode,
          pod_service: item.podService,
          items: [],
        };
        orders.push(existingOrder);
      }

      existingOrder.items.push({
        sku: item.sku,
        design: item.design,
        quantity: item.quantity,
        front_art_url: item.frontArtUrl,
        back_art_url: item.backArtUrl,
        front_mockup_url: item.frontMockupUrl,
        front_print_area: item.frontPrintArea,
        back_mockup_url: item.backMockupUrl,
        inner_neck_art_url: item?.innerNeckArtUrl,
        outer_neck_art_url: item?.outerNeckArtUrl,
        pod_service: item.podService,
        pod_service_sku: item.podServiceSKU,
        product: item.product,
        color: item.color,
        size: item.size,
      });
    });

    res.send({
      response: orders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

// const linkMockup = async (req, res) => {
//   try {
//     const { skuBase, size } = req.body;
//     const [exist] = await getSimilarMock(skuBase);

//     if (exist.length === 0) {
//       return res.status(404).json({ message: "Mockup no encontrado" });
//     }

//     const lastMockup = exist[0];
//     const newSku = `${skuBase}${size}`;

//     const [result] = await saveMockupModel({
//       sku: newSku,
//       url: lastMockup.url,
//       region: lastMockup.region,
//       type: lastMockup.type,
//     });

//     return res.json({ data: result });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// };
const linkMockup = async (req, res) => {
  try {
    const { skuBase, size } = req.body;

    // Buscar primero en la base de datos
    const [exist] = await getSimilarMock(skuBase);

    if (exist.length > 0) {
      const lastMockup = exist[0];
      const newSku = `${skuBase}${size}`;

      // Guardar el nuevo mockup en la base de datos con el mismo URL
      const [result] = await saveMockupModel({
        sku: newSku,
        url: lastMockup.url,
        region: lastMockup.region,
        type: lastMockup.type,
      });

      return res.json({ data: result });
    }

    const dbx = new Dropbox({
      accessToken: process.env.DBX_ACCESS_TOKEN,
      refreshToken: process.env.DBX_REFRESH_TOKEN,
      selectUser: process.env.USER_D2AMERICA,
      fetch: isoFetch,
    });

    // Si no se encuentra en la BD, buscar en Dropbox
    const searchPath = '/Mockups'; // Carpeta donde se buscarán los mockups
    const searchQuery = skuBase;

    const dropboxResult = await dbx.filesSearchV2({
      query: searchQuery,
      options: {
        filesSearchV2: { ".tag": "active" },
        max_results: 20, // Limitar a un resultado
      },
    });

    const jpgFiles = dropboxResult.result.matches?.filter(
      (match) =>
        match.metadata.metadata[".tag"] === "file" && // Asegurarse de que es un archivo
        match.metadata.metadata.name.toLowerCase().endsWith(".jpg") // Que sea un archivo .jpg
    );

    if (!jpgFiles || jpgFiles.length === 0) {
      return res.status(404).json({ message: 'Mockup no encontrado en Dropbox ni en la BD' });
    }

    // Obtener detalles del archivo en Dropbox
    const mockupFile = jpgFiles[0].metadata.metadata;

    // Verificar si ya existe un enlace compartido para el archivo
    const sharedLinksResponse = await dbx.sharingListSharedLinks({
      path: mockupFile.path_lower,
    });

    let sharedLink;

    if (
      sharedLinksResponse.result.links.length > 0 &&
      sharedLinksResponse.result.links[0].url.includes("https://www.dropbox.com/scl/fi")
    ) {
      // Usar el enlace existente si es del tipo correcto
      sharedLink = sharedLinksResponse.result.links[0].url.replace("&dl=0", "&raw=1");
    } else {
      // Crear un nuevo enlace compartido si no existe o no es del tipo correcto
      const newSharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: mockupFile.path_lower,
      });

      sharedLink = newSharedLinkResponse.result.url.replace("&dl=0", "&raw=1");
    }
    

    const newSku = `${skuBase}${size}`;

    // Guardar el nuevo mockup en la base de datos
    const [result] = await saveMockupModel({
      sku: newSku,
      url: sharedLink,
      region: '', // Ajusta según sea necesario
      type: (skuBase.includes('UNSPP')) ? 'poster' : 'front' // Ajusta según sea necesario
    });

    return res.json({ data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const linkArt = async (req, res) => {
  try {
    const { design, pod } = req.body;
    const podMap = {
      crea_tu_playera: "crea tu playera",
      swiftpod: "swiftpod",
      printbar: "the print bar",
    };
    // Buscar primero en la base de datos
    const [exist] = await getSimilarArt(design);

    if (exist.length > 0) {
      const lastArt = exist[0];

      // Guardar el nuevo mockup en la base de datos con el mismo URL
      const [result] = await saveArtFrontModel({
        art: lastArt.art,
        url: lastArt.url,
        pod: podMap[pod],
        type: (design.includes('UNSPP')) ? 'poster' : lastArt.type,
      });

      return res.json({ data: result });
    }

    const dbx = new Dropbox({
      accessToken: process.env.DBX_ACCESS_TOKEN,
      refreshToken: process.env.DBX_REFRESH_TOKEN,
      selectUser: process.env.USER_D2AMERICA,
      fetch: isoFetch,
    });

    // Si no se encuentra en la BD, buscar en Dropbox
    const searchPath = '/Mockups'; // Carpeta donde se buscarán los mockups
    const searchQuery = design;

    const dropboxResult = await dbx.filesSearchV2({
      query: searchQuery,
      options: {
        filesSearchV2: { ".tag": "active" },
        max_results: 20, // Limitar a un resultado
      },
    });

    const pngFiles = dropboxResult.result.matches?.filter(
      (match) =>
        match.metadata.metadata[".tag"] === "file" && // Asegurarse de que es un archivo
        match.metadata.metadata.name.toLowerCase().endsWith(".png") // Que sea un archivo .jpg
    );

    if (!pngFiles || pngFiles.length === 0) {
      return res.status(404).json({ message: 'Arte no encontrado en Dropbox ni en la BD' });
    }

    // Obtener detalles del archivo en Dropbox
    const mockupFile = pngFiles[0].metadata.metadata;

    // Verificar si ya existe un enlace compartido para el archivo
    const sharedLinksResponse = await dbx.sharingListSharedLinks({
      path: mockupFile.path_lower,
    });

    let sharedLink;

    if (
      sharedLinksResponse.result.links.length > 0 &&
      sharedLinksResponse.result.links[0].url.includes("https://www.dropbox.com/scl/fi")
    ) {
      // Usar el enlace existente si es del tipo correcto
      sharedLink = sharedLinksResponse.result.links[0].url.replace("&dl=0", "&dl=1");
    } else {
      // Crear un nuevo enlace compartido si no existe o no es del tipo correcto
      const newSharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: mockupFile.path_lower,
      });

      sharedLink = newSharedLinkResponse.result.url.replace("&dl=0", "&dl=1");
    }
    

    // Guardar el nuevo mockup en la base de datos
    const [result] = await saveArtFrontModel({
      art: design,
      url: sharedLink,
      pod: podMap[pod], // Ajusta según sea necesario
      type: (design.includes('UNSPP')) ? 'poster' : 'front' // Ajusta según sea necesario
    });

    return res.json({ data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

const saveArt = async (req, res) => {
  try {
    const { data } = req.body;
    data.pod = data.pod.split("_").join(" ");

    const [exist] = await getArt(data.art, data.type, data.pod);
    if (exist.length > 0) {
      return res.send({
        msg: "Ya existe este arte...",
      });
    } else {
      const [result] = await saveArtFrontModel(data);
      res.send({
        response: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const saveMockup = async (req, res) => {
  try {
    const { data } = req.body;
    const [exist] = await getMock(data.sku, data.type, data.region);
    if (exist.length > 0) {
      return res.send({
        msg: "Ya existe este Mockup...",
      });
    } else {
      const [result] = await saveMockupModel(data);
      res.send({
        response: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const saveArtNeck = async (req, res) => {
  try {
    let exist;
    const { data } = req.body;

    if (data.type === "inner_neck") {
      [exist] = await getArtInnerNeck(data.art);
    } else {
      [exist] = await getArtOuterNeck(data.art);
    }
    if (exist.length > 0) {
      return res.send({
        msg: "Este diseño ya tiene asignado un arte...",
      });
    } else {
      const [result] = await saveArtNeckModel(data);
      res.send({
        response: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const deleteArtNeck = async (req, res) => {
  try {
    const { art } = req.params;

    const [exist] = await getArtInnerNeck(art);
    if (exist.length === 0) {
      return res.send({
        msg: "No existe este arte...",
      });
    } else {
      const [result] = await deleteArtNeckModel(art);
      res.send({
        response: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const saveShippingLabel = async (req, res) => {
  try {
    const { data } = req.body;
    const [exist] = await getShipping(data.site_order_id);
    if (exist.length > 0) {
      return res.send({
        msg: "Esta orden ya tiene un Shipping Label asignado...",
      });
    } else {
      const [result] = await saveShippingLabelModel(data);
      res.send({
        msg: "Shipping Label registrado satisfactoriamente...",
        response: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getSwiftpodBrand = async (req, res) => {
  try {
    const [data] = await getSwiftpodBrandModel(req.params.design);

    res.send({
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

//----------------------------- Order in Tables -----------------------------

const saveSwiftPODOrder = async (req, res) => {
  try {
    const { data } = req.body;

    const [result] = await saveSwiftPODOrderModal(data);
    res.send({
      response: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getSwiftPODOrder = async (req, res) => {
  try {
    const [data] = await getSwiftPODOrderModel();

    res.send({
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const getSwiftPODOrdersStatus = async (req, res) => {
  try {
    const swift_id = req.params.swift_id;
    const [data] = await getSwiftPODOrdersStatusModel(swift_id);

    res.send({
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const updateSwiftPODOrderStatus = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const data = req.body;

    console.log(`Updating order: ${order_id}`);
    const [result] = await updateSwiftPODOrderStatusModel(order_id, data);

    res.send({
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const getOrdersWithoutUpdate = async (req, res) => {
  try {
    const [data] = await getOrdersWithoutUpdateModel();

    res.send({
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  sendOrderToSwift,
  getOrderFromSwift,
  cancelOrderFromSwift,

  getIncomingOrders,
  linkMockup,
  linkArt,
  saveArt,
  saveMockup,
  saveArtNeck,
  saveShippingLabel,
  deleteArtNeck,
  getSwiftpodBrand,

  saveSwiftPODOrder,
  getSwiftPODOrder,
  getSwiftPODOrdersStatus,
  updateSwiftPODOrderStatus,
  getOrdersWithoutUpdate,
};
