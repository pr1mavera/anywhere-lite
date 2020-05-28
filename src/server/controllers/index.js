module.exports = {
    getDirController: () => {
        const DirController = require('./DirController');
        return new DirController();
    },
};
