const { getIncomingOrdersModel, saveArtModel, saveMockupModel, getArt, getMock } = require("../models/swiftpod.model");

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
        const bodyData = {
            order_id: data.order_id,
            test_order: true,
            order_status: "new_order",
            line_items: [
                {
                    order_item_id: data.line_items.order_item_id,
                    sku: data.line_items.sku,
                    name: data.line_items.name,
                    quantity: data.line_items.quantity,
                    print_files: [
                        {
                            key: data.line_items.print_files.key,
                            url: data.line_items.print_files.url
                        },
                        {
                            key: "back",
                            url: "https://via.placeholder.com/1400/09f/fff.png"
                        }
                    ],
                    preview_files: [
                        {
                            key: "front",
                            url: "https://via.placeholder.com/1400/09f/fff.png"
                        },
                        {
                            key: "back",
                            url: "https://via.placeholder.com/1400/09f/fff.png"
                        }
                    ]
                }
            ],
            address: {
                name: "John Smith",
                email: "johnsmith@demo.com",
                company: "DEMO",
                phone: "(330) 638-1331",
                street1: "4736 Phillips Rice Rd",
                street2: "",
                city: "Cortland",
                state: "OH",
                country: "US",
                zip: "44410",
                force_verified_status: true
            },
            return_address: {
                name: "John Smith",
                email: "johnsmith@demo.com",
                company: "DEMO",
                phone: "(330) 638-1331",
                street1: "4736 Phillips Rice Rd",
                street2: "",
                state: "OH",
                city: "Cortland",
                country: "US",
                zip: "44410"
            },
            shipping_method: "standard",
            tax_id: "IM0123456888",
            tax_id_type: "IOSS",
            insert: [
                {
                    name: "gift_message",
                    url: "https://swiftpod.s3.us-west-1.amazonaws.com/demo/gift-card.jpg",
                    size: "4x6"
                }]
        };
        const body = JSON.stringify(bodyData);
        const sendOrder = await fetch(
            `${process.env.SWIFTPOD_BASE_URL}orders`,
            {
                headers,
                method: "POST",
                body,
            }
        );

        const sendResponse = await sendOrder.json();
        res.send({ response: sendResponse });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getOrderFromSwift = async (req, res) => {
    try {
        const { orderID } = req.params;

        const getOrder = await fetch(
            `${process.env.SWIFTPOD_BASE_URL}orders/${orderID}`,
            {
                headers,
                method: "GET"
            }
        );

        const getResponse = await getOrder.json();
        res.send({ response: getResponse });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const cancelOrderFromSwift = async (req, res) => {
    try {
        const { orderID } = req.params;

        const cancelOrder = await fetch(
            `${process.env.SWIFTPOD_BASE_URL}orders/${orderID}/cancel`,
            {
                headers,
                method: "POST"
            }
        );

        const cancelResponse = await cancelOrder.json();
        res.send({ response: cancelResponse });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

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
                    items: []
                }
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
                pod_service: item.podService,
                pod_service_sku: item.podServiceSKU,
                product: item.product,
                color: item.color,
                size: item.size
            })

        })
        res.send({
            response: orders
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const saveArt = async (req, res) => {
    try {
        const { data } = req.body;

        const [exist] = await getArt(data.art);
        if(exist.length > 0){
            return res.send({
                msg: 'Ya existe este arte...'
            })
        }else{
            const [result] = await saveArtModel(data);
            res.send({
                response: result
            })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: error.message
        });
    }
}

const saveMockup = async (req, res) => {
    try {
        const { data } = req.body;
        const [exist] = await getMock(data.sku);
        if(exist.length > 0){
            return res.send({
                msg: 'Ya existe este Mockup...'
            })
        }else{
            const [result] = await saveMockupModel(data);
            res.send({
                response: result
            })
        }

    } catch (error) {
        console.log(error);
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
    saveMockup
}