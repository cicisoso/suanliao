/**
 * @fileOverview 
 * @ignore
 */

define('bui/tab/tabpanelitem',['bui/common','bui/tab/tabitem'],function (require) {
  

  var BUI = require('bui/common'),
    TabItem = require('bui/tab/tabitem'),
    Component = BUI.Component;

  /**
   * @private
   * @class BUI.Tab.TabPanelItemView
   * @extends BUI.Tab.TabItemView
   * 存在面板的标签项视图层对象
   */
  var itemView = TabItem.View.extend({
  },{
    xclass:'tab-panel-item-view'
  });


  /**
   * 标签项
   * @class BUI.Tab.TabPanelItem
   * @extends BUI.Tab.TabItem
   */
  var item = TabItem.extend({
    
    renderUI : function(){
      var _self = this,
        selected = _self.get('selected');
        _self._setPanelVisible(selected);
    },
    //设置面板是否可见
    _setPanelVisible : function(visible){
      var _self = this,
        panel = _self.get('panel'),
        method = visible ? 'show' : 'hide';
      if(panel){
        $(panel)[method]();
      }
    },
    //选中标签项时显示面板
    _uiSetSelected : function(v){
      this._setPanelVisible(v);
    },
    destructor: function(){
      var _self = this,
        panel = _self.get('panel');
      if(panel && _self.get('panelDestroyable')){
        $(panel).remove();
      }
    },
    _uiSetPanelContent : function(v){
      var _self = this,
        panel = _self.get('panel');
      $(panel).html(v);
    }
  },{
    ATTRS : 
    {
      /**
       * 标签项对应的面板容器，当标签选中时，面板显示
       * @cfg {String|HTMLElement|jQuery} panel
       * @internal 面板属性一般由 tabPanel设置而不应该由用户手工设置
       */
      /**
       * 标签项对应的面板容器，当标签选中时，面板显示
       * @type {String|HTMLElement|jQuery}
       * @readOnly
       */
      panel : {

      },
      /**
       * panel的内容
       * @property {String}
       */
      panelContent : {

      },
      /**
       * 默认的加载控件内容的配置,默认值：
       * <pre>
       *  {
       *   property : 'panelContent',
       *   lazyLoad : {
       *       event : 'active'
       *   },
       *     loadMask : {
       *       el : _self.get('panel')
       *   }
       * }
       * </pre>
       * @type {Object}
       */
      defaultLoaderCfg  : {
        valueFn :function(){
          var _self = this;
          return {
            property : 'panelContent',
            autoLoad : false,
            lazyLoad : {
              event : 'afterSelectedChange'
            },
            loadMask : {
              el : _self.get('panel')
            }
          }
        } 
      },
      /**
       * 移除标签项时是否移除面板，默认为 false
       * @type {Boolean}
       */
      panelDestroyable : {
        value : true
      },
      xview:{
        value:itemView
      }
    }
  },{
    xclass:'tab-panel-item'
  });
  
  item.View = itemView;
  return item;

});