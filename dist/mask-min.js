/*! suanliao */
define("bui/mask",["bui/common","bui/mask/mask","bui/mask/loadmask"],function(a){var b=(a("bui/common"),a("bui/mask/mask"));return b.LoadMask=a("bui/mask/loadmask"),b}),define("bui/mask/loadmask",["bui/mask/mask"],function(a){function b(a){var c=this;b.superclass.constructor.call(c,a)}var c=a("bui/mask/mask");return BUI.extend(b,BUI.Base),b.ATTRS={el:{},msg:{value:"Loading..."},msgCls:{value:"x-mask-loading"},disabled:{value:!1}},BUI.augment(b,{disable:function(){this.set("disabled",!0)},onLoad:function(){c.unmaskElement(this.get("el"))},onBeforeLoad:function(){var a=this;a.get("disabled")||c.maskElement(a.get("el"),a.get("msg"),this.get("msgCls"))},show:function(){this.onBeforeLoad()},hide:function(){this.onLoad()},destroy:function(){this.hide(),this.clearAttrVals(),this.off()}}),b}),define("bui/mask/mask",["bui/common"],function(a){var b=a("bui/common"),c=b.namespace("Mask"),d=b.UA,e=b.prefix+"ext-mask",f=e+"-msg";return b.mix(c,{maskElement:function(a,c,g){var h=$(a),i=$("."+e,h),j=null,k=null,l=null,m=null;if(!i.length&&(i=$('<div class="'+e+'"></div>').appendTo(h),h.addClass("x-masked-relative x-masked"),6===d.ie&&i.height(h.height()),c)){j=['<div class="'+f+'"><div>',c,"</div></div>"].join(""),k=$(j).appendTo(h),g&&k.addClass(g);try{l=(h.height()-k.height())/2,m=(h.width()-k.width())/2,k.css({left:m,top:l})}catch(n){b.log("mask error occurred")}}return i},unmaskElement:function(a){var b=$(a),c=b.children("."+f),d=b.children("."+e);c&&c.remove(),d&&d.remove(),b.removeClass("x-masked-relative x-masked")}}),c});