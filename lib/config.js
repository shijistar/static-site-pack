let oldCwd = process.cwd();
process.chdir(process.env.USP_ENTRY_CWD);
const uspConfig = require(process.env.USP_CONFIG_PATH);
process.chdir(oldCwd);
const uspConfigDefaults = require('../config.defaults');
module.exports = {
    ...uspConfigDefaults,
    ...uspConfig
};
