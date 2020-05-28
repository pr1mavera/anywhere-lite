class App {
    
    init() {
        this.initService(this);
        this.initRouter(this);
        this.initComponents(this);
    }

    initComponents(app) {
        this.components = {
            table: initTable(app, document.getElementById('dirClass')),
            controlBtn: initControlBtn(app, document.getElementsByClassName('controlBtn')[0]),
            breadcrumbs: initBreadcrumbs(app, document.getElementsByClassName('breadcrumbs')[0]),
        }
    }

    initService(app) {
        // 没有service模块，就搁这写吧
        const apis = {
            requestDirToUpdate: () => request(window.location.href),
        };
        const defaultRequestParams = {
            method: 'GET',
            headers: {
                'X-PJAX': true,
                'content-type': 'application/json'
            }
        };
        // 包装fetch
        function request(url, method, data, headers = null) {
            return fetch(url, {
                method: method || defaultRequestParams.method,
                
                headers: {
                    ...defaultRequestParams.headers,
                    ...headers,
                },
                ...((method !== 'GET' && data)
                    ? { body: JSON.stringify(data) }
                    : { }),
            })
            .catch(error => console.error('Error:', error))
            .then(response => response.json());
        }
        this.service = {
            app,
            apis,
            request,
        };
    }

    initRouter(app) {
        // 没有Router模块，就搁这写吧

        // 根据当前路由请求文件目录，并触发数据dom更新
        const handlerRequestDirToUpdate = () => this.service.apis.requestDirToUpdate().then(data => {
            if (data.code === '0') {
                const { table, breadcrumbs, controlBtn } = app.components;
                table.render(data.result.list);
                breadcrumbs.render(data.result.path);
                controlBtn.updateDisable();
            }
        });
        window.addEventListener('popstate', () => {
            // this.router.stack.pop();
            this.curIndex--;
            handlerRequestDirToUpdate();
        });

        this.router = {
            app,
            curIndex: 0,
            stack: [window.location.href],
            pushState(...args) {
                window.history.pushState(...args);
                this.stack.splice(this.curIndex + 1, this.stack.length, window.location.href);
                this.curIndex++;
                handlerRequestDirToUpdate();
            },
            replaceState(...args) {
                window.history.replaceState(...args);
                this.stack.splice(this.curIndex, this.stack.length, window.location.href);
                handlerRequestDirToUpdate();
            },
            forward() {
                window.history.forward();
                this.curIndex++;
                handlerRequestDirToUpdate();
            },
            back() {
                window.history.back();
                this.curIndex--;
                handlerRequestDirToUpdate();
            },
        }
    }
}

function initTable(app, el) {
    const table = el;

    // 监控点击table（先这样写了，本来组件啥的都应该有自己的生命周期）
    table.addEventListener('click', event => {
        const e = event || window.event;
        if (e.target.className.indexOf('dir') > -1) {
            // 命中文件
            const dir = e.target.textContent.replace(' ', '');
            const path = window.location.href.replace(/\/$/, ''); // 需要去掉结尾的 '/'
            app.router.pushState({}, 'dir:' + dir, path + dir);
        }
    });

    // 处理表单更新
    function render(data) {
        // const table = document.getElementById('dirClass');
        const frag = document.createDocumentFragment();

        // 根据数据生成节点树，生成到frag
        if (Array.isArray(data)) {
            // 文件结构
            frag.appendChild(this.createTableTitles(data.shift()));
            frag.appendChild(this.createTableContents(data));
        } else {
            // 文件内容
            const p = this.createP(data);
            frag.appendChild(p);
        }

        // 奢侈的删去容器内所有子节点
        table.innerHTML = '';
        table.appendChild(frag);
    }
    // 生成段落
    function createP(data) {
        const p = document.createElement('p');
        p.textContent = data;
        return p;
    }
    // 生成表格标题
    function createTableTitles(titles) {
        const tr = document.createElement('tr');
        titles.forEach(title => {
            const titleItem = document.createElement('th');
            titleItem.textContent = title;
            tr.appendChild(titleItem);
        });
        return tr;
    }
    // 生成一组表格
    function createTableContents(contents) {
        const keyMap = [ 'name', 'type', 'byte' ];
        const frag = document.createDocumentFragment();
        contents.forEach(content => {
            const tr = document.createElement('tr');
            tr.setAttribute('class', /^\/*\s*\./.test(content.name) ? 'hidden-file' : 'visible-file');
            keyMap.forEach(key => {
                const td = document.createElement('td');
                td.textContent = content[key];
                if (key === 'name') { // 单独处理name
                    td.setAttribute('class', content.type);
                }
                tr.appendChild(td);
            })
            frag.appendChild(tr);
        });
        return frag;
    }

    return {
        render,
        createP,
        createTableTitles,
        createTableContents,
    };
}

function initBreadcrumbs(app, el) {

    const breadcrumbs = el;

    // 监控面包屑文件夹点击（先这样写了，本来组件啥的都应该有自己的生命周期）
    breadcrumbs.addEventListener('click', event => {
        const e = event || window.event;
        if (e.target.dataset.path) {
            const path = '/dir' + e.target.dataset.path;
            app.router.pushState({}, 'dir:' + path, path);
        }
    });

    // 处理面包屑组件更新
    function render(path) {
        // const breadcrumbs = document.getElementsByClassName('breadcrumbs')[0];
        const frag = document.createDocumentFragment();

        const pathPieces = path.split('/').filter(item => item);
        pathPieces
            .map((item, i) => {
                const curPath = pathPieces.slice(0, i + 1)
                                        .reduce((temp, pathPiece) => temp += '/' + pathPiece, '');
                const spanNode = document.createElement('span');
                spanNode.setAttribute('class', `crumb ${/^\./.test(item.trim()) ? 'hidden-file' : 'visible-file'}`);
                spanNode.setAttribute('data-path', curPath);
                spanNode.textContent = item;
                return spanNode;
            })
            .forEach(spanNode => {
                const iNode = document.createElement('i');
                iNode.textContent = '/';
                frag.appendChild(iNode);
                frag.appendChild(spanNode);
            });
        breadcrumbs.innerHTML = '当前路径：';
        breadcrumbs.appendChild(frag);
    }

    return {
        render,
    }
}

function initControlBtn(app, el) {
    const controlBtn = el;
    const prev = controlBtn.getElementsByClassName('prev')[0];
    const next = controlBtn.getElementsByClassName('next')[0];

    // 监控前进后退按钮
    controlBtn.addEventListener('click', event => {
        const e = event || window.event;
        e.target === prev ? app.router.back() : app.router.forward();
    });

    function updateDisable() {
        const { stack, curIndex } = app.router;
        prev.disabled = !stack[curIndex - 1];
        next.disabled = !stack[curIndex + 1];
    }

    // 此处需要先手动更新一次
    updateDisable();

    return {
        updateDisable,
    }
}

const app = new App();
app.init();
