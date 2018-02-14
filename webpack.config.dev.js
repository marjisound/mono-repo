// @flow
/* eslint-disable global-require,import/no-dynamic-require */

const { log } = require('util');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const chalk = require('chalk');

require('@babel/register')({
    only: [/util|src/],
});

// const demo = require('./util/demo/app.server').default;
// const component = require('./util/demo/component.server').default;
const page = require('./src/app/app.server').default;

module.exports = {
    browser: {
        devtool: 'cheap-module-eval-source-map',
        entry: {
            // app: './util/demo/app.browser.js',
            // component: './util/demo/component.browser.js',
        },
        devServer: {
            publicPath: '/assets/javascript/',
            port: 3000,
            overlay: true,
            quiet: true,
            before(app) {
                Object.keys(require.cache).forEach(
                    key => delete require.cache[key],
                );

                // app.get('/src/*', async (req, res) => {
                //     try {
                //         res.send(demo(req.params[0]));
                //     } catch (e) {
                //         log(e);
                //     }
                // });
                // app.get('/component/*', async (req, res) => {
                //     try {
                //         res.send(component(req.params[0]));
                //     } catch (e) {
                //         log(e);
                //     }
                // });
                app.get('/', async (req, res) => {
                    try {
                        res.send(page({ page: 'article' }));
                    } catch (e) {
                        log(e);
                    }
                });
            },
        },
        plugins: [
            new FriendlyErrorsWebpackPlugin({
                compilationSuccessInfo: {
                    messages: [
                        `DEV server running at ${chalk.blue.underline(
                            'http://localhost:3000',
                        )}`,
                    ],
                    notes: [
                        chalk.dim(
                            'http://localhost:3000/src/components/{MyComponentPath}',
                        ),
                    ],
                },
            }),
        ],
    },
    server: {},
};
