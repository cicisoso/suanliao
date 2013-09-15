/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 表格命名空间入口
 * @ignore
 */

define('bui/grid',['bui/common','bui/grid/simplegrid','bui/grid/grid','bui/grid/column','bui/grid/header','bui/grid/format','bui/grid/plugins'],function (require) {

  var BUI = require('bui/common'),
    Grid = BUI.namespace('Grid');

  BUI.mix(Grid,{
    SimpleGrid : require('bui/grid/simplegrid'),
    Grid : require('bui/grid/grid'),
    Column : require('bui/grid/column'),
    Header : require('bui/grid/header'),
    Format : require('bui/grid/format'),
    Plugins : require('bui/grid/plugins')
  });

  return Grid;

});
/**
 * @fileOverview This class specifies the definition for a column of a grid.
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/grid/column',['bui/common'],function (require) {

    var	BUI = require('bui/common'),
        PREFIX = BUI.prefix,
		CLS_HD_TITLE = PREFIX + 'grid-hd-title',
        CLS_OPEN = PREFIX + 'grid-hd-open',
        SORT_PREFIX = 'sort-',
        SORT_ASC = 'ASC',
        SORT_DESC = 'DESC',
        CLS_TRIGGER = PREFIX + 'grid-hd-menu-trigger',
        CLS_HD_TRIGGER = 'grid-hd-menu-trigger';

    /**
    * 表格列的视图类
    * @class BUI.Grid.ColumnView
    * @extends BUI.Component.View
    * @private
    */
    var columnView = BUI.Component.View.extend({

		/**
		* @protected
        * @ignore
		*/
		setTplContent : function(attrs){
			var _self = this,
				sortTpl = _self.get('sortTpl'),
                triggerTpl = _self.get('triggerTpl'),
				el = _self.get('el'),
                titleEl;

			columnView.superclass.setTplContent.call(_self,attrs);
            titleEl = el.find('.' + CLS_HD_TITLE);
			$(sortTpl).insertAfter(titleEl);
            $(triggerTpl).insertAfter(titleEl);

		},
        //use template to fill the column
        _setContent:function () {
           this.setTplContent();
        },
        _uiSetShowMenu : function(v){
            var _self = this,
                triggerTpl = _self.get('triggerTpl'),
                el = _self.get('el'),
                titleEl = el.find('.' + CLS_HD_TITLE);
            if(v){
                $(triggerTpl).insertAfter(titleEl);
            }else{
                el.find('.' + CLS_TRIGGER).remove();
            }   
        },
        //set the title of column
        _uiSetTitle:function (title) {
            if (!this.get('rendered')) {
                return;
            }
            this._setContent();
        },
        //set the draggable of column
        _uiSetDraggable:function (v) {
            if (!this.get('rendered')) {
                return;
            }
            this._setContent();
        },
        //set the sortableof column
        _uiSetSortable:function (v) {

            if (!this.get('rendered')) {
                return;
            }
            this._setContent();
        },
        //set the template of column
        _uiSetTpl:function (v) {
            if (!this.get('rendered')) {
                return;
            }
            this._setContent();
        },
        //set the sort state of column
        _uiSetSortState:function (v) {
            var _self = this,
                el = _self.get('el'),
                method = v ? 'addClass' : 'removeClass',
                ascCls = SORT_PREFIX + 'asc',
                desCls = SORT_PREFIX + 'desc';
            el.removeClass(ascCls + ' ' + desCls);
            if (v === 'ASC') {
                el.addClass(ascCls);
            } else if (v === 'DESC') {
                el.addClass(desCls);
            }
        },
        //展开表头
        _uiSetOpen : function (v) {
            var _self = this,
                el = _self.get('el');
            if(v){
                el.addClass(CLS_OPEN);
            }else{
                el.removeClass(CLS_OPEN);
            }
        }
    }, {
        ATTRS:{
            
            /**
             * @private
             */
            sortTpl : {
                view: true,
                getter: function(){
                    var _self = this,
                        sortable = _self.get('sortable');
                    if(sortable){
                        return '<span class="' + PREFIX + 'grid-sort-icon">&nbsp;</span>';
                    }
                    return '';
                }
            },
            tpl:{
            }
        }
    });

    /**
     * 表格的列对象，存储列信息，此对象不会由用户创建，而是配置在Grid中
     * xclass:'grid-column'
     * <pre><code>
     * columns = [{
     *        title : '表头1',
     *        dataIndex :'a',
     *        width:100
     *      },{
     *        title : '表头2',
     *        dataIndex :'b',
     *        visible : false, //隐藏
     *        width:200
     *      },{
     *        title : '表头3',
     *        dataIndex : 'c',
     *        width:200
     *    }];
     * </code></pre>
     * @class BUI.Grid.Column
     * @extends BUI.Component.Controller
     */
    var column = BUI.Component.Controller.extend(
        /**
         * @lends BUI.Grid.Column.prototype
         * @ignore
         */
        {    //toggle sort state of this column ,if no sort state set 'ASC',else toggle 'ASC' and 'DESC'
            _toggleSortState:function () {
                var _self = this,
                    sortState = _self.get('sortState'),
                    v = sortState ? (sortState === SORT_ASC ? SORT_DESC : SORT_ASC) : SORT_ASC;
                _self.set('sortState', v);
            },
            /**
             * {BUI.Component.Controller#performActionInternal}
             * @ignore
             */
            performActionInternal:function (ev) {
                var _self = this,
                    sender = $(ev.target),
                    prefix = _self.get('prefixCls');
                if (sender.hasClass(prefix + CLS_HD_TRIGGER)) {

                } else {
                    if (_self.get('sortable')) {
                        _self._toggleSortState();
                    }
                }
                //_self.fire('click',{domTarget:ev.target});
            },
            _uiSetWidth : function(v){
                if(v){
                    this.set('originWidth',v);
                }
            }
        }, {
            ATTRS:
            /*** 
            * @lends BUI.Grid.Column.prototype 
            * @ignore
            */
            {
                /**
                 * The tag name of the rendered column
                 * @private
                 */
                elTagName:{
                    value:'th'
                },
                /**
                 * 表头展开显示菜单，
                 * @type {Boolean}
                 * @protected
                 */
                open : {
                    view : true,
                    value : false
                },
                /**
                 * 此列对应显示数据的字段名称
                 * <pre><code>
                 * {
                 *     title : '表头1',
                 *     dataIndex :'a', //对应的数据的字段名称，如 ： {a:'123',b:'456'}
                 *     width:100
                 * }
                 * </code></pre>
                 * @cfg {String} dataIndex
                 */
                /**
                 * 此列对应显示数据的字段名称
                 * @type {String}
                 * @default {String} empty string
                 */
                dataIndex:{
                    view:true,
                    value:''
                },
                /**
                 * 是否可拖拽，暂时未支持
                 * @private
                 * @type {Boolean}
                 * @defalut true
                 */
                draggable:{
					sync:false,
                    view:true,
                    value:true
                },
                /**
                 * 编辑器,用于可编辑表格中<br>
                 * ** 常用编辑器 **
                 *  - xtype 指的是表单字段的类型 {@link BUI.Form.Field}
                 *  - 其他的配置项对应于表单字段的配置项
                 * <pre><code>
                 * columns = [
                 *   {title : '文本',dataIndex :'a',editor : {xtype : 'text'}}, 
                 *   {title : '数字', dataIndex :'b',editor : {xtype : 'number',rules : {required : true}}},
                 *   {title : '日期',dataIndex :'c', editor : {xtype : 'date'},renderer : Grid.Format.dateRenderer},
                 *   {title : '单选',dataIndex : 'd', editor : {xtype :'select',items : enumObj},renderer : Grid.Format.enumRenderer(enumObj)},
                 *   {title : '多选',dataIndex : 'e', editor : {xtype :'select',select:{multipleSelect : true},items : enumObj},
                 *       renderer : Grid.Format.multipleItemsRenderer(enumObj)
                 *   }
                 * ]
                 * </code></pre>
                 * @type {Object}
                 */
                editor:{

                },
                /**
                 * 是否可以获取焦点
                 * @protected
                 */
                focusable:{
                    value:false
                },
                /**
                 * 固定列,主要用于在首行显示一些特殊内容，如单选框，复选框，序号等。插件不能对此列进行特殊操作，如：移动位置，隐藏等
                 * @cfg {Boolean} fixed
                 */
                fixed : {
                    value : false
                },
                /**
                 * 控件的编号
                 * @cfg {String} id
                 */
                id:{

                },
                /**
                 * 渲染表格单元格的格式化函数
                 * "function(value,obj,index){return value;}"
                 * <pre><code>
                 * {title : '操作',renderer : function(){
                 *     return '<span class="grid-command btn-edit">编辑</span>'
                 *   }}
                 * </code></pre>
                 * @cfg {Function} renderer
                 */
                renderer:{

                },
                /**
                 * 是否可以调整宽度，应用于拖拽或者自适应宽度时
                 * @type {Boolean}
                 * @protected
                 * @default true
                 */
                resizable:{
                    value:true
                },
                /* 是否可以按照此列排序，如果设置true,那么点击列头时
                 * <pre><code>
                 *     {title : '数字', dataIndex :'b',sortable : false},
                 * </code></pre>
                 * @cfg {Boolean} [sortable=true]
                 */
                sortable:{
					sync:false,
                    view:true,
                    value:true
                },
                /**
                 * 排序状态，当前排序是按照升序、降序。有3种值 null, 'ASC','DESC'
                 * @type {String}
                 * @protected
                 * @default null
                 */
                sortState:{
                    view:true,
                    value:null
                },
                /**
                 * 列标题
                 * @cfg {String} [title=&#160;]
                 */
                /**
                 * 列标题
                 * <pre><code>
                 * var column = grid.findColumn('id');
                 * column.get('title');
                 * </code></pre>
                 * Note: to have a clickable header with no text displayed you can use the default of &#160; aka &nbsp;.
                 * @type {String}
                 * @default {String} &#160;
                 */
                title:{
					sync:false,
                    view:true,
                    value:'&#160;'
                },

                /**
                 * 列的宽度,可以使数字或者百分比,不要使用 width : '100'或者width : '100px'
                 * <pre><code>
                 *  {title : '文本',width:100,dataIndex :'a',editor : {xtype : 'text'}}
                 *  
                 *  {title : '文本',width:'10%',dataIndex :'a',editor : {xtype : 'text'}}
                 * </code></pre>
                 * @cfg {Number} [width = 80]
                 */
                
                /**
                 * 列宽度
                 * <pre><code>
                 *  grid.findColumn(id).set('width',200);
                 * </code></pre>
                 * 
                 * @type {Number}
                 */
                width:{
                    value:100
                },
                /**
                 * 是否显示菜单
                 * @cfg {Boolean} [showMenu=false]
                 */
                /**
                 * 是否显示菜单
                 * @type {Boolean}
                 * @default false
                 */
                showMenu:{
                    view:true,
                    value:false
                },
                /**
                 * @private
                 * @type {Object}
                 */
                triggerTpl:{
					view:true,
                    value:'<span class="' + CLS_TRIGGER + '"></span>'
                    
                },
                /**
                 * An template used to create the internal structure inside this Component's encapsulating Element.
                 * User can use the syntax of KISSY 's template component.
                 * Only in the configuration of the column can set this property.
                 * @type {String}
                 */
                tpl:{
					sync:false,
                    view:true,
                    value:'<div class="' + PREFIX + 'grid-hd-inner">' +
                        '<span class="' + CLS_HD_TITLE + '">{title}</span>' +
                        '</div>'
                },
                /**
                 * 单元格的模板，在列上设置单元格的模板，可以在渲染单元格时使用，更改单元格的内容
                 * @cfg {String} cellTpl
                 */
                /**
                 * 单元格的模板，在列上设置单元格的模板，可以在渲染单元格时使用，更改单元格的内容
                 * @type {String}
                 */
                cellTpl:{
                    value:''
                },
                /**
                 * the collection of column's events
                 * @protected
                 * @type {Array}
                 */
                events:{
                    value:{
                    /**
                     * @event
                     * Fires when this column's width changed
                     * @param {jQuery.Event} e the event object
                     * @param {BUI.Grid.Column} target
                     */
                        'afterWidthChange' : true,
                    /**
                     * @event
                     * Fires when this column's sort changed
                     * @param {jQuery.Event} e the event object
                     * @param {BUI.Grid.Column} e.target
                     */
                        'afterSortStateChange' : true,
                    /**
                     * @event
                     * Fires when this column's hide or show
                     * @param {jQuery.Event} e the event object
                     * @param {BUI.Grid.Column} e.target
                     */
                        'afterVisibleChange' : true,
                    /**
                     * @event
                     * Fires when use clicks the column
                     * @param {jQuery.Event} e the event object
                     * @param {BUI.Grid.Column} e.target
                     * @param {HTMLElement} domTarget the dom target of this event
                     */
                        'click' : true,
                    /**
                     * @event
                     * Fires after the component is resized.
                     * @param {BUI.Grid.Column} target
                     * @param {Number} adjWidth The box-adjusted width that was set
                     * @param {Number} adjHeight The box-adjusted height that was set
                     */
                        'resize' : true,
                    /**
                     * @event
                     * Fires after the component is moved.
                     * @param {jQuery.Event} e the event object
                     * @param {BUI.Grid.Column} e.target
                     * @param {Number} x The new x position
                     * @param {Number} y The new y position
                     */
                        'move' : true
                    }
                },
                /**
                 * @private
                 */
                xview:{
                    value:columnView
                }

            }
        }, {
            xclass:'grid-hd',
            priority:1
        });

    column.Empty = column.extend({

    }, {
        ATTRS:{
            type:{
                value:'empty'
            },
            sortable:{
                view:true,
                value:false
            },
            width:{
                view:true,
                value:null
            },
            tpl:{
                view:true,
                value:'<div class="' + PREFIX + 'grid-hd-inner"></div>'
            }
        }
    }, {
        xclass:'grid-hd-empty',
        priority:1
    });

    return column;

});
	

/**
 * @fileOverview 表格
 * @ignore
 * @author dxq613@gmail.com
 */

define('bui/grid/grid',['bui/common','bui/mask','bui/toolbar','bui/list','bui/grid/header','bui/grid/column'],function (require) {

  var BUI = require('bui/common'),
    Mask = require('bui/mask'),
    UA = BUI.UA,
    Component = BUI.Component,
    toolbar = require('bui/toolbar'),
    List = require('bui/list'),
    Header = require('bui/grid/header'),
    Column = require('bui/grid/column');

  function isPercent(str){
    if(BUI.isString(str)){
      return str.indexOf('%') !== -1;
    }
    return false;
  }

  var PREFIX = BUI.prefix,
    CLS_GRID_HEADER_CONTAINER = PREFIX + 'grid-header-container',
    CLS_GRID_BODY = PREFIX + 'grid-body',
    CLS_GRID_WITH = PREFIX + 'grid-width',
    CLS_GRID_HEIGHT = PREFIX + 'grid-height',
    CLS_GRID_BORDER = PREFIX + 'grid-border',
    CLS_GRID_TBAR = PREFIX + 'grid-tbar',
    CLS_GRID_BBAR = PREFIX + 'grid-bbar',
    CLS_BUTTON_BAR= PREFIX + 'grid-button-bar',
    CLS_GRID_STRIPE = PREFIX + 'grid-strip',
    CLS_GRID_ROW = PREFIX + 'grid-row',
    CLS_ROW_ODD = PREFIX + 'grid-row-odd',
    CLS_ROW_EVEN = PREFIX + 'grid-row-even',
    CLS_ROW_FIRST = PREFIX + 'grid-row-first',
    CLS_GRID_CELL = PREFIX + 'grid-cell',
    CLS_GRID_CELL_INNER = PREFIX + 'grid-cell-inner',
    CLS_TD_PREFIX = 'grid-td-',
    CLS_CELL_TEXT = PREFIX + 'grid-cell-text',
    CLS_CELL_EMPTY = PREFIX + 'grid-cell-empty',
    CLS_SCROLL_WITH = '17',
    CLS_HIDE = PREFIX + 'hidden',
    ATTR_COLUMN_FIELD = 'data-column-field',
    WIDTH_BORDER = 2,
    HEIGHT_BAR_PADDING = 1;  

  function getInnerWidth(width){
    var _self = this;
      if(BUI.isNumber(width)){
        width -= WIDTH_BORDER;
      }
      return width;
  }

  /**
   * @class BUI.Grid.GridView
   * @private
   * @extends BUI.List.SimpleListView
   * 表格的视图层
   */
  var gridView = List.SimpleListView.extend({

    //设置 body和table的标签
    renderUI : function(){
      var _self = this,
        el = _self.get('el'),
        bodyEl = el.find('.' + CLS_GRID_BODY);
      _self.set('bodyEl',bodyEl);
      _self._setTableTpl();
    },
    /**
     * 获取行模板
     * @ignore
     */
    getItemTpl : function  (record,index) {
      var _self = this,
        columns =  _self._getColumns(),
        tbodyEl = _self.get('tbodyEl'),
        rowTpl = _self.get('rowTpl'),
        oddCls = index % 2 === 0 ? CLS_ROW_ODD : CLS_ROW_EVEN,
        cellsTpl = [],
        rowEl;

      $.each(columns, function (index,column) {
        var dataIndex = column.get('dataIndex');
        cellsTpl.push(_self._getCellTpl(column, dataIndex, record));
      });

      if(_self.get('useEmptyCell')){
        cellsTpl.push(_self._getEmptyCellTpl());
      }

      rowTpl = BUI.substitute(rowTpl,{cellsTpl:cellsTpl.join(''), oddCls:oddCls});
      return rowTpl;
    },
    /**
     * find the dom by the record in this component
     * @param {Object} record the record used to find row dom
     * @return jQuery
     */
    findRow:function (record) {
        var _self = this;
        return $(_self.findElement(record));
    },
    /**
     * find the cell dom by record and column id
     * @param {String} id the column id
     * @param {jQuery} rowEl the dom that showed in this component
     * @return  {jQuery}
     */
    findCell : function(id,rowEl){
      var cls = CLS_TD_PREFIX + id;
        return rowEl.find('.' + cls);
    },
    /**
     * 重新创建表格的首行，一般在表格初始化完成后，或者列发生改变时
     */
    resetHeaderRow:function () {
      if(!this.get('useHeaderRow')){
        return;
      }
      var _self = this,
        headerRowEl = _self.get('headerRowEl'),
        tbodyEl = _self.get('tbodyEl');
      if(headerRowEl){
        headerRowEl.remove();
      }
      headerRowEl = _self._createHeaderRow();
      headerRowEl.prependTo(tbodyEl);
      _self.set('headerRowEl', headerRowEl);
    },
    /**
     * when header's column width changed, column in this component changed followed
     * @ignore
     */
    resetColumnsWidth:function (column,width) {
      var _self = this,
        headerRowEl = _self.get('headerRowEl'),
        cell = _self.findCell(column.get('id'), headerRowEl);
      width = width || column.get('width');
      if (cell) {
        cell.width(width);
      }
      _self.setTableWidth();
    },
    //set table width
    setTableWidth:function (columnsWidth) {
      if(!columnsWidth && isPercent(this.get('width'))){
        this.get('tableEl').width('100%');
        return;
      }
      var _self = this,
        width = _self._getInnerWidth(),
        height = _self.get('height'),
        tableEl = _self.get('tableEl'),
        forceFit = _self.get('forceFit'),
        headerRowEl = _self.get('headerRowEl');
      //使用百分比的宽度，不进行计算
      if(!isPercent(columnsWidth)){
        
        columnsWidth = columnsWidth || _self._getColumnsWidth();
        if (!width) {
          return;
        }
        if (width >= columnsWidth) {
          columnsWidth = width;
          if (height) {
            var scrollWidth = (UA.ie == 6 || UA.ie == 7) ? CLS_SCROLL_WITH + 2 : CLS_SCROLL_WITH;
            columnsWidth = width - scrollWidth;
          }
        }
      }
      
      tableEl.width(columnsWidth);
    },
    /**
     * 表格表体的宽度
     * @param {Number} width 宽度
     */
    setBodyWidth : function(width){
      var _self = this,
        bodyEl = _self.get('bodyEl');
      width = width || _self._getInnerWidth();
      bodyEl.width(width);

    },
    /**
     * 设置表体高度
     * @param {Number} height 高度
     */
    setBodyHeight : function(height){
      var _self = this,
        bodyEl = _self.get('bodyEl'),
        bodyHeight = height,
        siblings = bodyEl.siblings();

      BUI.each(siblings,function(item){
        if($(item).css('display') !== 'none'){
          bodyHeight -= $(item).outerHeight();
        }
      });
      bodyEl.height(bodyHeight);
    },
    //show or hide column
    setColumnVisible:function (column) {
      var _self = this,
        hide = !column.get('visible'),
        colId = column.get('id'),
        tbodyEl = _self.get('tbodyEl'),
        cells = $('.' + CLS_TD_PREFIX + colId,tbodyEl);
      if (hide) {
        cells.hide();
      } else {
        cells.show();
      }
    },
    /**
     * 更新数据
     * @param  {Object} record 更新的数据
     */
    updateItem : function(record){
      var _self = this, 
        items = _self.getItems(),
        index = BUI.Array.indexOf(record,items),
        columns = _self._getColumns(),
        element = null,
        tpl;
      if(index >=0 ){
        element = _self.findElement(record);

        BUI.each(columns,function(column){
          var cellEl = _self.findCell(column.get('id'),$(element)),
            innerEl = cellEl.find('.' + CLS_GRID_CELL_INNER),
            textTpl = _self._getCellText(column,record);
          innerEl.html(textTpl);
        });
        return element;
      }
    },
    /**
     * 显示没有数据时的提示信息
     */
    showEmptyText : function(){
      var _self = this,
        bodyEl = _self.get('bodyEl'),
        emptyDataTpl = _self.get('emptyDataTpl'),
        emptyEl = _self.get('emptyEl');
      if(emptyEl){
        emptyEl.remove();
      }
      var emptyEl = $(emptyDataTpl).appendTo(bodyEl);
      _self.set('emptyEl',emptyEl);
    },
    /**
     * 清除没有数据时的提示信息
     */
    clearEmptyText : function(){
       var _self = this,
        emptyEl = _self.get('emptyEl');
      if(emptyEl){
        emptyEl.remove();
      }
    },
    //设置第一行空白行，不显示任何数据，仅用于设置列的宽度
    _createHeaderRow:function () {
      var _self = this,
          columns = _self._getColumns(),
          tbodyEl = _self.get('tbodyEl'),
          rowTpl = _self.get('headerRowTpl'),
          rowEl,
          cellsTpl = [];

      $.each(columns, function (index,column) {
        cellsTpl.push(_self._getHeaderCellTpl(column));
      });

      //if this component set width,add a empty column to fit row width
      if(_self.get('useEmptyCell')){
        cellsTpl.push(_self._getEmptyCellTpl());
      }
      rowTpl = BUI.substitute(rowTpl,{cellsTpl:cellsTpl.join('')});
      rowEl = $(rowTpl).appendTo(tbodyEl);
      return rowEl;
    },
    //get the sum of the columns' width
    _getColumnsWidth:function () {
      var _self = this,
        columns = _self.get('columns'),
        totalWidth = 0;

      BUI.each(columns, function (column) {
          if (column.get('visible')) {
              totalWidth += column.get('el').outerWidth();
          }
      });
      return totalWidth;
    },
    //获取列集合
    _getColumns : function(){
      return this.get('columns');
    },
    //get cell text by record and column
    _getCellText:function (column, record) {
        var _self = this,
          dataIndex = column.get('dataIndex'),
          textTpl = column.get('cellTpl') || _self.get('cellTextTpl'),
          text = _self._getCellInnerText(column,dataIndex, record);
        return BUI.substitute(textTpl,{text:text, tips:_self._getTips(column, dataIndex, record)});
    },
    _getCellInnerText : function(column,dataIndex, record){
      //renderer 时发生错误可能性很高
      try{
        var _self = this,
          renderer = column.get('renderer'),
          text = renderer ? renderer(record[dataIndex], record) : record[dataIndex];
        return text == null ? '' : text;
      }catch(ex){
        throw 'column:' + column.get('title') +' fomat error!';
      }
    },
    //get cell template by config and record
    _getCellTpl:function (column, dataIndex, record) {
      var _self = this,
        cellText = _self._getCellText(column, record),
        cellTpl = _self.get('cellTpl');
      return BUI.substitute(cellTpl,{
        elCls : column.get('elCls'),
        id:column.get('id'),
        dataIndex:dataIndex,
        cellText:cellText,
        hideCls:!column.get('visible') ? CLS_HIDE : ''
      });
    },
    //获取空白单元格的模板
    _getEmptyCellTpl:function () {
      return '<td class="' + CLS_GRID_CELL + ' ' + CLS_CELL_EMPTY + '">&nbsp;</td>';
    },
    //获取空白行单元格模板
    _getHeaderCellTpl:function (column) {
      var _self = this,
        headerCellTpl = _self.get('headerCellTpl');
      return BUI.substitute(headerCellTpl,{
        id:column.get('id'),
        width:column.get('width'),
        hideCls:!column.get('visible') ? CLS_HIDE : ''
      });
    },
    //获取表格内宽度
    _getInnerWidth : function(){
      return getInnerWidth(this.get('width'));
    },
    //get cell tips
    _getTips:function (column, dataIndex, record) {
      var showTip = column.get('showTip'),
          value = '';
      if (showTip) {
        value = record[dataIndex];
        if (BUI.isFunction(showTip)) {
          value = showTip(value, record);
        }
      }
      return value;
    },
    //设置单元格边框
    _uiSetInnerBorder : function(v){
      var _self = this,
        el = _self.get('el');
      if(v){
        el.addClass(CLS_GRID_BORDER);
      }else{
        el.removeClass(CLS_GRID_BORDER);
      }
    },
    //设置表格模板
    _setTableTpl : function(tpl){
      var _self = this,
        bodyEl = _self.get('bodyEl');

      tpl = tpl || _self.get('tableTpl');
      $(tpl).appendTo(bodyEl);
      var tableEl = bodyEl.find('table'),
        tbodyEl = bodyEl.find('tbody');
        //headerRowEl = _self._createHeaderRow();
            
      _self.set('tableEl',tableEl);
      _self.set('tbodyEl',tbodyEl);
      //_self.set('headerRowEl', headerRowEl);
      _self.set('itemContainer',tbodyEl);
      _self._setTableCls(_self.get('tableCls'));
    },
    //设置table上的样式
    _uiSetTableCls : function(v){
      this._setTableCls(v);
    },
    //when set grid's height,the scroll can effect the width of its body and header
    _uiSetHeight:function (h) {
      var _self = this,
        bodyEl = _self.get('bodyEl');
      _self.get('el').height(h);
      _self.get('el').addClass(CLS_GRID_HEIGHT);

    },
    _uiSetWidth:function (w) {
      var _self = this;
      _self.get('el').width(w);
      _self.setBodyWidth(_self._getInnerWidth(w));
      _self.get('el').addClass(CLS_GRID_WITH);
      
    },
    _uiSetStripeRows : function(v){
      var _self = this,
        method = v ? 'addClass' : 'removeClass';
      _self.get('el')[method](CLS_GRID_STRIPE);
    },
    _setTableCls : function(cls){
      var _self = this,
        tableEl = _self.get('tableEl');
      tableEl.attr('class',cls);
    }
  },{
    ATTRS : {
      tableCls : {},
      bodyEl : {},
      tbodyEl : {},
      headerRowEl:{},
      tableEl : {},
      emptyEl : {}
    }
  },{
    xclass : 'grid-view'
  });

  /**
   * @class BUI.Grid.Grid
   *
   * 表格控件,表格控件类图，一般情况下配合{@link BUI.Data.Store} 一起使用
   * <p>
   * <img src="../assets/img/class-grid.jpg"/>
   * </p>
   * <p>表格插件的类图：</p>
   * <p>
   * <img src="../assets/img/class-grid-plugins.jpg"/>
   * </p>
   *
   * <pre><code>
   *  BUI.use(['bui/grid','bui/data'],function(Grid,Data){
   *    var Grid = Grid,
   *      Store = Data.Store,
   *      columns = [{  //声明列模型
   *          title : '表头1(20%)',
   *          dataIndex :'a',
   *          width:'20%'
   *        },{
   *          id: '123',
   *          title : '表头2(30%)',
   *          dataIndex :'b',
   *          width:'30%'
   *        },{
   *          title : '表头3(50%)',
   *          dataIndex : 'c',
   *          width:'50%'
   *      }],
   *      data = [{a:'123'},{a:'cdd',b:'edd'},{a:'1333',c:'eee',d:2}]; //显示的数据
   *
   *    var store = new Store({
   *        data : data,
   *        autoLoad:true
   *      }),
   *       grid = new Grid.Grid({
   *         render:'#grid',
   *         width:'100%',//这个属性一定要设置
   *         columns : columns,
   *         idField : 'a',
   *         store : store
   *       });
   *
   *     grid.render();
   *   });
   * </code></pre>
   * @extends BUI.List.SimpleList
   */
  var grid = List.SimpleList.extend({
    
    /**
     * 初始化，如果未设置宽度，则使用表格容器的宽度
     * @protected
     * @ignore
     */
    initializer : function(){
        var _self = this,
            render = _self.get('render'),
            width = _self.get('width');
        if(!width){
            _self.set('width',$(render).width());
        }
    },
    /**
     * @protected
     * @ignore
     */
    createDom:function () {
      var _self = this;

      // 提前,中途设置宽度时会失败！！
      if (_self.get('width')) {
          _self.get('el').addClass(CLS_GRID_WITH);
      }

      if (_self.get('height')) {
        _self.get('el').addClass(CLS_GRID_HEIGHT);
      }

      //因为内部的边距影响header的forceFit计算，所以必须在header计算forceFit前置此项
      if(_self.get('innerBorder')){
          _self.get('el').addClass(CLS_GRID_BORDER);
      } 
    },
    /**
     * @protected
     * @ignore
     */
    renderUI : function(){
      var _self = this;
      _self._initHeader();
      _self._initBars();
      _self._initLoadMask();
      _self.get('view').resetHeaderRow();
    },
    /**
     * @private
     */
    bindUI:function () {
      var _self = this;
      _self._bindHeaderEvent();
      _self._bindBodyEvent();
      _self._bindItemsEvent();
    },
    /**
     * 添加列
     * <pre><code>
     *   //添加到最后
     *   grid.addColumn({title : 'new column',dataIndex : 'new',width:100});
     *   //添加到最前
     *   grid.addColumn({title : 'new column',dataIndex : 'new',width:100},0);
     * </code></pre>
     * @param {Object|BUI.Grid.Column} column 列的配置，列类的定义 {@link BUI.Grid.Column}
     * @param {Number} index 添加到的位置
     * @return {BUI.Grid.Column}
     */
    addColumn : function(column, index){
      var _self = this,
        header = _self.get('header');

      if(header){
        column = header.addColumn(column, index);
      }else{
        column = new Column(column);
        _self.get('columns').splice(index,0,column);
      }  
      return column;
    },
    /**
     * 清除显示的数据
     * <pre><code>
     *   grid.clearData();
     * </code></pre>       
     */
    clearData : function(){
      this.clearItems();
    },
    /**
     * 当前显示在表格中的数据
     * @return {Array} 纪录集合
     * @private
     */
    getRecords : function(){
      return this.getItems();
    },
    /**
     * 使用索引或者id查找列
     * <pre><code>
     *  //设置列的id,否则会自动生成
     *  {id : '1',title : '表头',dataIndex : 'a'}
     *  //获取列
     *  var column = grid.findColumn('id');
     *  //操作列
     *  column.set('visible',false);
     * </code></pre>
     * @param {String|Number} id|index  文本值代表编号，数字代表索引
     */
    findColumn : function(id){
      var _self = this,
        header = _self.get('header');
      if(BUI.isNumber(id)){
        return header.getColumnByIndex(id);
      }else{
        return header.getColumnById(id);
      }
    },
    /**
     * 使用字段名查找列
     * <pre><code>
     * //设置列dataIndex
     *  {id : '1',title : '表头',dataIndex : 'a'}
     *  //获取列
     *  var column = grid.findColumnByField('a');
     *  //操作列
     *  column.set('visible',false);
     * </code></pre>
     * @param {String} field 列的字段名 dataIndex
     */
    findColumnByField : function(field){
      var _self = this,
        header = _self.get('header');
      return header.getColumn(function(column){
        return column.get('dataIndex') === field;
      });
    },
    /**
     * 根据列的Id查找对应的单元格
     * @param {String|Number} id 列id
     * @param {Object|jQuery} record 本行对应的记录，或者是本行的ＤＯＭ对象
     * @protected
     * @return  {jQuery}
     */
    findCell:function (id, record) {
        var _self = this,
            rowEl = null;
        if (record instanceof $) {
            rowEl = record;
        } else {
            rowEl = _self.findRow(record);
        }
        if (rowEl) {
            return _self.get('view').findCell(id, rowEl);
        }
        return null;
    },
    /**
     * find the dom by the record in this component
     * @param {Object} record the record used to find row dom
     * @protected
     * @return jQuery
     */
    findRow:function (record) {
        var _self = this;
        return _self.get('view').findRow(record);
    },
    /**
     * 移除列
     * <pre><code>
     *   var column = grid.findColumn('id');
     *   grid.removeColumn(column);
     * </code></pre>
     * @param {BUI.Grid.Column} column 要移除的列
     */
    removeColumn:function (column) {
      var _self = this;
        _self.get('header').removeColumn(column);
    },
    /**
     * 显示数据,当不使用store时，可以单独显示数据
     * <pre><code>
     *   var data = [{},{}];
     *   grid.showData(data);
     * </code></pre>
     * @param  {Array} data 显示的数据集合
     */
    showData : function(data){
      var _self = this;
      _self.set('items',data);
    },
    /**
     * 重置列，当列发生改变时同步DOM和数据
     * @protected
     */
    resetColumns:function () {
      var _self = this,
          store = _self.get('store');
      //recreate the header row
      _self.get('view').resetHeaderRow();
      //show data
      if (store) {
          _self.onLoad();
      }
    },
    //when body scrolled,the other component of grid also scrolled
    _bindScrollEvent:function () {
      var _self = this,
        el = _self.get('el'),
        bodyEl = el.find('.' + CLS_GRID_BODY),
        header = _self.get('header');

      bodyEl.on('scroll', function () {
        var left = bodyEl.scrollLeft(),
            top = bodyEl.scrollTop();
        header.scrollTo({left:left, top:top});
        _self.fire('scroll', {scrollLeft:left, scrollTop:top,bodyWidth : bodyEl.width(),bodyHeight : bodyEl.height()});
      });
    },
    //bind header event,when column changed,followed this component
    _bindHeaderEvent:function () {
        var _self = this,
          header = _self.get('header'),
          view = _self.get('view'),
          store = _self.get('store');
        header.on('afterWidthChange', function (e) {
          var sender = e.target;
          if (sender !== header) {
              view.resetColumnsWidth(sender);
          }
        });

        header.on('afterSortStateChange', function (e) {
          var column = e.target,
              val = e.newVal;
          if (val && store) {
            store.sort(column.get('dataIndex'), column.get('sortState'));
          }
        });

        header.on('afterVisibleChange', function (e) {
          var sender = e.target;
          if (sender !== header) {
            view.setColumnVisible(sender);
            _self.fire('columnvisiblechange',{column:sender});
          }
        });

        header.on('click', function (e) {
          var sender = e.target;
          if (sender !== header) {
            _self.fire('columnclick',{column:sender,domTarget:e.domTarget});
          }
        });

        header.on('forceFitWidth', function () {
          if (_self.get('rendered')) {
              _self.resetColumns();
          }
        });

        header.on('add', function (e) {
          if (_self.get('rendered')) {
            _self.fire('columnadd',{column:e.column,index:e.index});
              _self.resetColumns();
          }
        });

        header.on('remove', function (e) {
          if (_self.get('rendered')) {
            _self.resetColumns();
            _self.fire('columnremoved',{column:e.column,index:e.index});
          }
        });

    },
    //when body scrolled, header can followed
    _bindBodyEvent:function () {
      var _self = this;
      _self._bindScrollEvent();       
    },
    //绑定记录DOM相关的事件
    _bindItemsEvent : function(){
      var _self = this,
        store = _self.get('store');

      _self.on('itemsshow',function(){
        _self.fire('aftershow');

        if(_self.get('emptyDataTpl')){
          if(store && store.getCount() == 0){
            _self.get('view').showEmptyText();
          }else{
            _self.get('view').clearEmptyText();
          }
        }
      });

      _self.on('itemsclear',function(){
        _self.fire('clear');
      });

      _self.on('itemclick',function(ev){
        var target = ev.domTarget,
          record = ev.item,
          cell = $(target).closest('.' + CLS_GRID_CELL),
          rowEl = $(target).closest('.' + CLS_GRID_ROW),
          rst; //用于是否阻止事件触发

        if(cell.length){
          rst = _self.fire('cellclick', {record:record, row:rowEl[0], cell:cell[0], field:cell.attr(ATTR_COLUMN_FIELD), domTarget:target,domEvent:ev.domEvent});
        }

        if(rst === false){
          return rst;
        }

        return _self.fire('rowclick', {record:record, row:rowEl[0], domTarget:target});
          
      });

      _self.on('itemunselected',function(ev){
        _self.fire('rowunselected',getEventObj(ev));
      });

      _self.on('itemselected',function(ev){
        _self.fire('rowselected',getEventObj(ev));
      });

      _self.on('itemrendered',function(ev){
        _self.fire('rowcreated',getEventObj(ev));
      });
      
      _self.on('itemremoved',function(ev){
        _self.fire('rowremoved',getEventObj(ev));
      });

      _self.on('itemupdated',function(ev){
        _self.fire('rowupdated',getEventObj(ev));
      });

      function getEventObj(ev){
        return {record : ev.item, row : ev.domTarget, domTarget : ev.domTarget};
      }
    },
    //获取表格内部的宽度，受边框的影响，
    //内部的宽度不能等于表格宽度
    _getInnerWidth : function(width){
      width = width || this.get('width');
      return getInnerWidth(width);
    },
    //init header,if there is not a header property in config,instance it
    _initHeader:function () {
      var _self = this,
        header = _self.get('header'),
        container = _self.get('el').find('.'+ CLS_GRID_HEADER_CONTAINER);
      if (!header) {
        header = new Header({
          columns:_self.get('columns'),
          tableCls:_self.get('tableCls'),
          forceFit:_self.get('forceFit'),
          width:_self._getInnerWidth(),
          render: container,
          parent : _self
        }).render();
        //_self.addChild(header);
        _self.set('header', header);
      }
    },
    //初始化 上下工具栏
    _initBars:function () {
      var _self = this,
          bbar = _self.get('bbar'),
          tbar = _self.get('tbar');
      _self._initBar(bbar, CLS_GRID_BBAR, 'bbar');
      _self._initBar(tbar, CLS_GRID_TBAR, 'tbar');
    },
    //set bar's elCls to identify top bar or bottom bar
    _initBar:function (bar, cls, name) {
      var _self = this,
        store = null,
        pagingBarCfg = null;
      if (bar) {
        //未指定xclass,同时不是Controller时
        if(!bar.xclass && !(bar instanceof Component.Controller)){
          bar.xclass = 'bar';
          bar.children = bar.children || [];

          if(bar.items){
            bar.children.push({
                xclass : 'bar',
                defaultChildClass : "bar-item-button",
                elCls : CLS_BUTTON_BAR,
                children : bar.items
            });
            bar.items=null;
          }

          // modify by fuzheng
          if(bar.pagingBar){
            store = _self.get('store');
            pagingBarCfg = {
              xclass : 'pagingbar',
              store : store,
              pageSize : store.pageSize
            };
            if(bar.pagingBar !== true){
              pagingBarCfg = S.merge(pagingBarCfg, bar.pagingBar);
            }
            bar.children.push(pagingBarCfg);
          }
        }
        if (bar.xclass) {
          var barContainer = _self.get('el').find('.' + cls);
          barContainer.show();
          bar.render = barContainer;
          //bar.parent=_self;
          bar.elTagName = 'div';
          bar.autoRender = true;
          bar = _self.addChild(bar); //Component.create(bar).create();
        }
        _self.set(name, bar);
      }
      return bar;
    },
    //when set 'loadMask = true' ,create a loadMask instance
    _initLoadMask:function () {
      var _self = this,
        loadMask = _self.get('loadMask');
      if (loadMask && !loadMask.show) {
        loadMask = new BUI.Mask.LoadMask({el:_self.get('el')});
        _self.set('loadMask', loadMask);
      }
    },
    //调整宽度时，调整内部控件宽度
    _uiSetWidth:function (w) {
      var _self = this;
      if (_self.get('rendered')) {
        if(!isPercent(w)){
          _self.get('header').set('width', _self._getInnerWidth(w));
        }else{
          _self.get('header').set('width','100%');
        }
        
      }
      _self.get('view').setTableWidth();
    },
    //设置自适应宽度
    _uiSetForceFit:function (v) {
      var _self = this;
      _self.get('header').set('forceFit', v);
    },
    //when set grid's height,the scroll can effect the width of its body and header
    _uiSetHeight:function (h,obj) {
      var _self = this,
        header = _self.get('header');
      _self.get('view').setBodyHeight(h);
      if (_self.get('rendered')) {
        if (_self.get('forceFit') && !obj.prevVal) {
          header.forceFitColumns();
          //强迫对齐时，由未设置高度改成设置高度，增加了17像素的滚动条宽度，所以重置表格宽度
          _self.get('view').setTableWidth();
        }
        header.setTableWidth();
      }
      
    }
  },{
    ATTRS : {
      /**
       * 表头对象
       * @type {BUI.Grid.Header}
       * @protected
       */
      header:{

      },
      /**
       * @see {BUI.Grid.Grid#tbar}
       * <pre><code>
       * grid = new Grid.Grid({
       *    render:'#grid',
       *    columns : columns,
       *    width : 700,
       *    forceFit : true,
       *    tbar:{ //添加、删除
       *        items : [{
       *          btnCls : 'button button-small',
       *          text : '<i class="icon-plus"></i>添加',
       *          listeners : {
       *            'click' : addFunction
       *          }
       *        },
       *        {
       *          btnCls : 'button button-small',
       *          text : '<i class="icon-remove"></i>删除',
       *          listeners : {
       *            'click' : delFunction
       *          }
       *        }]
       *    },
       *    store : store
       *  });
       *
       * grid.render();
       * </code></pre>
       * @cfg {Object|BUI.Toolbar.Bar} bbar
       */
      /**
       * @see {BUI.Grid.Grid#tbar}
       * @type {Object}
       * @ignore
       */
      bbar:{

      },
      itemCls : {
        value : CLS_GRID_ROW
      },
      /**
       * 列的配置 用来配置 表头 和 表内容。{@link BUI.Grid.Column}
       * @cfg {Array} columns
       */
      columns:{
        view : true,
        value:[]
      },
      /**
       * 强迫列自适应宽度，如果列宽度大于Grid整体宽度，等比例缩减，否则等比例增加
       * <pre><code>
       *  var grid = new Grid.Grid({
       *    render:'#grid',
       *    columns : columns,
       *    width : 700,
       *    forceFit : true, //自适应宽度
       *    store : store
       *  });
       * </code></pre>
       * @cfg {Boolean} [forceFit= false]
       */
      /**
       * 强迫列自适应宽度，如果列宽度大于Grid整体宽度，等比例缩减，否则等比例增加
       * <pre><code>
       *  grid.set('forceFit',true);
       * </code></pre>
       * @type {Boolean}
       * @default 'false'
       */
      forceFit:{
        sync:false,
        value:false
      },
      /**
       * 数据为空时，显示的提示内容
       * <pre><code>
       *  var grid = new Grid({
       *   render:'#J_Grid4',
       *   columns : columns,
       *   store : store,
       *   emptyDataTpl : '&lt;div class="centered"&gt;&lt;img alt="Crying" src="http://img03.taobaocdn.com/tps/i3/T1amCdXhXqXXXXXXXX-60-67.png"&gt;&lt;h2&gt;查询的数据不存在&lt;/h2&gt;&lt;/div&gt;',
       *   width:'100%'
       *
       * });
       * 
       * grid.render();
       * </code></pre>
       ** @cfg {Object} emptyDataTpl
       */
      emptyDataTpl : {
        view : true
      },
      /**
       * 表格首行记录模板，首行记录，隐藏显示，用于确定表格各列的宽度
       * @type {String}
       * @protected
       */
      headerRowTpl:{
        view:true,
        value:'<tr class="' + PREFIX + 'grid-header-row">{cellsTpl}</tr>'
      },
      /**
       * 表格首行记录的单元格模板
       * @protected
       * @type {String}
       */
      headerCellTpl:{
        view:true,
        value:'<td class="{hideCls} ' + CLS_TD_PREFIX + '{id}" width="{width}" style="height:0"></td>'
      },
      /**
       * 表格数据行的模板
       * @type {String}
       * @default  <pre>'&lt;tr class="' + CLS_GRID_ROW + ' {{oddCls}}"&gt;{{cellsTpl}}&lt;/tr&gt;'</pre>
       */
      rowTpl:{
        view:true,
        value:'<tr class="' + CLS_GRID_ROW + ' {oddCls}">{cellsTpl}</tr>'
      },
      /**
       * 单元格的模板
       * @type {String}
       * <pre>
       *     '&lt;td  class="' + CLS_GRID_CELL + ' grid-td-{{id}}" data-column-id="{{id}}" data-column-field = {{dataIndex}}&gt;'+
       *        '&lt;div class="' + CLS_GRID_CELL_INNER + '" &gt;{{cellText}}&lt;/div&gt;'+
       *    '&lt;/td&gt;'
       *</pre>
       */
      cellTpl:{
        view:true,
        value:'<td  class="{elCls} {hideCls} ' + CLS_GRID_CELL + ' ' + CLS_TD_PREFIX + '{id}" data-column-id="{id}" data-column-field = "{dataIndex}" >' +
            '<div class="' + CLS_GRID_CELL_INNER + '" >{cellText}</div>' +
            '</td>'

      },
      /**
       * 单元格文本的模板
       * @default &lt;span class="' + CLS_CELL_TEXT + ' " title = "{{tips}}"&gt;{{text}}&lt;/span&gt;
       * @type {String}
       */
      cellTextTpl:{
        view:true,
        value:'<span class="' + CLS_CELL_TEXT + ' " title = "{tips}">{text}</span>'
      },
      /**
       * 事件集合
       * @type {Object}
       */
      events:{
        value:{
          /**
           * 显示完数据触发
           * @event
           */
          'aftershow' : false,
           /**
           * 表格的数据清理完成后
           * @event
           */
          'clear' : false,
          /**
           * 点击单元格时触发,如果return false,则会阻止 'rowclick' ,'rowselected','rowunselected'事件
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {String} e.field 点击单元格列对应的字段名称
           * @param {HTMLElement} e.row 点击行对应的DOM
           * @param {HTMLElement} e.cell 点击对应的单元格的DOM
           * @param {HTMLElement} e.domTarget 点击的DOM
           * @param {jQuery.Event} e.domEvent 点击的jQuery事件
           */
          'cellclick' : false,
          /**
           * 点击表头
           * @event 
           * @param {jQuery.Event} e 事件对象
           * @param {BUI.Grid.Column} e.column 列对象
           * @param {HTMLElement} e.domTarget 点击的DOM
           */
          'columnclick' : false,
          /**
           * 点击行时触发，如果return false,则会阻止'rowselected','rowunselected'事件
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 点击行对应的DOM
           * @param {HTMLElement} e.domTarget 点击的DOM
           */
          'rowclick' : false,
          /**
           * 当一行数据显示在表格中后触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowcreated' : false,
          /**
           * 移除一行的DOM后触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowremoved' : false,
          /**
           * 选中一行时触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowselected' : false,
          /**
           * 清除选中一行时触发，只有多选情况下触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowunselected' : false,
          /**
           * 表格内部发生滚动时触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Number} e.scrollLeft 滚动到的横坐标
           * @param {Number} e.scrollTop 滚动到的纵坐标
           * @param {Number} e.bodyWidth 表格内部的宽度
           * @param {Number} e.bodyHeight 表格内部的高度
           */
          'scroll' : false
        }
      },
      /**
       * 是否奇偶行添加分割色
       * @type {Boolean}
       * @default true
       */
      stripeRows:{
        view:true,
        value:true
      },
      /**
       * 顶层的工具栏，跟bbar结构一致,可以是工具栏对象@see {BUI.Toolbar.Bar},也可以是xclass形式的配置项，
       * 还可以是包含以下字段的配置项
       * <ol>
       * <li>items:工具栏的项，
       *    - 默认是按钮(xtype : button)、
       *    - 文本(xtype : text)、
       *    - 链接(xtype : link)、
       *    - 分隔符(bar-item-separator)以及自定义项
       * </li>
       * <li>pagingBar:表明包含分页栏</li>
       * </ol>
       * @type {Object|BUI.Toolbar.Bar}
       * @example
       * tbar:{
       *     items:[
       *         {
       *             text:'命令一' //默认是按钮
       *             
       *         },
       *         {
       *             xtype:'text',
       *             text:'文本'
       *         }
       *     ],
       *     pagingBar:true
       * }
       */
      tbar:{

      },
      /**
       * 可以附加到表格上的样式.
       * @cfg {String} tableCls
       * @default 'bui-grid-table' this css cannot be overridden
       */
      tableCls:{
        view : true,
        sync : false,
        value:PREFIX + 'grid-table'
      },
      /**
       * 表体的模板
       * @protected
       * @type {String}
       */
      tableTpl : {
        view:true,
        value:'<table cellspacing="0" cellpadding="0" >' +
            '<tbody></tbody>' +
            '</table>'
      },
      tpl : {
        value : '<div class="'+CLS_GRID_TBAR+'" style="display:none"></div><div class="'+CLS_GRID_HEADER_CONTAINER+'"></div><div class="'+CLS_GRID_BODY+'"></div><div style="display:none" class="' + CLS_GRID_BBAR + '"></div>'
      },
      /**
       * 单元格左右之间是否出现边框
       * 
       * @cfg {Boolean} [innerBorder=true]
       */
      /**
       * 单元格左右之间是否出现边框
       * <pre><code>
       *   var  grid = new Grid.Grid({
       *     render:'#grid',
       *     innerBorder: false, // 默认为true
       *     columns : columns,
       *     store : store
       *   });
       * </code></pre>
       * @type {Boolean}
       * @default true
       */
      innerBorder : {
        sync:false,
        value : true
      },
      /**
       * 是否使用空白单元格用于占位，使列宽等于设置的宽度
       * @type {Boolean}
       * @private
       */
      useEmptyCell : {
        view : true,
        value : true
      },
      /**
       * 是否首行使用空白行，用以确定表格列的宽度
       * @type {Boolean}
       * @private
       */
      useHeaderRow : {
        view : true,
        value : true
      },
      /**
       * Grid 的视图类型
       * @type {BUI.Grid.GridView}
       */
      xview : {
        value : gridView
      }
    }
  },{
    xclass : 'grid'
  });

  return grid;
});

/**
 * @ignore
 * 2013.1.18 
 *   这是一个重构的版本，将Body取消掉了，目的是为了可以将Grid和SimpleGrid联系起来，
 *   同时将selection 统一         
 */
/**
 * @fileOverview 表格的头部
 * @author dxq613@gmail.com, yiminghe@gmail.com
 * @ignore
 */

define('bui/grid/header',['bui/common','bui/grid/column'],function(require) {

  var BUI = require('bui/common'),
    PREFIX = BUI.prefix,
    Grid = BUI.namespace('Grid'),
    Column = require('bui/grid/column'),
    View = BUI.Component.View,
    Controller = BUI.Component.Controller,
    CLS_SCROLL_WITH = 17,
	  UA = BUI.UA;

  /**
  * 表格控件中表头的视图类
  * @class BUI.Grid.HeaderView
  * @extends BUI.Component.View
  * @private
  */
  var headerView = View.extend({

    /**
     * @see {Component.Render#getContentElement}
     * @ignore
     */
    getContentElement:function () {
      return this.get('el').find('tr');
    },
    scrollTo:function (obj) {
      var _self = this,
          el = _self.get('el');
      if (obj.top !== undefined) {
          el.scrollTop(obj.top);
      }
      if (obj.left !== undefined) {
          el.scrollLeft(obj.left);
      }
    },
    _uiSetTableCls : function(v){
      var _self = this,
        tableEl = _self.get('el').find('table');
      tableEl.attr('class',v);
    }
  }, {
    ATTRS:{
      emptyCellEl:{},
      tableCls : {

      }
    }
  },{
    xclass : 'header-view'
  });
  /**
   * Container which holds headers and is docked at the top or bottom of a Grid.
   * The HeaderContainer drives resizing/moving/hiding of columns within the GridView.
   * As headers are hidden, moved or resized,
   * the header container is responsible for triggering changes within the view.
   * If you are not in the writing plugins, don't direct manipulation this control.
   * @class BUI.Grid.Header
   * @protected
   * xclass:'grid-header'
   * @extends BUI.Component.Controller
   */
  var header = Controller.extend(
    /**
     * @lends BUI.Grid.Header.prototype
     * @ignore
     */
    {
      /**
       * add a columns to header
       * @param {Object|BUI.Grid.Column} c The column object or column config.
       * @index {Number} index The position of the column in a header,0 based.
       */
      addColumn:function (c, index) {
        var _self = this,
          insertIndex = 0,
          columns = _self.get('columns');
        c = _self._createColumn(c);
        if (index === undefined) {
          index = columns.length;
          insertIndex = _self.get('children').length - 1;
        }
        columns.splice(index, 0, c);
        _self.addChild(c, insertIndex);
        _self.fire('add', {column:c, index:index});
        return c;
      },
      /**
       * remove a columns from header
       * @param {BUI.Grid.Column|Number} c is The column object or The position of the column in a header,0 based.
       */
      removeColumn:function (c) {
        var _self = this,
            columns = _self.get('columns'),
            index;
        c = BUI.isNumber(c) ? columns[c] : c;
        index = BUI.Array.indexOf(c, columns);
        columns.splice(index, 1);
        _self.fire('remove', {column:c, index:index});
        return _self.removeChild(c, true);
      },
      /**
       * For overridden.
       * @see Component.Controller#bindUI
       */
      bindUI:function () {
        var _self = this;
        _self._bindColumnsEvent();
      },
      /*
       * For overridden.
       * @protected
       *
       */
      initializer:function () {
        var _self = this,
            children = _self.get('children'),
            columns = _self.get('columns'),
            emptyColumn = _self._createEmptyColumn();
        $.each(columns, function (index,item) {
            var columnControl = _self._createColumn(item);
            children[index] = columnControl;
            columns[index] = columnControl;
        });
        children.push(emptyColumn);
        _self.set('emptyColumn',emptyColumn);
      },
      /**
       * get the columns of this header,the result equals the 'children' property .
       * @return {Array} columns
       * @example var columns = header.getColumns();
       *    <br>or</br>
       * var columns = header.get('children');
       */
      getColumns:function () {
        return this.get('columns');
      },
      /**
       * Obtain the sum of the width of all columns
       * @return {Number}
       */
      getColumnsWidth:function () {
        var _self = this,
          columns = _self.getColumns(),
          totalWidth = 0;

        $.each(columns, function (index,column) {
          if (column.get('visible')) {
            totalWidth += column.get('el').outerWidth();//column.get('width')
          }
        });
        return totalWidth;
      },
      getColumnOriginWidth : function(){
        var _self = this,
          columns = _self.getColumns(),
          totalWidth = 0;

        $.each(columns, function (index,column) {
          if (column.get('visible')) {
            var width = column.get('originWidth') || column.get('width');
            totalWidth += width;
          }
        });
        return totalWidth;
      },
      /**
       * get {@link BUI.Grid.Column} instance by index,when column moved ,the index changed.
       * @param {Number} index The index of columns
       * @return {BUI.Grid.Column} the column in the header,if the index outof the range,the result is null
       */
      getColumnByIndex:function (index) {
        var _self = this,
          columns = _self.getColumns(),
          result = columns[index];
        return result;
      },
      /**
       * 查找列
       * @param  {Function} func 匹配函数，function(column){}
       * @return {BUI.Grid.Column}  查找到的列
       */
      getColumn:function (func) {
        var _self = this,
          columns = _self.getColumns(),
          result = null;
        $.each(columns, function (index,column) {
          if (func(column)) {
              result = column;
              return false;
          }
        });
        return result;
      },
      /**
       * get {@link BUI.Grid.Column} instance by id,when column rendered ,this id can't to be changed
       * @param {String|Number}id The id of columns
       * @return {BUI.Grid.Column} the column in the header,if the index out of the range,the result is null
       */
      getColumnById:function (id) {
        var _self = this;
        return _self.getColumn(function(column){
          return column.get('id') === id;
        });
      },
      /**
       * get {@link BUI.Grid.Column} instance's index,when column moved ,the index changed.
       * @param {BUI.Grid.Column} column The instance of column
       * @return {Number} the index of column in the header,if the column not in the header,the index is -1
       */
      getColumnIndex:function (column) {
        var _self = this,
            columns = _self.getColumns();
        return BUI.Array.indexOf(column, columns);
      },
      /**
       * move the header followed by body's or document's scrolling
       * @param {Object} obj the scroll object which has two value:top(scrollTop),left(scrollLeft)
       */
      scrollTo:function (obj) {
        this.get('view').scrollTo(obj);
      },
      //when column's event fire ,this header must handle them.
      _bindColumnsEvent:function () {
        var _self = this;

        _self.on('afterWidthChange', function (e) {
          var sender = e.target;
          if (sender !== _self) {
              _self.setTableWidth();
          }
        });
        _self.on('afterVisibleChange', function (e) {
          var sender = e.target;
          if (sender !== _self) {
              _self.setTableWidth();
          }
        });
        _self.on('afterSortStateChange', function (e) {
          var sender = e.target,
            columns = _self.getColumns(),
            val = e.newVal;
          if (val) {
            $.each(columns, function (index,column) {
                if (column !== sender) {
                    column.set('sortState', '');
                }
            });
          }
        });

        _self.on('add',function(){
          _self.setTableWidth();
        });
        _self.on('remove',function(){
          _self.setTableWidth();
        });
      },
      //create the column control
      _createColumn:function (cfg) {
        if (cfg instanceof Column) {
          return cfg;
        }
        if (!cfg.id) {
          cfg.id = BUI.guid('col');
        }
        return new Column(cfg);
      },
      _createEmptyColumn:function () {
        return new Column.Empty();
      },
      //when set grid's height, scroll bar emerged.
      _isAllowScrollLeft:function () {
        var _self = this,
          parent = _self.get('parent');

        return parent && !!parent.get('height');
      },
      /**
       * force every column fit the table's width
       */
      forceFitColumns:function () {
          
        var _self = this,
          columns = _self.getColumns(),
          width = _self.get('width'),
          totalWidth = width,
          totalColumnsWidth = _self.getColumnOriginWidth(),
					realWidth = 0,
					appendWidth = 0,
					lastShowColumn = null,
          allowScroll = _self._isAllowScrollLeft();

				/**
				* @private
				*/
				function setColoumnWidthSilent(column,colWidth){
					var columnEl = column.get('el');
					column.set('width',colWidth , {
						silent:1
					});
					columnEl.width(colWidth);
				}
        //if there is not a width config of grid ,The forceFit action can't work
        if (width) {
          if (allowScroll) {
            width -= CLS_SCROLL_WITH;
            totalWidth = width;
          }

          var adjustCount = 0;

          $.each(columns, function (index,column) {
            if (column.get('visible') && column.get('resizable')) {
              adjustCount++;
            }
            if (column.get('visible') && !column.get('resizable')) {
              var colWidth = column.get('el').outerWidth();
              totalWidth -= colWidth;
              totalColumnsWidth -= colWidth;
            }
          });

          var colWidth = Math.floor(totalWidth / adjustCount),
              ratio = totalWidth / totalColumnsWidth;
          if(ratio ===1){
            return;
          }
          $.each(columns, function (index,column) {
            if (column.get('visible') && column.get('resizable')) {

              var borderWidth = _self._getColumnBorderWith(column,index),
                  originWidth = column.get('originWidth');
              if(!originWidth){
                  column.set('originWidth',column.get('width'));
                  originWidth = column.get('width');
              }
              colWidth = Math.floor((originWidth + borderWidth) * ratio);
                 /* parseInt(columnEl.css('border-left-width')) || 0 +
                      parseInt(columnEl.css('border-right-width')) || 0;*/
              // ！ note
              //
              // 会再调用 setTableWidth， 循环调用 || 
              setColoumnWidthSilent(column,colWidth - borderWidth);
							realWidth += colWidth;
							lastShowColumn = column;
            }
          });

					if(lastShowColumn){
						appendWidth = totalWidth - realWidth;
						setColoumnWidthSilent(lastShowColumn,lastShowColumn.get('width') + appendWidth);
					}

          _self.fire('forceFitWidth');
        }

      },
      _getColumnBorderWith : function(column,index){
        //chrome 下border-left-width取的值不小数，所以暂时使用固定边框
        //第一个边框无宽度，ie 下仍然存在Bug，所以做ie 的兼容
        var columnEl = column.get('el'),
          borderWidth = Math.round(parseFloat(columnEl.css('border-left-width')) || 0)  + 
               Math.round(parseFloat(columnEl.css('border-right-width')) || 0);
        
        borderWidth = UA.ie && UA.ie < 8 ? (index === 0 ? 1 : borderWidth) : borderWidth;
        return borderWidth;                   
      },
      /**
       * set the header's inner table's width
       */
      setTableWidth:function () {
        var _self = this,
          width = _self.get('width'),
          totalWidth = 0,
          emptyColumn = null;
        if(width == 'auto'){
          //_self.get('el').find('table').width()
          return;
        }
        if (_self.get('forceFit')) {
          _self.forceFitColumns();
        }else if(_self._isAllowScrollLeft()){
          totalWidth = _self.getColumnsWidth();
          emptyColumn = _self.get('emptyColumn');
          if(width < totalWidth){
              emptyColumn.get('el').width(CLS_SCROLL_WITH);
          }else{
              emptyColumn.get('el').width('auto');
          }
        }
      },
      //when header's width changed, it also effects its columns.
      _uiSetWidth:function () {
        var _self = this;
        _self.setTableWidth();
      },
      _uiSetForceFit:function (v) {
        var _self = this;
        if (v) {
          _self.setTableWidth();
        }
      }

    }, {
      ATTRS:
      /** 
      * @lends BUI.Grid.Header.prototype
      * @ignore
      * */
      {
        /**
         * 列集合
         * @type {Array}
         */
        columns:{
            value:[]
        },
        /**
         * @private
         */
        emptyColumn:{

        },
        /**
         * 是否可以获取焦点
         * @protected
         */
        focusable:{
            value:false
        },
        /**
         * true to force the columns to fit into the available width. Headers are first sized according to configuration, whether that be a specific width, or flex.
         * Then they are all proportionally changed in width so that the entire content width is used.
         * @type {Boolean}
         * @default 'false'
         */
        forceFit:{
            sync:false,
            view:true,
            value:false
        },
        /**
         * 表头的模版
         * @type {String}
         */
        tpl : {

          view : true,
          value : '<table cellspacing="0" class="' + PREFIX + 'grid-table" cellpadding="0">' +
          '<thead><tr></tr></thead>' +
          '</table>'
        },
        /**
         * 表格应用的样式.
         */
        tableCls:{
            view:true
        },
        /**
         * @private
         */
        xview:{
            value:headerView
        },
        /**
         * the collection of header's events
         * @type {Array}
         * @protected
         */
        events:{
          value:{
          /**
           * @event
           * 添加列时触发
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.column which column added
           * @param {Number} index the add column's index in this header
           *
           */
              'add' : false,
          /**
           * @event
           * 移除列时触发
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.column which column removed
           * @param {Number} index the removed column's index in this header
           */
              'remove' : false
          }
        } 
      }
    }, {
      xclass:'grid-header',
      priority:1
    });
  
  return header;
});
/**
 * @fileOverview 简单表格,仅用于展示数据
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/grid/simplegrid',['bui/common','bui/list'],function(require) {
  
  var BUI = require('bui/common'),
    List = require('bui/list'),
    Component = BUI.Component,
    UIBase = Component.UIBase,
    PREFIX = BUI.prefix,
    CLS_GRID = PREFIX + 'grid',
    CLS_GRID_ROW = CLS_GRID + '-row',
    CLS_ROW_ODD = PREFIX + 'grid-row-odd',
    CLS_ROW_EVEN = PREFIX + 'grid-row-even',
    CLS_GRID_BORDER = PREFIX + 'grid-border',
    CLS_ROW_FIRST = PREFIX + 'grid-row-first';


  /**
   * 简单表格的视图类
   * @class BUI.Grid.SimpleGridView
   * @extends BUI.List.SimpleListView
   * @private
   */
  var simpleGridView = List.SimpleListView.extend({
    /**
     * 设置列
     * @internal 
     * @param {Array} columns 列集合
     */
    setColumns : function(columns){
      var _self = this,
        headerRowEl = _self.get('headerRowEl');

      columns = columns || _self.get('columns');
      //清空表头
      headerRowEl.empty();

      BUI.each(columns,function(column){
        _self._createColumn(column,headerRowEl);
      });
    },
    //创建列
    _createColumn : function(column,parent){
      var _self = this,
        columnTpl = BUI.substitute(_self.get('columnTpl'),column);
      $(columnTpl).appendTo(parent);
    },
    /**
     * 获取行模板
     * @ignore
     */
    getItemTpl : function  (record,index) {
      var _self = this,
          columns = _self.get('columns'),
          rowTpl = _self.get('rowTpl'),
          oddCls = index % 2 === 0 ? CLS_ROW_ODD : CLS_ROW_EVEN,
          cellsTpl = [],
          rowEl;

      BUI.each(columns, function (column) {
          var dataIndex = column['dataIndex'];
          cellsTpl.push(_self._getCellTpl(column, dataIndex, record));
      });

      rowTpl = BUI.substitute(rowTpl,{cellsTpl:cellsTpl.join(''), oddCls:oddCls});
      return rowTpl;
    },
    //get cell template by config and record
    _getCellTpl:function (column, dataIndex, record) {
        var _self = this,
            renderer = column.renderer,
            text = renderer ? renderer(record[dataIndex], record) : record[dataIndex],
            cellTpl = _self.get('cellTpl');
        return BUI.substitute(cellTpl,{elCls : column.elCls,text:text});    
    },
    /**
     * 清除数据
     * @ignore
     */
    clearData : function(){
      var _self = this,
        tbodyEl = _self.get('itemContainer');
       tbodyEl.empty();
    },
    showData : function(data){

      var _self = this;
      BUI.each(data,function(record,index){
        _self._createRow(record,index);
      });
    },
    //设置单元格边框
    _uiSetInnerBorder : function(v){
        var _self = this,
            el = _self.get('el');
        if(v){
            el.addClass(CLS_GRID_BORDER);
        }else{
            el.removeClass(CLS_GRID_BORDER);
        }
    },
    _uiSetTableCls : function(v){
      var _self = this,
        tableEl = _self.get('el').find('table');
      tableEl.attr('class',v);
    }
  },{
    ATTRS : {
      /**
       * @private
       * @ignore
       */
      headerRowEl : {
        valueFn :function(){
          var _self = this,
            thead = _self.get('el').find('thead');
          return thead.children('tr');
        }
      },
      /**
       * @private 
       * @ignore
       * @type {Object}
       */
      itemContainer :{
        valueFn :function(){
          return this.get('el').find('tbody');
        }
      },
      tableCls : {

      }
    }
  },{
    xclass:'simple-grid-veiw'
  });

  /**
   * 简单表格
   * xclass:'simple-grid'
   * <pre><code>
   *  BUI.use('bui/grid',function(Grid){
   *     
   *    var columns = [{
   *             title : '表头1(10%)',
   *             dataIndex :'a',
   *             width:'10%'
   *           },{
   *             id: '123',
   *             title : '表头2(20%)',
   *             dataIndex :'b',
   *             width:'20%'
   *           },{
   *             title : '表头3(70%)',
   *             dataIndex : 'c',
   *             width:'70%'
   *         }],
   *         data = [{a:'123'},{a:'cdd',b:'edd'},{a:'1333',c:'eee',d:2}];
   *
   *     var grid = new Grid.SimpleGrid({
   *       render:'#grid',
   *       columns : columns,
   *       items : data,
   *       idField : 'a'
   *     });
   *
   *     grid.render();
   *   });
   * </code></pre>
   * @class BUI.Grid.SimpleGrid
   * @extends BUI.List.SimpleList
   */
  var simpleGrid = BUI.List.SimpleList.extend(
  /**
   * @lends BUI.Grid.SimpleGrid.prototype
   * @ignore
   */
  {
    renderUI : function(){
      this.get('view').setColumns();
    },
    /**
     * 绑定事件
     * @protected
     */
    bindUI : function(){
      var _self = this,
        itemCls = _self.get('itemCls'),
        hoverCls = itemCls + '-hover',
        el = _self.get('el');

      el.delegate('.'+itemCls,'mouseover',function(ev){
        var sender = $(ev.currentTarget);
        sender.addClass(hoverCls);
      }).delegate('.'+itemCls,'mouseout',function(ev){
        var sender = $(ev.currentTarget);
        sender.removeClass(hoverCls);
      });
    },
    /**
     * 显示数据
     * <pre><code>
     *   var data = [{},{}];
     *   grid.showData(data);
     *
     *   //等同
     *   grid.set('items',data);
     * </code></pre>
     * @param  {Array} data 要显示的数据
     */
    showData : function(data){
      this.clearData();
      //this.get('view').showData(data);
      this.set('items',data);
    },
    /**
     * 清除数据
     */
    clearData : function(){
      this.get('view').clearData();
    },
    _uiSetColumns : function(columns){
      var _self = this;

      //重置列，先清空数据
      _self.clearData();
      _self.get('view').setColumns(columns);
    }
  },{
    ATTRS : 
    /**
     * @lends BUI.Grid.SimpleGrid#
     * @ignore
     */
    {
      /**
       * 表格可点击项的样式
       * @protected
       * @type {String}
       */
      itemCls : {
        view:true,
        value : CLS_GRID_ROW
      },
      /**
       * 表格应用的样式，更改此值，则不应用默认表格样式
       * <pre><code>
       * grid = new Grid.SimpleGrid({
       *   render:'#grid',
       *   columns : columns,
       *   innerBorder : false,
       *   tableCls:'table table-bordered table-striped', 
       *   store : store 
       * }); 
       * </code></pre>
       * @type {Object}
       */
      tableCls : {
        view : true,
        value : CLS_GRID + '-table'
      },
      /**
       * 列信息
       * @cfg {Array} columns
       */
      /**
       * 列信息，仅支持以下配置项：
       * <ol>
       *   <li>title：标题</li>
       *   <li>elCls: 应用到本列的样式</li>
       *   <li>width：宽度，数字或者百分比</li>
       *   <li>dataIndex: 字段名</li>
       *   <li>renderer: 渲染函数</li>
       * </ol>
       * 具体字段的解释清参看 ： {@link BUI.Grid.Column}
       * @type {Array}
       */
      columns : {
        view : true,
        sync:false,
        value : []
      },
      /**
       * 模板
       * @protected
       */
      tpl:{
        view : true,
        value:'<table cellspacing="0" class="{tableCls}" cellpadding="0"><thead><tr></tr></thead><tbody></tbody></table>'
      },
      /**
       * 单元格左右之间是否出现边框
       * <pre><code>
       * <pre><code>
       * grid = new Grid.SimpleGrid({
       *   render:'#grid',
       *   columns : columns,
       *   innerBorder : false,
       *   store : store 
       * }); 
       * </code></pre>
       * </code></pre>
       * @cfg {Boolean} [innerBorder=true]
       */
      /**
       * 单元格左右之间是否出现边框
       * @type {Boolean}
       * @default true
       */
      innerBorder : {
          view:true,
          value : true
      },
      /**
       * 行模版
       * @type {Object}
       */
      rowTpl:{
        view : true,
        value:'<tr class="' + CLS_GRID_ROW + ' {oddCls}">{cellsTpl}</tr>'
      },
      /**
       * 单元格的模版
       * @type {String}
       */
      cellTpl:{
        view:true,
        value:'<td class="' + CLS_GRID + '-cell {elCls}"><div class="' + CLS_GRID + '-cell-inner"><span class="' + CLS_GRID + '-cell-text">{text}</span></div></td>'
      },
      /**
       * 列的配置模版
       * @type {String}
       */
      columnTpl : {
        view:true,
        value : '<th class="' + CLS_GRID + '-hd {elCls}" width="{width}"><div class="' + CLS_GRID + '-hd-inner"><span class="' + CLS_GRID + '-hd-title">{title}</span></div></th>'
      },
      /**
       * @private
       */
      events :{ 

          value : {
            
          }
      },
      xview : {
        value : simpleGridView
      }
    }
  },{
    xclass:'simple-grid'
  });
  
  simpleGrid.View = simpleGridView;
  return  simpleGrid;
});
/**
 * @fileOverview this class details some util tools of grid,like loadMask, formatter for grid's cell render
 * @author dxq613@gmail.com, yiminghe@gmail.com
 * @ignore
 */
define('bui/grid/format',function (require) {

    function formatTimeUnit(v) {
        if (v < 10) {
            return '0' + v;
        }
        return v;
    }

    /**
     * This class specifies some formatter for grid's cell renderer
     * @class BUI.Grid.Format
     * @singleton
     */
    var Format =
    /** 
    * @lends BUI.Grid.Format 
    * @ignore
    */
    {
        /**
         * 日期格式化函数
         * @param {Number|Date} d 格式话的日期，一般为1970 年 1 月 1 日至今的毫秒数
         * @return {String} 格式化后的日期格式为 2011-10-31
         * @example
         * 一般用法：<br>
         * BUI.Grid.Format.dateRenderer(1320049890544);输出：2011-10-31 <br>
         * 表格中用于渲染列：<br>
         * {title:"出库日期",dataIndex:"date",renderer:BUI.Grid.Format.dateRenderer}
         */
        dateRenderer:function (d) {
            if (!d) {
                return '';
            }
            if (BUI.isString(d)) {
                return d;
            }
            var date = null;
            try {
                date = new Date(d);
            } catch (e) {
                return '';
            }
            if (!date || !date.getFullYear) {
                return '';
            }
            return date.getFullYear() + '-' + formatTimeUnit(date.getMonth() + 1) + '-' + formatTimeUnit(date.getDate());
        },
        /**
         * @description 日期时间格式化函数
         * @param {Number|Date} d 格式话的日期，一般为1970 年 1 月 1 日至今的毫秒数
         * @return {String} 格式化后的日期格式时间为 2011-10-31 16 : 41 : 02
         */
        datetimeRenderer:function (d) {
            if (!d) {
                return '';
            }
            if (BUI.isString(d)) {
                return d;
            }
            var date = null;
            try {
                date = new Date(d);
            } catch (e) {
                return '';
            }
            if (!date || !date.getFullYear) {
                return '';
            }
            return date.getFullYear() + '-' + formatTimeUnit(date.getMonth() + 1) + '-' + formatTimeUnit(date.getDate()) + ' ' + formatTimeUnit(date.getHours()) + ':' + formatTimeUnit(date.getMinutes()) + ':' + formatTimeUnit(date.getSeconds());
        },
        /**
         * 文本截取函数，当文本超出一定数字时，会截取文本，添加...
         * @param {Number} length 截取多少字符
         * @return {Function} 返回处理函数 返回截取后的字符串，如果本身小于指定的数字，返回原字符串。如果大于，则返回截断后的字符串，并附加...
         */
        cutTextRenderer:function (length) {
            return function (value) {
                value = value || '';
                if (value.toString().length > length) {
                    return value.toString().substring(0, length) + '...';
                }
                return value;
            };
        },
        /**
         * 枚举格式化函数
         * @param {Object} enumObj 键值对的枚举对象 {"1":"大","2":"小"}
         * @return {Function} 返回指定枚举的格式化函数
         * @example
         * //Grid 的列定义
         *  {title:"状态",dataIndex:"status",renderer:BUI.Grid.Format.enumRenderer({"1":"入库","2":"出库"})}
         */
        enumRenderer:function (enumObj) {
            return function (value) {
                return enumObj[value] || '';
            };
        },
        /*
         * 将多个值转换成一个字符串
         * @param {Object} enumObj 键值对的枚举对象 {"1":"大","2":"小"}
         * @return {Function} 返回指定枚举的格式化函数
         * @example
         * <code>
         *  //Grid 的列定义
         *  {title:"状态",dataIndex:"status",renderer:BUI.Grid.Format.multipleItemsRenderer({"1":"入库","2":"出库","3":"退货"})}
         *  //数据源是[1,2] 时，则返回 "入库,出库"
         * </code>
         */
        multipleItemsRenderer:function (enumObj) {
            var enumFun = Format.enumRenderer(enumObj);
            return function (values) {
                var result = [];
                if (!values) {
                    return '';
                }
                if (!BUI.isArray(values)) {
                    values = values.toString().split(',');
                }
                $.each(values, function (index,value) {
                    result.push(enumFun(value));
                });

                return result.join(',');
            };
        },
        /*
         * 将财务数据分转换成元
         * @param {Number|String} enumObj 键值对的枚举对象 {"1":"大","2":"小"}
         * @return {Number} 返回将分转换成元的数字
         */
        moneyCentRenderer:function (v) {
            if (BUI.isString(v)) {
                v = parseFloat(v);
            }
            if ($.isNumberic(v)) {
                return (v * 0.01).toFixed(2);
            }
            return v;
        }
    };

    return Format;
});