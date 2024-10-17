const axios = require("axios");
const url = require('url');

const getAuthorizationCode = async (req, res) => {
  try {
    const authorizationUrl =
      "https://auth.mercadolibre.com.mx/authorization?response_type=code&client_id=2269980235715792&redirect_uri=https://www.mercadolibre.com.mx/";

    const response = await axios.get(authorizationUrl, {
      maxRedirects: 0, // Esto evita que axios siga automáticamente la redirección
      validateStatus: (status) => status >= 300 && status < 400, // Capturar redirecciones (3xx)
    });

    const redirectUrl = response.headers["location"];
    console.log("Redirected to:", redirectUrl);

    const parsedUrl = new url.URL(redirectUrl);
    const code = parsedUrl.searchParams.get('code');

    if (code && code.startsWith('TG-')) {
        console.log('Authorization Code:', code);
        res.send({code}); // Enviar el código como respuesta
      } else {
        console.log('Code not found or invalid format.');
        res.send({code:'Code not found'});
      }
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
    getAuthorizationCode
};
