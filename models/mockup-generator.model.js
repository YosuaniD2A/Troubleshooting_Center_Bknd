const db = require("../config/dbConfig").promise();

const saveMockupDynamicModel = (data) => {
    return db.query(`
        INSERT INTO mockups_dynamic (
            uuid, mockup_name, smart_obj_uuid, smart_obj_type, 
            smart_obj_size_w, smart_obj_size_h, smart_obj_position_top, 
            smart_obj_position_left, collection_uuid, collection
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            mockup_name = VALUES(mockup_name),
            smart_obj_type = VALUES(smart_obj_type),
            smart_obj_size_w = VALUES(smart_obj_size_w),
            smart_obj_size_h = VALUES(smart_obj_size_h),
            smart_obj_position_top = VALUES(smart_obj_position_top),
            smart_obj_position_left = VALUES(smart_obj_position_left),
            collection_uuid = VALUES(collection_uuid),
            collection = VALUES(collection)
    `, [
        data.uuid, data.mockup_name, data.smart_obj_uuid, data.smart_obj_type, 
        data.smart_obj_size_w, data.smart_obj_size_h, data.smart_obj_position_top, 
        data.smart_obj_position_left, data.collection_uuid, data.collection
    ]);
};

const searchSimilar = (searchKey, unisexKey, amount) => {
    return db.query(`
        SELECT * FROM mockups_dynamic
        WHERE mockup_name LIKE ? OR mockup_name LIKE ?
        LIMIT ?;
    `, [
        `${searchKey}_%`, `${unisexKey}_%`, parseInt(amount)
    ]);
};

const saveMockupToDatabase = (data) => {
    return db.query(`
        INSERT INTO generated_mockups_dynamic (mockup_name, download_path, design_path)
    VALUES (?, ?, ?);
  `, [data.mockup_name, data.download_path, data.design_path]);
};

const selectColorByStyleModel = (style) => {
    return db.query(`
        SELECT po.color FROM product_offering po WHERE po.product = ? GROUP BY po.color;
  `, [style]);
};

module.exports = {
    saveMockupDynamicModel,
    searchSimilar,
    saveMockupToDatabase,
    selectColorByStyleModel
}