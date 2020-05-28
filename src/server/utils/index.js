const fs = require('fs');

function isFile(path) {
    return fs.statSync(path).isFile();
}

const unitMap = ['byte', 'kb', 'm', 'g', 't'];
function formatFileSize(size, count = 0) {
    if (size >= 1024) {
        const carrySize = size / Math.pow(1024, ++count);
        return formatFileSize(carrySize, count);
    } else {
        return Math.round(size) + ' ' + unitMap[count];
    }
}

const sortRules = (a, b) => {
    var nameA = a.name;
    var nameB = b.name;
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}
function normalizeFileOrder(list) {
    const dirList = list.filter(({ type }) => type === 'dir').sort(sortRules);
    const fileList = list.filter(({ type }) => type === 'file').sort(sortRules);

    return [ ...dirList, ...fileList ];
}

module.exports = {
    isFile,
    formatFileSize,
    normalizeFileOrder
}
