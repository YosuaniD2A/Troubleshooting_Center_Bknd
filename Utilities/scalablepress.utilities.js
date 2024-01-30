const splitString = (inputString) => {
    if (inputString.length < 8) {
        return null; // Retorna null si la cadena es demasiado corta.
    }

    const front = inputString.slice(0, 5);
    const back = inputString.slice(-10);

    return { back };
}

module.exports = {
    splitString
}