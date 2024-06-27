const download = require("image-downloader");

const importCSVofImages = async (stream) => {
    return new Promise((resolve, reject) => {
        let listOfImages = [];

        stream.on("data", (row) => {
            listOfImages.push({
                sku: row.sku,
                url: row.img_url
            });
        });
        stream.on("end", () => resolve(listOfImages));
    });
};

const downloadImages = async (image) => {
    const urls = image.url.split(',');
    const promises = urls.map(async (url, index) => {
        const option = {
            url: url.split('=')[1],
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


module.exports = {
    importCSVofImages,
    downloadImages
}