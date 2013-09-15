/*! suanliao */
!function(){var a="bui/form/";define("bui/form",["bui/common",a+"fieldcontainer",a+"form",a+"row",a+"fieldgroup",a+"horizontal",a+"rules",a+"field",a+"fieldgroup"],function(b){var c=b("bui/common"),d=c.namespace("Form"),e=b(a+"tips");return c.mix(d,{Tips:e,TipItem:e.Item,FieldContainer:b(a+"fieldcontainer"),Form:b(a+"form"),Row:b(a+"row"),Group:b(a+"fieldgroup"),HForm:b(a+"horizontal"),Rules:b(a+"rules"),Field:b(a+"field"),FieldGroup:b(a+"fieldgroup")}),d})}(),function(){var a="bui/form/";define(a+"field",["bui/common",a+"textfield",a+"datefield",a+"selectfield",a+"hiddenfield",a+"numberfield",a+"checkfield",a+"radiofield",a+"checkboxfield",a+"plainfield",a+"listfield",a+"checklistfield",a+"radiolistfield"],function(b){var c=b("bui/common"),d=b(a+"basefield");return c.mix(d,{Text:b(a+"textfield"),Date:b(a+"datefield"),Select:b(a+"selectfield"),Hidden:b(a+"hiddenfield"),Number:b(a+"numberfield"),Check:b(a+"checkfield"),Radio:b(a+"radiofield"),Checkbox:b(a+"checkboxfield"),Plain:b(a+"plainfield"),List:b(a+"listfield"),CheckList:b(a+"checklistfield"),RadioList:b(a+"radiolistfield")}),d})}(),define("bui/form/fieldcontainer",["bui/common","bui/form/field","bui/form/groupvalid"],function(a){function b(a){return a.is(k)}function c(a,e){if(a!=e){if(b(a))return[a];var f=a.attr("class");if(f&&(-1!==f.indexOf(j)||-1!==f.indexOf(i)))return[a]}var g=[],h=a.children();return d.each(h,function(a){g=g.concat(c($(a),e))}),g}var d=a("bui/common"),e=a("bui/form/field"),f=a("bui/form/groupvalid"),g=d.prefix,h="form-field",i=g+h,j=g+"form-group",k="input,select,textarea",l=d.Component.View.extend([f.View]),m=d.Component.Controller.extend([f],{syncUI:function(){var a=this,b=a.getFields(),c=a.get("validators");d.each(b,function(a){var b=a.get("name");c[b]&&a.set("validator",c[b])}),d.each(c,function(b,c){if(0==c.indexOf("#")){var d=c.replace("#",""),e=a.getChild(d,!0);e&&e.set("validator",b)}})},getDecorateElments:function(){var a=this,b=a.get("el"),d=c(b,b);return d},findXClassByNode:function(a,c){return"checkbox"===a.attr("type")?h+"-checkbox":"radio"===a.attr("type")?h+"-radio":"number"===a.attr("type")?h+"-number":a.hasClass("calendar")?h+"-date":"SELECT"==a[0].tagName?h+"-select":b(a)?h:d.Component.Controller.prototype.findXClassByNode.call(this,a,c)},getRecord:function(){var a=this,b={},c=a.getFields();return d.each(c,function(c){var e=c.get("name"),f=a._getFieldValue(c);if(b[e]){if(d.isArray(b[e])&&null!=f)b[e].push(f);else if(null!=f){var g=[b[e]];g.push(f),b[e]=g}}else b[e]=f}),b},getFields:function(a){var b=this,c=[],f=b.get("children");return d.each(f,function(b){b instanceof e?a&&b.get("name")!=a||c.push(b):b.getFields&&(c=c.concat(b.getFields(a)))}),c},getField:function(a){var b=this,c=b.getFields(),e=null;return d.each(c,function(b){return b.get("name")===a?(e=b,!1):void 0}),e},getFieldAt:function(a){return this.getFields()[a]},setFieldValue:function(a,b){var c=this,e=c.getFields(a);d.each(e,function(a){c._setFieldValue(a,b)})},_setFieldValue:function(a,b){if(!a.get("disabled"))if(a instanceof e.Check){var c=a.get("value");b&&(c===b||d.isArray(b)&&d.Array.contains(c,b))?a.set("checked",!0):a.set("checked",!1)}else null==b&&(b=""),a.set("value",b)},getFieldValue:function(a){var b=this,c=b.getFields(a),e=[];return d.each(c,function(a){var c=b._getFieldValue(a);c&&e.push(c)}),0===e.length?null:1===e.length?e[0]:e},_getFieldValue:function(a){return a instanceof e.Check&&!a.get("checked")?null:a.get("value")},clearFields:function(){this.clearErrors(),this.setRecord({})},setRecord:function(a){var b=this,c=b.getFields();d.each(c,function(c){var d=c.get("name");b._setFieldValue(c,a[d])})},updateRecord:function(a){var b=this,c=b.getFields();d.each(c,function(c){var d=c.get("name");a.hasOwnProperty(d)&&b._setFieldValue(c,a[d])})},focus:function(){var a=this,b=a.getFields(),c=b[0];c&&c.focus()},_uiSetDisabled:function(a){var b=this,c=b.get("children");d.each(c,function(b){b.set("disabled",a)})}},{ATTRS:{record:{setter:function(a){this.setRecord(a)},getter:function(){return this.getRecord()}},validators:{value:{}},defaultLoaderCfg:{value:{property:"children",dataType:"json"}},disabled:{sync:!1},isDecorateChild:{value:!0},xview:{value:l}}},{xclass:"form-field-container"});return m.View=l,m}),define("bui/form/fieldgroup",["bui/common","bui/form/group/base","bui/form/group/range","bui/form/group/check","bui/form/group/select"],function(a){var b=a("bui/common"),c=a("bui/form/group/base");return b.mix(c,{Range:a("bui/form/group/range"),Check:a("bui/form/group/check"),Select:a("bui/form/group/select")}),c}),define("bui/form/form",["bui/common","bui/toolbar","bui/form/fieldcontainer"],function(a){var b=a("bui/common"),c=a("bui/toolbar").Bar,d={NORMAL:"normal",AJAX:"ajax",IFRAME:"iframe"},e=a("bui/form/fieldcontainer");b.Component;var f=e.View.extend({_uiSetMethod:function(a){this.get("el").attr("method",a)},_uiSetAction:function(a){this.get("el").attr("action",a)}},{ATTRS:{method:{},action:{}}},{xclass:"form-view"}),g=e.extend({renderUI:function(){var a,d=this,e=d.get("buttonBar");$.isPlainObject(e)&&d.get("buttons")&&(a=b.merge(d.getDefaultButtonBarCfg(),e),e=new c(a),d.set("buttonBar",e)),d._initSubmitMask()},bindUI:function(){var a=this,b=a.get("el");b.on("submit",function(b){a.valid(),a.isValid()&&a.onBeforeSubmit()!==!1||b.preventDefault(),a.isValid()&&a.get("submitType")===d.AJAX&&(b.preventDefault(),a.ajaxSubmit())})},getDefaultButtonBarCfg:function(){var a=this,b=a.get("buttons");return{autoRender:!0,elCls:"toolbar",render:a.get("el"),items:b,defaultChildClass:"bar-item-button"}},submit:function(a){var b=this,c=b.get("submitType");if(b.valid(),b.isValid()){if(0==b.onBeforeSubmit())return;c===d.NORMAL?b.get("el")[0].submit():c===d.AJAX&&b.ajaxSubmit(a)}},ajaxSubmit:function(a){var c,d=this,e=d.get("method"),f=d.get("action"),g=d.get("callback"),h=d.get("submitMask"),i=d.serializeToObject(),j=b.merge(!0,{url:f,type:e,dataType:"json",data:i},a);a&&a.success&&(c=a.success),j.success=function(a){h&&h.hide&&h.hide(),c&&c(a),g&&g.call(d,a)},h&&h.show&&h.show(),$.ajax(j)},_initSubmitMask:function(){var a=this,c=a.get("submitType"),e=a.get("submitMask");c===d.AJAX&&e&&b.use("bui/mask",function(c){var d=$.isPlainObject(e)?e:{};e=new c.LoadMask(b.mix({el:a.get("el")},d)),a.set("submitMask",e)})},serializeToObject:function(){return b.FormHelper.serializeToObject(this.get("el")[0])},onBeforeSubmit:function(){return this.fire("beforesubmit")},reset:function(){var a=this,b=a.get("initRecord");a.setRecord(b)},resetTips:function(){var a=this,c=a.getFields();b.each(c,function(a){a.resetTip()})},destructor:function(){var a=this,b=a.get("buttonBar"),c=a.get("submitMask");b&&b.destroy&&b.destroy(),c&&c.destroy&&c.destroy()},_uiSetInitRecord:function(a){this.setRecord(a)}},{ATTRS:{action:{view:!0,value:""},allowTextSelection:{value:!0},events:{value:{beforesubmit:!1}},method:{view:!0,value:"get"},defaultLoaderCfg:{value:{autoLoad:!0,property:"record",dataType:"json"}},submitMask:{value:{msg:"正在提交。。。"}},submitType:{value:"normal"},callback:{},decorateCfgFields:{value:{method:!0,action:!0}},defaultChildClass:{value:"form-field"},elTagName:{value:"form"},buttons:{},buttonBar:{value:{}},childContainer:{value:".x-form-fields"},initRecord:{},showError:{value:!1},xview:{value:f},tpl:{value:'<div class="x-form-fields"></div>'}}},{xclass:"form"});return g.View=f,g}),define("bui/form/groupvalid",["bui/form/valid"],function(a){function b(){}function c(){}var d="x-form-error",e=a("bui/form/valid");return BUI.augment(b,e.View,{showError:function(a,b,c){var e=BUI.substitute(b,{error:a}),f=$(e);f.appendTo(c),f.addClass(d)},clearErrors:function(){var a=this,b=a.getErrorsContainer();b.children("."+d).remove()}}),c.ATTRS=ATTRS=BUI.merge(!0,e.ATTRS,{events:{value:{validchange:!0,change:!0}}}),BUI.augment(c,e,{__bindUI:function(){var a=this,b="validchange change";a.on(b,function(b){var c=b.target;if(c!=this&&a.get("showError")){var d=a.isChildrenValid();d&&(a.validControl(a.getRecord()),d=a.isSelfValid()),d?a.clearErrors():a.showErrors()}})},isValid:function(){var a=this,b=a.isChildrenValid();return b&&a.isSelfValid()},valid:function(){var a=this,b=a.get("children");BUI.each(b,function(a){a.valid()})},isChildrenValid:function(){var a=this,b=a.get("children"),c=!0;return BUI.each(b,function(a){return a.isValid()?void 0:(c=!1,!1)}),c},isSelfValid:function(){return!this.get("error")},validControl:function(a){var b=this,c=b.getValidError(a);b.set("error",c)},getErrors:function(){var a=this,b=a.get("children"),c=a.get("showChildError"),d=null,e=[];return c&&BUI.each(b,function(a){a.getErrors&&(e=e.concat(a.getErrors()))}),a.isChildrenValid()&&(d=a.get("error"),d&&e.push(d)),e},_uiSetErrorTpl:function(a){var b=this,c=b.get("children");BUI.each(c,function(b){b.set("errorTpl",a)})}}),c.View=b,c}),define("bui/form/horizontal",["bui/common","bui/form/form"],function(a){var b=(a("bui/common"),a("bui/form/form")),c=b.extend({getDefaultButtonBarCfg:function(){var a=this,b=a.get("buttons");return{autoRender:!0,elCls:"actions-bar toolbar row",tpl:'<div class="form-actions span21 offset3"></div>',childContainer:".form-actions",render:a.get("el"),items:b,defaultChildClass:"bar-item-button"}}},{ATTRS:{defaultChildClass:{value:"form-row"},errorTpl:{value:'<span class="valid-text"><span class="estate error"><span class="x-icon x-icon-mini x-icon-error">!</span><em>{error}</em></span></span>'},elCls:{value:"form-horizontal"}},PARSER:{}},{xclass:"form-horizontal"});return c}),define("bui/form/remote",["bui/common"],function(a){var b=a("bui/common"),c=function(){};c.ATTRS={isLoading:{},loadingEl:{}},c.prototype={getLoadingContainer:function(){},_setLoading:function(){var a=this,b=a.get("loadingEl"),c=a.get("loadingTpl");b||(b=$(c).appendTo(a.getLoadingContainer()),a.setInternal("loadingEl",b))},_clearLoading:function(){var a=this,b=a.get("loadingEl");b&&(b.remove(),a.setInternal("loadingEl",null))},_uiSetIsLoading:function(a){var b=this;a?b._setLoading():b._clearLoading()}};var d=function(){};return d.ATTRS={defaultRemote:{value:{method:"GET",cache:!0,callback:function(a){return a}}},remoteDaly:{value:500},loadingTpl:{view:!0,value:'<img src="http://img02.taobaocdn.com/tps/i2/T1NU8nXCVcXXaHNz_X-16-16.gif" alt="loading"/>'},isLoading:{view:!0,value:!1},remote:{setter:function(a){return b.isString(a)&&(a={url:a}),a}},remoteHandler:{},events:{value:{remotecomplete:!1,remotestart:!1}}},d.prototype={__bindUI:function(){var a=this;a.on("change",function(){if(a.get("remote")&&a.isValid()){var b=a.getRemoteParams();a._startRemote(b)}}),a.on("error",function(){a.get("remote")&&a._cancelRemote()})},_startRemote:function(a){function b(){c._remoteValid(a,d),c.set("isLoading",!0)}var c=this,d=c.get("remoteHandler"),e=c.get("remoteDaly");d&&c._cancelRemote(d),d=setTimeout(b,e),c.setInternal("remoteHandler",d)},_remoteValid:function(a,c){function d(a,b){c==e.get("remoteHandler")&&(e.fire("remotecomplete",{error:a,data:b}),e.set("isLoading",!1),e.setInternal("remoteHandler",null))}var e=this,f=e.get("remote"),g=e.get("defaultRemote"),h=b.merge(g,f,{data:a});h.success=function(a){var b=h.callback,c=b(a);d(c,a)},h.error=function(a,b,c){d(c)},e.fire("remotestart",{data:a}),$.ajax(h)},getRemoteParams:function(){},_cancelRemote:function(a){var b=this;a=a||b.get("remoteHandler"),a&&(clearTimeout(a),b.setInternal("remoteHandler",null)),b.set("isLoading",!1)}},d.View=c,d}),define("bui/form/row",["bui/common","bui/form/fieldcontainer"],function(a){var b=(a("bui/common"),a("bui/form/fieldcontainer")),c=b.extend({},{ATTRS:{elCls:{value:"row"},defaultChildCfg:{value:{tpl:' <label class="control-label">{label}</label>                <div class="controls">                </div>',childContainer:".controls",showOneError:!0,controlContainer:".controls",elCls:"control-group span8",errorTpl:'<span class="valid-text"><span class="estate error"><span class="x-icon x-icon-mini x-icon-error">!</span><em>{error}</em></span></span>'}},defaultChildClass:{value:"form-field-text"}}},{xclass:"form-row"});return c}),define("bui/form/rule",["bui/common"],function(a){function b(a,b,c,e,f){var g=a,h=g.get("validator"),i=d(a,c,e);return b=null==b?"":b,h.call(g,b,c,i,f)}function c(a){if(null==a)return{};if($.isPlainObject(a))return a;var b=a,c={};if(e.isArray(a)){for(var d=0;d<b.length;d++)c[d]=b[d];return c}return{0:a}}function d(a,b,d){var f=c(b);return d=d||a.get("msg"),e.substitute(d,f)}var e=a("bui/common"),f=function(a){f.superclass.constructor.call(this,a)};return e.extend(f,e.Base),f.ATTRS={name:{},msg:{},validator:{value:function(){}}},e.augment(f,{valid:function(a,c,d,e){var f=this;return b(f,a,c,d,e)}}),f}),define("bui/form/rules",["bui/form/rule"],function(a){function b(a){return parseFloat(a)}function c(a){return BUI.Date.parse(a)}function d(a,b,c){var d=a&&a.equals!==!1;return d?b>=c:b>c}function e(a){return""==a||null==a}function f(a,b,c,f){for(var g=f.getFields(),h=!0,i=1;i<g.length;i++){var j,k,l=g[i],m=g[i-1];if(l&&m&&(j=l.get("value"),k=m.get("value"),!e(j)&&!e(k)&&!d(b,j,k))){h=!1;break}}return h?null:c}function g(a){var b=a.getFieldAt(0);return b?b.get("name"):""}function h(a,b){if(BUI.isArray(b)||(b=[b]),!a||!b.length)return!1;var c=a?BUI.isArray(a)?a.length:1:0;if(1==b.length){var d=b[0];if(!d)return!0;if(d>c)return!1}else{var e=b[0],f=b[1];if(e>c||c>f)return!1}return!0}var i=a("bui/form/rule"),j={},k={add:function(a){var b;return $.isPlainObject(a)?(b=a.name,j[b]=new i(a)):a.get&&(b=a.get("name"),j[b]=a),j[b]},remove:function(a){delete j[a]},get:function(a){return j[a]},valid:function(a,b,c,d,e){var f=k.get(a);return f?f.valid(b,c,d,e):null},isValid:function(a,b,c,d){return null==k.valid(a,b,c,d)}};return k.add({name:"required",msg:"不能为空！",validator:function(a,b,c){return b!==!1&&/^\s*$/.test(a)?c:void 0}}),k.add({name:"equalTo",msg:"两次输入不一致！",validator:function(a,b,c){var d=$(b);return d.length&&(b=d.val()),a===b?void 0:c}}),k.add({name:"min",msg:"输入值不能小于{0}！",validator:function(a,c,d){return""!==a&&b(a)<b(c)?d:void 0}}),k.add({name:"max",msg:"输入值不能大于{0}！",validator:function(a,c,d){return""!==a&&b(a)>b(c)?d:void 0}}),k.add({name:"length",msg:"输入值长度为{0}！",validator:function(a,b,c){return null!=a&&(a=$.trim(a.toString()),b!=a.length)?c:void 0}}),k.add({name:"minlength",msg:"输入值长度不小于{0}！",validator:function(a,b,c){if(null!=a){a=$.trim(a.toString());var d=a.length;if(b>d)return c}}}),k.add({name:"maxlength",msg:"输入值长度不大于{0}！",validator:function(a,b,c){if(a){a=$.trim(a.toString());var d=a.length;if(d>b)return c}}}),k.add({name:"regexp",msg:"输入值不符合{0}！",validator:function(a,b,c){return b?b.test(a)?void 0:c:void 0}}),k.add({name:"email",msg:"不是有效的邮箱地址！",validator:function(a,b,c){return a=$.trim(a),a?/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(a)?void 0:c:void 0}}),k.add({name:"date",msg:"不是有效的日期！",validator:function(a,b,c){return BUI.isNumber(a)||BUI.isDate(a)?void 0:(a=$.trim(a),a?BUI.Date.isDateString(a)?void 0:c:void 0)}}),k.add({name:"minDate",msg:"输入日期不能小于{0}！",validator:function(a,b,d){if(a){var e=c(a);if(e&&e<c(b))return d}}}),k.add({name:"maxDate",msg:"输入日期不能大于{0}！",validator:function(a,b,d){if(a){var e=c(a);if(e&&e>c(b))return d}}}),k.add({name:"number",msg:"不是有效的数字！",validator:function(a,b,c){return BUI.isNumber(a)?void 0:(a=a.replace(/\,/g,""),isNaN(a)?c:void 0)}}),k.add({name:"dateRange",msg:"结束日期不能小于起始日期！",validator:f}),k.add({name:"numberRange",msg:"结束数字不能小于开始数字！",validator:f}),k.add({name:"checkRange",msg:"必须选中{0}项！",validator:function(a,b,c,d){var e,f=g(d),i=b;return f&&i&&(e=a[f],!h(e,i))?c:null}}),k}),define("bui/form/tips",["bui/common","bui/overlay"],function(a){var b=a("bui/common"),c=b.prefix,d=a("bui/overlay").Overlay,e="data-tip",f=c+"form-tip-container",g=d.extend({initializer:function(){var a=this,b=a.get("render");if(!b){var c=$(a.get("trigger")).parent();a.set("render",c)}},renderUI:function(){var a=this;a.resetVisible()},resetVisible:function(){var a=this,b=$(a.get("trigger"));b.val()?a.set("visible",!1):(a.set("align",{node:$(a.get("trigger")),points:["cl","cl"]}),a.set("visible",!0))},bindUI:function(){var a=this,b=$(a.get("trigger"));a.get("el").on("click",function(){a.hide(),b.focus()}),b.on("click focus",function(){a.hide()}),b.on("blur",function(){a.resetVisible()})}},{ATTRS:{trigger:{},text:{},iconCls:{},tpl:{value:'<span class="{iconCls}"></span><span class="tip-text">{text}</span>'}}},{xclass:"form-tip"}),h=function(a){return this.constructor!==h?new h(a):(h.superclass.constructor.call(this,a),this._init(),void 0)};return h.ATTRS={form:{},items:{value:[]}},b.extend(h,b.Base),b.augment(h,{_init:function(){var a=this,c=$(a.get("form"));c.length&&(b.each($.makeArray(c[0].elements),function(b){var c=$(b).attr(e);c&&a._initFormElement(b,$.parseJSON(c))}),c.addClass(f))},_initFormElement:function(a,b){b&&(b.trigger=a);var c=this,d=c.get("items"),e=new g(b);d.push(e)},getItem:function(a){var c=this,d=c.get("items"),e=null;return b.each(d,function(b){return $(b.get("trigger")).attr("name")===a?(e=b,!1):void 0}),e},resetVisible:function(){var a=this,c=a.get("items");b.each(c,function(a){a.resetVisible()})},render:function(){var a=this,c=a.get("items");b.each(c,function(a){a.render()})},destroy:function(){var a=this,c=a.get(c);b.each(c,function(a){a.destroy()})}}),h.Item=g,h}),define("bui/form/valid",["bui/common","bui/form/rules"],function(a){var b=a("bui/common"),c=a("bui/form/rules"),d=function(){};d.prototype={getErrorsContainer:function(){var a=this,c=a.get("errorContainer");return c?b.isString(c)?a.get("el").find(c):c:a.getContentElement()},showErrors:function(a){var c=this,d=c.getErrorsContainer(),e=c.get("errorTpl");return c.clearErrors(),c.get("showError")?c.get("showOneError")?(a&&a.length&&c.showError(a[0],e,d),void 0):(b.each(a,function(a){a&&c.showError(a,e,d)}),void 0):void 0},showError:function(){},clearErrors:function(){}};var e=function(){};return e.ATTRS={defaultRules:{value:{}},defaultMessages:{value:{}},rules:{value:{}},messages:{value:{}},validator:{},errorContainer:{view:!0},errorTpl:{view:!0,value:'<span class="x-field-error"><span class="x-icon x-icon-mini x-icon-error">!</span><label class="x-field-error-text">{error}</label></span>'},showError:{view:!0,value:!0},showOneError:{},error:{}},e.prototype={isValid:function(){},valid:function(){},validControl:function(){},validRules:function(a,b){var d=this,e=d._getValidMessages(),f=null;for(var g in a)if(a.hasOwnProperty(g)){var h=a[g];if(f=c.valid(g,b,h,e[g],d))break}return f},_getValidMessages:function(){var a=this,c=a.get("defaultMessages"),d=a.get("messages");return b.merge(c,d)},getValidError:function(a){var b=this,c=b.get("validator"),d=null;return d=b.validRules(b.get("defaultRules"),a)||b.validRules(b.get("rules"),a),d||(b.parseValue&&(a=b.parseValue(a)),d=c?c.call(this,a):""),d},getErrors:function(){},showErrors:function(a){var b=this,a=a||b.getErrors();b.get("view").showErrors(a)},clearErrors:function(){var a=this,c=a.get("children");b.each(c,function(a){a.clearErrors&&a.clearErrors()}),a.set("error",null),a.get("view").clearErrors()},addRule:function(a,b,c){var d=this,e=d.get("rules"),f=d.get("messages");e[a]=b,c&&(f[a]=c)},addRules:function(a,c){var d=this;b.each(a,function(a,b){var e=c?c[b]:null;d.addRule(b,a,e)})},removeRule:function(a){var b=this,c=b.get("rules");delete c[a]},clearRules:function(){var a=this;a.set("rules",{})}},e.View=d,e});