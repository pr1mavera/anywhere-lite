module.exports = {
    error(app) {
        app.use(async (ctx, next) => {
            try {
                await next();
            } catch (error) {
                console.log('❌❌❌ error:', error);
                ctx.status = error.status || 500;
                ctx.body = "❌ 项目出错";
            }
        });
        app.use(async (ctx, next) => {
            await next();
            if (404 !== ctx.status) {
                return;
            }
            ctx.status = 404;
            ctx.body = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <h1 style="
                        display: inline-block;
                        width: fit-content;
                        height: fit-content;
                        position: absolute;
                        top: -200px; bottom: 0; left: 0; right: 0;
                        margin: auto;
                        font-size: 150px;
                        line-height: 150px;
                    ">
                        404
                    </h1>
                </div>
            `;
        });
    }
};
