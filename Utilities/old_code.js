// Primer bloque implementado (Funcional parcialmente)
const uploadImages = async (req, res) => {
  try {
    const { image_type } = req.params;
    const files = req.files;

    const dbx = new Dropbox({
      accessToken: process.env.DBX_ACCESS_TOKEN,
      refreshToken: process.env.DBX_REFRESH_TOKEN,
      selectUser: process.env.USER_YOSUANI,
      fetch: isoFetch,
    });

    if (!files || files.length === 0) {
      return res.status(400).send({ message: "Please upload a file." });
    }

    const filteredFiles = files.filter((file) => {
      if (image_type === "mockup" && file.originalname.includes("__")) {
        const number = file.originalname.split(".")[0].split("__")[1];
        return number === "101";
      }
      return true;
    });

    if (filteredFiles.length === 0) {
      return res.status(400).send({ message: "No valid files to upload." });
    }

    const uploadFile = async (file) => {
      let shareLink = "";
      let response = {};

      if (image_type === "mockup") {
        const fileName = file.originalname.replace(/__101/, "");
        let uploadPath = `/Mockups/${fileName}`;
        let newPath = uploadPath;
        let counter = 1;
        let fileExists = false;

        // Check if file exists and create unique name if necessary
        try {
          let metadata = await dbx.filesGetMetadata({ path: uploadPath });
          fileExists = !!metadata;
          while (fileExists) {
            newPath =
              `/Mockups/${fileName
                .split(".")
                .slice(0, -1)
                .join(".")}` +
              ` (${counter}).${fileName.split(".").pop()}`;
            try {
              metadata = await dbx.filesGetMetadata({ path: newPath });
              fileExists = !!metadata;
              counter++;
            } catch (error) {
              if (error.status === 409) {
                fileExists = false;
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          if (error.status !== 409) {
            throw error;
          }
        }

        // Read the file content
        const fileContent = fs.readFileSync(file.path);

        // Upload file
        fileUploaded = await dbx.filesUpload({
          path: newPath,
          contents: fileContent,
          autorename: false,
          mode: { ".tag": "overwrite" },
        });

        // Create share link
        shareLink = await dbx.sharingCreateSharedLinkWithSettings({
          path: fileUploaded.result.path_display,
        });

        // Construct art object and save to DB
        const mockup = {
          sku: shareLink.result.name.replace(/\s\(\d+\)\.jpg$/, '').replace(/\.\w+$/, ''),
          url: shareLink.result.url.replace(/dl=0/, "raw=1"),
          region: "",
          type: "front",
        };
        await saveMockupModel(mockup);

        // Prepare response
        response = {
          sku: shareLink.result.name.split(".")[0],
          url: shareLink.result.url,
          path: fileUploaded.result.path_display,
        };
      } else if (image_type === "art") {
        let uploadPath = `/Respaldo PNG/${file.originalname}`;
        let newPath = uploadPath;
        let counter = 1;
        let fileExists = false;

        // Check if file exists and create unique name if necessary
        try {
          let metadata = await dbx.filesGetMetadata({ path: uploadPath });
          fileExists = !!metadata;
          while (fileExists) {
            newPath =
              `/Respaldo PNG/${file.originalname
                .split(".")
                .slice(0, -1)
                .join(".")}` +
              ` (${counter}).${file.originalname.split(".").pop()}`;
            try {
              metadata = await dbx.filesGetMetadata({ path: newPath });
              fileExists = !!metadata;
              counter++;
            } catch (error) {
              if (error.status === 409) {
                fileExists = false;
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          if (error.status !== 409) {
            throw error;
          }
        }

        // Read the file content
        const fileContent = fs.readFileSync(file.path);

        // Upload file
        fileUploaded = await dbx.filesUpload({
          path: newPath,
          contents: fileContent,
          autorename: false,
          mode: { ".tag": "overwrite" },
        });

        // Create share link
        shareLink = await dbx.sharingCreateSharedLinkWithSettings({
          path: fileUploaded.result.path_display,
        });

        // Construct art object and save to DB
        const art = {
          art: shareLink.result.name.replace(/\s\(\d+\)\.png$/, '').replace(/\.\w+$/, ''),
          url: shareLink.result.url.replace(/dl=0/, "dl=1"),
          pod: "swiftpod",
          type: "front",
        };
        await saveArtFrontModel(art);

        // Prepare response
        response = {
          sku: shareLink.result.name.split(".")[0],
          url: shareLink.result.url,
          path: fileUploaded.result.path_display,
        };
      }
      return response;
    };

    const results = await Promise.all(filteredFiles.map(uploadFile));

    res.send({
      response: results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: error.message,
    });
  }
};

// ------------------------------------------------------------------------------------------
// Segundo bloque implementado (Funcional parcialmente)
const uploadImages2 = async (req, res) => {
  try {
    const { image_type } = req.params;
    const files = req.files;

    const dbx = new Dropbox({
      accessToken: process.env.DBX_ACCESS_TOKEN,
      refreshToken: process.env.DBX_REFRESH_TOKEN,
      selectUser: process.env.USER_YOSUANI,
      fetch: isoFetch,
    });

    if (!files || files.length === 0) {
      return res.status(400).send({ message: "Please upload a file." });
    }

    const filteredFiles = files.filter((file) => {
      if (image_type === "mockup" && file.originalname.includes("__")) {
        const number = file.originalname.split(".")[0].split("__")[1];
        return number === "101";
      }
      return true;
    });

    if (filteredFiles.length === 0) {
      return res.status(400).send({ message: "No valid files to upload." });
    }

    const results = await uploadFilesInBatch(dbx, filteredFiles, image_type);

    res.send({
      response: results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: error.message,
    });
  }
};
//-------------------------  Functions for Upload Endpoint  ----------------------------
async function uploadFilesInBatch(dbx, files, image_type) {
  const entries = await Promise.all(files.map(async (file) => {
    const content = fs.readFileSync(file.path);
    const path = getUploadPath(file, image_type);
    return {
      path,
      content,
      file
    };
  }));

  const results = await Promise.all(entries.map(entry => uploadSingleFile(dbx, entry, image_type)));

  return results;
}

async function uploadSingleFile(dbx, entry, image_type) {
  const { path: originalPath, content, file } = entry;

  try {
    let uploadPath = originalPath;
    let counter = 1;
    let fileExists = true;

    // Verificar si el archivo existe y crear un nombre único si es necesario
    while (fileExists) {
      try {
        await dbx.filesGetMetadata({ path: uploadPath });
        // Si no lanza un error, el archivo existe
        const pathParts = uploadPath.split('.');
        const extension = pathParts.pop();
        const basePath = pathParts.join('.');
        uploadPath = `${basePath} (${counter}).${extension}`;
        counter++;
      } catch (error) {
        if (error.status === 409) {
          // Error 409 significa que el archivo no existe
          fileExists = false;
        } else {
          // Si es otro tipo de error, lo lanzamos
          throw error;
        }
      }
    }

    const fileSize = content.length;
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    let offset = 0;

    // Iniciar sesión de carga
    const sessionStart = await dbx.filesUploadSessionStart({
      close: false,
      contents: content.slice(offset, Math.min(offset + chunkSize, fileSize))
    });
    offset += chunkSize;

    const sessionId = sessionStart.result.session_id;

    // Subir el resto del archivo en chunks
    while (offset < fileSize) {
      const chunk = content.slice(offset, Math.min(offset + chunkSize, fileSize));
      await dbx.filesUploadSessionAppendV2({
        cursor: {
          session_id: sessionId,
          offset: offset
        },
        close: false,
        contents: chunk
      });
      offset += chunk.length;
    }

    // Finalizar la sesión de carga
    const fileMetadata = await dbx.filesUploadSessionFinish({
      cursor: {
        session_id: sessionId,
        offset: fileSize
      },
      commit: {
        path: uploadPath,
        mode: { ".tag": "overwrite" },
        autorename: false,
        mute: false
      }
    });

    // Crear enlace compartido
    const shareLink = await dbx.sharingCreateSharedLinkWithSettings({
      path: fileMetadata.result.path_display,
    });

    const responseObj = {
      sku: shareLink.result.name,
      url: shareLink.result.url,
      path: fileMetadata.result.path_display,
    };

    // Guardar en la base de datos
    if (image_type === 'mockup') {
      await saveMockupModel_Clone({
        sku: responseObj.sku.replace(/\s\(\d+\)\.jpg$/, '').replace(/\.\w+$/, ''),
        url: responseObj.url.replace(/dl=0/, "raw=1"),
        region: "",
        type: "front",
      });
    } else if (image_type === 'art') {
      await saveArtFrontModel_Clone({
        art: responseObj.sku.replace(/\s\(\d+\)\.png$/, '').replace(/\.\w+$/, ''),
        url: responseObj.url.replace(/dl=0/, "dl=1"),
        pod: "swiftpod",
        type: "front",
      });
    }

    return responseObj;
  } catch (error) {
    console.error(`Error uploading file ${file.originalname}:`, error);
    return {
      error: `Failed to upload ${file.originalname}: ${error.message}`,
    };
  }
}

function getUploadPath(file, image_type) {
  if (image_type === "mockup") {
    const fileName = file.originalname.replace(/__101/, "");
    return `/Test/Mockups/${fileName}`;
  } else if (image_type === "art") {
    return `/Test/Respaldo PNG/${file.originalname}`;
  }
  throw new Error(`Invalid image type: ${image_type}`);
}

