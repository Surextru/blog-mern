import axios from "axios";

export const uploadImage = async (img) => {
    const domain = import.meta.env.VITE_SERVER_DOMAIN;
    const route = "/get-upload-url"
    let imgUrl = null;

    await axios.get(domain + route)
    .then( async ({data: { uploadURL } }) => {
        
        // console.log("AWS AXIOS:", uploadURL);

        await axios({
            method: 'put',
            url: uploadURL,
            headers: { 'Content-Type': 'multipart/form-data' },
            data: img
        })
        .then((res) => {
            imgUrl = uploadURL.split("?")[0];
        })
    })

    return imgUrl;
}