const { join, resolve } = require('path');
const fs = require('fs');

const { publicPath, rootPath } = require('../config');
const { isFile, formatFileSize, normalizeFileOrder } = require('../utils');

const ERR_OK = '0';

class DirController {
    async get(ctx) {
        const dirPath = ctx.request.path.slice(publicPath.length + '/dir'.length);
        const fullPath = join(rootPath, dirPath);

        // 这块按理说应该在service里写
        const res = dirService(fullPath);
        res.result.path = dirPath;

        if (ctx.request.header['x-pjax']) {
            // 说明是前端路由触发fetch请求接口
            ctx.body = res;
        } else {
            // 说明是浏览器直接发起的页面访问
            // 需要拼接内容生成网页骨架，注入样式及脚本，送到前端
            ctx.body = renderOnService(res);
        }
    }
}

// 这块应该属于web侧，和renderOnWeb放在一起同属于 template 的编译方式
function renderOnService(data) {
    const INSERT_STYLE = '<!-- style-outlet -->';
    const INSERT_CONTENT = '<!-- app-outlet -->';
    const INSERT_SCRIPT = '<!-- script-outlet -->';
    const template = getWeb('index.html');
    const mainScript = getWeb('main.js');
    const style = getWeb('style.css');
    const resetStyle = getWeb('common/reset.css');
    const nodeList2str = list => list.reduce((temp, node) => temp += node);
    function resolvePath(...path) {
        return resolve(__dirname, '../../', ...path);
    }
    function getWeb(path) {
        return fs.readFileSync(resolvePath('web', path), 'utf8');
    }
    const createCtrlBtn = () => `
        <div class="controlBtn">
            <button class="prev"><</button>
            <button class="next">></button>
        </div>
    `;
    const createBreadcrumbs = path => {
        const pathPieces = path.split('/').filter(item => item);
        return `
            <span class="breadcrumbs">
                当前路径：
                ${
                    pathPieces
                        .map((item, i) => {
                            const curPath = pathPieces.slice(0, i + 1)
                                                        .reduce((temp, pathPiece) => temp += '/' + pathPiece, '');
                            return `<span
                                        class="crumb ${/^\./.test(item.trim()) ? 'hidden-file' : 'visible-file'}"
                                        data-path="${curPath}">
                                            ${item}
                                    </span>`;
                        })
                        .reduce((temp, crumb) => temp += '<i>/</i>' + crumb, '')
                }
            </span>
        `;
    };
    
    const createTable = data => `
        <table id="dirClass">
            <tr>
                ${nodeList2str(data.shift().map(item => `<th>${item}</th>`))}
            </tr>
            ${nodeList2str(data.map(item => {
                const keyMap = [ 'name', 'type', 'byte' ];
                const tds = keyMap.map(key => {
                    if (key === 'name') {
                        return `<td class="${item.type === 'dir' ? 'dir' : 'file'}">${item[key]}</td>`;
                    } else {
                        return `<td>${item[key]}</td>`;
                    }
                });
                return `<tr class="${/^\/*\s*\./.test(item.name) ? 'hidden-file' : 'visible-file'}">${nodeList2str(tds)}</tr>`;
            }))}
        </table>
    `;

    return template
        .replace(INSERT_CONTENT, () => {
            return `<div id="app">
                ${createCtrlBtn()}
                ${createBreadcrumbs(data.result.path)}
                ${createTable(data.result.list)}
            </div>`;
        })
        .replace(INSERT_SCRIPT, () => {
            return `
                <script type="text/javascript">
                +(() => {
                    ${mainScript}
                })();
                </script>
            `;
        })
        .replace(INSERT_STYLE, () => {
            return `
                <style>${resetStyle}</style>
                <style>${style}</style>
            `;
        });
}

// DirService
function getFileData(path, fileName) {
    const stats = fs.statSync(join(path, fileName));
    if (stats.isFile()) { // 文件，并需要计算其大小
        return {
            name: fileName,
            type: 'file',
            byte: formatFileSize(stats.size),
        };
    } else {
        return {
            name: '/ ' + fileName,
            type: 'dir',
            byte: '-'
        };
    }
}
function dirService(path) {
    let res;
    try {
        if (isFile(path)) {
            res = '文件内容';
        } else {
            const files = fs.readdirSync(path);
            const filesData = files.map(file => getFileData(path, file));
            res = normalizeFileOrder(filesData);
            res.unshift([ '文件标题', '类型', '大小' ]);
        }
        return {
            code: ERR_OK,
            result: { list: res },
        };
    } catch (error) {
        console.log('error in dirService:', error);
        return {
            code: '-1',
            result: { list: [] },
            msg: String(error),
        };
    }
}

module.exports = DirController;
