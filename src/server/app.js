const Koa = require('koa');
// const Router = require('koa-router');
const app = new Koa();
// const router = new Router();

const config = require('./config');
const controllers = require('./controllers');
const { errorHandler } = require('./middlewares');
const { registerRoute, router } = require('./router');

// 容错处理中心
errorHandler.error(app);

app.use(registerRoute(router, controllers));

app.listen(config.port, () => {
    console.log("~ 服务启动成功🍺 ~");
});
