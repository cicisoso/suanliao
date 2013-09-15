/*! suanliao */
define("bui/data/abstractstore",["bui/common","bui/data/proxy"],function(a){function b(a){b.superclass.constructor.call(this,a),this._init()}var c=a("bui/common"),d=a("bui/data/proxy");return b.ATTRS={autoLoad:{value:!1},remoteFilter:{value:!1},lastParams:{value:{}},params:{},proxy:{value:{}},url:{},events:{value:["acceptchanges","load","beforeload","beforeProcessLoad","add","exception","remove","update","localsort"]},data:{setter:function(a){var b=this,c=b.get("proxy");c.set?c.set("data",a):c.data=a,b.set("autoLoad",!0)}}},c.extend(b,c.Base),c.augment(b,{isStore:!0,_init:function(){var a=this;a.beforeInit(),a._initParams(),a._initProxy(),a._initData()},beforeInit:function(){},_initData:function(){var a=this,b=a.get("autoLoad");b&&a.load()},_initParams:function(){var a=this,b=a.get("lastParams"),d=a.get("params");c.mix(b,d)},_initProxy:function(){var a=this,b=a.get("url"),c=a.get("proxy");c instanceof d||(b&&(c.url=b),c="ajax"===c.type||c.url?new d.Ajax(c):new d.Memery(c),a.set("proxy",c))},load:function(a,b){var d=this,e=d.get("proxy"),f=d.get("lastParams");c.mix(f,d.getAppendParams(),a),d.fire("beforeload",{params:f}),a=c.cloneObject(f),e.read(f,function(c){d.onLoad(c,a),b&&b(c,a)},d)},onFiltered:function(a,b){var c=this;c.fire("filtered",{data:a,filter:b})},onLoad:function(a,b){var c=this,d=c.processLoad(a,b);d&&c.afterProcessLoad(a,b)},filter:function(a){var b,c=this,d=c.get("remoteFilter");d?c.load({filter:a}):(c.set("filter",a),b=c._filterLocal(a),c.onFiltered(b,a))},_filterLocal:function(){},_clearLocalFilter:function(){this._filterLocal(function(){return!0})},clearFilter:function(){var a=this,b=a.get("remoteFilter");b?a.load({filter:""}):a._clearLocalFilter()},processLoad:function(a){var b=this,c=b.get("hasErrorProperty");return b.fire("beforeProcessLoad",a),a[c]||a.exception?(b.onException(a),!1):!0},afterProcessLoad:function(){},onException:function(a){var b=this,c=b.get("errorProperty"),d={};a.exception?(d.type="exception",d[c]=a.exception):(d.type="error",d[c]=a[c]),b.fire("exception",d)},hasData:function(){},getAppendParams:function(){return{}}}),b}),function(){var a="bui/data/";define("bui/data",["bui/common",a+"sortable",a+"proxy",a+"abstractstore",a+"store",a+"node",a+"treestore"],function(b){var c=b("bui/common"),d=c.namespace("Data");return c.mix(d,{Sortable:b(a+"sortable"),Proxy:b(a+"proxy"),AbstractStore:b(a+"abstractstore"),Store:b(a+"store"),Node:b(a+"node"),TreeStore:b(a+"treestore")}),d})}(),define("bui/data/node",["bui/common"],function(a){function b(a,b){var c={};return b?(d.each(a,function(a,d){var e=b[d]||d;c[e]=a}),c.record=a):c=a,c}function c(a,c){a=b(a,c),d.mix(this,a)}var d=a("bui/common");return d.augment(c,{root:!1,leaf:null,text:"",id:null,loaded:!1,path:null,parent:null,level:0,record:null,children:null,isNode:!0}),c}),define("bui/data/proxy",["bui/data/sortable"],function(a){var b=a("bui/data/sortable"),c=function(a){c.superclass.constructor.call(this,a)};c.ATTRS={},BUI.extend(c,BUI.Base),BUI.augment(c,{_read:function(){},read:function(a,b,c){var d=this;c=c||d,d._read(a,function(a){b.call(c,a)})},update:function(){}});var d=function(a){d.superclass.constructor.call(this,a)};d.ATTRS=BUI.mix(!0,c.ATTRS,{limitParam:{value:"limit"},startParam:{value:"start"},pageIndexParam:{value:"pageIndex"},pageStart:{value:0},dataType:{value:"json"},method:{value:"GET"},cache:{value:!1},url:{}}),BUI.extend(d,c),BUI.augment(d,{_processParams:function(a){var b=this,c=b.get("pageStart"),d=["start","limit","pageIndex"];null!=a.pageIndex&&(a.pageIndex=a.pageIndex+c),BUI.each(d,function(c){var d=b.get(c+"Param");d!==c&&(a[d]=a[c],delete a[c])})},_read:function(a,b){var c=this;a=BUI.cloneObject(a),c._processParams(a),$.ajax({url:c.get("url"),type:c.get("method"),dataType:c.get("dataType"),data:a,cache:c.get("cache"),success:function(a){b(a)},error:function(a,c,d){var e={exception:{status:c,errorThrown:d,jqXHR:a}};b(e)}})}});var e=function(a){e.superclass.constructor.call(this,a)};return e.ATTRS={matchFields:{value:[]}},BUI.extend(e,c),BUI.mixin(e,[b]),BUI.augment(e,{_read:function(a,b){var c=this,d=(a.pageable,a.start),e=a.sortField,f=a.sortDirection,g=a.limit,h=c.get("data"),i=[];h=c._getMatches(a),c.sortData(e,f),g?(i=h.slice(d,d+g),b({rows:i,results:h.length})):(i=h.slice(d),b(i))},_getMatchFn:function(a,b){return function(c){var d=!0;return BUI.each(b,function(b){return null!=a[b]&&a[b]!==c[b]?(d=!1,!1):void 0}),d}},_getMatches:function(a){var b,c=this,d=c.get("matchFields"),e=c.get("data")||[];return a&&d.length&&(b=c._getMatchFn(a,d),e=BUI.Array.filter(e,b)),e}}),c.Ajax=d,c.Memery=e,c}),define("bui/data/sortable",function(){var a="ASC",b=function(){};return b.ATTRS={compareFunction:{value:function(a,b){return void 0===a&&(a=""),void 0===b&&(b=""),BUI.isString(a)?a.localeCompare(b):a>b?1:a===b?0:-1}},sortField:{},sortDirection:{value:"ASC"},sortInfo:{getter:function(){var a=this,b=a.get("sortField");return{field:b,direction:a.get("sortDirection")}},setter:function(a){var b=this;b.set("sortField",a.field),b.set("sortDirection",a.direction)}}},BUI.augment(b,{compare:function(b,c,d,e){var f,g=this;return d=d||g.get("sortField"),e=e||g.get("sortDirection"),d&&e?(f=e===a?1:-1,g.get("compareFunction")(b[d],c[d])*f):1},getSortData:function(){},sortData:function(a,b,c){var d=this,c=c||d.getSortData();return BUI.isArray(a)&&(c=a,a=null),a=a||d.get("sortField"),b=b||d.get("sortDirection"),d.set("sortField",a),d.set("sortDirection",b),a&&b?(c.sort(function(c,e){return d.compare(c,e,a,b)}),c):c}}),b}),define("bui/data/store",["bui/data/proxy","bui/data/abstractstore","bui/data/sortable"],function(a){function b(a,b){if(!(0>a)){var c=b,d=c[a];return c.splice(a,1),d}}function c(a,c){var d=BUI.Array.indexOf(a,c);d>=0&&b(d,c)}function d(a,b){return-1!==BUI.Array.indexOf(a,b)}var e=a("bui/data/proxy"),f=a("bui/data/abstractstore"),g=a("bui/data/sortable"),h=function(a){h.superclass.constructor.call(this,a)};return h.ATTRS={currentPage:{value:0},deletedRecords:{value:[]},errorProperty:{value:"error"},hasErrorProperty:{value:"hasError"},matchFunction:{value:function(a,b){return a==b}},modifiedRecords:{value:[]},newRecords:{value:[]},remoteSort:{value:!1},resultMap:{value:{}},root:{value:"rows"},rowCount:{value:0},totalProperty:{value:"results"},start:{value:0},pageSize:{}},BUI.extend(h,f),BUI.mixin(h,[g]),BUI.augment(h,{add:function(a,b,c){var d=this,e=d.getCount();d.addAt(a,e,b,c)},addAt:function(a,b,d,e){var f=this;e=e||f._getDefaultMatch(),BUI.isArray(a)||(a=[a]),$.each(a,function(a,g){d&&f.contains(g,e)||(f._addRecord(g,a+b),f.get("newRecords").push(g),c(g,f.get("deletedRecords")),c(g,f.get("modifiedRecords")))})},contains:function(a,b){return-1!==this.findIndexBy(a,b)},find:function(a,b){var c=this,d=null,e=c.getResult();return $.each(e,function(c,e){return e[a]===b?(d=e,!1):void 0}),d},findAll:function(a,b){var c=this,d=[],e=c.getResult();return $.each(e,function(c,e){e[a]===b&&d.push(e)}),d},findByIndex:function(a){return this.getResult()[a]},findIndexBy:function(a,b){var c=this,d=-1,e=c.getResult();return b=b||c._getDefaultMatch(),null===a||void 0===a?-1:($.each(e,function(c,e){return b(a,e)?(d=c,!1):void 0}),d)},findNextRecord:function(a){var b=this,c=b.findIndexBy(a);return c>=0?b.findByIndex(c+1):void 0},getCount:function(){return this.getResult().length},getTotalCount:function(){var a=this,b=a.get("resultMap"),c=a.get("totalProperty");return b[c]||0},getResult:function(){var a=this,b=a.get("resultMap"),c=a.get("root");return b[c]},hasData:function(){return 0!==this.getCount()},setResult:function(a){var b=this,c=b.get("proxy");c instanceof e.Memery?(b.set("data",a),b.load({start:0})):b._setResult(a)},remove:function(a,e){var f=this;e=e||f._getDefaultMatch(),BUI.isArray(a)||(a=[a]),$.each(a,function(a,g){var a=f.findIndexBy(g,e),h=b(a,f.getResult());d(h,f.get("newRecords"))||d(h,f.get("deletedRecords"))||f.get("deletedRecords").push(h),c(h,f.get("newRecords")),c(h,f.get("modifiedRecords")),f.fire("remove",{record:h})})},sort:function(a,b){var c=this,d=c.get("remoteSort");d?(c.set("sortField",a),c.set("sortDirection",b),c.load(c.get("sortInfo"))):c._localSort(a,b)},sum:function(a,b){var c=this,d=b||c.getResult(),e=0;return BUI.each(d,function(b){var c=b[a];isNaN(c)||(e+=parseFloat(c))}),e},setValue:function(a,b,c){var e=a,f=this;e[b]=c,d(e,f.get("newRecords"))||d(e,f.get("modifiedRecords"))||f.get("modifiedRecords").push(e),f.fire("update",{record:e,field:b,value:c})},update:function(a,b){var c=a,e=this,f=null,g=null;b&&(f=e._getDefaultMatch(),g=e.findIndexBy(a,f),g>=0&&(c=e.getResult()[g])),c=BUI.mix(c,a),d(c,e.get("newRecords"))||d(c,e.get("modifiedRecords"))||e.get("modifiedRecords").push(c),e.fire("update",{record:c})},_addRecord:function(a,b){var c=this.getResult();void 0==b&&(b=c.length),c.splice(b,0,a),this.fire("add",{record:a,index:b})},_clearChanges:function(){var a=this;a.get("newRecords").splice(0),a.get("modifiedRecords").splice(0),a.get("deletedRecords").splice(0)},_filterLocal:function(a,b){var c=this,d=[];return b=b||c.getResult(),a?(BUI.each(b,function(b){a(b)&&d.push(b)}),d):b},_getDefaultMatch:function(){return this.get("matchFunction")},_getPageParams:function(){var a=this,b=a.get("sortInfo"),c=a.get("start"),d=a.get("pageSize"),e=a.get("pageIndex")||(d?c/d:0);return params={start:c,limit:d,pageIndex:e},a.get("remoteSort")&&BUI.mix(params,b),params},getAppendParams:function(){return this._getPageParams()},beforeInit:function(){this._setResult([])},_localSort:function(a,b){var c=this;c._sortData(a,b),c.fire("localsort")},_sortData:function(a,b,c){var d=this;c=c||d.getResult(),d.sortData(a,b,c)},afterProcessLoad:function(a,b){var c=this,d=c.get("root"),e=b.start,f=b.limit,g=c.get("totalProperty");BUI.isArray(a)?c._setResult(a):c._setResult(a[d],a[g]),c.set("start",e),f&&c.set("pageIndex",e/f),c.get("remoteSort")||c._sortData(),c.fire("load",{params:b})},_setResult:function(a,b){var c=this,d=c.get("resultMap");b=b||a.length,d[c.get("root")]=a,d[c.get("totalProperty")]=b,c._clearChanges()}}),h}),define("bui/data/treestore",["bui/common","bui/data/node","bui/data/abstractstore","bui/data/proxy"],function(a){function b(a){b.superclass.constructor.call(this,a)}var c=a("bui/common"),d=a("bui/data/node"),e=a("bui/data/proxy"),f=a("bui/data/abstractstore");return b.ATTRS={root:{},map:{},pidField:{},dataProperty:{value:"nodes"},events:{value:["add","update","remove","load"]}},c.extend(b,f),c.augment(b,{beforeInit:function(){this.initRoot()},_initData:function(){var a=this,b=a.get("autoLoad"),c=a.get("pidField"),d=a.get("proxy"),e=a.get("root");!d.get("url")&&c&&d.get("matchFields").push(c),b&&!e.children&&a.loadNode(e)},initRoot:function(){var a=this,b=a.get("map"),c=a.get("root");c||(c={}),c.isNode||(c=new d(c,b)),c.path=[c.id],c.level=0,c.children&&a.setChildren(c,c.children),a.set("root",c)},add:function(a,b,c){var d=this;return a=d._add(a,b,c),d.fire("add",{node:a,index:c}),a},_add:function(a,b,e){b=b||this.get("root");var f,g=this,h=g.get("map"),i=b.children;return a.isNode||(a=new d(a,h)),f=a.children||[],0==f.length&&null==a.leaf&&(a.leaf=!0),b&&(b.leaf=!1),a.parent=b,a.level=b.level+1,a.path=b.path.concat(a.id),e=null==e?b.children.length:e,c.Array.addAt(i,a,e),g.setChildren(a,f),a},remove:function(a){var b=a.parent||_self.get("root"),d=c.Array.indexOf(a,b.children);return c.Array.remove(b.children,a),0===b.children.length&&(b.leaf=!0),this.fire("remove",{node:a,index:d}),a.parent=null,a},update:function(a){this.fire("update",{node:a})},getResult:function(){return this.get("root").children},setResult:function(a){var b=this,c=b.get("proxy"),d=b.get("root");c instanceof e.Memery?(b.set("data",a),b.load({id:d.id})):b.setChildren(d,a)},setChildren:function(a,b){var d=this;a.children=[],b.length&&c.each(b,function(b){d._add(b,a)})},findNode:function(a,b,d){var e=this;if(d=null==d?!0:d,!b){var f=e.get("root");return f.id===a?f:e.findNode(a,f)}var g=b.children,h=null;return c.each(g,function(b){return b.id===a?h=b:d&&(h=e.findNode(a,b)),h?!1:void 0}),h},findNodesBy:function(a,b){var d=this,e=[];return b||(b=d.get("root")),c.each(b.children,function(b){a(b)&&e.push(b),e=e.concat(d.findNodesBy(a,b))}),e},findNodeByPath:function(a){if(!a)return null;var b,c,d=this,e=d.get("root"),f=a.split(","),g=f[0];if(!g)return null;if(b=e.id==g?e:d.findNode(g,e,!1)){for(c=1;c<f.length;c+=1){var g=f[c];if(b=d.findNode(g,b,!1),!b)break}return b}},contains:function(a,b){var c=this,d=c.findNode(a.id,b);return!!d},afterProcessLoad:function(a,b){var d=this,e=d.get("pidField"),f=b.id||b[e],g=d.get("dataProperty"),h=d.findNode(f)||d.get("root");c.isArray(a)?d.setChildren(h,a):d.setChildren(h,a[g]),d.fire("load",{node:h,params:b})},hasData:function(){return this.get("root").children&&0!==this.get("root").children.length},isLoaded:function(a){var b=this.get("root");return a!=b||b.children?this.get("url")||this.get("pidField")?a.leaf||a.children&&a.children.length:!0:!1},loadNode:function(a){var b=this;if(!b.isLoaded(a)){if(!b.get("url")&&b.get("data")){var c=b.get("pidField"),d={id:a.id};return c&&(d[c]=a.id),b.load(d),void 0}b.load({id:a.id,path:""})}},loadPath:function(a){var b=this,c=a.split(","),d=c[0];b.findNodeByPath(a)||b.load({id:d,path:a})}}),b});