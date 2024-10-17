const { Dropbox, DropboxAuth } = require("dropbox");
const isoFetch = require("isomorphic-fetch");
const fs = require("fs");
const {
  saveMockupModel,
  saveArtFrontModel,
  saveArtFrontModel_Clone,
  saveMockupModel_Clone,
} = require("../models/swiftpod.model");

const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024; // 150 MB
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; 
const redirectUri = `http://localhost:3005/dropbox/auth`;

const dbxAuth = new DropboxAuth({
  clientId: "cxubf21xnekirt4",
  clientSecret: "74xx0jmyjsxvu9r",
  fetch: isoFetch,
});

const uploadImages = async (req, res) => {
  try {
    const { image_type } = req.params;
    const pod = req.query.pod;
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

    const results = await uploadFilesInBatch(dbx, filteredFiles, image_type, pod);

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
async function uploadFilesInBatch(dbx, files, image_type, pod) {
  const entries = await Promise.all(files.map(async (file) => {
    const content = fs.readFileSync(file.path);
    const path = getUploadPath(file, image_type);
    return {
      path,
      content,
      file
    };
  }));

  // Usamos un bucle for...of para controlar mejor el flujo y permitir pausas entre cargas
  const results = [];
  for (const entry of entries) {
    const result = await uploadSingleFileWithRetry(dbx, entry, image_type, pod);
    results.push(result);
    // Pausa breve entre cargas para evitar sobrecargar la API
    await delay(500);
  }

  return results;
}

async function uploadSingleFileWithRetry(dbx, entry, image_type, pod, retryCount = 0) {
  try {
    return await uploadSingleFile(dbx, entry, image_type, pod);
  } catch (error) {
    if (error.error && error.error.reason && error.error.reason['.tag'] === 'too_many_write_operations' && retryCount < MAX_RETRIES) {
      console.log(`Rate limit hit, retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY);
      return uploadSingleFileWithRetry(dbx, entry, image_type, retryCount + 1);
    }
    throw error;
  }
}

async function uploadSingleFile(dbx, entry, image_type, pod) {
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
      let sku = responseObj.sku.replace(/\s\(\d+\)\.jpe?g$/, '').replace(/\.\w+$/, '');
      let type = "front";
      
      if (sku.includes('-BACK')) {
        sku = sku.replace('-BACK', '');
        type = "back";
      }
    
      await saveMockupModel({
        sku: sku,
        url: responseObj.url.replace(/dl=0/, "raw=1"),
        region: "",
        type: type,
      });
    } else if (image_type === 'art') {
      let art = responseObj.sku.replace(/\s\(\d+\)\.png$/, '').replace(/\.\w+$/, '');
      let type = "front";
      
      if (art.includes('-BACK')) {
        art = art.replace('-BACK', '');
        type = "back";
      }
    
      await saveArtFrontModel({
        art: art,
        url: responseObj.url.replace(/dl=0/, "dl=1"),
        pod: pod,
        type: type,
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
    return `/Mockups/${fileName}`;
  } else if (image_type === "art") {
    return `/Respaldo PNG/${file.originalname}`;
  }
  throw new Error(`Invalid image type: ${image_type}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --------------------------------------------------------------------------------------------------------

const initAuthentication = async (req, res) => {
  try {
    const authUrl = await dbxAuth.getAuthenticationUrl(
      redirectUri,
      null,
      "code",
      "offline",
      null,
      "none",
      false
    );
    console.log(authUrl);
    res.send({
      authUrl,
    });
  } catch (error) {
    console.error("Error getting auth URL:", error);
    res.status(500).send("Error getting auth URL");
  }
};

const auth = async (req, res) => {
  try {
    const { code } = req.query;
    console.log(`code:${code}`);

    const token = await dbxAuth.getAccessTokenFromCode(redirectUri, code);
    console.log(`Token Result:${JSON.stringify(token)}`);

    await dbxAuth.setRefreshToken(token.result.refresh_token);

    if (token.result.access_token && token.result.refresh_token) {
      process.env.DBX_ACCESS_TOKEN = token.result.access_token;
      process.env.DBX_REFRESH_TOKEN = token.result.refresh_token;
    }

    res.send({
      Status: "OK",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: error.message,
    });
  }
};

const getAllFile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const path = "";
    let response = [];
    let files;

    const dbx = new Dropbox({
      accessToken: process.env.DBX_ACCESS_TOKEN,
      refreshToken: process.env.DBX_REFRESH_TOKEN,
      selectUser: user_id,
      fetch: isoFetch,
    });

    files = await dbx.filesListFolder({ path });

    if (files.result.entries.length > 0) {
      response = files.result.entries.map((file) => {
        return {
          type: file[".tag"],
          name: file.name,
        };
      });
    }

    res.send({
      response,
    });
  } catch (err) {
    console.log(err);
    if (err.error) {
      res.status(500).json({
        msg: err.error,
      });
    } else {
      res.status(500).json({
        msg: err.message,
      });
    }
  }
};

const getMembersList = async (req, res) => {
  try {
    let response = [];

    const dbxTeam = new Dropbox({
      accessToken: process.env.DBX_ACCESS_TOKEN,
      refreshToken: process.env.DBX_REFRESH_TOKEN,
      fetch: isoFetch,
    });
    const members = await dbxTeam.teamMembersList({
      limit: 100,
      include_removed: false,
    });

    if (members.result.members.length > 0) {
      response = members.result.members.map((member) => {
        return {
          member_id: member.profile.team_member_id,
          email: member.profile.email,
          status: member.profile.status[".tag"],
        };
      });
    }

    res.send({
      response,
    });
  } catch (err) {
    console.log(err);
    if (err.error) {
      res.status(500).json({
        msg: err.error,
      });
    } else {
      res.status(500).json({
        msg: err.message,
      });
    }
  }
};

module.exports = {
  uploadImages,
  getAllFile,
  initAuthentication,
  auth,
  getMembersList,
};
