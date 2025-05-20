const storeInSession = (key, value) => {
    sessionStorage.setItem(key, value);
}

const lookInSession = (key) => {
    return sessionStorage.getItem(key);
}

const removeFromsession = (key) => {
    return sessionStorage.removeItem(key);
}

const logOutUser = () => {
    sessionStorage.clear();
}

export {storeInSession, lookInSession, removeFromsession, logOutUser};