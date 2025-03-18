const OpenAI = require("openai");
const fs = require("fs").promises;
const path = require("path");
const { saveMetadataModel } = require("../models/ai_generator.model");

const generateInfoGPT = async (req, res) => {
  try {
    // 📌 Validación: Asegurar que hay archivos en req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se subieron imágenes." });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Procesar cada imagen individualmente
    const results = await Promise.all(
      req.files.map(async (file) => {
        // 📌 Leer la imagen desde el disco y convertirla a base64
        const filePath = path.resolve(file.path);
        const fileData = await fs.readFile(filePath);
        const base64Image = `data:${file.mimetype};base64,${fileData.toString(
          "base64"
        )}`;

        // 📌 Hacer la consulta a OpenAI para esta imagen
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: 'Generate a title and keywords for this image. The answer should be, **Title:**, **Keywords:**, keywords should be separated by “,”.',
                },
                { type: "image_url", image_url: { url: base64Image } },
              ],
            },
          ],
        });

        const message = response.choices[0].message.content;

        // 📌 Expresiones regulares para extraer título y palabras clave en ambas estructuras
        const titleMatch = message.match(/\*\*?Title:\*\*?\s*"?(.+?)"?\n/i);
        const keywordsMatch = message.match(/\*\*?Keywords:\*\*?\s*(.+)/i);

        // 📌 Extraer el título, eliminando posibles comillas alrededor
        const title = titleMatch
          ? titleMatch[1].trim().replace(/^["']|["']$/g, "")
          : "No title generated";

        // 📌 Extraer las keywords y dividirlas correctamente
        const keywords = keywordsMatch
          ? keywordsMatch[1]
              .trim()
              .replace(/^["']|["']$/g, "")
              .split(/,\s*/)
          : [];

        // 📌 Formatear el resultado
        return {
          file: path.parse(file.originalname).name, // Nombre sin extensión
          title,
          keywords,
          original_message: message,
        };
      })
    );

    // 📌 Eliminar archivos temporales después de procesarlos
    await Promise.all(req.files.map((file) => fs.unlink(file.path)));

    return res.json(results);
  } catch (error) {
    console.error("Error al procesar imágenes:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

const generateInfoDeepSeek = async (req, res) => {
  try {
    // 📌 Validación: Asegurar que hay archivos en req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se subieron imágenes." });
    }

    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });

    // Procesar cada imagen individualmente
    const results = await Promise.all(
      req.files.map(async (file) => {
        // 📌 Leer la imagen desde el disco y convertirla a base64
        const filePath = path.resolve(file.path);
        const fileData = await fs.readFile(filePath);
        const base64Image = `data:${file.mimetype};base64,${fileData.toString(
          "base64"
        )}`;

        // 📌 Hacer la consulta a OpenAI para esta imagen
        const response = await openai.chat.completions.create({
          model: "deepseek-reasoner",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Generate a title and keywords for this image.",
                },
                { type: "image_url", image_url: { url: base64Image } },
              ],
            },
          ],
        });

        // // 📌 Extraer datos de la respuesta
        // const message = response.choices[0].message.content;
        // const titleMatch = message.match(/\*\*Title:\*\* (.+)/i);
        // const keywordsMatch = message.match(/\*\*Keywords:\*\* (.+)/i);

        // const title = titleMatch
        //   ? titleMatch[1].trim().replace(/^["']|["']$/g, "")
        //   : "No title generated";
        // const keywords = keywordsMatch
        //   ? keywordsMatch[1].trim().split(", ")
        //   : [];

        // // 📌 Formatear el resultado
        // return {
        //   file: path.parse(file.originalname).name, // Nombre sin extensión
        //   title,
        //   keywords,
        //   original_message: message,
        // };

        return response;
      })
    );

    // 📌 Eliminar archivos temporales después de procesarlos
    await Promise.all(req.files.map((file) => fs.unlink(file.path)));

    return res.json(results);
  } catch (error) {
    console.error("Error al procesar imágenes:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

const saveMetadata = async (req, res) => {
  try {
    const metadataArray = req.body; // Array de objetos

    if (!Array.isArray(metadataArray) || metadataArray.length === 0) {
      return res
        .status(400)
        .json({ msg: "El cuerpo de la solicitud debe ser un array con datos" });
    }

    // Procesar cada elemento en paralelo
    const results = await Promise.all(
      metadataArray.map(({ metadata, filename, title, keywords }) =>
        saveMetadataModel(metadata, { filename, title, keywords })
      )
    );

    res.json({ success: true, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { generateInfoGPT, generateInfoDeepSeek, saveMetadata };
