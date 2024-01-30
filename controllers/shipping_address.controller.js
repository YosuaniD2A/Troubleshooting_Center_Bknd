const { getOrderById, updateShippingAddress } = require("../models/shipping_address.model");

const orderById = async (req, res) => {
    try {
        const id = req.body.id;
        const [data] = await getOrderById(id);

        res.send({
            data
        })
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const updateShipping = async (req, res) => {
    try {
        const data = req.body;
        const [result] = await updateShippingAddress(data);

        res.send({
            data: result
        })
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

module.exports = {
    orderById,
    updateShipping
}