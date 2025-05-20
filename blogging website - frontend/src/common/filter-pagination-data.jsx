import axios from "axios";

export const filterPaginationData = async  ({ create_new_arr = false, state, results, page, countRoute, data_to_send = {} }) => {

    let object;
    let url = import.meta.env.VITE_SERVER_DOMAIN + countRoute;
    if(state != null && !create_new_arr){

        // console.log("filterPaginationData - inside if:")

        object = { ...state, results: [...state.results, ...results], page: page }

        // console.log("object",object);

    } else {
        // console.log("filterPaginationData - inside else:")

        await axios.post(url, data_to_send)
        .then(({ data: { totalDocs } }) => {
            // console.log("filterPagination:  ", results);
            object = { results: results, page: 1, totalDocs }
        })
        .catch(err => {
            console.log(err);
        })
    }

    return object;
}