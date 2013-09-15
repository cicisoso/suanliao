/**
 * @fileOverview 兼容kissy 和 jQuery 的适配器
 * @ignore
 */
/**
 * @private
 * @class jQuery
 * 原生的jQuery对象或者使用kissy时适配出来的对象
 */

var $ = $ || jQuery,
    BUI = BUI || {};;
window.define = window.define || function (name, depends, fun) {
    if (KISSY.isFunction(depends)) {
        fun = depends;
        depends = [];
    }

    function require(name) {
        return KISSY.require.call(KISSY, name);
    }

    function callback(S) {
        return fun.call(S, require);
    }
    KISSY.add(name, callback, {
        requires: depends
    });
};
if (!BUI.use) {
    BUI.use = function (modules, callback) {
        if (KISSY.isArray(modules)) {
            modules = modules.join();
        };
        KISSY.use(modules, function (S) {
            var args = KISSY.makeArray(arguments);
            args.shift();
            callback.apply(S, args);
        });
    };
}