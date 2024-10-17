const { S3Client } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require("@smithy/node-http-handler");

const httpHandler = new NodeHttpHandler({
  connectionTimeout: 20000, // Tiempo de espera para nuevas conexiones
  maxSockets: 200, // Número máximo de sockets simultáneos
});

const connectionAws = () => {
    const options = {
        region: process.env.REGION_IMG,
        requestHandler: httpHandler,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_IMG_2,
          secretAccessKey: process.env.SECRET_ACCESS_KEY_IMG_2
        }
      };

    const s3Client = new S3Client(options);

    return s3Client
};

module.exports = {
    connectionAws
}