const db = require("../config/dbConfig").promise();


const saveMetadataModel = (metadata, data) => {
    let query = "";
    let values = [];

    switch (metadata) {
        case "SwiftPod":
            query = `
                INSERT INTO swiftpod_metadata (swiftpod_id, description, keywords) 
                VALUES (?, ?, ?)
            `;
            values = [data.filename, data.title, data.keywords];
            break;

        case "Pipeline":
            query = `
                INSERT INTO pipeline_metadata (pipeline_id, description, keywords) 
                VALUES (?, ?, ?)
            `;
            values = [data.filename, data.title, data.keywords];
            break;
        case "Tshirtguys":
            query = `
                INSERT INTO tshirtguys_metadata (tshirtguys_id, description, keywords) 
                VALUES (?, ?, ?)
            `;
            values = [data.filename, data.title, data.keywords];
            break;

        default:
            throw new Error("Tabla no reconocida");
    }

    return db.query(query, values);
}

module.exports = {
    saveMetadataModel
}