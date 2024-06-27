const generateTokenBase64 = (companyRefId, apiKey) => {
    const credentials = `${companyRefId}:${apiKey}`;
    const buffer = Buffer.from(credentials);

    return buffer.toString('base64');
}

module.exports = {
    generateTokenBase64
}