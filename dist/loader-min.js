/*! suanliao */
var BUI=BUI||{};seajs||function(){function a(a,b){this.id=a,this.factory=b,this.isInit=!1}function b(){}function c(a){window.__module[a]={}}Object.prototype.toString,a.init=function(){this.result=this.factory(b)},window.__module={},window.define=window.define||function(a,b){c(a,b)},BUI.use=function(){}}(),this.seajs={_seajs:this.seajs},seajs.version="1.3.0",seajs._util={},seajs._config={debug:"%DEBUG%",preload:[]},function(a){var b=Object.prototype.toString,c=Array.prototype;a.isString=function(a){return"[object String]"===b.call(a)},a.isFunction=function(a){return"[object Function]"===b.call(a)},a.isRegExp=function(a){return"[object RegExp]"===b.call(a)},a.isObject=function(a){return a===Object(a)},a.isArray=Array.isArray||function(a){return"[object Array]"===b.call(a)},a.indexOf=c.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0;c<a.length;c++)if(a[c]===b)return c;return-1};var d=a.forEach=c.forEach?function(a,b){a.forEach(b)}:function(a,b){for(var c=0;c<a.length;c++)b(a[c],c,a)};a.map=c.map?function(a,b){return a.map(b)}:function(a,b){var c=[];return d(a,function(a,d,e){c.push(b(a,d,e))}),c},a.filter=c.filter?function(a,b){return a.filter(b)}:function(a,b){var c=[];return d(a,function(a,d,e){b(a,d,e)&&c.push(a)}),c};var e=a.keys=Object.keys||function(a){var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b};a.unique=function(a){var b={};return d(a,function(a){b[a]=1}),e(b)},a.now=Date.now||function(){return(new Date).getTime()}}(seajs._util),function(a){a.log=function(){if("undefined"!=typeof console){var a=Array.prototype.slice.call(arguments),b="log",c=a[a.length-1];if(console[c]&&(b=a.pop()),"log"!==b||seajs.debug){if(console[b].apply)return console[b].apply(console,a),void 0;var d=a.length;1===d?console[b](a[0]):2===d?console[b](a[0],a[1]):3===d?console[b](a[0],a[1],a[2]):console[b](a.join(" "))}}}}(seajs._util),function(a,b,c){function d(a){var b=a.match(p);return(b?b[0]:".")+"/"}function e(a){if(q.lastIndex=0,q.test(a)&&(a=a.replace(q,"$1/")),-1===a.indexOf("."))return a;for(var b,c=a.split("/"),d=[],e=0;e<c.length;e++)if(b=c[e],".."===b){if(0===d.length)throw new Error("The path is invalid: "+a);d.pop()}else"."!==b&&d.push(b);return d.join("/")}function f(a){a=e(a);var b=a.charAt(a.length-1);return"/"===b?a:("#"===b?a=a.slice(0,-1):-1!==a.indexOf("?")||r.test(a)||(a+=".js"),a.indexOf(":80/")>0&&(a=a.replace(":80/","/")),a)}function g(a){if("#"===a.charAt(0))return a.substring(1);var c=b.alias;if(c&&n(a)){var d=a.split("/"),e=d[0];c.hasOwnProperty(e)&&(d[0]=c[e],a=d.join("/"))}return a}function h(c){var f=b.map||[];if(!f.length)return c;for(var g=c,h=0;h<f.length;h++){var i=f[h];if(a.isArray(i)&&2===i.length){var j=i[0];(a.isString(j)&&g.indexOf(j)>-1||a.isRegExp(j)&&j.test(g))&&(g=g.replace(j,i[1]))}else a.isFunction(i)&&(g=i(g))}return k(g)||(g=e(d(v)+g)),g!==c&&(t[g]=c),g}function i(a){return t[a]||a}function j(a,c){if(!a)return"";a=g(a),c||(c=v);var e;return k(a)?e=a:l(a)?(0===a.indexOf("./")&&(a=a.substring(2)),e=d(c)+a):e=m(a)?c.match(s)[1]+a:b.base+"/"+a,f(e)}function k(a){return a.indexOf("://")>0||0===a.indexOf("//")}function l(a){return 0===a.indexOf("./")||0===a.indexOf("../")}function m(a){return"/"===a.charAt(0)&&"/"!==a.charAt(1)}function n(a){var b=a.charAt(0);return-1===a.indexOf("://")&&"."!==b&&"/"!==b}function o(a){return"/"!==a.charAt(0)&&(a="/"+a),a}var p=/.*(?=\/.*$)/,q=/([^:\/])\/\/+/g,r=/\.(?:css|js)$/,s=/^(.*?\w)(?:\/|$)/,t={},u=c.location,v=u.protocol+"//"+u.host+o(u.pathname);v.indexOf("\\")>0&&(v=v.replace(/\\/g,"/")),a.dirname=d,a.realpath=e,a.normalize=f,a.parseAlias=g,a.parseMap=h,a.unParseMap=i,a.id2Uri=j,a.isAbsolute=k,a.isRoot=m,a.isTopLevel=n,a.pageUri=v}(seajs._util,seajs._config,this),function(a,b){function c(a,b){"SCRIPT"===a.nodeName?d(a,b):e(a,b)}function d(a,c){a.onload=a.onerror=a.onreadystatechange=function(){n.test(a.readyState)&&(a.onload=a.onerror=a.onreadystatechange=null,a.parentNode&&!b.debug&&k.removeChild(a),a=void 0,c())}}function e(b,c){p||q?(a.log("Start poll to fetch css"),setTimeout(function(){f(b,c)},1)):b.onload=b.onerror=function(){b.onload=b.onerror=null,b=void 0,c()}}function f(a,b){var c;if(p)a.sheet&&(c=!0);else if(a.sheet)try{a.sheet.cssRules&&(c=!0)}catch(d){"NS_ERROR_DOM_SECURITY_ERR"===d.name&&(c=!0)}setTimeout(function(){c?b():f(a,b)},1)}function g(){}var h,i,j=document,k=j.head||j.getElementsByTagName("head")[0]||j.documentElement,l=k.getElementsByTagName("base")[0],m=/\.css(?:\?|$)/i,n=/loaded|complete|undefined/;a.fetch=function(b,d,e){var f=m.test(b),i=document.createElement(f?"link":"script");if(e){var j=a.isFunction(e)?e(b):e;j&&(i.charset=j)}c(i,d||g),f?(i.rel="stylesheet",i.href=b):(i.async="async",i.src=b),h=i,l?k.insertBefore(i,l):k.appendChild(i),h=null},a.getCurrentScript=function(){if(h)return h;if(i&&"interactive"===i.readyState)return i;for(var a=k.getElementsByTagName("script"),b=0;b<a.length;b++){var c=a[b];if("interactive"===c.readyState)return i=c,c}},a.getScriptAbsoluteSrc=function(a){return a.hasAttribute?a.src:a.getAttribute("src",4)},a.importStyle=function(a,b){if(!b||!j.getElementById(b)){var c=j.createElement("style");b&&(c.id=b),k.appendChild(c),c.styleSheet?c.styleSheet.cssText=a:c.appendChild(j.createTextNode(a))}};var o=navigator.userAgent,p=Number(o.replace(/.*AppleWebKit\/(\d+)\..*/,"$1"))<536,q=o.indexOf("Firefox")>0&&!("onload"in document.createElement("link"))}(seajs._util,seajs._config,this),function(a){function b(a){return a.replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm,"").replace(/^\s*\/\/.*$/gm,"")}var c=/(?:^|[^.$])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;a.parseDependencies=function(d){var e,f=[];for(d=b(d),c.lastIndex=0;e=c.exec(d);)e[2]&&f.push(e[2]);return a.unique(f)}}(seajs._util),function(a,b,c){function d(a,b){this.uri=a,this.status=b||0}function e(a,c){return b.isString(a)?d._resolve(a,c):b.map(a,function(a){return e(a,c)})}function f(a,e){var f=b.parseMap(a);return u[f]?(p[a]=p[f],e(),void 0):t[f]?(v[f].push(e),void 0):(t[f]=!0,v[f]=[e],d._fetch(f,function(){u[f]=!0;var c=p[a];c.status===s.FETCHING&&(c.status=s.FETCHED),w&&(d._save(a,w),w=null),x&&c.status===s.FETCHED&&(p[a]=x,x.realUri=a),x=null,t[f]&&delete t[f];var e=v[f];e&&(delete v[f],b.forEach(e,function(a){a()}))},c.charset),void 0)}function g(a,c){var f=p[a]||(p[a]=new d(a));return f.status<s.SAVED&&(f.id=c.id||a,f.dependencies=e(b.filter(c.dependencies||[],function(a){return!!a}),a),f.factory=c.factory,f.status=s.SAVED),f}function h(a,b){var c=a(b.require,b.exports,b);void 0!==c&&(b.exports=c)}function i(a){return!!q[a.realUri||a.uri]}function j(a){var c=a.realUri||a.uri,d=q[c];d&&(b.forEach(d,function(b){h(b,a)}),delete q[c])}function k(a){var c=a.uri;return b.filter(a.dependencies,function(a){y=[c];var b=l(p[a]);return b&&(y.push(c),m(y)),!b})}function l(a){if(!a||a.status!==s.SAVED)return!1;y.push(a.uri);var b=a.dependencies;if(b.length){if(n(b,y))return!0;for(var c=0;c<b.length;c++)if(l(p[b[c]]))return!0}return y.pop(),!1}function m(a,c){b.log("Found circular dependencies:",a.join(" --> "),c)}function n(a,c){var d=a.concat(c);return d.length>b.unique(d).length}function o(a){var b=c.preload.slice();c.preload=[],b.length?z._use(b,a):a()}var p={},q={},r=[],s={FETCHING:1,FETCHED:2,SAVED:3,READY:4,COMPILING:5,COMPILED:6};d.prototype._use=function(a,c){b.isString(a)&&(a=[a]);var d=e(a,this.uri);this._load(d,function(){o(function(){var a=b.map(d,function(a){return a?p[a]._compile():null});c&&c.apply(null,a)})})},d.prototype._load=function(a,c){function e(a){(a||{}).status<s.READY&&(a.status=s.READY),0===--i&&c()}var g=b.filter(a,function(a){return a&&(!p[a]||p[a].status<s.READY)}),h=g.length;if(0===h)return c(),void 0;for(var i=h,j=0;h>j;j++)!function(a){function b(){if(c=p[a],c.status>=s.SAVED){var b=k(c);b.length?d.prototype._load(b,function(){e(c)}):e(c)}else e()}var c=p[a]||(p[a]=new d(a,s.FETCHING));c.status>=s.FETCHED?b():f(a,b)}(g[j])},d.prototype._compile=function(){function a(a){var b=e(a,c.uri),d=p[b];return d?d.status===s.COMPILING?d.exports:(d.parent=c,d._compile()):null}var c=this;if(c.status===s.COMPILED)return c.exports;if(c.status<s.SAVED&&!i(c))return null;c.status=s.COMPILING,a.async=function(a,b){c._use(a,b)},a.resolve=function(a){return e(a,c.uri)},a.cache=p,c.require=a,c.exports={};var d=c.factory;return b.isFunction(d)?(r.push(c),h(d,c),r.pop()):void 0!==d&&(c.exports=d),c.status=s.COMPILED,j(c),c.exports},d._define=function(a,c,f){var g=arguments.length;1===g?(f=a,a=void 0):2===g&&(f=c,c=void 0,b.isArray(a)&&(c=a,a=void 0)),!b.isArray(c)&&b.isFunction(f)&&(c=b.parseDependencies(f.toString()));var h,i={id:a,dependencies:c,factory:f};if(document.attachEvent){var j=b.getCurrentScript();j&&(h=b.unParseMap(b.getScriptAbsoluteSrc(j))),h||b.log("Failed to derive URI from interactive script for:",f.toString(),"warn")}var k=a?e(a):h;if(k){if(k===h){var l=p[h];l&&l.realUri&&l.status===s.SAVED&&(p[h]=null)}var m=d._save(k,i);h?(p[h]||{}).status===s.FETCHING&&(p[h]=m,m.realUri=h):x||(x=m)}else w=i},d._getCompilingModule=function(){return r[r.length-1]},d._find=function(a){var c=[];return b.forEach(b.keys(p),function(d){if(b.isString(a)&&d.indexOf(a)>-1||b.isRegExp(a)&&a.test(d)){var e=p[d];e.exports&&c.push(e.exports)}}),c},d._modify=function(b,c){var d=e(b),f=p[d];return f&&f.status===s.COMPILED?h(c,f):(q[d]||(q[d]=[]),q[d].push(c)),a},d.STATUS=s,d._resolve=b.id2Uri,d._fetch=b.fetch,d._save=g;var t={},u={},v={},w=null,x=null,y=[],z=new d(b.pageUri,s.COMPILED);a.use=function(b,c){return o(function(){z._use(b,c)}),a},a.define=d._define,a.cache=d.cache=p,a.find=d._find,a.modify=d._modify,d.fetchedList=u,a.pluginSDK={Module:d,util:b,config:c}}(seajs,seajs._util,seajs._config),function(a,b,c){function d(){c.debug&&(a.debug=!!c.debug)}function e(a){if(-1===a.indexOf("??"))return a;var c=a.split("??"),d=c[0],e=b.filter(c[1].split(","),function(a){return-1!==a.indexOf("sea.js")});return d+e[0]}function f(a,c,d){a&&a!==c&&b.log("The alias config is conflicted:","key =",'"'+d+'"',"previous =",'"'+a+'"',"current =",'"'+c+'"',"warn")}var g="seajs-ts=",h=g+b.now(),i=document.getElementById("seajsnode");if(!i){var j=document.getElementsByTagName("script");i=j[j.length-1]}var k=i&&b.getScriptAbsoluteSrc(i)||b.pageUri,l=b.dirname(e(k));b.loaderDir=l;var m=l.match(/^(.+\/)seajs\/[\.\d]+(?:-dev)?\/$/);m&&(l=m[1]),c.base=l,c.main=i&&i.getAttribute("data-main"),c.charset="utf-8",a.config=function(e){for(var i in e)if(e.hasOwnProperty(i)){var j=c[i],k=e[i];if(j&&"alias"===i){for(var l in k)if(k.hasOwnProperty(l)){var m=j[l],n=k[l];/^\d+\.\d+\.\d+$/.test(n)&&(n=l+"/"+n+"/"+l),f(m,n,l),j[l]=n}}else!j||"map"!==i&&"preload"!==i?c[i]=k:(b.isString(k)&&(k=[k]),b.forEach(k,function(a){a&&j.push(a)}))}var o=c.base;return o&&!b.isAbsolute(o)&&(c.base=b.id2Uri((b.isRoot(o)?"":"./")+o+"/")),2===c.debug&&(c.debug=1,a.config({map:[[/^.*$/,function(a){return-1===a.indexOf(g)&&(a+=(-1===a.indexOf("?")?"?":"&")+h),a}]]})),d(),this},d()}(seajs,seajs._util,seajs._config),function(a,b,c){function d(){var a=[],d=c.location.search;return d=d.replace(/(seajs-\w+)(&|$)/g,"$1=1$2"),d+=" "+document.cookie,d.replace(/seajs-(\w+)=[1-9]/g,function(b,c){a.push(c)}),b.unique(a)}a.log=b.log,a.importStyle=b.importStyle,a.config({alias:{seajs:b.loaderDir}}),b.forEach(d(),function(b){a.use("seajs/plugin-"+b),"debug"===b&&(a._use=a.use,a._useArgs=[],a.use=function(){return a._useArgs.push(arguments),a})})}(seajs,seajs._util,this),function(a,b,c){var d=a._seajs;return d&&!d.args?(c.seajs=a._seajs,void 0):(c.define=a.define,b.main&&a.use(b.main),function(b){if(b)for(var c={0:"config",1:"use",2:"define"},d=0;d<b.length;d+=2)a[c[b[d]]].apply(a,b[d+1])}((d||0).args),c.define.cmd={},delete a.define,delete a._util,delete a._config,delete a._seajs,void 0)}(seajs,seajs._config,this);var loaderPath=seajs.pluginSDK.util.loaderDir;seajs.config({map:[[".js","-min.js"]],alias:{bui:loaderPath},charset:"utf-8"});var BUI=BUI||{};BUI.use=seajs.use,BUI.config=seajs.config,BUI.setDebug=function(a){BUI.debug=a,a?seajs.config({map:[["-min.js",".js"]]}):seajs.config({map:[[".js","-min.js"]]})};