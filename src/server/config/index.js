const devConfig = require('./dev');
const prodConfig = require('./prod');

const defaultConfig = {
    port: 3000,
    publicPath: '',
    rootPath: '/Users/pr1mavera/',
};

module.exports = {
    ...defaultConfig,
    ...(process.env.NODE_ENV === 'production' ? prodConfig : devConfig),
}
