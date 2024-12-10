const download = require("image-downloader");

const importCSVofImages = async (stream) => {
  return new Promise((resolve, reject) => {
    let listOfImages = [];

    stream.on("data", (row) => {
      listOfImages.push({
        sku: row.sku,
        url: row.img_url,
      });
    });
    stream.on("end", () => resolve(listOfImages));
  });
};

const downloadImages = async (image) => {
  const urls = image.url.split(",");
  const promises = urls.map(async (url, index) => {
    const option = {
      url: url.split("=")[1],
      dest: `C:/Users/loren/Documents/Mockups Downloaded/temp/${image.sku}_${index}.jpg`,
    };
    try {
      const { filename } = await download.image(option);
      console.log(`Image ${image.sku}_${index} saved in ${filename}`);
    } catch (err) {
      console.error(err);
    }
  });

  await Promise.all(promises);
  // const option = {
  //     url: image.url,
  //     dest: `C:/Users/loren/Documents/Mockups Downloaded/temp/${image.sku}.jpg`,
  // };
  // try {
  //     const { filename } = await download.image(option);
  //     return `Image ${image.sku} saved in ${filename}`;
  // } catch (err) {
  //     console.error(err);
  // }
};

const sizeMapping = {
  ME: {
    TSA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"], //Inlcuye TSB
    TSC: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL"],
    HOA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"],
    HOZ: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL"],
    SWA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"],
    LGA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL"],
    TTA: ["0XS", "S", "M", "L", "XL", "2XL"],
    TDP: ["00S", "00M", "00L", "0XL", "2XL"], //Incluye TCR y TCY 
  },
  WO: {
    TSA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"], //Inlcuye TSB
    TSC: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL"],
    HOA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"],
    HOZ: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL"],
    SWA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"],
    LGA: ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL"],
    CTE: ["00S", "00M", "00L", "0XL", "2XL"],
    RBA: ["0XS", "00S", "00M", "00L", "0XL", "2XL"],
    TDP: ["00S", "00M", "00L", "0XL", "2XL"],
},
  TO: {
    TSA: ["02T", "03T", "04T", "05T"],
    HOA: ["02T", "04T", "05T"],
    LGA: ["02T", "03T", "04T", "05T"],
  },
  YO: {
    TSA: ["0XS", "00S", "00M", "00L", "0XL"],
    HOA: ["00S", "00M", "00L", "0XL"],
  },
  BB: {
    TSA: ["06M", "12M", "18M", "24M"],
    BDS: ["0NB", "06M", "12M", "18M", "24M"],
  },
};

module.exports = {
  importCSVofImages,
  downloadImages,
  sizeMapping,
};
