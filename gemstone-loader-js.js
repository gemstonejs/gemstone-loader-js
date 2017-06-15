/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2017 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*  load internal requirements  */
const path          = require("path")

/*  load external requirements  */
const loaderUtils   = require("loader-utils")
const babel         = require("babel-core")

/*  Error object conforming to Webpack reporting  */
const WebpackBabelError = function (name, message, error) {
    Error.call(this)
    Error.captureStackTrace(this, WebpackBabelError)
    this.name = "WebpackBabelError"
    this.message = (name ? name + ": " : "") + message + "\n\n" + error.codeFrame + "\n"
    this.hideStack = true
    this.error = error
}
WebpackBabelError.prototype = Object.create(Error.prototype)
WebpackBabelError.prototype.constructor = WebpackBabelError

/*  transpile the source code  */
const transpile = (source, options) => {
    let result
    try {
        result = babel.transform(source, options)
    }
    catch (error) {
        if (error.message && error.codeFrame) {
            let message = error.message
            let name
            if (error instanceof SyntaxError) {
                message = message.replace(/^[^:]+: /, "")
                name = "SyntaxError"
            }
            else if (error instanceof TypeError)
                message = message.replace(/^[^:]+: /, "")
            throw new WebpackBabelError(name, message, error)
        }
        else
            throw error
    }
    const code = result.code
    const map  = result.map
    if (map && (!map.sourcesContent || !map.sourcesContent.length))
        map.sourcesContent = [ source ]
    return { code: code, map: map }
}

/*  the exported Webpack loader function  */
module.exports = function (content, inputSourceMap) {
    /*  determine Webpack loader query parameters  */
    const options = Object.assign({}, {
        scope: "none"
    }, loaderUtils.getOptions(this), this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : null)
    void (options)

    /*  indicate to Webpack that our results are
        fully deterministic and can be cached  */
    this.cacheable(true)

    /*  determine filenames  */
    let filenameChain = loaderUtils.getRemainingRequest(this).split("!")
    let filename = filenameChain[filenameChain.length - 1]

    /*  transpile content  */
    let opts = {
        sourceMap:      this.sourceMap,
        inputSourceMap: inputSourceMap,
        sourceRoot:     process.cwd(),
        sourceFileName: path.relative(process.cwd(), filename),
        filename:       filename,
        presets: [
            require.resolve("babel-preset-es2015"),
            require.resolve("babel-preset-es2016"),
            require.resolve("babel-preset-es2017"),
            require.resolve("babel-preset-stage-3"),
            require.resolve("babel-preset-stage-2")
        ],
        plugins: [
            require.resolve("babel-plugin-transform-runtime")
        ]
    }
    /*  FIXME: currently buggy!?
    if (this.minimize)
        opts.presets.push(require.resolve("babel-preset-babili"))
    */
    let result = transpile(content, opts)

    /*  provide results to Webpack  */
    this.callback(null, result.code, result.map)
}

