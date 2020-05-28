const { publicPath } = require('./config');

const routes = {
    'GET /dir/*': controllers => controllers.getDirController().get,
};

const router = {
    routeMap: {
        get: {},
        post: {},
        all: {},
    },
    routes() {
        return async (ctx, next) => {
            const { path, method } = ctx.request;
            let handler = this.routeMap[method.toLowerCase()][path];
            if (!handler) {
                // 处理通配符，虽然很脏
                const matchPath = Object.keys(this.routeMap.all).find(key => path.startsWith(key));
                matchPath && (handler = this.routeMap.all[matchPath]);
            }
            handler && await handler(ctx, next);
        };
    },
    get(path, handler) {
        if (path.endsWith('/*')) {
            const [ prePath ] = path.match(/[\/a-zA-Z0-9_]*(?=\/\*)/);
            this.routeMap.all[prePath] = handler;
        } else {
            this.routeMap.get[path] = handler;
        }
    }
}

const registerRoute = (router, controllers) => {
    for (const route in routes) {
        if (routes.hasOwnProperty(route)) {
            const [ method, path ] = route.split(' ');
            const loadController = routes[route];
            if (loadController(controllers)) {
                router[method.toLowerCase()](publicPath + path, loadController(controllers));
            }
        }
    }
    return router.routes();
};

module.exports = {
    router,
    registerRoute,
};
