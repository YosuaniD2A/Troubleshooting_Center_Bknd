const {
  getIncomingOrdersModel,
  saveMockupModel,
  getMock,
  saveShippingLabelModel,
  getShipping,
  getArtFront,
  saveArtFrontModel,
  getArtInnerNeck,
  getArtOuterNeck,
  saveArtNeckModel,
  deleteArtNeckModel,
  saveSwiftPODOrderModal,
  getSwiftPODOrderModel,
  getSwiftPODOrdersStatusModel,
  updateSwiftPODOrderStatusModel,
} = require("../models/swiftpod.model");

const headers = {
  "Content-type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${process.env.SWIFTPOD_API_TOKEN}`,
};

// --------------------------- SwiftPOD API -------------------------------------

const sendOrderToSwift = async (req, res) => {
  try {
    const { data } = req.body;
    // Build order to SwiftPOD
    // const bodyData = {
    //     order_id: "CSDUP04262024-L1",
    //     test_order: true,
    //     order_status: "draft",
    //     line_items: [
    //         {
    //             order_item_id: "1196784058_SS00022098METSA0400M",
    //             sku: "UNGT1W00M",
    //             quantity: 1,
    //             print_files: [
    //                 {
    //                     key: "front",
    //                     url: "https://www.dropbox.com/scl/fi/cgqyjvdbg66gzi77kd26n/SS00490129WOTSA.png?rlkey=zkxms5e0vow9t8aybzlyhpj6w&st=1iqaxf9g&raw=1"
    //                 }
    //             ]
    //         }
    //     ],
    //     address: {
    //         name: "John Smith",
    //         email: "johnsmith@demo.com",
    //         company: "DEMO",
    //         phone: "(330) 638-1331",
    //         street1: "4736 Phillips Rice Rd",
    //         street2: "",
    //         city: "Cortland",
    //         state: "OH",
    //         country: "US",
    //         zip: "44410",
    //         force_verified_status: true
    //     },
    //     return_address: {
    //         name: "John Smith",
    //         email: "johnsmith@demo.com",
    //         company: "DEMO",
    //         phone: "(330) 638-1331",
    //         street1: "4736 Phillips Rice Rd",
    //         street2: "",
    //         state: "OH",
    //         city: "Cortland",
    //         country: "US",
    //         zip: "44410"
    //     },
    //     shipping_method: "standard",
    // };
    const body = JSON.stringify(data);
    console.log(body);
    const sendOrder = await fetch(`${process.env.SWIFTPOD_BASE_URL}orders`, {
      headers,
      method: "POST",
      body,
    });

    const sendResponse = await sendOrder.json();
    res.send({ response: sendResponse });
  } catch (error) {
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
    let i = -1;
    let order;
    const [result] = await getIncomingOrdersModel();

    //BuildIncomingOrders
    result.forEach((item, index) => {
      if (item.siteOrderId !== order?.site_order_id) {
        i += 1;
        order = {
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
        orders.push(order);
      }
      orders[i].items?.push({
        sku: item.sku,
        design: item.design,
        quantity: item.quantity,
        front_art_url: item.frontArtUrl,
        back_art_url: item.backArtUrl,
        front_mockup_url: item.frontMockupUrl,
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

    const [exist] = await getArtFront(data.art);
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
    const [exist] = await getMock(data.sku);
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
        const order_id = req.params.order_id
        const [data] = await getSwiftPODOrdersStatusModel(order_id);

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
  updateSwiftPODOrderStatus
};
