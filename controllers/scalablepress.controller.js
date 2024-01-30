const { splitString } = require("../Utilities/scalablepress.utilities");
const { getOrdersWithoutSP_Id, getSizes, getSuggestions, insertDictionary, deleteOrder } = require("../models/scalablepress.model");

const ordersWithoutSP_Id = async (req, res) => {
    try {
        const [data] = await getOrdersWithoutSP_Id();

        res.send({
            data
        })
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const sizesType = async (req, res) => {
    try {
        const [data] = await getSizes();

        res.send({
            data
        })
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const suggestions = async (req, res) => {
    try {
        const sku = req.body.sku;
        
        const { back } = splitString(sku);

        if (!back) {
            throw new Error("La cadena proporcionada no tiene suficientes caracteres para dividirla.");
        }
        
        console.log(back);

        const [data] = await getSuggestions(back);

        res.send({
            data
        })
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const insertDesignID = async (req, res) => {
    try {
        const date = req.body.date;
        const sku = req.body.sku
        const size = req.body.size
        const size_translation = req.body.size_translation
        const design_id = req.body.design_id

        const [result] = await insertDictionary(date, sku, size, size_translation, design_id);

        res.send({
            data: result
        })
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

const deleteElem = async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await deleteOrder(id);

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
    ordersWithoutSP_Id,
    sizesType,
    suggestions,
    insertDesignID,
    deleteElem

}