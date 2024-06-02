const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const klawSync = require('klaw-sync');

class HtmlTemplatePlugin {
    constructor({ htmlFiles, dataDir }) {
        this.htmlFiles = Array.from(htmlFiles);
        this.dataDir = dataDir;
        if (!fs.existsSync(this.dataDir)) {
            const errorMsg = `dataDir '${this.dataDir}' 不存在，请手动创建目录`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
    /**
     * @param {webpack.Compiler} compiler
     * @memberof HtmlTemplatePlugin
     */
    apply(compiler) {
        compiler.getInfrastructureLogger(HtmlTemplatePlugin.name).log(`${HtmlTemplatePlugin.name} apply`);

        // 监听多语言json文件，变化后自动编译
        compiler.hooks.emit.tap(HtmlTemplatePlugin.name, (compilation) => {
            // 监听全局json文件
            let globalJsonFiles = klawSync(path.join(this.dataDir), {
                nodir: true,
                filter: (item) => item.path.endsWith('.json'),
            });
            globalJsonFiles.forEach((i) => {
                compilation.fileDependencies.add(i.path);
            });

            // 监听页面级别json文件
            this.htmlFiles.forEach((p) => {
                compilation.fileDependencies.add(p.replace(/\.html$/, '.json'));
            });
        });
    }
}

module.exports = HtmlTemplatePlugin;
