const dotenv = require('dotenv');
const envResult = dotenv.config();
const subEnvResult = dotenv.config({
    path: `.env.${process.env.NODE_ENV}`
});
const envConfig = Object.assign({}, envResult.parsed, subEnvResult.parsed);
module.exports = envConfig;