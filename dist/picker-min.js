/*! suanliao */
define("bui/picker",["bui/common","bui/picker/picker","bui/picker/listpicker"],function(a){var b=a("bui/common"),c=b.namespace("Picker");return b.mix(c,{Picker:a("bui/picker/picker"),ListPicker:a("bui/picker/listpicker")}),c}),define("bui/picker/picker",["bui/overlay"],function(a){var b=a("bui/overlay").Overlay,c=b.extend({bindUI:function(){var a=this,b=a.get("innerControl"),c=a.get("hideEvent"),d=$(a.get("trigger"));d.on(a.get("triggerEvent"),function(){if(a.get("autoSetValue")){var b=a.get("valueField")||a.get("textField")||this,c=$(b).val();a.setSelectedValue(c)}}),b.on(a.get("changeEvent"),function(b){var c=a.get("curTrigger"),e=a.get("textField")||c||d,f=a.get("valueField"),g=a.getSelectedValue(),h=!1;if(e){var i=a.getSelectedText(),j=$(e).val();i!=j&&($(e).val(i),h=!0)}if(f){var k=$(f).val();f!=k&&($(f).val(g),h=!0)}h&&a.onChange(i,g,b)}),c&&b.on(a.get("hideEvent"),function(){var b=a.get("curTrigger");try{b&&b.focus()}catch(c){BUI.log(c)}a.hide()})},setSelectedValue:function(){},getSelectedValue:function(){},getSelectedText:function(){},onChange:function(a,b){var c=this,d=c.get("curTrigger");c.fire("selectedchange",{value:b,text:a,curTrigger:d})},_uiSetValueField:function(a){var b=this;a&&b.setSelectedValue($(a).val())},_getTextField:function(){var a=this;return a.get("textField")||a.get("curTrigger")}},{ATTRS:{innerControl:{getter:function(){return this.get("children")[0]}},triggerEvent:{value:"click"},autoSetValue:{value:!0},changeEvent:{value:"selectedchange"},autoHide:{value:!0},hideEvent:{value:"itemclick"},textField:{},align:{value:{points:["bl","tl"],offset:[0,0]}},valueField:{}}},{xclass:"picker"});return c}),define("bui/picker/listpicker",["bui/picker/picker","bui/list"],function(a){var b=(a("bui/list"),a("bui/picker/picker")),c=b.extend({initializer:function(){var a=this,b=a.get("children"),c=a.get("list");c||b.push({})},setSelectedValue:function(a){a=a?a.toString():"";var b=this,c=b.get("list"),d=b.getSelectedValue();a!==d&&c.getCount()&&(c.get("multipleSelect")&&c.clearSelection(),c.setSelectionByField(a.split(",")))},onChange:function(a,b,c){var d=this,e=d.get("curTrigger");d.fire("selectedchange",{value:b,text:a,curTrigger:e,item:c.item})},getSelectedValue:function(){return this.get("list").getSelectionValues().join(",")},getSelectedText:function(){return this.get("list").getSelectionText().join(",")}},{ATTRS:{defaultChildClass:{value:"simple-list"},list:{getter:function(){return this.get("children")[0]}}}},{xclass:"list-picker"});return c});