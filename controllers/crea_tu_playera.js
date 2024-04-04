const { getCTPOrdersStatusModel, updateCTPOrderStatusModel, getKornitXOrdersStatusModel } = require("../models/crea_tu_playera");

const getCTPOrdersStatus = async (req, res) => {
    try {

        const [data] = await getCTPOrdersStatusModel();

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getKornitXOrdersStatus = async (req, res) => {
    try {
        const order_id = req.params.order_id
        const [data] = await getKornitXOrdersStatusModel(order_id);

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const updateCTPOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.order_id;
        const data = req.body;
        console.log(orderId);
        console.log(data);
        const [result] = await updateCTPOrderStatusModel(orderId, data);

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
    getCTPOrdersStatus,
    getKornitXOrdersStatus,
    updateCTPOrderStatus
}