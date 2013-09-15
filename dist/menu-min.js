/*! suanliao */
define("bui/menu",["bui/common","bui/menu/menu","bui/menu/menuitem","bui/memu/contextmenu","bui/menu/popmenu","bui/menu/sidemenu"],function(a){var b=a("bui/common"),c=b.namespace("Menu");return b.mix(c,{Menu:a("bui/menu/menu"),MenuItem:a("bui/menu/menuitem"),ContextMenu:a("bui/memu/contextmenu"),PopMenu:a("bui/menu/popmenu"),SideMenu:a("bui/menu/sidemenu")}),c.ContextMenuItem=c.ContextMenu.Item,c}),define("bui/menu/menuitem",["bui/common"],function(a){var b=a("bui/common"),c=b.Component,d=c.UIBase,e=(b.prefix,"x-caret"),f="data-id",g=c.View.extend([d.ListItemView,d.CollapseableView],{_uiSetOpen:function(a){var b=this,c=b.getStatusCls("open");a?b.get("el").addClass(c):b.get("el").removeClass(c)}},{ATTRS:{}},{xclass:"menu-item-view"}),h=c.Controller.extend([d.ListItem,d.Collapseable],{renderUI:function(){var a=this,c=a.get("el"),d=a.get("id");d||(d=b.guid("menu-item"),a.set("id",d)),c.attr(f,d)},handleMouseEnter:function(a){this.get("subMenu")&&this.set("open",!0),h.superclass.handleMouseEnter.call(this,a)},handleMouseLeave:function(a){var b=this,c=b.get("subMenu"),d=a.toElement;d&&c&&c.containsElement(d)?b.set("open",!0):b.set("open",!1),h.superclass.handleMouseLeave.call(this,a)},containsElement:function(a){var b,c=this,d=h.superclass.containsElement.call(c,a);return d||(b=c.get("subMenu"),d=b&&b.containsElement(a)),d},_uiSetOpen:function(a){var b=this,c=b.get("subMenu"),d=b.get("subMenuAlign");if(c)if(a)d.node=b.get("el"),c.set("align",d),c.show();else{var e=c.get("align");e&&e.node!=b.get("el")||c.hide()}},_uiSetSubMenu:function(a){if(a){var b=this,c=b.get("el"),d=b.get("parent");a.get("parentMenu")||(a.set("parentMenu",d),d.get("autoHide")&&a.set("autoHide",!1)),$(b.get("arrowTpl")).appendTo(c)}},destructor:function(){var a=this,b=a.get("subMenu");b&&b.destroy()}},{ATTRS:{elTagName:{value:"li"},xview:{value:g},open:{view:!0,value:!1},subMenu:{view:!0},subMenuAlign:{valueFn:function(){return{points:["tr","tl"],offset:[-5,0]}}},arrowTpl:{value:'<span class="'+e+" "+e+'-left"></span>'},events:{value:{afterOpenChange:!0}}}},{xclass:"menu-item",priority:0}),i=h.extend({},{ATTRS:{focusable:{value:!1},selectable:{value:!1},handleMouseEvents:{value:!1}}},{xclass:"menu-item-sparator"});return h.View=g,h.Separator=i,h}),define("bui/menu/menu",["bui/common"],function(a){var b=a("bui/common"),c=b.Component,d=c.UIBase,e=c.Controller.extend([d.ChildList],{bindUI:function(){var a=this;a.on("click",function(b){var c=b.target,d=a.get("multipleSelect");a!=c&&(d||!a.get("clickHide")||c.get("subMenu")||a.getTopAutoHideMenu().hide())}),a.on("afterOpenChange",function(c){var d=c.target,e=c.newVal,f=a.get("children");e&&b.each(f,function(a){a!==d&&a.get("open")&&a.set("open",!1)})}),a.on("afterVisibleChange",function(b){b.newVal,a.get("parentMenu"),a._clearOpen()})},getTopAutoHideMenu:function(){var a=this,b=a.get("parentMenu");return b&&b.get("autoHide")?b.getTopAutoHideMenu():a.get("autoHide")?a:null},_clearOpen:function(){var a=this,c=a.get("children");b.each(c,function(a){a.set&&a.set("open",!1)})},findItemById:function(a){return this.findItemByField("id",a)},_uiSetSelectedItem:function(a){a&&_self.setSelected(a)}},{ATTRS:{elTagName:{view:!0,value:"ul"},idField:{value:"id"},isDecorateChild:{value:!0},defaultChildClass:{value:"menu-item"},selectedItem:{},parentMenu:{}}},{xclass:"menu",priority:0});return e}),define("bui/menu/popmenu",["bui/common","bui/menu/menu"],function(a){var b=a("bui/common"),c=b.Component.UIBase,d=a("bui/menu/menu"),e=b.Component.View.extend([c.PositionView],{}),f=d.extend([c.Position,c.Align,c.AutoShow,,c.AutoHide],{},{ATTRS:{clickHide:{value:!0},align:{value:{points:["bl","tl"],offset:[0,0]}},visibleMode:{value:"visibility"},autoHide:{value:!0},visible:{value:!1},xview:{value:e}}},{xclass:"pop-menu"});return f}),define("bui/memu/contextmenu",["bui/common","bui/menu/menuitem","bui/menu/popmenu"],function(a){var b=a("bui/common"),c=a("bui/menu/menuitem"),d=a("bui/menu/popmenu"),e=b.prefix,f=e+"menu-item-link",g=e+"menu-item-icon",h=b.Component;h.UIBase;var i=c.extend({bindUI:function(){var a=this;a.get("el").delegate("."+f,"click",function(a){a.preventDefault()})},_uiSetIconCls:function(a,b){var c=this,d=b.prevVal,e=c.get("el").find("."+g);e.removeClass(d),e.addClass(a)}},{ATTRS:{text:{veiw:!0,value:""},iconCls:{sync:!1,value:""},tpl:{value:'<a class="'+f+'" href="#">        <span class="'+g+' {iconCls}"></span><span class="'+e+'menu-item-text">{text}</span></a>'}}},{xclass:"context-menu-item"}),j=d.extend({},{ATTRS:{defaultChildClass:{value:"context-menu-item"},align:{value:null}}},{xclass:"context-menu"});return j.Item=i,j}),define("bui/menu/sidemenu",["bui/common","bui/menu/menu"],function(a){var b=a("bui/common"),c=a("bui/menu/menu"),d=(b.Component,b.prefix+"menu-title"),e="menu-leaf",f=c.extend({initializer:function(){var a=this,c=a.get("items"),d=a.get("children");b.each(c,function(b){var c=a._initMenuCfg(b);d.push(c)})},bindUI:function(){var a=this,c=a.get("children");b.each(c,function(a){var b=a.get("children")[0];b&&b.publish("click",{bubbles:1})}),a.get("el").delegate("a","click",function(a){a.preventDefault()}),a.on("itemclick",function(b){var c=b.item,f=$(b.domTarget).closest("."+d);if(f.length){var g=c.get("collapsed");c.set("collapsed",!g)}else c.get("el").hasClass(e)&&(a.fire("menuclick",{item:c}),a.clearSelection(),a.setSelected(c))})},getItems:function(){var a=this,c=[],d=a.get("children");return b.each(d,function(a){var b=a.get("children")[0];c=c.concat(b.get("children"))}),c},_initMenuCfg:function(a){var c=this,e=a.items,f=[],g={xclass:"menu-item",elCls:"menu-second",collapsed:a.collapsed,selectable:!1,children:[{xclass:"menu",children:f}],content:'<div class="'+d+'"><s></s><span class="'+d+'-text">'+a.text+"</span></div>"};return b.each(e,function(a){var b=c._initSubMenuCfg(a);f.push(b)}),g},_initSubMenuCfg:function(a){var c={xclass:"menu-item",elCls:"menu-leaf",tpl:'<a href="{href}"><em>{text}</em></a>'};return b.mix(c,a)}},{ATTRS:{autoInitItems:{value:!1},events:{value:{menuclick:!1}}}},{xclass:"side-menu"});return f});