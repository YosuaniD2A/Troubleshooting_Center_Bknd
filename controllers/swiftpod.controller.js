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
} = require("../models/swiftpod.model");
const https = require('https');

const headers = {
  "Content-type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${process.env.SWIFTPOD_API_TOKEN}`,
};

// --------------------------- SwiftPOD API -------------------------------------

const sendOrderToSwift = async (req, res) => {
  try {
    const { data } = req.body;
    const body = JSON.stringify(data);

    const options = {
      hostname: 'api.swiftpod.com',
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SWIFTPOD_API_TOKEN}`,
      },
    };

    const sendOrder = () => {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve(JSON.parse(data));
          });
        });

        req.on('error', (e) => {
          reject(e);
        });

        req.write(body);
        req.end();
      });
    };

    const sendResponse = await sendOrder();
    res.send({ response: sendResponse });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};
// const sendOrderToSwift = async (req, res) => {
//   try {
//     const { data } = req.body;
   
//     const body = JSON.stringify(data);
//     console.log({body});
//     const sendOrder = await fetch(`${process.env.SWIFTPOD_BASE_URL}orders`, {
//       headers,
//       method: "POST",
//       body,
//     });

//     const sendResponse = await sendOrder.json();
//     res.send({ response: sendResponse });
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// };

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
      let existingOrder = orders.find(order => order.site_order_id === item.siteOrderId);
      
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
    res.status(500).json({
      error: error.message,
    });
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
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSwiftPODOrdersStatus = async (req, res) => {
    try {
        const swift_id = req.params.swift_id
        const [data] = await getSwiftPODOrdersStatusModel(swift_id);

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const updateSwiftPODOrderStatus = async (req, res) => {
    try {
        const order_id = req.params.order_id;
        const data = req.body;

        console.log(`Updating order: ${order_id}`)
        const [result] = await updateSwiftPODOrderStatusModel(order_id, data);

        res.send({
            data: result
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getOrdersWithoutUpdate = async (req, res) => {
  try {
      const [data] = await getOrdersWithoutUpdateModel();

      res.send({
          data
      });
  } catch (error) {
      res.status(500).json({
          error: error.message
      });
  }
}

module.exports = {
  sendOrderToSwift,
  getOrderFromSwift,
  cancelOrderFromSwift,

  getIncomingOrders,
  saveArt,
  saveMockup,
  saveArtNeck,
  saveShippingLabel,
  deleteArtNeck,

  saveSwiftPODOrder,
  getSwiftPODOrder,
  getSwiftPODOrdersStatus,
  updateSwiftPODOrderStatus,
  getOrdersWithoutUpdate
};
