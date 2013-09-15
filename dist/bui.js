/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 兼容kissy 和 jQuery 的适配器
 * @ignore
 */

/**
 * @private
 * @class jQuery
 * 原生的jQuery对象或者使用kissy时适配出来的对象
 */
var jQuery = jQuery || (function () {

  function excuteDuration(self,fn,speed, easing,callback){
    var params = getDurationParams(speed, easing,callback);

    fn.call(self,params.duration,params.complete,params.easing);
  }

  function getDurationParams(speed, easing,callback){

    if(S.isPlainObject(speed)){
      var obj = speed;
      if(S.isNumber(obj.duration)){
        obj.duration = obj.duration / 1000;
      }
      return obj;
    }

    if(S.isNumber(speed)){
      speed = speed / 1000;
    }else if(S.isString(speed)){
      callback = easing;
      easing = speed;
      speed = undefined;
    }else if(S.isFunction(speed)){
      callback = speed;
      speed = undefined;
    }

    if(S.isFunction(easing)){
      callback = easing;
      easing = undefined;
    }
    return {duration : speed,complete : callback,easing : easing};
  }

  function getOffsetParent(element) {
    var doc = element.ownerDocument,
        body = doc.body,
        parent,
        positionStyle = $(element).css('position'),
        skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';

    if (!skipStatic) {
        return element.nodeName.toLowerCase() == 'html' ? null : element.parentNode;
    }

    for (parent = element.parentNode; parent && parent != body; parent = parent.parentNode) {
        positionStyle = $(parent).css('position');
        if (positionStyle != 'static') {
            return parent;
        }
    }
    return null;
  }

  var S = KISSY,
    DOM = S.DOM,
    NLP = S.Node.prototype,
    wrapNode = function(selector,content){
      if(!(this instanceof wrapNode)){
        return new wrapNode(selector,content);
      }
      //S.ready
      if(S.isFunction(selector)){
        return S.ready(selector);
      }
      if(S.isString(selector)){
        if(content){
          return new wrapNode(content).find(selector);
        }
        return new wrapNode(S.all(selector));
      }
      S.Node.call(this,selector);
    };

  S.extend(wrapNode,S.Node);

  S.augment(wrapNode,{
    bind : NLP.on,
    off : NLP.detach,
    trigger : NLP.fire,
    //返回的结果不一致
    /*children : function(selector){
      return new wrapNode(DOM.children(this[0],selector));
    },*/
    filter : function(selector){
      if(!selector){
        return new wrapNode();
      }
      if(S.isString(selector)){
        return new wrapNode(DOM.filter(this[0],selector));
      } 
      var nodes = this.getDOMNodes(),
        rst;
      if(S.isFunction(selector)){
        rst = [];
        S.each(nodes,function(node,index){
          var r = selector.call(node,index);
          if(r){
            rst.push(node);
          }
        });
        return new wrapNode(rst);
      }

      S.each(nodes,function(node,index){
        if(node === selector){
          rst = node;
          return false;
        }
      });
      return new wrapNode(rst);
    },
    //返回的结果不一致
    find : function(selector){
      return new wrapNode(DOM.query(selector,this[0]));
    },
    /**
     * 判断是否符合指定的选择器
     */
    is : function(selector){
      var splits = selector.split(','),
        rst = false;
      for (var i = 0; i < splits.length; i++) {
        if(!rst && splits[i]){
          rst = rst || DOM.test(this[0],splits[i]);
        }
      };
      return rst;
    },
    //复写delegate，更改参数顺序
    delegate : function(selector,eventType,fn){
     return wrapNode.superclass.delegate.call(this,eventType,selector,fn);
    },
    //更改 便遍历函数的顺序
    //修改this,和对象
    each : function(fn){
      return wrapNode.superclass.each.call(this,function(value,index){
        return fn.call(this[0],index,value[0]);
      });
    },
    //第一个子元素
    first : function(){
      return new wrapNode(this[0]);
    },
    //查找父节点，jQuery 的parent 和parents 有差异
    parents : function(selector){
      return this.parent(selector);
    },
    //最后一个子元素
    last : function(){
      var length = this.length;
      return new wrapNode(this[length-1]);
    },
    /**
     * kissy 未提供此方法
     */
    offsetParent : function(){
      return new wrapNode(getOffsetParent(this[0]));
    },
    //参数顺序不一致
    animate : function(properties,speed, easing,callback){
      var params = getDurationParams(speed, easing,callback);
      wrapNode.superclass.animate.call(this,properties,params.duration,params.easing,params.complete);
    },
    /**
     * kissy 未提供此方法
     */
    position : function(){
      var _self = this,
        offset = this.offset(),
        parent = _self.offsetParent();
      if(parent.length){
        var parentOffset = parent.offset();
        offset.left -= parentOffset.left;
        offset.top -= parentOffset.top;
      }
      return offset;
    },
    /**
    * 将表单数据序列化成对象
    * @return {Object} 表单元素的
    */
    serializeArray:function(){
      var form = this[0],
        originElements = null,
        elements = null,
        arr =[],
        checkboxElements = null,
        result={};
      if(S.isArray(form)){
        originElements = form;
      }else{
        originElements =  S.makeArray(form.elements);
      }
      elements = S.filter(originElements,function(item){
        return (item.id ||item.name) && !item.disabled &&
          (item.checked || /select|textarea/i.test(item.nodeName) ||
            /text|hidden|password/i.test(item.type));
      });
      //checkbox 做特殊处理，如果所有checkbox都未选中时,设置字段为空
      checkboxElements = S.filter(originElements,function(item){
        return (item.id ||item.name) && !item.disabled &&(/checkbox/i.test(item.type));
      });
      S.each(elements,function(elem){
        var val = S.one(elem).val(),
          name = elem.name||elem.id,
          obj = val == null ? {name:  name, value: ''} : S.isArray(val) ?
          S.map( val, function(val, i){
            return {name: name, value: val};
          }) :
          {name:  name, value: val};
        if(obj){
          arr.push(obj);
        }
      });
      return arr;
    }
  });

  //由于 kissy的动画单位和参数位置跟 jquery的不一致
  var durationMethods = ['fadeIn','fadeOut','fadeToggle','slideDown','slideUp','slideToggle','show','hide'];
  S.each(durationMethods,function(fnName){
    wrapNode.prototype[fnName] = function(speed, easing,callback){
      excuteDuration(this,NLP[fnName],speed,easing,callback);
    };
  });
  //jquery上的很多DOM的方法在kissy的Node上不支持
  var domMethods = ['change','blur','focus','select'];
  S.each(domMethods,function(fnName){
    wrapNode.prototype[fnName] = function(){
      var el = this[0];
      if(el){
        if(el[fnName]){
          el[fnName]();
        }else{
          this.fire(fnName);
        }
        
      }
    }
  });

  //由于返回的对象的类型是S.Node，所以要更改类型
  var nodeMethods = ['children','parent','next','prev','siblings','closest'];
  S.each(nodeMethods,function(fnName){
    wrapNode.prototype[fnName] = function(selector){
      return new wrapNode(DOM[fnName](this[0],selector));
    }
  });

  S.mix(wrapNode,S);
  S.mix(wrapNode,{
    /**
     * 是否包含指定DOM
     */
    contains : function(container, contained){
      return S.DOM.contains(container, contained);
    },
    /**
     * 实现$.extend
     * @return {Object} 结果
     */
    extend : function(){
      var args = S.makeArray(arguments),
        deep = false,
        obj;
      if(S.isBoolean(arguments[0])){
        deep = args.shift();
      }
      obj = args[0];
      if(obj){
        for(var i = 1; i < args.length;i++){
          S.mix(obj,args[i],undefined,undefined,deep);
        }
      }
      return obj;
    },
    /**
     * kissy 的此方法跟 jQuery的接口不一致
     */
    each : function(elements,fn){
      S.each(elements,function(value,index){
        return fn(index,value);
      });
    },
    /**
     * 返回结果不一致
     */
    inArray : function(elem,arr){
      return S.indexOf(elem,arr);
    },
    /**
     * jQuery 的map函数将返回为 null 和 undefined的项不返回
     */
    map : function(arr,callback){
      var rst = [];
      S.each(arr,function(item,index){
        var val = callback(item,index);
        if(val != null){
          rst.push(val);
        }
      });
      return rst;
    },

    /**
     * 空操作
     */
    noop : function(){},
    
    parseJSON : S.JSON.parse
  })
  return wrapNode;
})();

var $ = $ || jQuery,
  BUI = BUI || {};;

window.define = window.define || function(name,depends,fun){
  if(KISSY.isFunction(depends)){
    fun = depends;
    depends = [];
  }

  function require(name){
    return KISSY.require.call(KISSY,name);
  }

  function callback(S){
    return fun.call(S,require);
  }
  KISSY.add(name,callback,{requires : depends});
};

if(!BUI.use){
  BUI.use = function(modules,callback){
    if(KISSY.isArray(modules)){
      modules = modules.join();
    };
    KISSY.use(modules,function(S){
      var args = KISSY.makeArray(arguments); 
      args.shift();
      callback.apply(S,args);
    });
  };
}
KISSY.config({
  packages:[{
    name:"bui",
    tag:"201307042102",
    path:"http://g.tbcdn.cn/fi",
    charset:'utf-8'
  }]
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 日历命名空间入口
 * @ignore
 */

define('bui/calendar',['bui/common','bui/calendar/calendar','bui/calendar/monthpicker','bui/calendar/datepicker'],function (require) {
  var BUI = require('bui/common'),
    Calendar = BUI.namespace('Calendar');
  BUI.mix(Calendar,{
    Calendar : require('bui/calendar/calendar'),
    MonthPicker : require('bui/calendar/monthpicker'),
    DatePicker : require('bui/calendar/datepicker')
  });

  return Calendar;
});
/**
 * @fileOverview 日期控件
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/calendar/calendar',['bui/picker','bui/calendar/monthpicker','bui/calendar/header','bui/calendar/panel','bui/toolbar'],function(require){
  
  var BUI = require('bui/common'),
    PREFIX = BUI.prefix,
    CLS_PICKER_TIME = 'x-datepicker-time',
    CLS_PICKER_HOUR = 'x-datepicker-hour',
    CLS_PICKER_MINUTE = 'x-datepicker-minute',
    CLS_PICKER_SECOND = 'x-datepicker-second',
    CLS_TIME_PICKER = 'x-timepicker',
    Picker = require('bui/picker').ListPicker,
    MonthPicker = require('bui/calendar/monthpicker'),
    Header = require('bui/calendar/header'),
    Panel = require('bui/calendar/panel'),
    Toolbar = require('bui/toolbar'),
    Component = BUI.Component,
    DateUtil = BUI.Date;

  function today(){
    var now = new Date();
    return new Date(now.getFullYear(),now.getMonth(),now.getDate());
  }

  function fixedNumber(n){
    if( n< 10 ){
      return '0'+n;
    }
    return n.toString();
  }
  function getNumberItems(end){
    var items = [];
    for (var i = 0; i < end; i++) {
      items.push({text:fixedNumber(i),value:fixedNumber(i)});
    }
    return items;
  }

  function getTimeUnit (self,cls){
    var inputEl = self.get('el').find('.' + cls);
    return parseInt(inputEl.val());

  }

  function setTimeUnit (self,cls,val){
    var inputEl = self.get('el').find('.' + cls);
    if(BUI.isNumber(val)){
      val = fixedNumber(val);
    }
    inputEl.val(val);
  }



  /**
   * 日期控件
   * <p>
   * <img src="../assets/img/class-calendar.jpg"/>
   * </p>
   * xclass:'calendar'
   * <pre><code>
   *  BUI.use('bui/calendar',function(Calendar){
   *    var calendar = new Calendar.Calendar({
   *      render:'#calendar'
   *    });
   *    calendar.render();
   *    calendar.on('selectedchange',function (ev) {
   *      alert(ev.date);
   *    });
   * });
   * </code></pre>
   * @class BUI.Calendar.Calendar
   * @extends BUI.Component.Controller
   */
  var calendar = Component.Controller.extend({

    //设置内容
    initializer: function(){
      var _self = this,
        children = _self.get('children'),
        header = new Header(),
        panel = new Panel(),
        footer = _self.get('footer') || _self._createFooter(),
        monthPicker = _self.get('monthPicker') || _self._createMonthPicker();
        

      //添加头
      children.push(header);
      //添加panel
      children.push(panel);
      children.push(footer);
      children.push(monthPicker);

      _self.set('header',header);
      _self.set('panel',panel);
      _self.set('footer',footer);
      _self.set('monthPicker',monthPicker);

    },
    renderUI : function(){
      var _self = this,
      children = _self.get('children');
      if(_self.get('showTime')){
        var  timepicker = _self.get('timepicker') || _self._initTimePicker();
        children.push(timepicker);
        _self.set('timepicker',timepicker);
      }
    },
    //绑定事件
    bindUI : function(){
      var _self = this,
        header = _self.get('header'),
        panel = _self.get('panel');

      panel.on('selectedchange',function(e){
        var date = e.date;
        if(!DateUtil.isDateEquals(date,_self.get('selectedDate'))){
          _self.set('selectedDate',date);
        }
      });
      if(!_self.get('showTime')){
        panel.on('click',function(){
          _self.fire('accept');
        });
      }else{
        _self._initTimePickerEvent();
      }
    
      header.on('monthchange',function(e){
        _self._setYearMonth(e.year,e.month);
      });

      header.on('headerclick',function(){
        var monthPicker = _self.get('monthPicker');
        monthPicker.set('year',header.get('year'));
        monthPicker.set('month',header.get('month'));
        monthPicker.show();
      });
    },
    _initTimePicker : function(){
      var _self = this,
        picker = new Picker({
          elCls : CLS_TIME_PICKER,
          children:[{
            itemTpl : '<li><a href="#">{text}</a></li>'
          }],
          autoAlign : false,
          align : {
            node : _self.get('el'),
            points:['bl','bl'],
            offset:[0,-30]
          },
          trigger : _self.get('el').find('.' + CLS_PICKER_TIME)
        });
      picker.render();
      _self._initTimePickerEvent(picker);
      return picker;
    },
    _initTimePickerEvent : function(picker){
      var _self = this,
        picker= _self.get('timepicker');

      if(!picker){
        return;
      }

      picker.get('el').delegate('a','click',function(ev){
        ev.preventDefault();
      });
      picker.on('triggerchange',function(ev){
        var curTrigger = ev.curTrigger;
        if(curTrigger.hasClass(CLS_PICKER_HOUR)){
          picker.get('list').set('items',getNumberItems(24));
        }else{
          picker.get('list').set('items',getNumberItems(60));
        }
      });

      picker.on('selectedchange',function(ev){
        var curTrigger = ev.curTrigger,
          val = ev.value;
        if(curTrigger.hasClass(CLS_PICKER_HOUR)){
          _self.setInternal('hour',val);
        }else if(curTrigger.hasClass(CLS_PICKER_MINUTE)){
          _self.setInternal('minute',val);
        }else{
          _self.setInternal('second',val);
        }
      });
    },
    //更改年和月
    _setYearMonth : function(year,month){
      var _self = this,
        selectedDate = _self.get('selectedDate'),
        date = selectedDate.getDate();
      if(year !== selectedDate.getFullYear() || month !== selectedDate.getMonth()){
        _self.set('selectedDate',new Date(year,month,date));
      }
    },
    //创建选择月的控件
    _createMonthPicker: function(){
      var _self = this;

      return new MonthPicker({
        effect : {
          effect:'slide',
          duration:300
        },
        visibleMode:'display',
        success : function(){
          var picker = this;
          _self._setYearMonth(picker.get('year'),picker.get('month'));
          picker.hide();
        },
        cancel : function(){
          this.hide();
        }
      });
    },
    //创建底部按钮栏
    _createFooter : function(){
      var _self = this,
        showTime = this.get('showTime'),
        items = [];

      if(showTime){
        items.push({
          content : _self.get('timeTpl')
        });
        items.push({
          xclass:'bar-item-button',
          text:'确定',
          btnCls: 'button button-small button-primary',
          listeners:{
            click:function(){            
              _self.fire('accept');
            }
          }  
        });
      }else{
        items.push({
          xclass:'bar-item-button',
          text:'今天',
          btnCls: 'button button-small',
          listeners:{
            click:function(){
              var day = today();
              _self.set('selectedDate',day);
              _self.fire('accept');
            }
          }  
        });
      }
      
      return new Toolbar.Bar({
          elCls : PREFIX + 'calendar-footer',
          children:items
        });
    },
    //设置所选日期
    _uiSetSelectedDate : function(v){
      var _self = this,
        year = v.getFullYear(),
        month = v.getMonth();

      _self.get('header').setMonth(year,month);
      _self.get('panel').set('selected',v);
      _self.fire('datechange',{date:v});
    },
    _uiSetHour : function(v){
      setTimeUnit(this,CLS_PICKER_HOUR,v);
    },
    _uiSetMinute : function(v){
      setTimeUnit(this,CLS_PICKER_MINUTE,v);
    },
    _uiSetSecond : function(v){
      setTimeUnit(this,CLS_PICKER_SECOND,v);
    },
    //设置最大值
    _uiSetMaxDate : function(v){
      var _self = this;
      _self.get('panel').set('maxDate',v);
    },
    //设置最小值
    _uiSetMinDate : function(v){
      var _self = this;
      _self.get('panel').set('minDate',v);
    }

  },{
    ATTRS : 
    /**
     * @lends BUI.Calendar.Calendar#
     * @ignore
     */
    {
      /**
       * 日历控件头部，选择年月
       * @private
       * @type {Object}
       */
      header:{

      },

      /**
       * 日历控件选择日
       * @private
       * @type {Object}
       */
      panel:{

      },
      /**
       * 最大日期
       * <pre><code>
       *   calendar.set('maxDate','2013-07-29');
       * </code></pre>
       * @type {Date}
       */
      maxDate : {

      },
      /**
       * 最小日期
       * <pre><code>
       *   calendar.set('minDate','2013-07-29');
       * </code></pre>
       * @type {Date}
       */
      minDate : {

      },
      /**
       * 选择月份控件
       * @private
       * @type {Object}
       */
      monthPicker : {

      },
      /**
       * 选择时间控件
       * @private
       * @type {Object}
       */
      timepicker:{

      },
      width:{
        value:180
      },
      events:{
        value:{
           /**
           * @event
           * @name BUI.Calendar.Calendar#click
           * @param {Object} e 点击事件
           * @param {Date} e.date
           */
          'click' : false,
          /**
           * 确认日期更改，如果不显示日期则当点击日期或者点击今天按钮时触发，如果显示日期，则当点击确认按钮时触发。
           * @event
           */
          'accept' : false,
          /**
           * @event
           * @name BUI.Calendar.Calendar#datechange
           * @param {Object} e 选中的日期发生改变
           * @param {Date} e.date
           */
          'datechange' : false,
           /**
           * @event
           * @name BUI.Calendar.Calendar#monthchange
           * @param {Object} e 月份发生改变
           * @param {Number} e.year
           * @param {Number} e.month
           */
          'monthchange' : false
        }
      },
      /**
       * 是否选择时间,此选项决定是否可以选择时间
       * 
       * @cfg {Boolean} showTime
       */
      showTime : {
        value : false
      },
      timeTpl : {
        value : '<input type="text" readonly class="' + CLS_PICKER_TIME + ' ' + CLS_PICKER_HOUR + '" />:<input type="text" readonly class="' + CLS_PICKER_TIME + ' ' + CLS_PICKER_MINUTE + '" />:<input type="text" readonly class="' + CLS_PICKER_TIME + ' ' + CLS_PICKER_SECOND + '" />'
      },
      /**
       * 选择的日期,默认为当天
       * <pre><code>
       *  var calendar = new Calendar.Calendar({
       *  render:'#calendar',
       *   selectedDate : new Date('2013/07/01') //不能使用字符串
       * });
       * </code></pre>
       * @cfg {Date} selectedDate
       */
      /**
       * 选择的日期
       * <pre><code>
       *   calendar.set('selectedDate',new Date('2013-9-01'));
       * </code></pre>
       * @type {Date}
       * @default today
       */
      selectedDate : {
        value : today()
      },
      /**
       * 小时,默认为当前小时
       * @type {Number}
       */
      hour : {
        value : new Date().getHours()
  
      },
      /**
       * 分,默认为当前分
       * @type {Number}
       */
      minute:{
        value : new Date().getMinutes()
      },
      /**
       * 秒,默认为当前秒
       * @type {Number}
       */
      second : {
        value : 0
      }
    }
  },{
    xclass : 'calendar',
    priority : 0
  });

  return calendar;
});
/**
 * @fileOverview 日期选择器
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/calendar/datepicker',['bui/common','bui/picker','bui/calendar/calendar'],function(require){
  
  var BUI = require('bui/common'),
    Picker = require('bui/picker').Picker,
    Calendar = require('bui/calendar/calendar'),
    DateUtil = BUI.Date;

  /**
   * 日期选择器，可以由输入框等触发
   * <p>
   * <img src="../assets/img/class-calendar.jpg"/>
   * </p>
   * xclass : 'calendar-datepicker'
   * <pre><code>
   *   BUI.use('bui/calendar',function(Calendar){
   *      var datepicker = new Calendar.DatePicker({
   *        trigger:'.calendar',
   *        //delegateTigger : true, //如果设置此参数，那么新增加的.calendar元素也会支持日历选择
   *        autoRender : true
   *      });
   *    });
   * </code></pre>
   * @class BUI.Calendar.DatePicker
   * @extends BUI.Picker.Picker
   */
  var datepicker = Picker.extend({

    initializer:function(){
      var _self = this,
        children = _self.get('children'),
        calendar = new Calendar({
          showTime : _self.get('showTime')
        });
	
	  if (!_self.get('dateMask')) {
        if (_self.get('showTime')) {
            _self.set('dateMask', 'yyyy-mm-dd HH:MM:ss');
        } else {
            _self.set('dateMask', 'yyyy-mm-dd');
        }
       }	
      children.push(calendar);
      _self.set('calendar',calendar);
    },
    /**
     * 设置选中的值
     * <pre><code>
     *   datePicker.setSelectedValue('2012-01-1');
     * </code></pre>
     * @param {String} val 设置值
     * @protected
     */
    setSelectedValue : function(val){
      var _self = this,
        calendar = this.get('calendar'),
        date = DateUtil.parse(val,_self.get("dateMask"));
      date = date || new Date(new Date().setSeconds(0));
      calendar.set('selectedDate',DateUtil.getDate(date));
      if(_self.get('showTime')){
        calendar.set('hour',date.getHours());
        calendar.set('minute',date.getMinutes());
        calendar.set('second',date.getSeconds());
      }
    },
    /**
     * 获取选中的值
     * @protected
     * @return {String} 选中的值
     */
    getSelectedValue : function(){
      var _self = this, 
        calendar = _self.get('calendar'),
      date =  DateUtil.getDate(calendar.get('selectedDate'));
      if(_self.get('showTime')){
        date = DateUtil.addHour(calendar.get('hour'),date);
        date = DateUtil.addMinute(calendar.get('minute'),date);
        date = DateUtil.addSecond(calendar.get('second'),date);
      }
      return date;
    },
    /**
     * 获取选中项的文本，多选状态下，文本以','分割
     * @protected
     * @return {String} 选中的文本
     */
    getSelectedText : function(){
      return DateUtil.format(this.getSelectedValue(),this._getFormatType());
    },
    _getFormatType : function(){
      return this.get('dateMask');
    },
    //设置最大值
    _uiSetMaxDate : function(v){
      var _self = this;
      _self.get('calendar').set('maxDate',v);
    },
    //设置最小值
    _uiSetMinDate : function(v){
      var _self = this;
      _self.get('calendar').set('minDate',v);
    }

  },{
    ATTRS : 
    /**
     * @lends BUI.Calendar.DatePicker#
     * @ignore
     */
    {
      /**
       * 是否显示日期
       * <pre><code>
       *  var datepicker = new Calendar.DatePicker({
       *    trigger:'.calendar',
       *    showTime : true, //可以选择日期
       *    autoRender : true
       *  });
       * </code></pre>
       * @type {Boolean}
       */
      showTime : {
        value:false
      },
      /**
       * 最大日期
       * <pre><code>
       *   var datepicker = new Calendar.DatePicker({
       *     trigger:'.calendar',
       *     maxDate : '2014-01-01',
       *     minDate : '2013-7-25',
       *     autoRender : true
       *   });
       * </code></pre>
       * @type {Date}
       */
      maxDate : {

      },
      /**
       * 最小日期
       * <pre><code>
       *   var datepicker = new Calendar.DatePicker({
       *     trigger:'.calendar',
       *     maxDate : '2014-01-01',
       *     minDate : '2013-7-25',
       *     autoRender : true
       *   });
       * </code></pre>
       * @type {Date}
       */
      minDate : {

      },
	  /**
       * 返回日期格式，如果不设置默认为 yyyy-MM-dd，时间选择为true时为 yyyy-MM-dd HH:mm:ss
       * <pre><code>
       *   calendar.set('dateMask','yyyy-MM-dd');
       * </code></pre>
       * @type {String}
      */
      dateMask: {

      },
      changeEvent:{
        value:'accept'
      },
      hideEvent:{
        value:'accept'
      },
      /**
       * 日历对象,可以进行更多的操作，参看{@link BUI.Calendar.Calendar}
       * @type {BUI.Calendar.Calendar}
       */
      calendar:{

      }
    }
  },{
    xclass : 'datepicker',
    priority : 0
  });
  return datepicker;
  
});
/**
 * @fileOverview 日期控件来选择年月的部分
 * @ignore
 */

define('bui/calendar/header',['bui/common'],function (require) {
  
  var BUI = require('bui/common'),
    PREFIX = BUI.prefix,
    Component = BUI.Component,
    CLS_TEXT_YEAR = 'year-text',
    CLS_TEXT_MONTH = 'month-text',
    CLS_ARROW = 'x-datepicker-arrow',
    CLS_PREV = 'x-datepicker-prev',
    CLS_NEXT = 'x-datepicker-next';
      
  /**
   * 日历控件显示选择年月
   * xclass:'calendar-header'
   * @class BUI.Calendar.Header
   * @private
   * @extends BUI.Component.Controller
   */
  var header = Component.Controller.extend({

    bindUI : function(){
      var _self = this,
        el = _self.get('el');
		
      el.delegate('.' + CLS_ARROW,'click',function(e){
        e.preventDefault();
        var sender = $(e.currentTarget);
        if(sender.hasClass(CLS_NEXT)){
          _self.nextMonth();
        }else if(sender.hasClass(CLS_PREV)){
          _self.prevMonth();
        }
      });

      el.delegate('.x-datepicker-month','click',function(){
        _self.fire('headerclick');
      });
	  
    },
    /**
     * 设置年月
     * @ignore
     * @param {Number} year  年
     * @param {Number} month 月
     */
    setMonth : function(year,month){
      var _self = this,
        curYear = _self.get('year'),
        curMonth = _self.get('month');
      if(year !== curYear || month !== curMonth){
        _self.set('year',year);
        _self.set('month',month);
        _self.fire('monthchange',{year:year,month:month});
      }
    },
    /**
     * 下一月
     * @ignore
     */
    nextMonth : function(){
      var _self = this,
        date = new Date(_self.get('year'),_self.get('month') + 1);

      _self.setMonth(date.getFullYear(),date.getMonth());
    },
    /**
     * 上一月
     * @ignore
     */
    prevMonth : function(){
      var _self = this,
        date = new Date(_self.get('year'),_self.get('month') - 1);

       _self.setMonth(date.getFullYear(),date.getMonth());
    },
    _uiSetYear : function(v){
      var _self = this;
      _self.get('el').find('.' + CLS_TEXT_YEAR).text(v);
    },
    _uiSetMonth : function(v){
        var _self = this;
      _self.get('el').find('.' + CLS_TEXT_MONTH).text(v+1);
    }

  },{
    ATTRS : {
      /**
       * 年
       * @type {Number}
       */
      year:{
        sync:false
      },
      /**
       * 月
       * @type {Number}
       */
      month:{
        sync:false,
        setter:function(v){
          this.set('monthText',v+1);
        }
      },
      /**
       * @private
       * @type {Object}
       */
      monthText : {
        
      },
      tpl:{
        view:true,
        value:'<div class="'+CLS_ARROW+' ' + CLS_PREV + '"><span class="icon icon-white icon-caret  icon-caret-left"></span></div>'+
          '<div class="x-datepicker-month">'+
            '<div class="month-text-container">'+
              '<span><span class="year-text">{year}</span>年 <span class="month-text">{monthText}</span>月</span>'+
              '<span class="' + PREFIX + 'caret ' + PREFIX + 'caret-down"></span>'+
            '</div>'+
          '</div>' +
          '<div class="'+CLS_ARROW+' ' + CLS_NEXT + '"><span class="icon icon-white icon-caret  icon-caret-right"></span></div>'
      },
      elCls:{
        view:true,
        value:'x-datepicker-header'
      },
  	  events:{
    		value:{
          /**
           * 月发生改变，年发生改变也意味着月发生改变
           * @event
           * @param {Object} e 事件对象
           * @param {Number} e.year 年
           * @param {Number} e.month 月
           */
    			'monthchange' : true
    		}
  	  }
    }
  },{
    xclass:'calendar-header'
  });

  return header;

});
/**
 * @fileOverview 选择年月
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/calendar/monthpicker',['bui/common','bui/overlay','bui/list','bui/toolbar'],function (require){
  var BUI = require('bui/common'),
    Component = BUI.Component,
    Overlay = require('bui/overlay').Overlay,
    List = require('bui/list').SimpleList,
    Toolbar = require('bui/toolbar'),
	  PREFIX = BUI.prefix,
    CLS_MONTH = 'x-monthpicker-month',
    DATA_MONTH = 'data-month',
    DATA_YEAR = 'data-year',
    CLS_YEAR = 'x-monthpicker-year',
    CLS_YEAR_NAV = 'x-monthpicker-yearnav',
    CLS_SELECTED = 'x-monthpicker-selected',
    CLS_ITEM = 'x-monthpicker-item',
    months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

  function getMonths(){
    return $.map(months,function(month,index){
      return {text:month,value:index};
    });
  }

  var MonthPanel = List.extend({

    
    bindUI : function(){
      var _self = this;
      _self.get('el').delegate('a','click',function(ev){
        ev.preventDefault();
      }).delegate('.' + CLS_MONTH,'dblclick',function(){
        _self.fire('dblclick');
      });
    }
  },{
    ATTRS:{
      itemTpl:{
        view:true,
        value : '<li class="'+CLS_ITEM+' x-monthpicker-month"><a href="#" hidefocus="on">{text}</a></li>'
      },
      
      itemCls : {
        value : CLS_ITEM
      },
      items:{
        view:true,
        value:getMonths()
      },
      elCls : {
        view:true,
        value:'x-monthpicker-months'
      }
    }
  },{
    xclass:'calendar-month-panel'
  });


  var YearPanel = List.extend({

    bindUI : function(){
      var _self = this,
        el = _self.get('el');
      el.delegate('a','click',function(ev){
        ev.preventDefault();
      });

      el.delegate('.' + CLS_YEAR,'dblclick',function(){
        _self.fire('dblclick');
      });

      el.delegate('.x-icon','click',function(ev){
        var sender = $(ev.currentTarget);

        if(sender.hasClass(CLS_YEAR_NAV + '-prev')){
          _self._prevPage();
        }else if(sender.hasClass(CLS_YEAR_NAV + '-next')){
          _self._nextPage();
        }
      });
      _self.on('itemselected',function(ev){
        if(ev.item){
          _self.setInternal('year',ev.item.value);
        }
        
      });
    },
    _prevPage : function(){
      var _self = this,
        start = _self.get('start'),
        yearCount = _self.get('yearCount');
      _self.set('start',start - yearCount);
    },
    _nextPage : function(){
      var _self = this,
        start = _self.get('start'),
        yearCount = _self.get('yearCount');
      _self.set('start',start + yearCount);
    },
    _uiSetStart : function(){
      var _self = this;
      _self._setYearsContent();
    },
    _uiSetYear : function(v){
      var _self = this,
        item = _self.findItemByField('value',v);
      if(item){
        _self.setSelectedByField(v);
      }else{
        _self.set('start',v);
      }
    },
    _setYearsContent : function(){
      var _self = this,
        year = _self.get('year'),
        start = _self.get('start'),
        yearCount = _self.get('yearCount'),
        items = [];

      for(var i = start;i< start + yearCount;i++){
        var text = i.toString();

        items.push({text:text,value:i});
      }
      _self.set('items',items);
      _self.setSelectedByField(year);
    }

  },{
    ATTRS:{
      items:{
        view:true,
        value:[]
      },
      elCls : {
        view:true,
        value:'x-monthpicker-years'
      },
      itemCls : {
        value : CLS_ITEM
      },
      year:{

      },
      /**
       * 起始年
       * @private
       * @ignore
       * @type {Number}
       */
      start:{
        value: new Date().getFullYear()
      },
      /**
       * 年数
       * @private
       * @ignore
       * @type {Number}
       */
      yearCount:{
        value:10
      },
      itemTpl : {
        view:true,
        value : '<li class="'+CLS_ITEM+' '+CLS_YEAR+'"><a href="#" hidefocus="on">{text}</a></li>'
      },
      tpl : {
        view:true,
        value:'<div class="'+CLS_YEAR_NAV+'">'+
              '<span class="'+CLS_YEAR_NAV+'-prev x-icon x-icon-normal x-icon-small"><span class="icon icon-caret icon-caret-left"></span></span>'+
              '<span class="'+CLS_YEAR_NAV+'-next x-icon x-icon-normal x-icon-small"><span class="icon icon-caret icon-caret-right"></span></span>'+
              '</div>'+
              '<ul></ul>'
      }
    }
  },{
    xclass:'calendar-year-panel'
  });
  
  /**
   * 月份选择器
   * xclass : 'calendar-monthpicker'
   * @class BUI.Calendar.MonthPicker
   * @extends BUI.Overlay.Overlay
   */
  var monthPicker = Overlay.extend({

    initializer : function(){
      var _self = this,
        children = _self.get('children'),
        monthPanel = new MonthPanel(),
        yearPanel = new YearPanel(),
        footer = _self._createFooter();

      children.push(monthPanel);
      children.push(yearPanel);
      children.push(footer);

      _self.set('yearPanel',yearPanel);
      _self.set('monthPanel',monthPanel);
    },
    bindUI : function(){
      var _self = this;

      _self.get('monthPanel').on('itemselected',function(ev){
        if(ev.item){
          _self.setInternal('month',ev.item.value);
        }
      }).on('dblclick',function(){
        _self._successCall();
      });

      _self.get('yearPanel').on('itemselected',function(ev){
        if(ev.item){
          _self.setInternal('year',ev.item.value);
        }
      }).on('dblclick',function(){
        _self._successCall();
      });

    },
    _successCall : function(){
      var _self = this,
        callback = _self.get('success');

      if(callback){
        callback.call(_self);
      }
    },
    _createFooter : function(){
      var _self = this;
      return new Toolbar.Bar({
          elCls : PREFIX + 'clear x-monthpicker-footer',
          children:[
            {
              xclass:'bar-item-button',
              text:'确定',
              btnCls: 'button button-small button-primary',
              handler:function(){
                _self._successCall();
              }
            },{
              xclass:'bar-item-button',
              text:'取消',
              btnCls:'button button-small last',
              handler:function(){
                var callback = _self.get('cancel');
                if(callback){
                  callback.call(_self);
                }
              }
            }
          ]
        });
    },
    _uiSetYear : function(v){
      this.get('yearPanel').set('year',v);
    },
    _uiSetMonth:function(v){
      this.get('monthPanel').setSelectedByField(v);
    }
  },{
    ATTRS:
    /**
     * @lends BUI.Calendar.MonthPicker#
     * @ignore
     */
    {
      /**
       * 下部工具栏
       * @private
       * @type {Object}
       */
      footer : {

      },
      align : {
        value : {}
      },
      /**
       * 选中的年
       * @type {Number}
       */
      year : {
        
      },
      /**
       * 成功的回调函数
       * @type {Function}
       */
      success:{
        value : function(){

        }
      },
      /**
       * 取消的回调函数
       * @type {Function}
       */
      cancel :{

      value : function(){} 
 
      },
      width:{
        value:180
      },
      /**
       * 选中的月
       * @type {Number}
       */
      month:{
        
      },
      /**
       * 选择年的控件
       * @private
       * @type {Object}
       */
      yearPanel : {

      },
      /**
       * 选择月的控件
       * @private
       * @type {Object}
       */
      monthPanel:{

      }

    }
  },{
    xclass :'monthpicker'
  });
  return monthPicker;

});
/**
 * @fileOverview 日历控件显示一月的日期
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/calendar/panel',['bui/common'],function (require) {

  var BUI = require('bui/common'),
    Component = BUI.Component,
    DateUtil = BUI.Date,
    CLS_DATE = 'x-datepicker-date',
    CLS_TODAY = 'x-datepicker-today',
    CLS_DISABLED = 'x-datepicker-disabled',
    CLS_ACTIVE = 'x-datepicker-active',
    DATA_DATE = 'data-date',//存储日期对象
    DATE_MASK = 'isoDate',
    CLS_SELECTED = 'x-datepicker-selected',
    SHOW_WEEKS = 6,//当前容器显示6周
    dateTypes = {
      deactive : 'prevday',
      active : 'active',
      disabled : 'disabled'
    },
    weekDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /**
   * 日历面板的视图类
   * @class BUI.Calendar.PanelView
   * @extends BUI.Component.View
   * @private
   */
  var panelView = Component.View.extend({

    renderUI : function(){
      this.updatePanel();
    },

    //更新容器，当月、年发生改变时
    updatePanel : function(){
      var _self = this,
        el = _self.get('el'),
        bodyEl = el.find('tbody'),
        innerTem = _self._getPanelInnerTpl();

      bodyEl.empty();
      $(innerTem).appendTo(bodyEl);
    },
    //获取容器内容
    _getPanelInnerTpl : function(){
      var _self = this,
        startDate = _self._getFirstDate(),
        temps = [];

      for (var i = 0; i < SHOW_WEEKS; i++) {
        var weekStart = DateUtil.addWeek(i,startDate);
        temps.push(_self._getWeekTpl(weekStart));
      };

      return temps.join('');
    },
    //获取周模版
    _getWeekTpl : function(startDate){
      var _self = this,
        weekTpl = _self.get('weekTpl'),
        daysTemps = [];
      for (var i = 0; i < weekDays.length; i++) {
        var date = DateUtil.addDay(i,startDate);
        daysTemps.push(_self._getDayTpl(date));  
      }

      return BUI.substitute(weekTpl,{
        daysTpl:daysTemps.join('')
      });
    },
    //获取日模版
    _getDayTpl : function(date){
      var _self = this,
        dayTpl = _self.get('dayTpl'),
        day = date.getDay(),
        todayCls = _self._isToday(date) ? CLS_TODAY:'',
        dayOfWeek = weekDays[day],
        dateNumber = date.getDate(),
        //不是本月则处于不活动状态
        //不在指定的最大最小范围内，禁止选中
        dateType = _self._isInRange(date) ? (_self._isCurrentMonth(date) ? dateTypes.active : dateTypes.deactive) : dateTypes.disabled;

      return BUI.substitute(dayTpl,{
        dayOfWeek : dayOfWeek,
        dateType : dateType,
        dateNumber : dateNumber,
        todayCls : todayCls,
        date : DateUtil.format(date,DATE_MASK)
      });
    },
    //获取当前容器的第一天
    _getFirstDate : function(year,month){
      var _self = this,
        monthFirstDate = _self._getMonthFirstDate(year,month),
        day = monthFirstDate.getDay();
      return DateUtil.addDay(day * -1,monthFirstDate);
    },
    //获取当月的第一天
    _getMonthFirstDate : function(year,month){
      var _self = this,
        year = year || _self.get('year'),
        month = month || _self.get('month');
      return new Date(year,month);
    },
    //是否是当前显示的月
    _isCurrentMonth : function(date){
      return date.getMonth() === this.get('month');
    },
    //是否是今天
    _isToday : function(date){
      var tody = new Date();
      return tody.getFullYear() === date.getFullYear() && tody.getMonth() === date.getMonth() && tody.getDate() === date.getDate();
    },
    //是否在允许的范围内
    _isInRange : function(date){
      var _self = this,
        maxDate = _self.get('maxDate'),
        minDate = _self.get('minDate');

      if(minDate && date < minDate){
        return false;
      }
      if(maxDate && date > maxDate){
        return false;
      }
      return true;
    },
    //清除选中的日期
    _clearSelectedDate : function(){
      var _self = this;
      _self.get('el').find('.'+CLS_SELECTED).removeClass(CLS_SELECTED);
    },
    //查找日期对应的DOM节点
    _findDateElement : function(date){
      var _self = this,
        dateStr = DateUtil.format(date,DATE_MASK),
        activeList = _self.get('el').find('.' + CLS_DATE),
        result = null;
      if(dateStr){
        activeList.each(function(index,item){
          if($(item).attr('title') === dateStr){
            result = $(item);
            return false;
          }
        });
      }
      return result;
    },
    //设置选中的日期
    _setSelectedDate : function(date){
      var _self = this,
        dateEl = _self._findDateElement(date);

      _self._clearSelectedDate();
      if(dateEl){
        dateEl.addClass(CLS_SELECTED);
      }
    }
  },{
    ATTRS : {

    }
  });
  
  /**
   * 日历控件显示日期的容器
   * xclass:'calendar-panel'
   * @class BUI.Calendar.Panel
   * @private
   * @extends BUI.Component.Controller
   */
  var panel = Component.Controller.extend(
  /**
  * @lends  BUI.Calendar.Panel.prototype 
  * @ignore
  */
  {

    /**
     * 设置默认年月
     * @protected
     */
    initializer : function(){
      var _self = this,
        now = new Date();
      if(!_self.get('year')){
        _self.set('year',now.getFullYear());
      }

      if(!_self.get('month')){
        _self.set('month',now.getMonth());
      }
    },
    /**
     * @protected
     * @ignore
     */
    bindUI : function(){
      var _self = this,
        el = _self.get('el');
      el.delegate('.' + CLS_DATE,'click',function(e){
        e.preventDefault();
      });
      //阻止禁用的日期被选择
      el.delegate('.' + CLS_DISABLED,'mouseup',function(e){
        e.stopPropagation();
      });
    },
    /**
     * @protected
     * @ignore
     */
    performActionInternal : function(ev){
      var _self = this,
        sender = $(ev.target).closest('.' + CLS_DATE);
      if(sender){
        var date = sender.attr('title');
        if(date){
          date = DateUtil.parse(date);
          if(_self.get('view')._isInRange(date)){
            _self.set('selected',date);
          }
          //_self.fire('click',{date:date});
        }
      }
    },
    /**
     * 设置年月
     * @param {Number} year  年
     * @param {Number} month 月
     */
    setMonth : function(year,month){
      var _self = this,
        curYear = _self.get('year'),
        curMonth = _self.get('month');
      if(year !== curYear || month !== curMonth){
        _self.set('year',year);
        _self.set('month',month);
    		//if(_self.get('rendered')){
    			_self.get('view').updatePanel();
    		//}
      }
    },
    //选中日期
    _uiSetSelected : function(date,ev){
      var _self = this;
      
      if(!(ev && ev.prevVal && DateUtil.isDateEquals(date,ev.prevVal))){
        _self.setMonth(date.getFullYear(),date.getMonth());
        _self.get('view')._setSelectedDate(date);
        _self.fire('selectedchange',{date:date});
      } 
    },
    //设置最日期
    _uiSetMaxDate : function(v){
      if(v){
        this.get('view').updatePanel();
      }
    },
    //设置最小日期
    _uiSetMinDate : function(v){
      if(v){
        this.get('view').updatePanel();
      }
    }
  },{
    ATTRS:
    /**
     * @lends BUI.Calendar.Panel#
     * @ignore
     */
    {
      /**
       * 展示的月所属年
       * @type {Number}
       */
      year : {
        view :true
      },
      /**
       * 展示的月
       * @type {Number}
       */
      month:{
        view :true
      },
      /**
       * 选中的日期
       * @type {Date}
       */
      selected : {

      },
      focusable:{
        value:true
      },
      /**
       * 日期的模板
       * @private
       * @type {Object}
       */
      dayTpl:{
        view : true,
        value:'<td class="x-datepicker-date x-datepicker-{dateType} {todayCls} day-{dayOfWeek}" title="{date}">'+
                '<a href="#" hidefocus="on" tabindex="1">'+
                  '<em><span>{dateNumber}</span></em>'+
                '</a>'+
              '</td>'
      },
      events:{
        value : {
          /**
           * @event
           * @name BUI.Calendar.Panel#click
           * @param {Object} e 点击事件
           * @param {Date} e.date
           */
          'click' : false,
          /**
           * @name BUI.Calendar.Panel#selectedchange
           * @param {Object} e 点击事件
           * @param {Date} e.date
           */
          'selectedchange' : false
        }
      },
      /**
       * 最小日期
       * @type {Date | String}
       */
      maxDate : {
        view : true,
        setter : function(val){
          if(val){
            if(BUI.isString(val)){
              return DateUtil.parse(val);
            }
            return val;
          }
        }
      },
      /**
       * 最小日期
       * @type {Date | String}
       */
      minDate : {
        view : true,
        setter : function(val){
          if(val){
            if(BUI.isString(val)){
              return DateUtil.parse(val);
            }
            return val;
          }
        }
      },
      /**
       * 周的模板
       * @private
       * @type {Object}
       */
      weekTpl:{
        view : true,
        value : '<tr>{daysTpl}</tr>'
      },
      tpl:{
        view:true,
        value:'<table class="x-datepicker-inner" cellspacing="0">' +
                '<thead>' +
                   '<tr>' +
                    '<th  title="Sunday"><span>日</span></th>' +
                    '<th  title="Monday"><span>一</span></th>' +
                    '<th  title="Tuesday"><span>二</span></th>' +
                    '<th  title="Wednesday"><span>三</span></th>' +
                    '<th  title="Thursday"><span>四</span></th>' +
                    '<th  title="Friday"><span>五</span></th>' +
                    '<th  title="Saturday"><span>六</span></th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody class="x-datepicker-body">' +
                '</tbody>' +
              '</table>'
      },
      xview : {value : panelView}
    }
  },{
    xclass:'calendar-panel',
    priority:0
  });

  return panel;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/

define('bui/common',['bui/ua','bui/json','bui/date','bui/array','bui/keycode','bui/observable','bui/observable','bui/base','bui/component'],function(require){

  var BUI = require('bui/util');

  BUI.mix(BUI,{
    UA : require('bui/ua'),
    JSON : require('bui/json'),
    Date : require('bui/date'),
    Array : require('bui/array'),
    KeyCode : require('bui/keycode'),
    Observable : require('bui/observable'),
    Base : require('bui/base'),
    Component : require('bui/component')
  });
  return BUI;
});

/**
 * @class BUI.Util
 * 控件库的工具方法，这些工具方法直接绑定到BUI对象上
 * <pre><code>
 *     BUI.isString(str);
 *
 *     BUI.extend(A,B);
 *
 *     BUI.mix(A,{a:'a'});
 * </code></pre>
 * @singleton
 */  
var BUI = BUI || {};

define('bui/util',function(){
  
    //兼容jquery 1.6以下
    (function($){
      if($.fn){
        $.fn.on = $.fn.on || $.fn.bind;
        $.fn.off = $.fn.off || $.fn.unbind;
      }
     
    })(jQuery);
    
  var win = window,
    doc = document,
    objectPrototype = Object.prototype,
    toString = objectPrototype.toString,
    ATTRS = 'ATTRS',
    PARSER = 'PARSER',
    GUID_DEFAULT = 'guid';

  $.extend(BUI,
  {
    /**
     * 版本号
     * @memberOf BUI
     * @type {Number}
     */
    version:1.0,

    /**
     * 子版本号
     * @type {String}
     */
    subVersion : 2,

    /**
     * 是否为函数
     * @param  {*} fn 对象
     * @return {Boolean}  是否函数
     */
    isFunction : function(fn){
      return typeof(fn) === 'function';
    },
    /**
     * 是否数组
     * @method 
     * @param  {*}  obj 是否数组
     * @return {Boolean}  是否数组
     */
    isArray : ('isArray' in Array) ? Array.isArray : function(value) {
        return toString.call(value) === '[object Array]';
    },
    /**
     * 是否日期
     * @param  {*}  value 对象
     * @return {Boolean}  是否日期
     */
    isDate: function(value) {
        return toString.call(value) === '[object Date]';
    },
    /**
     * 是否是javascript对象
     * @param {Object} value The value to test
     * @return {Boolean}
     * @method
     */
    isObject: (toString.call(null) === '[object Object]') ?
    function(value) {
        // check ownerDocument here as well to exclude DOM nodes
        return value !== null && value !== undefined && toString.call(value) === '[object Object]' && value.ownerDocument === undefined;
    } :
    function(value) {
        return toString.call(value) === '[object Object]';
    },
    /**
     * 将指定的方法或属性放到构造函数的原型链上，
     * 函数支持多于2个变量，后面的变量同s1一样将其成员复制到构造函数的原型链上。
     * @param  {Function} r  构造函数
     * @param  {Object} s1 将s1 的成员复制到构造函数的原型链上
     *			@example
     *			BUI.augment(class1,{
     *				method1: function(){
     *   
     *				}
     *			});
     */
    augment : function(r,s1){
      if(!BUI.isFunction(r))
      {
        return r;
      }
      for (var i = 1; i < arguments.length; i++) {
        BUI.mix(r.prototype,arguments[i].prototype || arguments[i]);
      };
      return r;
    },
    /**
     * 拷贝对象
     * @param  {Object} obj 要拷贝的对象
     * @return {Object} 拷贝生成的对象
     */
    cloneObject : function(obj){
            var result = BUI.isArray(obj) ? [] : {};
            
      return BUI.mix(true,result,obj);
    },
    /**
    * 抛出错误
    */
    error : function(msg){
        if(BUI.debug){
            throw msg;
        }
    },
    /**
     * 实现类的继承，通过父类生成子类
     * @param  {Function} subclass
     * @param  {Function} superclass 父类构造函数
     * @param  {Object} overrides  子类的属性或者方法
     * @return {Function} 返回的子类构造函数
		 * 示例:
     *		@example
     *		//父类
     *		function base(){
     * 
     *		}
     *
     *		function sub(){
     * 
     *		}
     *		//子类
     *		BUI.extend(sub,base,{
     *			method : function(){
     *    
     *			}
     *		});
     *
     *		//或者
     *		var sub = BUI.extend(base,{});
     */
    extend : function(subclass,superclass,overrides, staticOverrides){
      //如果只提供父类构造函数，则自动生成子类构造函数
      if(!BUI.isFunction(superclass))
      {
        
        overrides = superclass;
        superclass = subclass;
        subclass =  function(){};
      }

      var create = Object.create ?
            function (proto, c) {
                return Object.create(proto, {
                    constructor: {
                        value: c
                    }
                });
            } :
            function (proto, c) {
                function F() {
                }

                F.prototype = proto;

                var o = new F();
                o.constructor = c;
                return o;
            };
      var superObj = create(superclass.prototype,subclass);//new superclass(),//实例化父类作为子类的prototype
      subclass.prototype = BUI.mix(superObj,subclass.prototype);     //指定子类的prototype
      subclass.superclass = create(superclass.prototype,superclass);  
      BUI.mix(superObj,overrides);
      BUI.mix(subclass,staticOverrides);
      return subclass;
    },
    /**
     * 生成唯一的Id
     * @method
     * @param {String} prefix 前缀
     * @default 'bui-guid'
     * @return {String} 唯一的编号
     */
    guid : (function(){
        var map = {};
        return function(prefix){
            prefix = prefix || BUI.prefix + GUID_DEFAULT;
            if(!map[prefix]){
                map[prefix] = 1;
            }else{
                map[prefix] += 1;
            }
            return prefix + map[prefix];
        };
    })(),
    /**
     * 判断是否是字符串
     * @return {Boolean} 是否是字符串
     */
    isString : function(value){
      return typeof value === 'string';
    },
    /**
     * 判断是否数字，由于$.isNumberic方法会把 '123'认为数字
     * @return {Boolean} 是否数字
     */
    isNumber : function(value){
      return typeof value === 'number';
    },
    /**
     * 控制台输出日志
     * @param  {Object} obj 输出的数据
     */
    log : function(obj){
      if(BUI.debug && win.console && win.console.log){
        win.console.log(obj);
      }
    },
    /**
    * 将多个对象的属性复制到一个新的对象
    */
    merge : function(){
      var args = $.makeArray(arguments);
      args.unshift({});
      return BUI.mix.apply(null,args);

    },
    /**
     * 封装 jQuery.extend 方法，将多个对象的属性merge到第一个对象中
     * @return {Object} 
     */
    mix : function(){
      return $.extend.apply(null,arguments);
    },
    /**
    * 创造顶层的命名空间，附加到window对象上,
    * 包含namespace方法
    */
    app : function(name){
      if(!window[name]){
        window[name] = {
          namespace :function(nsName){
            return BUI.namespace(nsName,window[name]);
          }
        };
      }
      return window[name];
    },
    /**
     * 将其他类作为mixin集成到指定类上面
     * @param {Function} c 构造函数
     * @param {Array} mixins 扩展类
     * @param {Array} attrs 扩展的静态属性，默认为['ATTRS']
     * @return {Function} 传入的构造函数
     */
    mixin : function(c,mixins,attrs){
        attrs = attrs || [ATTRS,PARSER];
        var extensions = mixins;
        if (extensions) {
            c.mixins = extensions;

            var desc = {
                // ATTRS:
                // HTML_PARSER:
            }, constructors = extensions['concat'](c);

            // [ex1,ex2]，扩展类后面的优先，ex2 定义的覆盖 ex1 定义的
            // 主类最优先
            BUI.each(constructors, function (ext) {
                if (ext) {
                    // 合并 ATTRS/HTML_PARSER 到主类
                    BUI.each(attrs, function (K) {
                        if (ext[K]) {
                            desc[K] = desc[K] || {};
                            // 不覆盖主类上的定义，因为继承层次上扩展类比主类层次高
                            // 但是值是对象的话会深度合并
                            // 注意：最好值是简单对象，自定义 new 出来的对象就会有问题(用 function return 出来)!
                             BUI.mix(true,desc[K], ext[K]);
                        }
                    });
                }
            });

            BUI.each(desc, function (v,k) {
                c[k] = v;
            });

            var prototype = {};

            // 主类最优先
            BUI.each(constructors, function (ext) {
                if (ext) {
                    var proto = ext.prototype;
                    // 合并功能代码到主类，不覆盖
                    for (var p in proto) {
                        // 不覆盖主类，但是主类的父类还是覆盖吧
                        if (proto.hasOwnProperty(p)) {
                            prototype[p] = proto[p];
                        }
                    }
                }
            });

            BUI.each(prototype, function (v,k) {
                c.prototype[k] = v;
            });
        }
        return c;
    },
    /**
     * 生成命名空间
     * @param  {String} name 命名空间的名称
     * @param  {Object} baseNS 在已有的命名空间上创建命名空间，默认“BUI”
     * @return {Object} 返回的命名空间对象
     *		@example
     *		BUI.namespace("Grid"); // BUI.Grid
     */
    namespace : function(name,baseNS){
      baseNS = baseNS || BUI;
      if(!name){
        return baseNS;
      }
      var list = name.split('.'),
        //firstNS = win[list[0]],
        curNS = baseNS;
      
      for (var i = 0; i < list.length; i++) {
        var nsName = list[i];
        if(!curNS[nsName]){
          curNS[nsName] = {};
        }
        curNS = curNS[nsName];
      };    
      return curNS;
    },
    /**
     * BUI 控件的公用前缀
     * @type {String}
     */
    prefix : 'bui-',
    /**
     * 替换字符串中的字段.
     * @param {String} str 模版字符串
     * @param {Object} o json data
     * @param {RegExp} [regexp] 匹配字符串的正则表达式
     */
    substitute: function (str, o, regexp) {
        if (!BUI.isString(str)
            || (!BUI.isObject(o)) && !BUI.isArray(o)) {
            return str;
        }

        return str.replace(regexp || /\\?\{([^{}]+)\}/g, function (match, name) {
            if (match.charAt(0) === '\\') {
                return match.slice(1);
            }
            return (o[name] === undefined) ? '' : o[name];
        });
    },
    /**
     * 使第一个字母变成大写
     * @param  {String} s 字符串
     * @return {String} 首字母大写后的字符串
     */
    ucfirst : function(s){
      s += '';
            return s.charAt(0).toUpperCase() + s.substring(1);
    },
    /**
     * 页面上的一点是否在用户的视图内
     * @param {Object} offset 坐标，left,top
     * @return {Boolean} 是否在视图内
     */
    isInView : function(offset){
      var left = offset.left,
        top = offset.top,
        viewWidth = BUI.viewportWidth(),
        wiewHeight = BUI.viewportHeight(),
        scrollTop = BUI.scrollTop(),
        scrollLeft = BUI.scrollLeft();
      //判断横坐标
      if(left < scrollLeft ||left > scrollLeft + viewWidth){
        return false;
      }
      //判断纵坐标
      if(top < scrollTop || top > scrollTop + wiewHeight){
        return false;
      }
      return true;
    },
    /**
     * 页面上的一点纵向坐标是否在用户的视图内
     * @param {Object} top  纵坐标
     * @return {Boolean} 是否在视图内
     */
    isInVerticalView : function(top){
      var wiewHeight = BUI.viewportHeight(),
        scrollTop = BUI.scrollTop();
      
      //判断纵坐标
      if(top < scrollTop || top > scrollTop + wiewHeight){
        return false;
      }
      return true;
    },
    /**
     * 页面上的一点横向坐标是否在用户的视图内
     * @param {Object} left 横坐标
     * @return {Boolean} 是否在视图内
     */
    isInHorizontalView : function(left){
      var viewWidth = BUI.viewportWidth(),     
        scrollLeft = BUI.scrollLeft();
      //判断横坐标
      if(left < scrollLeft ||left > scrollLeft + viewWidth){
        return false;
      }
      return true;
    },
    /**
     * 获取窗口可视范围宽度
     * @return {Number} 可视区宽度
     */
    viewportWidth : function(){
        return $(window).width();
    },
    /**
     * 获取窗口可视范围高度
     * @return {Number} 可视区高度
     */
    viewportHeight:function(){
         return $(window).height();
    },
    /**
     * 滚动到窗口的left位置
     */
    scrollLeft : function(){
        return $(window).scrollLeft();
    },
    /**
     * 滚动到横向位置
     */
    scrollTop : function(){
        return $(window).scrollTop();
    },
    /**
     * 窗口宽度
     * @return {Number} 窗口宽度
     */
    docWidth : function(){
        var body = document.documentElement || document.body;
        return $(body).width();
    },
    /**
     * 窗口高度
     * @return {Number} 窗口高度
     */
    docHeight : function(){
        var body = document.documentElement || document.body;
        return $(body).height();
    },
    /**
     * 遍历数组或者对象
     * @param {Object|Array} element/Object 数组中的元素或者对象的值 
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){}
     */
    each : function (elements,func) {
      if(!elements){
        return;
      }
      $.each(elements,function(k,v){
        return func(v,k);
      });
    },
    /**
     * 封装事件，便于使用上下文this,和便于解除事件时使用
     * @protected
     * @param  {Object} self   对象
     * @param  {String} action 事件名称
     */
    wrapBehavior : function(self, action) {
      return self['__bui_wrap_' + action] = function (e) {
        if (!self.get('disabled')) {
            self[action](e);
        }
      };
    },
    /**
     * 获取封装的事件
     * @protected
     * @param  {Object} self   对象
     * @param  {String} action 事件名称
     */
    getWrapBehavior : function(self, action) {
        return self['__bui_wrap_' + action];
    }

  });

  /**
  * 表单帮助类，序列化、反序列化，设置值
  * @class BUI.FormHelper
  * @singleton
  */
  var formHelper = BUI.FormHelper = {
    /**
    * 将表单格式化成键值对形式
    * @param {HTMLElement} form 表单
    * @return {Object} 键值对的对象
    */
    serializeToObject:function(form){
      var array = $(form).serializeArray(),
        result = {};
      BUI.each(array,function(item){
        var name = item.name;
        if(!result[name]){ //如果是单个值，直接赋值
          result[name] = item.value;  
        }else{ //多值使用数组
          if(!BUI.isArray(result[name])){
            result[name] = [result[name]];
          }
          result[name].push(item.value);
        }
      });
      return result;
    },
    /**
     * 设置表单的值
     * @param {HTMLElement} form 表单
     * @param {Object} obj  键值对
     */
    setFields : function(form,obj){
      for(var name in obj){
        if(obj.hasOwnProperty(name)){
          BUI.FormHelper.setField(form,name,obj[name]);
        }
      }
    },
    /**
     * 清空表单
     * @param  {HTMLElement} form 表单元素
     */
    clear : function(form){
      var elements = $.makeArray(form.elements);

      BUI.each(elements,function(element){
        if(element.type === 'checkbox' || element.type === 'radio' ){
          $(element).attr('checked',false);
        }else{
          $(element).val('');
        }
        $(element).change();
      });
    },
    /**
    * 设置表单字段
    * @param {HTMLElement} form 表单元素
    * @param {string} field 字段名 
    * @param {string} value 字段值
    */
    setField:function(form,fieldName,value){
      var fields = form.elements[fieldName];
      if(BUI.isArray(fields)){
        BUI.each(fields,function(field){
          if(field.type === 'checkbox'){
            if(field.value === value || BUI.Array.indexOf(field.value,value) !== -1){
              $(field).attr('checked',true);
            }else{
              $(field).attr('checked',false);  
            }
          }else if(field.type === 'radio'){
            if(field.value === value){
              $(field).attr('checked',true);
            }else{
              $(field).attr('checked',false); 
            }    
          }else{
            $(field).val(value);
          }
        
        });
      }else{
        $(fields).val(value);
      }
    },
    /**
     * 获取表单字段值
     * @param {HTMLElement} form 表单元素
     * @param {string} field 字段名 
     * @return {String}   字段值
     */
    getField : function(form,fieldName){
      return BUI.FormHelper.serializeToObject(form)[fieldName];
    }
  };

  return BUI;
});
/**
 * @fileOverview 数组帮助类
 * @ignore
 */

/**
 * @class BUI
 * 控件库的基础命名空间
 * @singleton
 */

define('bui/array',['bui/util'],function (r) {
  
  var BUI = r('bui/util');
  /**
   * @class BUI.Array
   * 数组帮助类
   */
  BUI.Array ={
    /**
     * 返回数组的最后一个对象
     * @param {Array} array 数组或者类似于数组的对象.
     * @return {*} 数组的最后一项.
     */
    peek : function(array) {
      return array[array.length - 1];
    },
    /**
     * 查找记录所在的位置
     * @param  {*} value 值
     * @param  {Array} array 数组或者类似于数组的对象
     * @param  {Number} [fromIndex=0] 起始项，默认为0
     * @return {Number} 位置，如果为 -1则不在数组内
     */
    indexOf : function(value, array,opt_fromIndex){
       var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, array.length + opt_fromIndex) : opt_fromIndex);

      for (var i = fromIndex; i < array.length; i++) {
        if (i in array && array[i] === value)
          return i;
      }
      return -1;
    },
    /**
     * 数组是否存在指定值
     * @param  {*} value 值
     * @param  {Array} array 数组或者类似于数组的对象
     * @return {Boolean} 是否存在于数组中
     */
    contains : function(value,array){
      return BUI.Array.indexOf(value,array) >=0;
    },
    /**
     * 遍历数组或者对象
     * @method 
     * @param {Object|Array} element/Object 数组中的元素或者对象的值 
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){}
     */
    each : BUI.each,
    /**
     * 2个数组内部的值是否相等
     * @param  {Array} a1 数组1
     * @param  {Array} a2 数组2
     * @return {Boolean} 2个数组相等或者内部元素是否相等
     */
    equals : function(a1,a2){
      if(a1 == a2){
        return true;
      }
      if(!a1 || !a2){
        return false;
      }

      if(a1.length != a2.length){
        return false;
      }
      var rst = true;
      for(var i = 0 ;i < a1.length; i++){
        if(a1[i] !== a2[i]){
          rst = false;
          break;
        }
      }
      return rst;
    },

    /**
     * 过滤数组
     * @param {Object|Array} element/Object 数组中的元素或者对象的值 
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){},如果返回true则添加到结果集
     * @return {Array} 过滤的结果集
     */
    filter : function(array,func){
      var result = [];
      BUI.Array.each(array,function(value,index){
        if(func(value,index)){
          result.push(value);
        }
      });
      return result;
    },
    /**
     * 转换数组数组
     * @param {Object|Array} element/Object 数组中的元素或者对象的值 
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){},将返回的结果添加到结果集
     * @return {Array} 过滤的结果集
     */
    map : function(array,func){
      var result = [];
      BUI.Array.each(array,function(value,index){
        result.push(func(value,index));
      });
      return result;
    },
    /**
     * 获取第一个符合条件的数据
     * @param  {Array} array 数组
     * @param  {Function} func  匹配函数
     * @return {*}  符合条件的数据
     */
    find : function(array,func){
      var i = BUI.Array.findIndex(array, func);
      return i < 0 ? null : array[i];
    },
    /**
     * 获取第一个符合条件的数据的索引值
    * @param  {Array} array 数组
     * @param  {Function} func  匹配函数
     * @return {Number} 符合条件的数据的索引值
     */
    findIndex : function(array,func){
      var result = -1;
      BUI.Array.each(array,function(value,index){
        if(func(value,index)){
          result = index;
          return false;
        }
      });
      return result;
    },
    /**
     * 数组是否为空
     * @param  {Array}  array 数组
     * @return {Boolean}  是否为空
     */
    isEmpty : function(array){
      return array.length == 0;
    },
    /**
     * 插入数组
     * @param  {Array} array 数组
     * @param  {Number} index 位置
     * @param {*} value 插入的数据
     */
    add : function(array,value){
      array.push(value);
    },
    /**
     * 将数据插入数组指定的位置
     * @param  {Array} array 数组
     * @param {*} value 插入的数据
     * @param  {Number} index 位置
     */
    addAt : function(array,value,index){
      BUI.Array.splice(array, index, 0, value);
    },
    /**
     * 清空数组
     * @param  {Array} array 数组
     * @return {Array}  清空后的数组
     */
    empty : function(array){
      if(!(array instanceof(Array))){
        for (var i = array.length - 1; i >= 0; i--) {
          delete array[i];
        }
      }
      array.length = 0;
    },
    /**
     * 移除记录
     * @param  {Array} array 数组
     * @param  {*} value 记录
     * @return {Boolean}   是否移除成功
     */
    remove : function(array,value){
      var i = BUI.Array.indexOf(value, array);
      var rv;
      if ((rv = i >= 0)) {
        BUI.Array.removeAt(array, i);
      }
      return rv;
    },
    /**
     * 移除指定位置的记录
     * @param  {Array} array 数组
     * @param  {Number} index 索引值
     * @return {Boolean}   是否移除成功
     */
    removeAt : function(array,index){
      return BUI.Array.splice(array, index, 1).length == 1;
    },
    /**
     * @private
     */
    slice : function(arr, start, opt_end){
      if (arguments.length <= 2) {
        return Array.prototype.slice.call(arr, start);
      } else {
        return Array.prototype.slice.call(arr, start, opt_end);
      }
    },
    /**
     * @private
     */
    splice : function(arr, index, howMany, var_args){
      return Array.prototype.splice.apply(arr, BUI.Array.slice(arguments, 1))
    }

  };
  return BUI.Array;
});
/**
 * @fileOverview 观察者模式实现事件
 * @ignore
 */

define('bui/observable',['bui/util'],function (r) {
  
  var BUI = r('bui/util');
  /**
   * @private
   * @class BUI.Observable.Callbacks
   * jquery 1.7 时存在 $.Callbacks,但是fireWith的返回结果是$.Callbacks 对象，
   * 而我们想要的效果是：当其中有一个函数返回为false时，阻止后面的执行，并返回false
   */
  var Callbacks = function(){
    this._init();
  };

  BUI.augment(Callbacks,{

    _functions : null,

    _init : function(){
      var _self = this;

      _self._functions = [];
    },
    /**
     * 添加回调函数
     * @param {Function} fn 回调函数
     */
    add:function(fn){
      this._functions.push(fn);
    },
    /**
     * 移除回调函数
     * @param  {Function} fn 回调函数
     */
    remove : function(fn){
      var functions = this._functions;
        index = BUI.Array.indexOf(fn,functions);
      if(index>=0){
        functions.splice(index,1);
      }
    },
    empty : function(){
      var length = this._functions.length; //ie6,7下，必须指定需要删除的数量
      this._functions.splice(0,length);
    },
    /**
     * 触发回调
     * @param  {Object} scope 上下文
     * @param  {Array} args  回调函数的参数
     * @return {Boolean|undefined} 当其中有一个函数返回为false时，阻止后面的执行，并返回false
     */
    fireWith : function(scope,args){
      var _self = this,
        rst;

      BUI.each(_self._functions,function(fn){
        rst = fn.apply(scope,args);
        if(rst === false){
          return false;
        }
      });
      return rst;
    }
  });

  function getCallbacks(){
    return new Callbacks();
  }
  /**
   * 支持事件的对象，参考观察者模式
   *  - 此类提供事件绑定
   *  - 提供事件冒泡机制
   *
   * <pre><code>
   *   var control = new Control();
   *   control.on('click',function(ev){
   *   
   *   });
   *
   *   control.off();  //移除所有事件
   * </code></pre>
   * @class BUI.Observable
   * @abstract
   * @param {Object} config 配置项键值对
   */
  var Observable = function(config){
        this._events = [];
        this._eventMap = {};
        this._bubblesEvents = [];
    this._initEvents(config);
  };

  BUI.augment(Observable,
  {

    /**
     * @cfg {Object} listeners 
     *  初始化事件,快速注册事件
     *  <pre><code>
     *    var list = new BUI.List.SimpleList({
     *      listeners : {
     *        itemclick : function(ev){},
     *        itemrendered : function(ev){}
     *      },
     *      items : []
     *    });
     *    list.render();
     *  </code></pre>
     */
    
    /**
     * @cfg {Function} handler
     * 点击事件的处理函数，快速配置点击事件而不需要写listeners属性
     * <pre><code>
     *    var list = new BUI.List.SimpleList({
     *      handler : function(ev){} //click 事件
     *    });
     *    list.render();
     *  </code></pre>
     */
    
    /**
     * 支持的事件名列表
     * @private
     */
    _events:[],

    /**
     * 绑定的事件
     * @private
     */
    _eventMap : {},

    _bubblesEvents : [],

    _bubbleTarget : null,

    //获取回调集合
    _getCallbacks : function(eventType){
      var _self = this,
        eventMap = _self._eventMap;
      return eventMap[eventType];
    },
    //初始化事件列表
    _initEvents : function(config){
      var _self = this,
        listeners = null; 

      if(!config){
        return;
      }
      listeners = config.listeners || {};
      if(config.handler){
        listeners.click = config.handler;
      }
      if(listeners){
        for (var name in listeners) {
          if(listeners.hasOwnProperty(name)){
            _self.on(name,listeners[name]);
          }
        };
      }
    },
    //事件是否支持冒泡
    _isBubbles : function (eventType) {
        return BUI.Array.indexOf(eventType,this._bubblesEvents) >= 0;
    },
    /**
     * 添加冒泡的对象
     * @protected
     * @param {Object} target  冒泡的事件源
     */
    addTarget : function(target) {
        this._bubbleTarget = target;
    },
    /**
     * 添加支持的事件
     * @protected
     * @param {String|String[]} events 事件
     */
    addEvents : function(events){
      var _self = this,
        existEvents = _self._events,
        eventMap = _self._eventMap;

      function addEvent(eventType){
        if(BUI.Array.indexOf(eventType,existEvents) === -1){
          eventMap[eventType] = getCallbacks();
          existEvents.push(eventType);
        }
      }
      if(BUI.isArray(events)){
        $.each(events,function(index,eventType){
          addEvent(eventType);
        });
      }else{
        addEvent(events);
      }
    },
    /**
     * 移除所有绑定的事件
     * @protected
     */
    clearListeners : function(){
      var _self = this,
        eventMap = _self._eventMap;
      for(var name in eventMap){
        if(eventMap.hasOwnProperty(name)){
          eventMap[name].empty();
        }
      }
    },
    /**
     * 触发事件
     * <pre><code>
     *   //绑定事件
     *   list.on('itemclick',function(ev){
     *     alert('21');
     *   });
     *   //触发事件
     *   list.fire('itemclick');
     * </code></pre>
     * @param  {String} eventType 事件类型
     * @param  {Object} eventData 事件触发时传递的数据
     * @return {Boolean|undefined}  如果其中一个事件处理器返回 false , 则返回 false, 否则返回最后一个事件处理器的返回值
     */
    fire : function(eventType,eventData){
      var _self = this,
        callbacks = _self._getCallbacks(eventType),
        args = $.makeArray(arguments),
        result;
      if(!eventData){
        eventData = {};
        args.push(eventData);
      }
      if(!eventData.target){
        eventData.target = _self;
      }
      if(callbacks){
        result = callbacks.fireWith(_self,Array.prototype.slice.call(args,1));
      }
      if(_self._isBubbles(eventType)){
          var bubbleTarget = _self._bubbleTarget;
          if(bubbleTarget && bubbleTarget.fire){
              bubbleTarget.fire(eventType,eventData);
          }
      }
      return result;
    },
    /**
     * 添加绑定事件
     * <pre><code>
     *   //绑定单个事件
     *   list.on('itemclick',function(ev){
     *     alert('21');
     *   });
     *   //绑定多个事件
     *   list.on('itemrendered itemupdated',function(){
     *     //列表项创建、更新时触发操作
     *   });
     * </code></pre>
     * @param  {String}   eventType 事件类型
     * @param  {Function} fn        回调函数
     */
    on : function(eventType,fn){
      //一次监听多个事件
      var arr = eventType.split(' '),
        _self = this,
        callbacks =null;
      if(arr.length > 1){
        BUI.each(arr,function(name){
          _self.on(name,fn);
        });
      }else{
        callbacks = _self._getCallbacks(eventType);
        if(callbacks){
          callbacks.add(fn);
        }else{
          _self.addEvents(eventType);
          _self.on(eventType,fn);
        }
      }
      return _self;
    },
    /**
     * 移除绑定的事件
     * <pre><code>
     *  //移除所有事件
     *  list.off();
     *  
     *  //移除特定事件
     *  function callback(ev){}
     *  list.on('click',callback);
     *
     *  list.off('click',callback);//需要保存回调函数的引用
     * 
     * </code></pre>
     * @param  {String}   eventType 事件类型
     * @param  {Function} fn        回调函数
     */
    off : function(eventType,fn){
      if(!eventType && !fn){
        this.clearListeners();
        return this;
      }
      var _self = this,
        callbacks = _self._getCallbacks(eventType);
      if(callbacks){
        callbacks.remove(fn);
      }
      return _self;
    },
    /**
     * 配置事件是否允许冒泡
     * @protected
     * @param  {String} eventType 支持冒泡的事件
     * @param  {Object} cfg 配置项
     * @param {Boolean} cfg.bubbles 是否支持冒泡
     */
    publish : function(eventType, cfg){
      var _self = this,
          bubblesEvents = _self._bubblesEvents;

      if(cfg.bubbles){
          if(BUI.Array.indexOf(eventType,bubblesEvents) === -1){
              bubblesEvents.push(eventType);
          }
      }else{
          var index = BUI.Array.indexOf(eventType,bubblesEvents);
          if(index !== -1){
              bubblesEvents.splice(index,1);
          }
      }
    }
  });

  return Observable;
});
/**
 * @fileOverview UA,jQuery的 $.browser 对象非常难使用
 * @ignore
 * @author dxq613@gmail.com
 */
define('bui/ua',function(){

    function numberify(s) {
        var c = 0;
        // convert '1.2.3.4' to 1.234
        return parseFloat(s.replace(/\./g, function () {
            return (c++ === 0) ? '.' : '';
        }));
    };

    var UA = $.UA || (function(){
        var browser = $.browser,
            versionNumber = numberify(browser.version),
            /**
             * 浏览器版本检测
             * @class BUI.UA
                     * @singleton
             */
            ua = 
            {
                /**
                 * ie 版本
                 * @type {Number}
                 */
                ie : browser.msie && versionNumber,

                /**
                 * webkit 版本
                 * @type {Number}
                 */
                webkit : browser.webkit && versionNumber,
                /**
                 * opera 版本
                 * @type {Number}
                 */
                opera : browser.opera && versionNumber,
                /**
                 * mozilla 火狐版本
                 * @type {Number}
                 */
                mozilla : browser.mozilla && versionNumber
            };
        return ua;
    })();

    return UA;
});
/**
 * @fileOverview 由于jQuery只有 parseJSON ，没有stringify所以使用过程不方便
 * @ignore
 */
define('bui/json',['bui/ua'],function (require) {

  var win = window,
    UA = require('bui/ua'),
    JSON = win.JSON;

  // ie 8.0.7600.16315@win7 json 有问题
  if (!JSON || UA['ie'] < 9) {
      JSON = win.JSON = {};
  }

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  if (typeof Date.prototype.toJSON !== 'function') {

      Date.prototype.toJSON = function (key) {

          return isFinite(this.valueOf()) ?
              this.getUTCFullYear() + '-' +
                  f(this.getUTCMonth() + 1) + '-' +
                  f(this.getUTCDate()) + 'T' +
                  f(this.getUTCHours()) + ':' +
                  f(this.getUTCMinutes()) + ':' +
                  f(this.getUTCSeconds()) + 'Z' : null;
      };

      String.prototype.toJSON =
          Number.prototype.toJSON =
              Boolean.prototype.toJSON = function (key) {
                  return this.valueOf();
              };
  }


  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

    function quote(string) {

      // If the string contains no control characters, no quote characters, and no
      // backslash characters, then we can safely slap some quotes around it.
      // Otherwise we must also replace the offending characters with safe escape
      // sequences.

      escapable['lastIndex'] = 0;
      return escapable.test(string) ?
          '"' + string.replace(escapable, function (a) {
              var c = meta[a];
              return typeof c === 'string' ? c :
                  '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          }) + '"' :
          '"' + string + '"';
    }

    function str(key, holder) {

      // Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

      // If the value has a toJSON method, call it to obtain a replacement value.

      if (value && typeof value === 'object' &&
          typeof value.toJSON === 'function') {
          value = value.toJSON(key);
      }

      // If we were called with a replacer function, then call the replacer to
      // obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

      // What happens next depends on the value's type.

      switch (typeof value) {
          case 'string':
              return quote(value);

          case 'number':

      // JSON numbers must be finite. Encode non-finite numbers as null.

              return isFinite(value) ? String(value) : 'null';

          case 'boolean':
          case 'null':

      // If the value is a boolean or null, convert it to a string. Note:
      // typeof null does not produce 'null'. The case is included here in
      // the remote chance that this gets fixed someday.

              return String(value);

      // If the type is 'object', we might be dealing with an object or an array or
      // null.

          case 'object':

      // Due to a specification blunder in ECMAScript, typeof null is 'object',
      // so watch out for that case.

              if (!value) {
                  return 'null';
              }

      // Make an array to hold the partial results of stringifying this object value.

              gap += indent;
              partial = [];

      // Is the value an array?

              if (Object.prototype.toString.apply(value) === '[object Array]') {

      // The value is an array. Stringify every element. Use null as a placeholder
      // for non-JSON values.

                  length = value.length;
                  for (i = 0; i < length; i += 1) {
                      partial[i] = str(i, value) || 'null';
                  }

      // Join all of the elements together, separated with commas, and wrap them in
      // brackets.

                  v = partial.length === 0 ? '[]' :
                      gap ? '[\n' + gap +
                          partial.join(',\n' + gap) + '\n' +
                          mind + ']' :
                          '[' + partial.join(',') + ']';
                  gap = mind;
                  return v;
              }

      // If the replacer is an array, use it to select the members to be stringified.

              if (rep && typeof rep === 'object') {
                  length = rep.length;
                  for (i = 0; i < length; i += 1) {
                      k = rep[i];
                      if (typeof k === 'string') {
                          v = str(k, value);
                          if (v) {
                              partial.push(quote(k) + (gap ? ': ' : ':') + v);
                          }
                      }
                  }
              } else {

      // Otherwise, iterate through all of the keys in the object.

                  for (k in value) {
                      if (Object.hasOwnProperty.call(value, k)) {
                          v = str(k, value);
                          if (v) {
                              partial.push(quote(k) + (gap ? ': ' : ':') + v);
                          }
                      }
                  }
              }

      // Join all of the member texts together, separated with commas,
      // and wrap them in braces.

              v = partial.length === 0 ? '{}' :
                  gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                      mind + '}' : '{' + partial.join(',') + '}';
              gap = mind;
              return v;
      }
  }

  if (typeof JSON.stringify !== 'function') {
    JSON.stringify = function (value, replacer, space) {

      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

      // If the space parameter is a number, make an indent string containing that
      // many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

      // If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

      // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
          (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.

      return str('', {'': value});
      };
    }

  function looseParse(data){
    try{
      return new Function('return ' + data + ';')();
    }catch(e){
      throw 'Json parse error!';
    }
  }
 /**
	* JSON 格式化
  * @class BUI.JSON
	* @singleton
  */
  var JSON = {
    /**
     * 转成json 等同于$.parseJSON
     * @method
     * @param {String} jsonstring 合法的json 字符串
     */
    parse : $.parseJSON,
    /**
     * 业务中有些字符串组成的json数据不是严格的json数据，如使用单引号，或者属性名不是字符串
     * 如 ： {a:'abc'}
     * @method 
     * @param {String} jsonstring
     */
    looseParse : looseParse,
    /**
     * 将Json转成字符串
     * @method 
     * @param {Object} json json 对象
     */
    stringify : JSON.stringify
  }

  return JSON;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 跟指定的元素项对齐的方式
 * @author yiminghe@gmail.com
 * copied by dxq613@gmail.com
 * @ignore
 */


define('bui/component/uibase/align',['bui/ua'],function (require) {
    var UA = require('bui/ua'),
        CLS_ALIGN_PREFIX ='x-align-',
        win = window;

    // var ieMode = document.documentMode || UA.ie;

    /*
     inspired by closure library by Google
     see http://yiminghe.iteye.com/blog/1124720
     */

    /**
     * 得到会导致元素显示不全的祖先元素
     * @ignore
     */
    function getOffsetParent(element) {
        // ie 这个也不是完全可行
        /**
         <div style="width: 50px;height: 100px;overflow: hidden">
         <div style="width: 50px;height: 100px;position: relative;" id="d6">
         元素 6 高 100px 宽 50px<br/>
         </div>
         </div>
         @ignore
         **/
        // element.offsetParent does the right thing in ie7 and below. Return parent with layout!
        //  In other browsers it only includes elements with position absolute, relative or
        // fixed, not elements with overflow set to auto or scroll.
        //        if (UA.ie && ieMode < 8) {
        //            return element.offsetParent;
        //        }
                // 统一的 offsetParent 方法
        var doc = element.ownerDocument,
            body = doc.body,
            parent,
            positionStyle = $(element).css('position'),
            skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';

        if (!skipStatic) {
            return element.nodeName.toLowerCase() == 'html' ? null : element.parentNode;
        }

        for (parent = element.parentNode; parent && parent != body; parent = parent.parentNode) {
            positionStyle = $(parent).css('position');
            if (positionStyle != 'static') {
                return parent;
            }
        }
        return null;
    }

    /**
     * 获得元素的显示部分的区域
     * @private
     * @ignore
     */
    function getVisibleRectForElement(element) {
        var visibleRect = {
                left:0,
                right:Infinity,
                top:0,
                bottom:Infinity
            },
            el,
            scrollX,
            scrollY,
            winSize,
            doc = element.ownerDocument,
            body = doc.body,
            documentElement = doc.documentElement;

        // Determine the size of the visible rect by climbing the dom accounting for
        // all scrollable containers.
        for (el = element; el = getOffsetParent(el);) {
            // clientWidth is zero for inline block elements in ie.
            if ((!UA.ie || el.clientWidth != 0) &&
                // body may have overflow set on it, yet we still get the entire
                // viewport. In some browsers, el.offsetParent may be
                // document.documentElement, so check for that too.
                (el != body && el != documentElement && $(el).css('overflow') != 'visible')) {
                var pos = $(el).offset();
                // add border
                pos.left += el.clientLeft;
                pos.top += el.clientTop;

                visibleRect.top = Math.max(visibleRect.top, pos.top);
                visibleRect.right = Math.min(visibleRect.right,
                    // consider area without scrollBar
                    pos.left + el.clientWidth);
                visibleRect.bottom = Math.min(visibleRect.bottom,
                    pos.top + el.clientHeight);
                visibleRect.left = Math.max(visibleRect.left, pos.left);
            }
        }

        // Clip by window's viewport.
        scrollX = $(win).scrollLeft();
        scrollY = $(win).scrollTop();
        visibleRect.left = Math.max(visibleRect.left, scrollX);
        visibleRect.top = Math.max(visibleRect.top, scrollY);
        winSize = {
            width:BUI.viewportWidth(),
            height:BUI.viewportHeight()
        };
        visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
        visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
        return visibleRect.top >= 0 && visibleRect.left >= 0 &&
            visibleRect.bottom > visibleRect.top &&
            visibleRect.right > visibleRect.left ?
            visibleRect : null;
    }

    function getElFuturePos(elRegion, refNodeRegion, points, offset) {
        var xy,
            diff,
            p1,
            p2;

        xy = {
            left:elRegion.left,
            top:elRegion.top
        };

        p1 = getAlignOffset(refNodeRegion, points[0]);
        p2 = getAlignOffset(elRegion, points[1]);

        diff = [p2.left - p1.left, p2.top - p1.top];

        return {
            left:xy.left - diff[0] + (+offset[0]),
            top:xy.top - diff[1] + (+offset[1])
        };
    }

    function isFailX(elFuturePos, elRegion, visibleRect) {
        return elFuturePos.left < visibleRect.left ||
            elFuturePos.left + elRegion.width > visibleRect.right;
    }

    function isFailY(elFuturePos, elRegion, visibleRect) {
        return elFuturePos.top < visibleRect.top ||
            elFuturePos.top + elRegion.height > visibleRect.bottom;
    }

    function adjustForViewport(elFuturePos, elRegion, visibleRect, overflow) {
        var pos = BUI.cloneObject(elFuturePos),
            size = {
                width:elRegion.width,
                height:elRegion.height
            };

        if (overflow.adjustX && pos.left < visibleRect.left) {
            pos.left = visibleRect.left;
        }

        // Left edge inside and right edge outside viewport, try to resize it.
        if (overflow['resizeWidth'] &&
            pos.left >= visibleRect.left &&
            pos.left + size.width > visibleRect.right) {
            size.width -= (pos.left + size.width) - visibleRect.right;
        }

        // Right edge outside viewport, try to move it.
        if (overflow.adjustX && pos.left + size.width > visibleRect.right) {
            // 保证左边界和可视区域左边界对齐
            pos.left = Math.max(visibleRect.right - size.width, visibleRect.left);
        }

        // Top edge outside viewport, try to move it.
        if (overflow.adjustY && pos.top < visibleRect.top) {
            pos.top = visibleRect.top;
        }

        // Top edge inside and bottom edge outside viewport, try to resize it.
        if (overflow['resizeHeight'] &&
            pos.top >= visibleRect.top &&
            pos.top + size.height > visibleRect.bottom) {
            size.height -= (pos.top + size.height) - visibleRect.bottom;
        }

        // Bottom edge outside viewport, try to move it.
        if (overflow.adjustY && pos.top + size.height > visibleRect.bottom) {
            // 保证上边界和可视区域上边界对齐
            pos.top = Math.max(visibleRect.bottom - size.height, visibleRect.top);
        }

        return BUI.mix(pos, size);
    }


    function flip(points, reg, map) {
        var ret = [];
        $.each(points, function (index,p) {
            ret.push(p.replace(reg, function (m) {
                return map[m];
            }));
        });
        return ret;
    }

    function flipOffset(offset, index) {
        offset[index] = -offset[index];
        return offset;
    }


    /**
     * @class BUI.Component.UIBase.Align
     * Align extension class.
     * Align component with specified element.
     * <img src="http://images.cnitblog.com/blog/111279/201304/09180221-201343d4265c46e7987e6b1c46d5461a.jpg"/>
     */
    function Align() {
    }


    Align.__getOffsetParent = getOffsetParent;

    Align.__getVisibleRectForElement = getVisibleRectForElement;

    Align.ATTRS =
    {
        /**
         * 对齐配置，详细说明请参看： <a href="http://www.cnblogs.com/zaohe/archive/2013/04/09/3010651.html">JS控件 对齐</a>
         * @cfg {Object} align
         * <pre><code>
         *  var overlay = new Overlay( {  
         *       align :{
         *         node: null,         // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
         *         points: ['cc','cc'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
         *         offset: [0, 0]      // 有效值为 [n, m]
         *       }
         *     }); 
         * </code></pre>
         */

        /**
         * 设置对齐属性
         * @type {Object}
         * @field
         * <code>
         *   var align =  {
         *        node: null,         // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
         *        points: ['cc','cc'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
         *        offset: [0, 0]      // 有效值为 [n, m]
         *     };
         *   overlay.set('align',align);
         * </code>
         */
        align:{
            value:{}
        }
    };

    function getRegion(node) {
        var offset, w, h;
        if (node.length && !$.isWindow(node[0])) {
            offset = node.offset();
            w = node.outerWidth();
            h = node.outerHeight();
        } else {
            offset = { left:BUI.scrollLeft(), top:BUI.scrollTop() };
            w = BUI.viewportWidth();
            h = BUI.viewportHeight();
        }
        offset.width = w;
        offset.height = h;
        return offset;
    }

    /**
     * 获取 node 上的 align 对齐点 相对于页面的坐标
     * @param region
     * @param align
     */
    function getAlignOffset(region, align) {
        var V = align.charAt(0),
            H = align.charAt(1),
            w = region.width,
            h = region.height,
            x, y;

        x = region.left;
        y = region.top;

        if (V === 'c') {
            y += h / 2;
        } else if (V === 'b') {
            y += h;
        }

        if (H === 'c') {
            x += w / 2;
        } else if (H === 'r') {
            x += w;
        }

        return { left:x, top:y };
    }

    //清除对齐的css样式
    function clearAlignCls(el){
        var cls = el.attr('class'),
            regex = new RegExp('\s?'+CLS_ALIGN_PREFIX+'[a-z]{2}-[a-z]{2}','ig'),
            arr = regex.exec(cls);
        if(arr){
            el.removeClass(arr.join(' '));
        }
    }

    Align.prototype =
    {
        _uiSetAlign:function (v,ev) {
            var alignCls = '',
                el,   
                selfAlign; //points 的第二个参数，是自己对齐于其他节点的的方式
            if (v && v.points) {
                this.align(v.node, v.points, v.offset, v.overflow);
                this.set('cachePosition',null);
                el = this.get('el');
                clearAlignCls(el);
                selfAlign = v.points.join('-');
                alignCls = CLS_ALIGN_PREFIX + selfAlign;
                el.addClass(alignCls);
                /**/
            }
        },

        /*
         对齐 Overlay 到 node 的 points 点, 偏移 offset 处
         @method
         @ignore
         @param {Element} node 参照元素, 可取配置选项中的设置, 也可是一元素
         @param {String[]} points 对齐方式
         @param {Number[]} [offset] 偏移
         */
        align:function (refNode, points, offset, overflow) {
            refNode = $(refNode || win);
            offset = offset && [].concat(offset) || [0, 0];
            overflow = overflow || {};

            var self = this,
                el = self.get('el'),
                fail = 0,
            // 当前节点可以被放置的显示区域
                visibleRect = getVisibleRectForElement(el[0]),
            // 当前节点所占的区域, left/top/width/height
                elRegion = getRegion(el),
            // 参照节点所占的区域, left/top/width/height
                refNodeRegion = getRegion(refNode),
            // 当前节点将要被放置的位置
                elFuturePos = getElFuturePos(elRegion, refNodeRegion, points, offset),
            // 当前节点将要所处的区域
                newElRegion = BUI.merge(elRegion, elFuturePos);

            // 如果可视区域不能完全放置当前节点时允许调整
            if (visibleRect && (overflow.adjustX || overflow.adjustY)) {

                // 如果横向不能放下
                if (isFailX(elFuturePos, elRegion, visibleRect)) {
                    fail = 1;
                    // 对齐位置反下
                    points = flip(points, /[lr]/ig, {
                        l:'r',
                        r:'l'
                    });
                    // 偏移量也反下
                    offset = flipOffset(offset, 0);
                }

                // 如果纵向不能放下
                if (isFailY(elFuturePos, elRegion, visibleRect)) {
                    fail = 1;
                    // 对齐位置反下
                    points = flip(points, /[tb]/ig, {
                        t:'b',
                        b:'t'
                    });
                    // 偏移量也反下
                    offset = flipOffset(offset, 1);
                }

                // 如果失败，重新计算当前节点将要被放置的位置
                if (fail) {
                    elFuturePos = getElFuturePos(elRegion, refNodeRegion, points, offset);
                    BUI.mix(newElRegion, elFuturePos);
                }

                var newOverflowCfg = {};

                // 检查反下后的位置是否可以放下了
                // 如果仍然放不下只有指定了可以调整当前方向才调整
                newOverflowCfg.adjustX = overflow.adjustX &&
                    isFailX(elFuturePos, elRegion, visibleRect);

                newOverflowCfg.adjustY = overflow.adjustY &&
                    isFailY(elFuturePos, elRegion, visibleRect);

                // 确实要调整，甚至可能会调整高度宽度
                if (newOverflowCfg.adjustX || newOverflowCfg.adjustY) {
                    newElRegion = adjustForViewport(elFuturePos, elRegion,
                        visibleRect, newOverflowCfg);
                }
            }

            // 新区域位置发生了变化
            if (newElRegion.left != elRegion.left) {
                self.setInternal('x', null);
                self.get('view').setInternal('x', null);
                self.set('x', newElRegion.left);
            }

            if (newElRegion.top != elRegion.top) {
                // https://github.com/kissyteam/kissy/issues/190
                // 相对于屏幕位置没变，而 left/top 变了
                // 例如 <div 'relative'><el absolute></div>
                // el.align(div)
                self.setInternal('y', null);
                self.get('view').setInternal('y', null);
                self.set('y', newElRegion.top);
            }

            // 新区域高宽发生了变化
            if (newElRegion.width != elRegion.width) {
                el.width(el.width() + newElRegion.width - elRegion.width);
            }
            if (newElRegion.height != elRegion.height) {
                el.height(el.height() + newElRegion.height - elRegion.height);
            }

            return self;
        },

        /**
         * 对齐到元素的中间，查看属性 {@link BUI.Component.UIBase.Align#property-align} .
         * <pre><code>
         *  control.center('#t1'); //控件处于容器#t1的中间位置
         * </code></pre>
         * @param {undefined|String|HTMLElement|jQuery} node
         * 
         */
        center:function (node) {
            var self = this;
            self.set('align', {
                node:node,
                points:['cc', 'cc'],
                offset:[0, 0]
            });
            return self;
        }
    };
    
  return Align;
});
/**
 * @fileOverview 点击或移出控件外部，控件隐藏
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/component/uibase/autohide',function () {

  var wrapBehavior = BUI.wrapBehavior,
      getWrapBehavior = BUI.getWrapBehavior;

  function isExcept(self,elem){
    var hideExceptNode = self.get('hideExceptNode');
    if(hideExceptNode && hideExceptNode.length){
      return $.contains(hideExceptNode[0],elem);
    }
    return false;
  }
  /**
   * 点击隐藏控件的扩展
   * @class BUI.Component.UIBase.AutoHide
   */
  function autoHide() {
  
  }

  autoHide.ATTRS = {

    /**
     * 控件自动隐藏的事件，这里支持2种：
     *  - 'click'
     *  - 'leave'
     *  <pre><code>
     *    var overlay = new Overlay({ //点击#t1时显示，点击#t1之外的元素隐藏
     *      trigger : '#t1',
     *      autoHide : true,
     *      content : '悬浮内容'
     *    });
     *    overlay.render();
     *
     *    var overlay = new Overlay({ //移动到#t1时显示，移动出#t1,overlay之外控件隐藏
     *      trigger : '#t1',
     *      autoHide : true,
     *      triggerEvent :'mouseover',
     *      autoHideType : 'leave',
     *      content : '悬浮内容'
     *    });
     *    overlay.render();
     * 
     *  </code></pre>
     * @cfg {String} [autoHideType = 'click']
     */
    /**
     * 控件自动隐藏的事件，这里支持2种：
     * 'click',和'leave',默认为'click'
     * @type {String}
     */
    autoHideType : {
      value : 'click'
    },
    /**
     * 是否自动隐藏
     * <pre><code>
     *  
     *  var overlay = new Overlay({ //点击#t1时显示，点击#t1,overlay之外的元素隐藏
     *    trigger : '#t1',
     *    autoHide : true,
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {Object} autoHide
     */
    /**
     * 是否自动隐藏
     * @type {Object}
     * @ignore
     */
    autoHide:{
      value : false
    },
    /**
     * 点击或者移动到此节点时不触发自动隐藏
     * <pre><code>
     *  
     *  var overlay = new Overlay({ //点击#t1时显示，点击#t1,#t2,overlay之外的元素隐藏
     *    trigger : '#t1',
     *    autoHide : true,
     *    hideExceptNode : '#t2',
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {Object} hideExceptNode
     */
    hideExceptNode :{

    },
    events : {
      value : {
        /**
         * @event autohide
         * 点击控件外部时触发，只有在控件设置自动隐藏(autoHide = true)有效
         * 可以阻止控件隐藏，通过在事件监听函数中 return false
         * <pre><code>
         *  overlay.on('autohide',function(){
         *    var curTrigger = overlay.curTrigger; //当前触发的项
         *    if(condtion){
         *      return false; //阻止隐藏
         *    }
         *  });
         * </code></pre>
         */
        autohide : false
      }
    }
  };

  autoHide.prototype = {

    __bindUI : function() {
      var _self = this;

      _self.on('afterVisibleChange',function (ev) {
        var visible = ev.newVal;
        if(_self.get('autoHide')){
          if(visible){
            _self._bindHideEvent();
          }else{
            _self._clearHideEvent();
          }
        }
      });
    },
    /**
     * 处理鼠标移出事件，不影响{BUI.Component.Controller#handleMouseLeave}事件
     * @param  {jQuery.Event} ev 事件对象
     */
    handleMoveOuter : function (ev) {
      var _self = this,
        target = ev.toElement || ev.relatedTarget;
      if(!_self.containsElement(target) && !isExcept(_self,target)){
        if(_self.fire('autohide') !== false){
          _self.hide();
        }
      }
    },
    /**
     * 点击页面时的处理函数
     * @param {jQuery.Event} ev 事件对象
     * @protected
     */
    handleDocumentClick : function (ev) {
      var _self = this,
        target = ev.target;
      if(!_self.containsElement(target) && !isExcept(_self,target)){
        if(_self.fire('autohide') !== false){
          _self.hide();
        }
      }
    },
    _bindHideEvent : function() {
      var _self = this,
        trigger = _self.get('curTrigger'),
        autoHideType = _self.get('autoHideType');
      if(autoHideType === 'click'){
        $(document).on('mousedown',wrapBehavior(_self,'handleDocumentClick'));
      }else{
        _self.get('el').on('mouseleave',wrapBehavior(_self,'handleMoveOuter'));
        if(trigger){
          $(trigger).on('mouseleave',wrapBehavior(_self,'handleMoveOuter'))
        }
      }

    },
    //清除绑定的隐藏事件
    _clearHideEvent : function() {
      var _self = this,
        trigger = _self.get('curTrigger'),
        autoHideType = _self.get('autoHideType');
      if(autoHideType === 'click'){
        $(document).off('mousedown',getWrapBehavior(_self,'handleDocumentClick'));
      }else{
        _self.get('el').off('mouseleave',getWrapBehavior(_self,'handleMoveOuter'));
        if(trigger){
          $(trigger).off('mouseleave',getWrapBehavior(_self,'handleMoveOuter'))
        }
      }
    }
  };

  return autoHide;

});





/**
 * @fileOverview click，focus,hover等引起控件显示，并且定位
 * @ignore
 */

define('bui/component/uibase/autoshow',function () {

  /**
   * 处理自动显示控件的扩展，一般用于显示menu,picker,tip等
   * @class BUI.Component.UIBase.AutoShow
   */
  function autoShow() {
    
  }

  autoShow.ATTRS = {

    /**
     * 触发显示控件的DOM选择器
     * <pre><code>
     *  var overlay = new Overlay({ //点击#t1时显示，点击#t1,overlay之外的元素隐藏
     *    trigger : '#t1',
     *    autoHide : true,
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {HTMLElement|String|jQuery} trigger
     */
    /**
     * 触发显示控件的DOM选择器
     * @type {HTMLElement|String|jQuery}
     */
    trigger : {

    },
    /**
     * 是否使用代理的方式触发显示控件,如果tigger不是字符串，此属性无效
     * <pre><code>
     *  var overlay = new Overlay({ //点击.t1(无论创建控件时.t1是否存在)时显示，点击.t1,overlay之外的元素隐藏
     *    trigger : '.t1',
     *    autoHide : true,
     *    delegateTigger : true, //使用委托的方式触发显示控件
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {Boolean} [delegateTigger = false]
     */
    /**
     * 是否使用代理的方式触发显示控件,如果tigger不是字符串，此属性无效
     * @type {Boolean}
     * @ignore
     */
    delegateTigger : {
      value : false
    },
    /**
     * 选择器是否始终跟随触发器对齐
     * @cfg {Boolean} autoAlign
     * @ignore
     */
    /**
     * 选择器是否始终跟随触发器对齐
     * @type {Boolean}
     * @protected
     */
    autoAlign :{
      value : true
    },
    /**
     * 控件显示时由此trigger触发，当配置项 trigger 选择器代表多个DOM 对象时，
     * 控件可由多个DOM对象触发显示。
     * <pre><code>
     *  overlay.on('show',function(){
     *    var curTrigger = overlay.get('curTrigger');
     *    //TO DO
     *  });
     * </code></pre>
     * @type {jQuery}
     * @readOnly
     */
    curTrigger : {

    },
    /**
     * 触发显示时的回调函数
     * @cfg {Function} triggerCallback
     * @ignore
     */
    /**
     * 触发显示时的回调函数
     * @type {Function}
     * @ignore
     */
    triggerCallback : {
      value : function (ev) {
        
      }
    },
    /**
     * 显示菜单的事件
     *  <pre><code>
     *    var overlay = new Overlay({ //移动到#t1时显示，移动出#t1,overlay之外控件隐藏
     *      trigger : '#t1',
     *      autoHide : true,
     *      triggerEvent :'mouseover',
     *      autoHideType : 'leave',
     *      content : '悬浮内容'
     *    });
     *    overlay.render();
     * 
     *  </code></pre>
     * @cfg {String} [triggerEvent='click']
     * @default 'click'
     */
    /**
     * 显示菜单的事件
     * @type {String}
     * @default 'click'
     * @ignore
     */
    triggerEvent : {
      value:'click'
    },
    /**
     * 因为触发元素发生改变而导致控件隐藏
     * @cfg {String} triggerHideEvent
     * @ignore
     */
    /**
     * 因为触发元素发生改变而导致控件隐藏
     * @type {String}
     * @ignore
     */
    triggerHideEvent : {

    },
    events : {
      value : {
        /**
         * 当触发器（触发选择器出现）发生改变时，经常用于一个选择器对应多个触发器的情况
         * <pre><code>
         *  overlay.on('triggerchange',function(ev){
         *    var curTrigger = ev.curTrigger;
         *    overlay.set('content',curTrigger.html());
         *  });
         * </code></pre>
         * @event
         * @param {Object} e 事件对象
         * @param {jQuery} e.prevTrigger 之前触发器，可能为null
         * @param {jQuery} e.curTrigger 当前的触发器
         */
        'triggerchange':false
      }
    }
  };

  autoShow.prototype = {

    __createDom : function () {
      this._setTrigger();
    },
    _setTrigger : function () {
      var _self = this,
        triggerEvent = _self.get('triggerEvent'),
        triggerHideEvent = _self.get('triggerHideEvent'),
        triggerCallback = _self.get('triggerCallback'),
        trigger = _self.get('trigger'),
        isDelegate = _self.get('delegateTigger'),
        triggerEl = $(trigger);

      //触发显示
      function tiggerShow (ev) {
        var prevTrigger = _self.get('curTrigger'),
          curTrigger = isDelegate ?$(ev.currentTarget) : $(this),
          align = _self.get('align');
        if(!prevTrigger || prevTrigger[0] != curTrigger[0]){

          _self.set('curTrigger',curTrigger);
          _self.fire('triggerchange',{prevTrigger : prevTrigger,curTrigger : curTrigger});
        }
        if(_self.get('autoAlign')){
          align.node = curTrigger;
          
        }
        _self.set('align',align);
        _self.show();
        triggerCallback && triggerCallback(ev);
      }

      //触发隐藏
      function tiggerHide (ev){
        var toElement = ev.toElement || ev.relatedTarget;
        if(!toElement || !_self.containsElement(toElement)){ //mouseleave时，如果移动到当前控件上，取消消失
          _self.hide();
        }
      }

      if(triggerEvent){
        if(isDelegate && BUI.isString(trigger)){
          $(document).delegate(trigger,triggerEvent,tiggerShow);
        }else{
          triggerEl.on(triggerEvent,tiggerShow);
        }
        
      }

      if(triggerHideEvent){
        if(isDelegate && BUI.isString(trigger)){
          $(document).delegate(trigger,triggerHideEvent,tiggerHide);
        }else{
          triggerEl.on(triggerHideEvent,tiggerHide);
        }
      } 
    },
    __renderUI : function () {
      var _self = this,
        align = _self.get('align');
      //如果控件显示时不是由trigger触发，则同父元素对齐
      if(align && !align.node){
        align.node = _self.get('render') || _self.get('trigger');
      }
    }
  };

  return autoShow;
});
/**
 * @fileOverview  UI控件的流程控制
 * @author yiminghe@gmail.com
 * copied by dxq613@gmail.com
 * @ignore
 */
define('bui/component/uibase/base',['bui/component/manage'],function(require){

  var Manager = require('bui/component/manage'),
   
    UI_SET = '_uiSet',
        ATTRS = 'ATTRS',
        ucfirst = BUI.ucfirst,
        noop = $.noop,
        Base = require('bui/base');
   /**
     * 模拟多继承
     * init attr using constructors ATTRS meta info
     * @ignore
     */
    function initHierarchy(host, config) {
        callMethodByHierarchy(host, 'initializer', 'constructor');
    }

    function callMethodByHierarchy(host, mainMethod, extMethod) {
        var c = host.constructor,
            extChains = [],
            ext,
            main,
            exts,
            t;

        // define
        while (c) {

            // 收集扩展类
            t = [];
            if (exts = c.mixins) {
                for (var i = 0; i < exts.length; i++) {
                    ext = exts[i];
                    if (ext) {
                        if (extMethod != 'constructor') {
                            //只调用真正自己构造器原型的定义，继承原型链上的不要管
                            if (ext.prototype.hasOwnProperty(extMethod)) {
                                ext = ext.prototype[extMethod];
                            } else {
                                ext = null;
                            }
                        }
                        ext && t.push(ext);
                    }
                }
            }

            // 收集主类
            // 只调用真正自己构造器原型的定义，继承原型链上的不要管 !important
            // 所以不用自己在 renderUI 中调用 superclass.renderUI 了，UIBase 构造器自动搜寻
            // 以及 initializer 等同理
            if (c.prototype.hasOwnProperty(mainMethod) && (main = c.prototype[mainMethod])) {
                t.push(main);
            }

            // 原地 reverse
            if (t.length) {
                extChains.push.apply(extChains, t.reverse());
            }

            c = c.superclass && c.superclass.constructor;
        }

        // 初始化函数
        // 顺序：父类的所有扩展类函数 -> 父类对应函数 -> 子类的所有扩展函数 -> 子类对应函数
        for (i = extChains.length - 1; i >= 0; i--) {
            extChains[i] && extChains[i].call(host);
        }
    }

     /**
     * 销毁组件顺序： 子类 destructor -> 子类扩展 destructor -> 父类 destructor -> 父类扩展 destructor
     * @ignore
     */
    function destroyHierarchy(host) {
        var c = host.constructor,
            extensions,
            d,
            i;

        while (c) {
            // 只触发该类真正的析构器，和父亲没关系，所以不要在子类析构器中调用 superclass
            if (c.prototype.hasOwnProperty('destructor')) {
                c.prototype.destructor.apply(host);
            }

            if ((extensions = c.mixins)) {
                for (i = extensions.length - 1; i >= 0; i--) {
                    d = extensions[i] && extensions[i].prototype.__destructor;
                    d && d.apply(host);
                }
            }

            c = c.superclass && c.superclass.constructor;
        }
    }

    /**
     * 构建 插件
     * @ignore
     */
    function constructPlugins(plugins) {
        if(!plugins){
        return;
        }
        BUI.each(plugins, function (plugin,i) {
            if (BUI.isFunction(plugin)) {
                plugins[i] = new plugin();
            }
        });
    }

    /**
     * 调用插件的方法
     * @ignore
     */
    function actionPlugins(self, plugins, action) {
        if(!plugins){
        return;
        }
        BUI.each(plugins, function (plugin,i) {
            if (plugin[action]) {
                plugin[action](self);
            }
        });
    }

     /**
     * 根据属性变化设置 UI
     * @ignore
     */
    function bindUI(self) {
        var attrs = self.getAttrs(),
            attr,
            m;

        for (attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                m = UI_SET + ucfirst(attr);
                if (self[m]) {
                    // 自动绑定事件到对应函数
                    (function (attr, m) {
                        self.on('after' + ucfirst(attr) + 'Change', function (ev) {
                            // fix! 防止冒泡过来的
                            if (ev.target === self) {
                                self[m](ev.newVal, ev);
                            }
                        });
                    })(attr, m);
                }
            }
        }
    }

        /**
     * 根据当前（初始化）状态来设置 UI
     * @ignore
     */
    function syncUI(self) {
        var v,
            f,
            attrs = self.getAttrs();
        for (var a in attrs) {
            if (attrs.hasOwnProperty(a)) {
                var m = UI_SET + ucfirst(a);
                //存在方法，并且用户设置了初始值或者存在默认值，就同步状态
                if ((f = self[m])
                    // 用户如果设置了显式不同步，就不同步，比如一些值从 html 中读取，不需要同步再次设置
                    && attrs[a].sync !== false
                    && (v = self.get(a)) !== undefined) {
                    f.call(self, v);
                }
            }
        }
    }

  /**
   * 控件库的基类，包括控件的生命周期,下面是基本的扩展类
   * <p>
   * <img src="https://dxq613.github.io/assets/img/class-mixins.jpg"/>
   * </p>
   * @class BUI.Component.UIBase
   * @extends BUI.Base
   * @param  {Object} config 配置项
   */
  var UIBase = function(config){

     var _self = this, 
      id;

        // 读取用户设置的属性值并设置到自身
        Base.apply(_self, arguments);

        //保存用户传入的配置项
        _self.setInternal('userConfig',config);
        // 按照类层次执行初始函数，主类执行 initializer 函数，扩展类执行构造器函数
        initHierarchy(_self, config);

        var listener,
            n,
            plugins = _self.get('plugins'),
            listeners = _self.get('listeners');

        constructPlugins(plugins);
    
        var xclass= _self.get('xclass');
        if(xclass){
          _self.__xclass = xclass;//debug 方便
        }
        actionPlugins(_self, plugins, 'initializer');

        // 是否自动渲染
        config && config.autoRender && _self.render();

  };

  UIBase.ATTRS = 
  {
    
    
    /**
     * 用户传入的配置项
     * @type {Object}
     * @readOnly
     * @protected
     */
    userConfig : {

    },
    /**
     * 是否自动渲染,如果不自动渲染，需要用户调用 render()方法
     * <pre><code>
     *  //默认状态下创建对象，并没有进行render
     *  var control = new Control();
     *  control.render(); //需要调用render方法
     *
     *  //设置autoRender后，不需要调用render方法
     *  var control = new Control({
     *   autoRender : true
     *  });
     * </code></pre>
     * @cfg {Boolean} autoRender
     */
    /**
     * 是否自动渲染,如果不自动渲染，需要用户调用 render()方法
     * @type {Boolean}
     * @ignore
     */
    autoRender : {
      value : false
    },
    /**
     * @type {Object}
     * 事件处理函数:
     *      {
     *        'click':function(e){}
     *      }
     *  @ignore
     */
    listeners: {
        value: {}
    },
    /**
     * 插件集合
     * <pre><code>
     *  var grid = new Grid({
     *    columns : [{},{}],
     *    plugins : [Grid.Plugins.RadioSelection]
     *  });
     * </code></pre>
     * @cfg {Array} plugins
     */
    /**
     * 插件集合
     * @type {Array}
     * @readOnly
     */
    plugins : {
      value : []
    },
    /**
     * 是否已经渲染完成
     * @type {Boolean}
     * @default  false
     * @readOnly
     */
    rendered : {
        value : false
    },
    /**
    * 获取控件的 xclass
    * @readOnly
    * @type {String}
    * @protected
    */
    xclass: {
        valueFn: function () {
            return Manager.getXClassByConstructor(this.constructor);
        }
    }
  };
  
  BUI.extend(UIBase,Base);

  BUI.augment(UIBase,
  {
    /**
     * 创建DOM结构
     * @protected
     */
    create : function(){
      var self = this;
            // 是否生成过节点
            if (!self.get('created')) {
                /**
                 * @event beforeCreateDom
                 * fired before root node is created
                 * @param e
                 */
                self.fire('beforeCreateDom');
                callMethodByHierarchy(self, 'createDom', '__createDom');
                self._set('created', true);
                /**
                 * @event afterCreateDom
                 * fired when root node is created
                 * @param e
                 */
                self.fire('afterCreateDom');
                actionPlugins(self, self.get('plugins'), 'createDom');
            }
            return self;
    },
    /**
     * 渲染
     */
    render : function(){
      var _self = this;
            // 是否已经渲染过
            if (!_self.get('rendered')) {
                var plugins = _self.get('plugins');
                _self.create(undefined);

                /**
                 * @event beforeRenderUI
                 * fired when root node is ready
                 * @param e
                 */
                _self.fire('beforeRenderUI');
                callMethodByHierarchy(_self, 'renderUI', '__renderUI');

                /**
                 * @event afterRenderUI
                 * fired after root node is rendered into dom
                 * @param e
                 */

                _self.fire('afterRenderUI');
                actionPlugins(_self, plugins, 'renderUI');

                /**
                 * @event beforeBindUI
                 * fired before UIBase 's internal event is bind.
                 * @param e
                 */

                _self.fire('beforeBindUI');
                bindUI(_self);
                callMethodByHierarchy(_self, 'bindUI', '__bindUI');

                /**
                 * @event afterBindUI
                 * fired when UIBase 's internal event is bind.
                 * @param e
                 */

                _self.fire('afterBindUI');
                actionPlugins(_self, plugins, 'bindUI');

                /**
                 * @event beforeSyncUI
                 * fired before UIBase 's internal state is synchronized.
                 * @param e
                 */

                _self.fire('beforeSyncUI');

                syncUI(_self);
                callMethodByHierarchy(_self, 'syncUI', '__syncUI');

                /**
                 * @event afterSyncUI
                 * fired after UIBase 's internal state is synchronized.
                 * @param e
                 */

                _self.fire('afterSyncUI');
                actionPlugins(_self, plugins, 'syncUI');
                _self._set('rendered', true);
            }
            return _self;
    },
    /**
     * 子类可继承此方法，当DOM创建时调用
     * @protected
     * @method
     */
    createDom : noop,
    /**
     * 子类可继承此方法，渲染UI时调用
     * @protected
     *  @method
     */
    renderUI : noop,
    /**
     * 子类可继承此方法,绑定事件时调用
     * @protected
     * @method
     */
    bindUI : noop,
    /**
     * 同步属性值到UI上
     * @protected
     * @method
     */
    syncUI : noop,

    /**
     * 析构函数
     */
    destroy: function () {
        var _self = this;
        /**
         * @event beforeDestroy
         * fired before UIBase 's destroy.
         * @param e
         */
        _self.fire('beforeDestroy');

        actionPlugins(_self, _self.get('plugins'), 'destructor');
        destroyHierarchy(_self);
         /**
         * @event afterDestroy
         * fired before UIBase 's destroy.
         * @param e
         */
        _self.fire('afterDestroy');
        _self.off();
        _self.clearAttrVals();
        _self.destroyed = true;
        return _self;
    } 
  });
  
  BUI.mix(UIBase,
    {
    /**
     * 定义一个类
     * @static
     * @param  {Function} base   基类构造函数
     * @param  {Array} extensions 扩展
     * @param  {Object} px  原型链上的扩展
     * @param  {Object} sx  
     * @return {Function} 继承与基类的构造函数
     */
    define : function(base, extensions, px, sx){
          if ($.isPlainObject(extensions)) {
              sx = px;
              px = extensions;
              extensions = [];
          }

          function C() {
              UIBase.apply(this, arguments);
          }

          BUI.extend(C, base, px, sx);
          BUI.mixin(C,extensions);
         
          return C;
    },
    /**
     * 扩展一个类，基类就是类本身
     * @static
     * @param  {Array} extensions 扩展
     * @param  {Object} px  原型链上的扩展
     * @param  {Object} sx  
     * @return {Function} 继承与基类的构造函数
     */
    extend: function extend(extensions, px, sx) {
        var args = $.makeArray(arguments),
            ret,
            last = args[args.length - 1];
        args.unshift(this);
        if (last.xclass) {
            args.pop();
            args.push(last.xclass);
        }
        ret = UIBase.define.apply(UIBase, args);
        if (last.xclass) {
            var priority = last.priority || (this.priority ? (this.priority + 1) : 1);

            Manager.setConstructorByXClass(last.xclass, {
                constructor: ret,
                priority: priority
            });
            //方便调试
            ret.__xclass = last.xclass;
            ret.priority = priority;
            ret.toString = function(){
                return last.xclass;
            }
        }
        ret.extend = extend;
        return ret;
    }
  });

  return UIBase;
});

/**
 * @fileOverview bindable extension class.
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/component/uibase/bindable',function(){
	
	/**
		* bindable extension class.
		* <pre><code>
		*   BUI.use(['bui/list','bui/data','bui/mask'],function(List,Data,Mask){
		*     var store = new Data.Store({
		*       url : 'data/xx.json'
		*     });
		*   	var list = new List.SimpleList({
		*  	    render : '#l1',
		*  	    store : store,
		*  	    loadMask : new Mask.LoadMask({el : '#t1'})
		*     });
		*
		*     list.render();
		*     store.load();
		*   });
		* </code></pre>
		* 使控件绑定store，处理store的事件 {@link BUI.Data.Store}
		* @class BUI.Component.UIBase.Bindable
		*/
	function bindable(){
		
	}

	bindable.ATTRS = 
	{
		/**
		* 绑定 {@link BUI.Data.Store}的事件
		* <pre><code>
		*  var store = new Data.Store({
		*   url : 'data/xx.json',
		*   autoLoad : true
		*  });
		*
		*  var list = new List.SimpleList({
		*  	 render : '#l1',
		*  	 store : store
		*  });
		*
		*  list.render();
		* </code></pre>
		* @cfg {BUI.Data.Store} store
		*/
		/**
		* 绑定 {@link BUI.Data.Store}的事件
		* <pre><code>
		*  var store = list.get('store');
		* </code></pre>
		* @type {BUI.Data.Store}
		*/
		store : {
			
		},
		/**
		* 加载数据时，是否显示等待加载的屏蔽层
		* <pre><code>
		*   BUI.use(['bui/list','bui/data','bui/mask'],function(List,Data,Mask){
		*     var store = new Data.Store({
		*       url : 'data/xx.json'
		*     });
		*   	var list = new List.SimpleList({
		*  	    render : '#l1',
		*  	    store : store,
		*  	    loadMask : new Mask.LoadMask({el : '#t1'})
		*     });
		*
		*     list.render();
		*     store.load();
		*   });
		* </code></pre>
		* @cfg {Boolean|Object} loadMask
		*/
		/**
		* 加载数据时，是否显示等待加载的屏蔽层
		* @type {Boolean|Object} 
		* @ignore
		*/
		loadMask : {
			value : false
		}
	};


	BUI.augment(bindable,
	/**
	* @lends BUI.Data.Bindable.prototype
	* @ignore
	*/	
	{

		__bindUI : function(){
			var _self = this,
				store = _self.get('store'),
				loadMask = _self.get('loadMask');
			if(!store){
				return;
			}
			store.on('beforeload',function(e){
				_self.onBeforeLoad(e);
				if(loadMask && loadMask.show){
					loadMask.show();
				}
			});
			store.on('load',function(e){
				_self.onLoad(e);
				if(loadMask && loadMask.hide){
					loadMask.hide();
				}
			});
			store.on('exception',function(e){
				_self.onException(e);
				if(loadMask && loadMask.hide){
					loadMask.hide();
				}
			});
			store.on('add',function(e){
				_self.onAdd(e);
			});
			store.on('remove',function(e){
				_self.onRemove(e);
			});
			store.on('update',function(e){
				_self.onUpdate(e);
			});
			store.on('localsort',function(e){
				_self.onLocalSort(e);
			});
		},
		__syncUI : function(){
			var _self = this,
				store = _self.get('store');
			if(!store){
				return;
			}
			if(store.hasData()){
				_self.onLoad();
			}
		},
		/**
		* @protected
    * @template
		* before store load data
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-beforeload}
		*/
		onBeforeLoad : function(e){

		},
		/**
		* @protected
    * @template
		* after store load data
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-load}
		*/
		onLoad : function(e){
			
		},
		/**
		* @protected
    * @template
		* occurred exception when store is loading data
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-exception}
		*/
		onException : function(e){
			
		},
		/**
		* @protected
    * @template
		* after added data to store
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-add}
		*/
		onAdd : function(e){
		
		},
		/**
		* @protected
    * @template
		* after remvoed data to store
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-remove}
		*/
		onRemove : function(e){
		
		},
		/**
		* @protected
    * @template
		* after updated data to store
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-update}
		*/
		onUpdate : function(e){
		
		},
		/**
		* @protected
    * @template
		* after local sorted data to store
		* @param {Object} e The event object
		* @see {@link BUI.Data.Store#event-localsort}
		*/
		onLocalSort : function(e){
			
		}
	});

	return bindable;
});
/**
 * @fileOverview 子控件的默认配置项
 * @ignore
 */

define('bui/component/uibase/childcfg',function (require) {

  /**
   * @class BUI.Component.UIBase.ChildCfg
   * 子控件默认配置项的扩展类
   */
  var childCfg = function(config){
    this._init();
  };

  childCfg.ATTRS = {
    /**
     * 默认的子控件配置项,在初始化控件时配置
     * 
     *  - 如果控件已经渲染过，此配置项无效，
     *  - 控件生成后，修改此配置项无效。
     * <pre><code>
     *   var control = new Control({
     *     defaultChildCfg : {
     *       tpl : '&lt;li&gt;{text}&lt;/li&gt;',
     *       xclass : 'a-b'
     *     }
     *   });
     * </code></pre>
     * @cfg {Object} defaultChildCfg
     */
    /**
     * @ignore
     */
    defaultChildCfg : {

    }
  };

  childCfg.prototype = {

    _init : function(){
      var _self = this,
        defaultChildCfg = _self.get('defaultChildCfg');
      if(defaultChildCfg){
        _self.on('beforeAddChild',function(ev){
          var child = ev.child;
          if($.isPlainObject(child)){
            BUI.each(defaultChildCfg,function(v,k){
              if(!child[k]){
                child[k] = v;
              }
            });
          }
        });
      }
    }

  };

  return childCfg;

});
/**
 * @fileOverview close 关闭或隐藏控件
 * @author yiminghe@gmail.com
 * copied and modified by dxq613@gmail.com
 * @ignore
 */

define('bui/component/uibase/close',function () {
  
  var CLS_PREFIX = BUI.prefix + 'ext-';

  function getCloseRenderBtn(self) {
      return $(self.get('closeTpl'));
  }

  /**
  * 关闭按钮的视图类
  * @class BUI.Component.UIBase.CloseView
  * @private
  */
  function CloseView() {
  }

  CloseView.ATTRS = {
    closeTpl : {
      value : '<a ' +
            'tabindex="0" ' +
            "href='javascript:void(\"关闭\")' " +
            'role="button" ' +
            'class="' + CLS_PREFIX + 'close' + '">' +
            '<span class="' +
            CLS_PREFIX + 'close-x' +
            '">关闭<' + '/span>' +
            '<' + '/a>'
    },
    closeable:{
        value:true
    },
    closeBtn:{
    }
  };

  CloseView.prototype = {
      _uiSetCloseable:function (v) {
          var self = this,
              btn = self.get('closeBtn');
          if (v) {
              if (!btn) {
                  self.setInternal('closeBtn', btn = getCloseRenderBtn(self));
              }
              btn.appendTo(self.get('el'), undefined);
          } else {
              if (btn) {
                  btn.remove();
              }
          }
      }
  };

   /**
   * @class BUI.Component.UIBase.Close
   * Close extension class.
   * Represent a close button.
   */
  function Close() {
  }

  var HIDE = 'hide';
  Close.ATTRS =
  {
      /**
      * 关闭按钮的默认模版
      * <pre><code>
      *   var overlay = new Overlay({
      *     closeTpl : '<a href="#" title="close">x</a>',
      *     closeable : true,
      *     trigger : '#t1'
      *   });
      *   overlay.render();
      * </code></pre>
      * @cfg {String} closeTpl
      */
      /**
      * 关闭按钮的默认模版
      * @type {String}
      * @protected
      */
      closeTpl:{
        view : true
      },
      /**
       * 是否出现关闭按钮
       * @cfg {Boolean} [closeable = false]
       */
      /**
       * 是否出现关闭按钮
       * @type {Boolean}
       */
      closeable:{
          view:1
      },

      /**
       * 关闭按钮.
       * @protected
       * @type {jQuery}
       */
      closeBtn:{
          view:1
      },
      /**
       * 关闭时隐藏还是移除DOM结构<br/>
       * default "hide". 可以设置 "destroy" ，当点击关闭按钮时移除（destroy)控件
       * @cfg {String} [closeAction = 'hide']
       */
      /**
       * 关闭时隐藏还是移除DOM结构
       * default "hide".可以设置 "destroy" ，当点击关闭按钮时移除（destroy)控件
       * @type {String}
       * @protected
       */
      closeAction:{
        value:HIDE
      }

      /**
       * @event closing
       * 正在关闭，可以通过return false 阻止关闭事件
       * @param {Object} e 关闭事件
       * @param {String} e.action 关闭执行的行为，hide,destroy
       */

      /**
       * @event closed
       * 已经关闭
       * @param {Object} e 关闭事件
       * @param {String} e.action 关闭执行的行为，hide,destroy
       */
      
      /**
       * @event closeclick
       * 触发点击关闭按钮的事件,return false 阻止关闭
       * @param {Object} e 关闭事件
       * @param {String} e.domTarget 点击的关闭按钮节点
       */
  };

  var actions = {
      hide:HIDE,
      destroy:'destroy'
  };

  Close.prototype = {
      _uiSetCloseable:function (v) {
          var self = this;
          if (v && !self.__bindCloseEvent) {
              self.__bindCloseEvent = 1;
              self.get('closeBtn').on('click', function (ev) {
                if(self.fire('closeclick',{domTarget : ev.target}) !== false){
                  self.close();
                }
                ev.preventDefault();
              });
          }
      },
      __destructor:function () {
          var btn = this.get('closeBtn');
          btn && btn.detach();
      },
      /**
       * 关闭弹出框，如果closeAction = 'hide'那么就是隐藏，如果 closeAction = 'destroy'那么就是释放
       */
      close : function(){
        var self = this,
          action = actions[self.get('closeAction') || HIDE];
        if(self.fire('closing',{action : action}) !== false){
          self[action]();
          self.fire('closed',{action : action});
        }
      }
  };

  Close.View = CloseView;

  return Close;
});

/**
 * @fileOverview 可以展开折叠的控件
 * @ignore
 */

define('bui/component/uibase/collapseable',function () {

  /**
  * 控件展开折叠的视图类
  * @class BUI.Component.UIBase.CollapseableView
  * @private
  */
  var collapseableView = function(){
  
  };

  collapseableView.ATTRS = {
    collapsed : {}
  }

  collapseableView.prototype = {
    //设置收缩样式
    _uiSetCollapsed : function(v){
      var _self = this,
        cls = _self.getStatusCls('collapsed'),
        el = _self.get('el');
      if(v){
        el.addClass(cls);
      }else{
        el.removeClass(cls);
      }
    }
  }
  /**
   * 控件展开折叠的扩展
   * @class BUI.Component.UIBase.Collapseable
   */
  var collapseable = function(){
    
  };

  collapseable.ATTRS = {
    /**
     * 是否可折叠
     * @type {Boolean}
     */
    collapseable: {
      value : false
    },
    /**
     * 是否已经折叠 collapsed
     * @cfg {Boolean} collapsed
     */
    /**
     * 是否已经折叠
     * @type {Boolean}
     */
    collapsed : {
      view : true,
      value : false
    },
    events : {
      value : {
        /**
         * 控件展开
         * @event
         * @param {Object} e 事件对象
         * @param {BUI.Component.Controller} target 控件
         */
        'expanded' : true,
        /**
         * 控件折叠
         * @event
         * @param {Object} e 事件对象
         * @param {BUI.Component.Controller} target 控件
         */
        'collapsed' : true
      }
    }
  };

  collapseable.prototype = {
    _uiSetCollapsed : function(v){
      var _self = this;
      if(v){
        _self.fire('collapsed');
      }else{
        _self.fire('expanded');
      }
    }
  };

  collapseable.View = collapseableView;
  
  return collapseable;
});
/**
 * @fileOverview 使用wrapper
 * @ignore
 */

define('bui/component/uibase/decorate',['bui/array','bui/json','bui/component/manage'],function (require) {
  
  var ArrayUtil = require('bui/array'),
    JSON = require('bui/json'),
    prefixCls = BUI.prefix,
    FIELD_PREFIX = 'data-'
    FIELD_CFG = FIELD_PREFIX + 'cfg',
    PARSER = 'PARSER',
    Manager = require('bui/component/manage'),
    regx = /^[\{\[]/;

  function isConfigField(name,cfgFields){
    if(cfgFields[name]){
      return true;
    }
    var reg = new RegExp("^"+FIELD_PREFIX);  
    if(name !== FIELD_CFG && reg.test(name)){
      return true;
    }
    return false;
  }

  // 收集单继承链，子类在前，父类在后
  function collectConstructorChains(self) {
      var constructorChains = [],
          c = self.constructor;
      while (c) {
          constructorChains.push(c);
          c = c.superclass && c.superclass.constructor;
      }
      return constructorChains;
  }

  //如果属性为对象或者数组，则进行转换
  function parseFieldValue(value){
    value = $.trim(value);
    if(regx.test(value)){
      value = JSON.looseParse(value);
    }
    return value;
  }

  function setConfigFields(self,cfg){

    var userConfig = self.userConfig || {};
    for (var p in cfg) {
      // 用户设置过那么这里不从 dom 节点取
      // 用户设置 > html parser > default value
      if (!(p in userConfig)) {
        self.setInternal(p,cfg[p]);
      }
    }
  }
  function applyParser(srcNode, parser) {
    var self = this,
      p, v,
      userConfig = self.userConfig || {};

    // 从 parser 中，默默设置属性，不触发事件
    for (p in parser) {
      // 用户设置过那么这里不从 dom 节点取
      // 用户设置 > html parser > default value
      if (!(p in userConfig)) {
        v = parser[p];
        // 函数
        if (BUI.isFunction(v)) {
            self.setInternal(p, v.call(self, srcNode));
        }
        // 单选选择器
        else if (typeof v == 'string') {
            self.setInternal(p, srcNode.find(v));
        }
        // 多选选择器
        else if (BUI.isArray(v) && v[0]) {
            self.setInternal(p, srcNode.find(v[0]))
        }
      }
    }
  }

  function initParser(self,srcNode){

    var c = self.constructor,
      len,
      p,
      constructorChains;

    constructorChains = collectConstructorChains(self);

    // 从父类到子类开始从 html 读取属性
    for (len = constructorChains.length - 1; len >= 0; len--) {
        c = constructorChains[len];
        if (p = c[PARSER]) {
            applyParser.call(self, srcNode, p);
        }
    }
  }

  function initDecorate(self){
    var _self = self,
      srcNode = _self.get('srcNode'),
      userConfig,
      decorateCfg;
    if(srcNode){
      srcNode = $(srcNode);
      _self.setInternal('el',srcNode);
      _self.setInternal('srcNode',srcNode);

      userConfig = _self.get('userConfig');
      decorateCfg = _self.getDecorateConfig(srcNode);
      setConfigFields(self,decorateCfg);
      
      //如果从DOM中读取子控件
      if(_self.get('isDecorateChild') && _self.decorateInternal){
        _self.decorateInternal(srcNode);
      }
      initParser(self,srcNode);
    }
  }

  /**
   * @class BUI.Component.UIBase.Decorate
   * 将DOM对象封装成控件
   */
  function decorate(){
    initDecorate(this);
  }

  decorate.ATTRS = {

    /**
     * 配置控件的根节点的DOM
     * <pre><code>
     * new Form.Form({
     *   srcNode : '#J_Form'
     * }).render();
     * </code></pre>
     * @cfg {jQuery} srcNode
     */
    /**
     * 配置控件的根节点的DOM
     * @type {jQuery} 
     */
    srcNode : {
      view : true
    },
    /**
     * 是否根据DOM生成子控件
     * @type {Boolean}
     * @protected
     */
    isDecorateChild : {
      value : false
    },
    /**
     * 此配置项配置使用那些srcNode上的节点作为配置项
     *  - 当时用 decorate 时，取 srcNode上的节点的属性作为控件的配置信息
     *  - 默认id,name,value,title 都会作为属性传入
     *  - 使用 'data-cfg' 作为整体的配置属性
     *  <pre><code>
     *     <input id="c1" type="text" name="txtName" id="id",data-cfg="{allowBlank:false}" />
     *     //会生成以下配置项：
     *     {
     *         name : 'txtName',
     *         id : 'id',
     *         allowBlank:false
     *     }
     *     new Form.Field({
     *        src:'#c1'
     *     }).render();
     *  </code></pre>
     * @type {Object}
     * @protected
     */
    decorateCfgFields : {
      value : {
        'id' : true,
        'name' : true,
        'value' : true,
        'title' : true
      }
    }
  };

  decorate.prototype = {

    /**
     * 获取控件的配置信息
     * @protected
     */
    getDecorateConfig : function(el){
      if(!el.length){
        return null;
      }
      var _self = this,
        dom = el[0],
        attributes = dom.attributes,
        decorateCfgFields = _self.get('decorateCfgFields'),
        config = {};

      BUI.each(attributes,function(attr){
        var name = attr.nodeName;
        try{
          if(name === FIELD_CFG){
              var cfg = parseFieldValue(attr.nodeValue);
              BUI.mix(config,cfg);
          }
          else if(isConfigField(name,decorateCfgFields)){
            name = name.replace(FIELD_PREFIX,'');
            config[name] = parseFieldValue(attr.nodeValue);
          }
        }catch(e){
          BUI.log('parse field error,the attribute is:' + name);
        }
      });
      return config;
    },
    /**
     * 获取封装成子控件的节点集合
     * @protected
     * @return {Array} 节点集合
     */
    getDecorateElments : function(){
      var _self = this,
        el = _self.get('el'),
        contentContainer = _self.get('childContainer');
      if(contentContainer){
        return el.find(contentContainer).children();
      }else{
        return el.children();
      }
    },

    /**
     * 封装所有的子控件
     * @protected
     * @param {jQuery} el Root element of current component.
     */
    decorateInternal: function (el) {
      var self = this;
      self.decorateChildren(el);
    },
    /**
     * 获取子控件的xclass类型
     * @protected
     * @param {jQuery} 子控件的根节点
     */
    findXClassByNode: function (childNode, ignoreError) {
      var _self = this,
        cls = childNode.attr("class") || '',
        childClass = _self.get('defaultChildClass'); //如果没有样式或者查找不到对应的类，使用默认的子控件类型

          // 过滤掉特定前缀
      cls = cls.replace(new RegExp("\\b" + prefixCls, "ig"), "");

      var UI = Manager.getConstructorByXClass(cls) ||  Manager.getConstructorByXClass(childClass);

      if (!UI && !ignoreError) {
        BUI.log(childNode);
        BUI.error("can not find ui " + cls + " from this markup");
      }
      return Manager.getXClassByConstructor(UI);
    },
    // 生成一个组件
    decorateChildrenInternal: function (xclass, c) {
      var _self = this,
        children = _self.get('children');
      children.push({
        xclass : xclass,
        srcNode: c
      });
    },
    /**
     * 封装子控件
     * @private
     * @param {jQuery} el component's root element.
     */
    decorateChildren: function (el) {
      var _self = this,
          children = _self.getDecorateElments();
      BUI.each(children,function(c){
        var xclass = _self.findXClassByNode($(c));
        _self.decorateChildrenInternal(xclass, $(c));
      });
    }
  };

  return decorate;
});
/**
 * @fileOverview 依赖扩展，用于观察者模式中的观察者
 * @ignore
 */

define('bui/component/uibase/depends',['bui/component/manage'],function (require) {
  
  var regexp = /^#(.*):(.*)$/,
    Manager = require('bui/component/manage');

  //获取依赖信息
  function getDepend(name){

    var arr = regexp.exec(name),
      id = arr[1],
      eventType = arr[2],
      source = getSource(id);
    return {
      source : source,
      eventType: eventType
    };
  }

  //绑定依赖
  function bindDepend(self,name,action){
    var depend = getDepend(name),
      source = depend.source,
      eventType = depend.eventType,
      callbak;
    if(source && action && eventType){

      if(BUI.isFunction(action)){//如果action是一个函数
        callbak = action;
      }else if(BUI.isArray(action)){//如果是一个数组，构建一个回调函数
        callbak = function(){
          BUI.each(action,function(methodName){
            if(self[methodName]){
              self[methodName]();
            }
          });
        }
      }
    }
    if(callbak){
      depend.callbak = callbak;
      source.on(eventType,callbak);
      return depend;
    }
    return null;
  }
  //去除依赖
  function offDepend(depend){
    var source = depend.source,
      eventType = depend.eventType,
      callbak = depend.callbak;
    source.off(eventType,callbak);
  }

  //获取绑定的事件源
  function getSource(id){
    var control = Manager.getComponent(id);
    if(!control){
      control = $('#' + id);
      if(!control.length){
        control = null;
      }
    }
    return control;
  }

  /**
   * @class BUI.Component.UIBase.Depends
   * 依赖事件源的扩展
   * <pre><code>
   *       var control = new Control({
   *         depends : {
   *           '#btn:click':['toggle'],//当点击id为'btn'的按钮时，执行 control 的toggle方法
   *           '#checkbox1:checked':['show'],//当勾选checkbox时，显示控件
   *           '#menu:click',function(){}
   *         }
   *       });
   * </code></pre>
   */
  function Depends (){

  };

  Depends.ATTRS = {
    /**
     * 控件的依赖事件，是一个数组集合，每一条记录是一个依赖关系<br/>
     * 一个依赖是注册一个事件，所以需要在一个依赖中提供：
     * <ol>
     * <li>绑定源：为了方便配置，我们使用 #id来指定绑定源，可以使控件的ID（只支持继承{BUI.Component.Controller}的控件），也可以是DOM的id</li>
     * <li>事件名：事件名是一个使用":"为前缀的字符串，例如 "#id:change",即监听change事件</li>
     * <li>触发的方法：可以是一个数组，如["disable","clear"],数组里面是控件的方法名，也可以是一个回调函数</li>
     * </ol>
     * <pre><code>
     *       var control = new Control({
     *         depends : {
     *           '#btn:click':['toggle'],//当点击id为'btn'的按钮时，执行 control 的toggle方法
     *           '#checkbox1:checked':['show'],//当勾选checkbox时，显示控件
     *           '#menu:click',function(){}
     *         }
     *       });
     * </code></pre>
     * ** 注意：** 这些依赖项是在控件渲染（render）后进行的。         
     * @type {Object}
     */
    depends : {
      value : {}
    },
    /**
     * @private
     * 依赖的映射集合
     * @type {Object}
     */
    dependencesMap : {
      value : {}
    }
  };

  Depends.prototype = {

    __syncUI : function(){
      this.initDependences();
    },
    /**
     * 初始化依赖项
     * @protected
     */
    initDependences : function(){
      var _self = this,
        depends = _self.get('depends');
      BUI.each(depends,function(action,name){
        _self.addDependence(name,action);
      });
    },
    /**
     * 添加依赖，如果已经有同名的事件，则移除，再添加
     * <pre><code>
     *  form.addDependence('#btn:click',['toggle']); //当按钮#btn点击时，表单交替显示隐藏
     *
     *  form.addDependence('#btn:click',function(){//当按钮#btn点击时，表单交替显示隐藏
     *   //TO DO
     *  }); 
     * </code></pre>
     * @param {String} name 依赖项的名称
     * @param {Array|Function} action 依赖项的事件
     */
    addDependence : function(name,action){
      var _self = this,
        dependencesMap = _self.get('dependencesMap'),
        depend;
      _self.removeDependence(name);
      depend = bindDepend(_self,name,action)
      if(depend){
        dependencesMap[name] = depend;
      }
    },
    /**
     * 移除依赖
     * <pre><code>
     *  form.removeDependence('#btn:click'); //当按钮#btn点击时，表单不在监听
     * </code></pre>
     * @param  {String} name 依赖名称
     */
    removeDependence : function(name){
      var _self = this,
        dependencesMap = _self.get('dependencesMap'),
        depend = dependencesMap[name];
      if(depend){
        offDepend(depend);
        delete dependencesMap[name];
      }
    },
    /**
     * 清除所有的依赖
     * <pre><code>
     *  form.clearDependences();
     * </code></pre>
     */
    clearDependences : function(){
      var _self = this,
        map = _self.get('dependencesMap');
      BUI.each(map,function(depend,name){
        offDepend(depend);
      });
      _self.set('dependencesMap',{});
    },
    __destructor : function(){
      this.clearDependences();
    }

  };
  
  return Depends;
});
/**
 * @fileOverview 拖拽
 * @author by dxq613@gmail.com
 * @ignore
 */

define('bui/component/uibase/drag',function(){

   
    var dragBackId = BUI.guid('drag');
    
    /**
     * 拖拽控件的扩展
     * <pre><code>
     *  var Control = Overlay.extend([UIBase.Drag],{
     *      
     *  });
     *
     *  var c = new Contol({ //拖动控件时，在#t2内
     *      content : '<div id="header"></div><div></div>',
     *      dragNode : '#header',
     *      constraint : '#t2'
     *  });
     * </code></pre>
     * @class BUI.Component.UIBase.Drag
     */
    var drag = function(){

    };

    drag.ATTRS = 
    {

        /**
         * 点击拖动的节点
         * <pre><code>
         *  var Control = Overlay.extend([UIBase.Drag],{
         *      
         *  });
         *
         *  var c = new Contol({ //拖动控件时，在#t2内
         *      content : '<div id="header"></div><div></div>',
         *      dragNode : '#header',
         *      constraint : '#t2'
         *  });
         * </code></pre>
         * @cfg {jQuery} dragNode
         */
        /**
         * 点击拖动的节点
         * @type {jQuery}
         * @ignore
         */
        dragNode : {

        },
        /**
         * 是否正在拖动
         * @type {Boolean}
         * @protected
         */
        draging:{
            setter:function (v) {
                if (v === true) {
                    return {};
                }
            },
            value:null
        },
        /**
         * 拖动的限制范围
         * <pre><code>
         *  var Control = Overlay.extend([UIBase.Drag],{
         *      
         *  });
         *
         *  var c = new Contol({ //拖动控件时，在#t2内
         *      content : '<div id="header"></div><div></div>',
         *      dragNode : '#header',
         *      constraint : '#t2'
         *  });
         * </code></pre>
         * @cfg {jQuery} constraint
         */
        /**
         * 拖动的限制范围
         * @type {jQuery}
         * @ignore
         */
        constraint : {

        },
        /**
         * @private
         * @type {jQuery}
         */
        dragBackEl : {
            /** @private **/
            getter:function(){
                return $('#'+dragBackId);
            }
        }
    };
    var dragTpl = '<div id="' + dragBackId + '" style="background-color: red; position: fixed; left: 0px; width: 100%; height: 100%; top: 0px; cursor: move; z-index: 999999; display: none; "></div>';
       
    function initBack(){
        var el = $(dragTpl).css('opacity', 0).prependTo('body');
        return el;
    }
    drag.prototype = {
        
        __bindUI : function(){
            var _self = this,
                constraint = _self.get('constraint'),
                dragNode = _self.get('dragNode');
            if(!dragNode){
                return;
            }
            dragNode.on('mousedown',function(e){

                if(e.which == 1){
                    e.preventDefault();
                    _self.set('draging',{
                        elX: _self.get('x'),
                        elY: _self.get('y'),
                        startX : e.pageX,
                        startY : e.pageY
                    });
                    registEvent();
                }
            });
            /**
             * @private
             */
            function mouseMove(e){
                var draging = _self.get('draging');
                if(draging){
                    e.preventDefault();
                    _self._dragMoveTo(e.pageX,e.pageY,draging,constraint);
                }
            }
            /**
             * @private
             */
            function mouseUp(e){
                if(e.which == 1){
                    _self.set('draging',false);
                    var dragBackEl = _self.get('dragBackEl');
                    if(dragBackEl){
                        dragBackEl.hide();
                    }
                    unregistEvent();
                }
            }
            /**
             * @private
             */
            function registEvent(){
                $(document).on('mousemove',mouseMove);
                $(document).on('mouseup',mouseUp);
            }
            /**
             * @private
             */
            function unregistEvent(){
                $(document).off('mousemove',mouseMove);
                $(document).off('mouseup',mouseUp);
            }

        },
        _dragMoveTo : function(x,y,draging,constraint){
            var _self = this,
                dragBackEl = _self.get('dragBackEl'),
                draging = draging || _self.get('draging'),
                offsetX = draging.startX - x,
                offsetY = draging.startY - y;
            if(!dragBackEl.length){
                 dragBackEl = initBack();
            }
            dragBackEl.css({
                cursor: 'move',
                display: 'block'
            });
            _self.set('xy',[_self._getConstrainX(draging.elX - offsetX,constraint),
                            _self._getConstrainY(draging.elY - offsetY,constraint)]);    

        },
        _getConstrainX : function(x,constraint){
            var _self = this,
                width =  _self.get('el').outerWidth(),
                endX = x + width,
                curX = _self.get('x');
            //如果存在约束
            if(constraint){
                var constraintOffset = constraint.offset();
                if(constraintOffset.left >= x){
                    return constraintOffset.left;
                }
                if(constraintOffset.left + constraint.width() < endX){
                    return constraintOffset.left + constraint.width() - width;
                }
                return x;
            }
            //当左右顶点都在视图内，移动到此点
            if(BUI.isInHorizontalView(x) && BUI.isInHorizontalView(endX)){
                return x;
            }

            return curX;
        },
        _getConstrainY : function(y,constraint){
             var _self = this,
                height =  _self.get('el').outerHeight(),
                endY = y + height,
                curY = _self.get('y');
            //如果存在约束
            if(constraint){
                var constraintOffset = constraint.offset();
                if(constraintOffset.top > y){
                    return constraintOffset.top;
                }
                if(constraintOffset.top + constraint.height() < endY){
                    return constraintOffset.top + constraint.height() - height;
                }
                return y;
            }
            //当左右顶点都在视图内，移动到此点
            if(BUI.isInVerticalView(y) && BUI.isInVerticalView(endY)){
                return y;
            }

            return curY;
        }
    };

    return drag;

});
/**
 * @fileOverview 使用键盘导航
 * @ignore
 */

define('bui/component/uibase/keynav',['bui/keycode'],function (require) {

  var KeyCode = require('bui/keycode'),
      wrapBehavior = BUI.wrapBehavior,
      getWrapBehavior = BUI.getWrapBehavior;
  /**
   * 键盘导航
   * @class BUI.Component.UIBase.KeyNav
   */
  var keyNav = function () {
    
  };

  keyNav.ATTRS = {

    /**
     * 是否允许键盘导航
     * @cfg {Boolean} [allowKeyNav = true]
     */
    allowKeyNav : {
      value : true
    },
    /**
     * 导航使用的事件
     * @cfg {String} [navEvent = 'keydown']
     */
    navEvent : {
      value : 'keydown'
    },
    /**
     * 当获取事件的DOM是 input,textarea,select等时，不处理键盘导航
     * @cfg {Object} [ignoreInputFields='true']
     */
    ignoreInputFields : {
      value : true
    }

  };

  keyNav.prototype = {

    __bindUI : function () {
      
    },
    _uiSetAllowKeyNav : function(v){
      var _self = this,
        eventName = _self.get('navEvent'),
        el = _self.get('el');
      if(v){
        el.on(eventName,wrapBehavior(_self,'_handleKeyDown'));
      }else{
        el.off(eventName,getWrapBehavior(_self,'_handleKeyDown'));
      }
    },
    /**
     * 处理键盘导航
     * @private
     */
    _handleKeyDown : function(ev){
      var _self = this,
        code = ev.which;
      switch(code){
        case KeyCode.UP :
          _self.handleNavUp(ev);
          break;
        case KeyCode.DOWN : 
          _self.handleNavDown(ev);
          break;
        case KeyCode.RIGHT : 
          _self.handleNavRight(ev);
          break;
        case KeyCode.LEFT : 
          _self.handleNavLeft(ev);
          break;
        case KeyCode.ENTER : 
          _self.handleNavEnter(ev);
          break;
        case KeyCode.ESC : 
          _self.handleNavEsc(ev);
          break;
        case KeyCode.TAB :
          _self.handleNavTab(ev);
          break;
        default:
          break;
      }
    },
    /**
     * 处理向上导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavUp : function (ev) {
      // body...
    },
    /**
     * 处理向下导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavDown : function (ev) {
      // body...
    },
    /**
     * 处理向左导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavLeft : function (ev) {
      // body...
    },
    /**
     * 处理向右导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavRight : function (ev) {
      // body...
    },
    /**
     * 处理确认键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEnter : function (ev) {
      // body...
    },
    /**
     * 处理 esc 键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEsc : function (ev) {
      // body...
    },
    /**
     * 处理Tab键
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavTab : function(ev){

    }

  };

  return keyNav;
});

/**
 * @fileOverview 所有子元素都是同一类的集合
 * @ignore
 */

define('bui/component/uibase/list',['bui/component/uibase/selection'],function (require) {
  
  var Selection = require('bui/component/uibase/selection');

  /**
   * 列表一类的控件的扩展，list,menu,grid都是可以从此类扩展
   * @class BUI.Component.UIBase.List
   */
  var list = function(){

  };

  list.ATTRS = {

    /**
     * 选择的数据集合
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
     *   idField : 'value',
     *   render : '#t1',
     *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
     * });
     * list.render();
     * </code></pre>
     * @cfg {Array} items
     */
    /**
     * 选择的数据集合
     * <pre><code>
     *  list.set('items',items); //列表会直接替换内容
     *  //等同于 
     *  list.clearItems();
     *  list.addItems(items);
     * </code></pre>
     * @type {Array}
     */
    items:{
      view : true
    },
    /**
     * 选项的默认key值
     * @cfg {String} [idField = 'id']
     */
    idField : {
      value : 'id'
    },
    /**
     * 列表项的默认模板,仅在初始化时传入。
     * @type {String}
     * @ignore
     */
    itemTpl : {
      view : true
    },
    /**
     * 列表项的渲染函数，应对列表项之间有很多差异时
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTplRender : function(item){
     *     if(item.type == '1'){
     *       return '&lt;li&gt;&lt;img src="xxx.jpg"/&gt;'+item.text+'&lt;/li&gt;'
     *     }else{
     *       return '&lt;li&gt;item.text&lt;/li&gt;'
     *     }
     *   },
     *   idField : 'value',
     *   render : '#t1',
     *   items : [{value : '1',text : '1',type : '0'},{value : '2',text : '2',type : '1'}]
     * });
     * list.render();
     * </code></pre>
     * @type {Function}
     */
    itemTplRender : {
      view : true
    },
    /**
     * 子控件各个状态默认采用的样式
     * <pre><code>
     * var list = new List.SimpleList({
     *   render : '#t1',
     *   itemStatusCls : {
     *     selected : 'active', //默认样式为list-item-selected,现在变成'active'
     *     hover : 'hover' //默认样式为list-item-hover,现在变成'hover'
     *   },
     *   items : [{id : '1',text : '1',type : '0'},{id : '2',text : '2',type : '1'}]
     * });
     * list.render();
     * </code></pre>
     * see {@link BUI.Component.Controller#property-statusCls}
     * @type {Object}
     */
    itemStatusCls : {
      view : true,
      value : {}
    },
    events : {

      value : {
        /**
         * 选项点击事件
         * @event
         * @param {Object} e 事件对象
         * @param {BUI.Component.UIBase.ListItem} e.item 点击的选项
         * @param {HTMLElement} e.element 选项代表的DOM对象
         * @param {HTMLElement} e.domTarget 点击的DOM对象
         * @param {HTMLElement} e.domEvent 点击的原生事件对象
         */
        'itemclick' : true
      }  
    }
  };

  list.prototype = {

    /**
     * 获取选项的数量
     * <pre><code>
     *   var count = list.getItemCount();
     * </code></pre>
     * @return {Number} 选项数量
     */
    getItemCount : function () {
        return this.getItems().length;
    },
    /**
     * 获取字段的值
     * @param {*} item 字段名
     * @param {String} field 字段名
     * @return {*} 字段的值
     * @protected
     */
    getValueByField : function(item,field){

    },
    /**
     * 获取所有选项值，如果选项是子控件，则是所有子控件
     * <pre><code>
     *   var items = list.getItems();
     *   //等同
     *   list.get(items);
     * </code></pre>
     * @return {Array} 选项值集合
     */
    getItems : function () {
      
    },
    /**
     * 获取第一项
     * <pre><code>
     *   var item = list.getFirstItem();
     *   //等同
     *   list.getItemAt(0);
     * </code></pre>
     * @return {Object|BUI.Component.Controller} 选项值（子控件）
     */
    getFirstItem : function () {
      return this.getItemAt(0);
    },
    /**
     * 获取最后一项
     * <pre><code>
     *   var item = list.getLastItem();
     *   //等同
     *   list.getItemAt(list.getItemCount()-1);
     * </code></pre>
     * @return {Object|BUI.Component.Controller} 选项值（子控件）
     */
    getLastItem : function () {
      return this.getItemAt(this.getItemCount() - 1);
    },
    /**
     * 通过索引获取选项值（子控件）
     * <pre><code>
     *   var item = list.getItemAt(0); //获取第1个
     *   var item = list.getItemAt(2); //获取第3个
     * </code></pre>
     * @param  {Number} index 索引值
     * @return {Object|BUI.Component.Controller}  选项（子控件）
     */
    getItemAt : function  (index) {
      return this.getItems()[index] || null;
    },
    /**
     * 通过Id获取选项，如果是改变了idField则通过改变的idField来查找选项
     * <pre><code>
     *   //如果idField = 'id'
     *   var item = list.getItem('2'); 
     *   //等同于
     *   list.findItemByField('id','2');
     *
     *   //如果idField = 'value'
     *   var item = list.getItem('2'); 
     *   //等同于
     *   list.findItemByField('value','2');
     * </code></pre>
     * @param {String} id 编号
     * @return {Object|BUI.Component.Controller} 选项（子控件）
     */
    getItem : function(id){
      var field = this.get('idField');
      return this.findItemByField(field,id);
    },
    /**
     * 返回指定项的索引
     * <pre><code>
     * var index = list.indexOf(item); //返回索引，不存在则返回-1
     * </code></pre>
     * @param  {Object|BUI.Component.Controller} 选项
     * @return {Number}   项的索引值
     */
    indexOfItem : function(item){
      return BUI.Array.indexOf(item,this.getItems());
    },
    /**
     * 添加多条选项
     * <pre><code>
     * var items = [{id : '1',text : '1'},{id : '2',text : '2'}];
     * list.addItems(items);
     * </code></pre>
     * @param {Array} items 记录集合（子控件配置项）
     */
    addItems : function (items) {
      var _self = this;
      BUI.each(items,function (item) {
          _self.addItem(item);
      });
    },
    /**
     * 插入多条记录
     * <pre><code>
     * var items = [{id : '1',text : '1'},{id : '2',text : '2'}];
     * list.addItemsAt(items,0); // 在最前面插入
     * list.addItemsAt(items,2); //第三个位置插入
     * </code></pre>
     * @param  {Array} items 多条记录
     * @param  {Number} start 起始位置
     */
    addItemsAt : function(items,start){
      var _self = this;
      BUI.each(items,function (item,index) {
        _self.addItemAt(item,start + index);
      });
    },
    /**
     * 更新列表项，修改选项值后，DOM跟随变化
     * <pre><code>
     *   var item = list.getItem('2');
     *   list.text = '新内容'; //此时对应的DOM不会变化
     *   list.updateItem(item); //DOM进行相应的变化
     * </code></pre>
     * @param  {Object} item 选项值
     */
    updateItem : function(item){

    },
    /**
     * 添加选项,添加在控件最后
     * 
     * <pre><code>
     * list.addItem({id : '3',text : '3',type : '0'});
     * </code></pre>
     * 
     * @param {Object|BUI.Component.Controller} item 选项，子控件配置项、子控件
     * @return {Object|BUI.Component.Controller} 子控件或者选项记录
     */
    addItem : function (item) {
       return this.addItemAt(item,this.getItemCount());
    },
    /**
     * 在指定位置添加选项
     * <pre><code>
     * list.addItemAt({id : '3',text : '3',type : '0'},0); //第一个位置
     * </code></pre>
     * @param {Object|BUI.Component.Controller} item 选项，子控件配置项、子控件
     * @param {Number} index 索引
     * @return {Object|BUI.Component.Controller} 子控件或者选项记录
     */
    addItemAt : function(item,index) {

    },
    /**
      * 根据字段查找指定的项
      * @param {String} field 字段名
      * @param {Object} value 字段值
      * @return {Object} 查询出来的项（传入的记录或者子控件）
      * @protected
    */
    findItemByField:function(field,value){

    },
    /**
     * 
     * 获取此项显示的文本  
     * @param {Object} item 获取记录显示的文本
     * @protected            
     */
    getItemText:function(item){

    },
    /**
     * 清除所有选项,不等同于删除全部，此时不会触发删除事件
     * <pre><code>
     * list.clearItems(); 
     * //等同于
     * list.set('items',items);
     * </code></pre>
     */
    clearItems : function(){
      var _self = this,
          items = _self.getItems();
      items.splice(0);
      _self.clearControl();
    },
    /**
     * 删除选项
     * <pre><code>
     * var item = list.getItem('1');
     * list.removeItem(item);
     * </code></pre>
     * @param {Object|BUI.Component.Controller} item 选项（子控件）
     */
    removeItem : function (item) {

    },
    /**
     * 移除选项集合
     * <pre><code>
     * var items = list.getSelection();
     * list.removeItems(items);
     * </code></pre>
     * @param  {Array} items 选项集合
     */
    removeItems : function(items){
      var _self = this;

      BUI.each(items,function(item){
          _self.removeItem(item);
      });
    },
    /**
     * 通过索引删除选项
     * <pre><code>
     * list.removeItemAt(0); //删除第一个
     * </code></pre>
     * @param  {Number} index 索引
     */
    removeItemAt : function (index) {
      this.removeItem(this.getItemAt(index));
    },
    /**
     * @protected
     * @template
     * 清除所有的子控件或者列表项的DOM
     */
    clearControl : function(){

    }
  }

  

  

  function clearSelected(item){
    if(item.selected){
        item.selected = false;
    }
    if(item.set){
        item.set('selected',false);
    }
  }

  function beforeAddItem(self,item){

    var c = item.isController ? item.getAttrVals() : item,
      defaultTpl = self.get('itemTpl'),
      defaultStatusCls = self.get('itemStatusCls'),
      defaultTplRender = self.get('itemTplRender');

    //配置默认模板
    if(defaultTpl && !c.tpl){
      setItemAttr(item,'tpl',defaultTpl);
      //  c.tpl = defaultTpl;
    }
    //配置默认渲染函数
    if(defaultTplRender && !c.tplRender){
      setItemAttr(item,'tplRender',defaultTplRender);
      //c.tplRender = defaultTplRender;
    }
    //配置默认状态样式
    if(defaultStatusCls){
      var statusCls = c.statusCls || item.isController ? item.get('statusCls') : {};
      BUI.each(defaultStatusCls,function(v,k){
        if(v && !statusCls[k]){
            statusCls[k] = v;
        }
      });
      setItemAttr(item,'statusCls',statusCls)
      //item.statusCls = statusCls;
    }
   // clearSelected(item);
  }
  function setItemAttr(item,name,val){
    if(item.isController){
      item.set(name,val);
    }else{
      item[name] = val;
    }
  }
  
  /**
  * @class BUI.Component.UIBase.ChildList
  * 选中其中的DOM结构
  * @extends BUI.Component.UIBase.List
  * @mixins BUI.Component.UIBase.Selection
  */
  var childList = function(){
    this.__init();
  };

  childList.ATTRS = BUI.merge(true,list.ATTRS,Selection.ATTRS,{
    items : {
      sync : false
    },
    /**
     * 配置的items 项是在初始化时作为children
     * @protected
     * @type {Boolean}
     */
    autoInitItems : {
      value : true
    },
    /**
     * 默认的加载控件内容的配置,默认值：
     * <pre>
     *  {
     *   property : 'children',
     *   dataType : 'json'
     * }
     * </pre>
     * @type {Object}
     */
    defaultLoaderCfg  : {
      value : {
        property : 'children',
        dataType : 'json'
      }
    }
  });

  BUI.augment(childList,list,Selection,{
    //初始化，将items转换成children
    __init : function(){
      var _self = this,
        items = _self.get('items');
      if(items && _self.get('autoInitItems')){
        _self.addItems(items);
      } 
      _self.on('beforeRenderUI',function(){
        _self._beforeRenderUI();
      });
    },
    _uiSetItems : function (items) {
      var _self = this;
      //清理子控件
      _self.clearControl();
      _self.addItems(items);
    },
    //渲染子控件
    _beforeRenderUI : function(){
      var _self = this,
        children = _self.get('children'),
        items = _self.get('items');   
      BUI.each(children,function(item){
        beforeAddItem(_self,item);
      });
    },
    //绑定事件
    __bindUI : function(){
      var _self = this,
        selectedEvent = _self.get('selectedEvent');
     
      _self.on(selectedEvent,function(e){
        var item = e.target;
        if(item.get('selectable')){
            if(!item.get('selected')){
              _self.setSelected(item);
            }else if(_self.get('multipleSelect')){
              _self.clearSelected(item);
            }
        }
      });

      _self.on('click',function(e){
        if(e.target !== _self){
          _self.fire('itemclick',{item:e.target,domTarget : e.domTarget,domEvent : e});
        }
      });
      _self.on('beforeAddChild',function(ev){
        beforeAddItem(_self,ev.child);
      });
      _self.on('beforeRemoveChild',function(ev){
        var item = ev.child,
          selected = item.get('selected');
        //清理选中状态
        if(selected){
          if(_self.get('multipleSelect')){
            _self.clearSelected(item);
          }else{
            _self.setSelected(null);
          }
        }
        item.set('selected',false);
      });
    },
    /**
     * @protected
     * @override
     * 清除者列表项的DOM
     */
    clearControl : function(){
      this.removeChildren(true);
    },
    /**
     * 获取所有子控件
     * @return {Array} 子控件集合
     * @override
     */
    getItems : function () {
      return this.get('children');
    },
    /**
     * 更新列表项
     * @param  {Object} item 选项值
     */
    updateItem : function(item){
      var _self = this,
        idField = _self.get('idField'),
        element = _self.findItemByField(idField,item[idField]);
      if(element){
        element.setTplContent();
      }
      return element;
    },
    /**
     * 删除项,子控件作为选项
     * @param  {Object} element 子控件
     */
    removeItem : function (item) {
      var _self = this,
        idField = _self.get('idField');
      if(!(item instanceof BUI.Component.Controller)){
        item = _self.findItemByField(idField,item[idField]);
      }
      this.removeChild(item,true);
    },
    /**
     * 在指定位置添加选项,此处选项指子控件
     * @param {Object|BUI.Component.Controller} item 子控件配置项、子控件
     * @param {Number} index 索引
     * @return {Object|BUI.Component.Controller} 子控件
     */
    addItemAt : function(item,index) {
      return this.addChild(item,index);
    },
    findItemByField : function(field,value,root){

      root = root || this;
      var _self = this,
        children = root.get('children'),
        result = null;
      $(children).each(function(index,item){
        if(item.get(field) == value){
            result = item;
        }else if(item.get('children').length){
            result = _self.findItemByField(field,value,item);
        }
        if(result){
          return false;
        }
      });
      return result;
    },
    getItemText : function(item){
      return item.get('el').text();
    },
    getValueByField : function(item,field){
        return item && item.get(field);
    },
    /**
     * @protected
     * @ignore
     */
    setItemSelectedStatus : function(item,selected){
      var _self = this,
        method = selected ? 'addClass' : 'removeClass',
        element = null;

      if(item){
        item.set('selected',selected);
        element = item.get('el');
      }
      _self.afterSelected(item,selected,element);
    },
    /**
     * 选项是否被选中
     * @override
     * @param  {*}  item 选项
     * @return {Boolean}  是否选中
     */
    isItemSelected : function(item){
        return item ? item.get('selected') : false;
    },
    /**
     * 设置所有选项选中
     * @override
     */
    setAllSelection : function(){
      var _self = this,
        items = _self.getItems();
      _self.setSelection(items);
    },
    /**
     * 获取选中的项的值
     * @return {Array} 
     * @override
     * @ignore
     */
    getSelection : function(){
        var _self = this,
            items = _self.getItems(),
            rst = [];
        BUI.each(items,function(item){
            if(_self.isItemSelected(item)){
                rst.push(item);
            }
           
        });
        return rst;
    }
  });

  list.ChildList = childList;

  return list;
});

/**
 * @ignore
 * 2013-1-22 
 *   更改显示数据的方式，使用 _uiSetItems
 */
/**
 * @fileOverview 可选中的控件,父控件支持selection扩展
 * @ignore
 */

define('bui/component/uibase/listitem',function () {

  /**
   * 列表项控件的视图层
   * @class BUI.Component.UIBase.ListItemView
   * @private
   */
  function listItemView () {
    // body...
  }

  listItemView.ATTRS = {
    /**
     * 是否选中
     * @type {Boolean}
     */
    selected : {

    }
  };

  listItemView.prototype = {
     _uiSetSelected : function(v){
      var _self = this,
        cls = _self.getStatusCls('selected'),
        el = _self.get('el');
      if(v){
        el.addClass(cls);
      }else{
        el.removeClass(cls);
      }
    }
  };
  /**
   * 列表项的扩展
   * @class BUI.Component.UIBase.ListItem
   */
  function listItem() {
    
  }

  listItem.ATTRS = {

    /**
     * 是否可以被选中
     * @cfg {Boolean} [selectable=true]
     */
    /**
     * 是否可以被选中
     * @type {Boolean}
     */
    selectable : {
      value : true
    },
    
    /**
     * 是否选中,只能通过设置父类的选中方法来实现选中
     * @type {Boolean}
     * @readOnly
     */
    selected :{
      view : true,
      sync : false,
      value : false
    }
  };

  listItem.prototype = {
    
  };

  listItem.View = listItemView;

  return listItem;

});

/**
 * @fileOverview mask 遮罩层
 * @author yiminghe@gmail.com
 * copied and modified by dxq613@gmail.com
 * @ignore
 */

define('bui/component/uibase/mask',function (require) {

    var UA = require('bui/ua'),
        
        /**
         * 每组相同 prefixCls 的 position 共享一个遮罩
         * @ignore
         */
        maskMap = {
            /**
             * @ignore
             * {
             *  node:
             *  num:
             * }
             */

    },
        ie6 = UA.ie == 6;

    function getMaskCls(self) {
        return self.get('prefixCls') + 'ext-mask';
    }

    function docWidth() {
        return  ie6 ? BUI.docWidth() + 'px' : '100%';
    }

    function docHeight() {
        return ie6 ? BUI.docHeight() + 'px' : '100%';
    }

    function initMask(maskCls) {
        var mask = $('<div ' +
            ' style="width:' + docWidth() + ';' +
            'left:0;' +
            'top:0;' +
            'height:' + docHeight() + ';' +
            'position:' + (ie6 ? 'absolute' : 'fixed') + ';"' +
            ' class="' +
            maskCls +
            '">' +
            (ie6 ? '<' + 'iframe ' +
                'style="position:absolute;' +
                'left:' + '0' + ';' +
                'top:' + '0' + ';' +
                'background:white;' +
                'width: expression(this.parentNode.offsetWidth);' +
                'height: expression(this.parentNode.offsetHeight);' +
                'filter:alpha(opacity=0);' +
                'z-index:-1;"></iframe>' : '') +
            '</div>')
            .prependTo('body');
        /**
         * 点 mask 焦点不转移
         * @ignore
         */
       // mask.unselectable();
        mask.on('mousedown', function (e) {
            e.preventDefault();
        });
        return mask;
    }

    /**
    * 遮罩层的视图类
    * @class BUI.Component.UIBase.MaskView
    * @private
    */
    function MaskView() {
    }

    MaskView.ATTRS = {
        maskShared:{
            value:true
        }
    };

    MaskView.prototype = {

        _maskExtShow:function () {
            var self = this,
                zIndex,
                maskCls = getMaskCls(self),
                maskDesc = maskMap[maskCls],
                maskShared = self.get('maskShared'),
                mask = self.get('maskNode');
            if (!mask) {
                if (maskShared) {
                    if (maskDesc) {
                        mask = maskDesc.node;
                    } else {
                        mask = initMask(maskCls);
                        maskDesc = maskMap[maskCls] = {
                            num:0,
                            node:mask
                        };
                    }
                } else {
                    mask = initMask(maskCls);
                }
                self.setInternal('maskNode', mask);
            }
            if (zIndex = self.get('zIndex')) {
                mask.css('z-index', zIndex - 1);
            }
            if (maskShared) {
                maskDesc.num++;
            }
            if (!maskShared || maskDesc.num == 1) {
                mask.show();
            }
        },

        _maskExtHide:function () {
            var self = this,
                maskCls = getMaskCls(self),
                maskDesc = maskMap[maskCls],
                maskShared = self.get('maskShared'),
                mask = self.get('maskNode');
            if (maskShared && maskDesc) {
                maskDesc.num = Math.max(maskDesc.num - 1, 0);
                if (maskDesc.num == 0) {
                    mask.hide();
                }
            } else if(mask){
                mask.hide();
            }
        },

        __destructor:function () {
            var self = this,
                maskShared = self.get('maskShared'),
                mask = self.get('maskNode');
            if (self.get('maskNode')) {
                if (maskShared) {
                    if (self.get('visible')) {
                        self._maskExtHide();
                    }
                } else {
                    mask.remove();
                }
            }
        }

    };

   /**
     * @class BUI.Component.UIBase.Mask
     * Mask extension class.
     * Make component to be able to show with mask.
     */
    function Mask() {
    }

    Mask.ATTRS =
    {
        /**
         * 控件显示时，是否显示屏蔽层
         * <pre><code>
         *   var overlay = new Overlay({ //显示overlay时，屏蔽body
         *     mask : true,
         *     maskNode : 'body',
         *     trigger : '#t1'
         *   });
         *   overlay.render();
         * </code></pre>
         * @cfg {Boolean} [mask = false]
         */
        /**
         * 控件显示时，是否显示屏蔽层
         * @type {Boolean}
         * @protected
         */
        mask:{
            value:false
        },
        /**
         * 屏蔽的内容
         * <pre><code>
         *   var overlay = new Overlay({ //显示overlay时，屏蔽body
         *     mask : true,
         *     maskNode : 'body',
         *     trigger : '#t1'
         *   });
         *   overlay.render();
         * </code></pre>
         * @cfg {jQuery} maskNode
         */
        /**
         * 屏蔽的内容
         * @type {jQuery}
         * @protected
         */
        maskNode:{
            view:1
        },
        /**
         * Whether to share mask with other overlays.
         * @default true.
         * @type {Boolean}
         * @protected
         */
        maskShared:{
            view:1
        }
    };

    Mask.prototype = {

        __bindUI:function () {
            var self = this,
                view = self.get('view'),
                _maskExtShow = view._maskExtShow,
                _maskExtHide = view._maskExtHide;
            if (self.get('mask')) {
                self.on('show',function(){
                    view._maskExtShow();
                });
                self.on('hide',function(){
                    view._maskExtHide();
                });
            }
        }
    };

  Mask = Mask;
  Mask.View = MaskView;

  return Mask;
});


/**
 * @fileOverview 位置，控件绝对定位
 * @author yiminghe@gmail.com
 * copied by dxq613@gmail.com
 * @ignore
 */
define('bui/component/uibase/position',function () {


    /**
    * 对齐的视图类
    * @class BUI.Component.UIBase.PositionView
    * @private
    */
    function PositionView() {

    }

    PositionView.ATTRS = {
        x:{
            /**
             * 水平方向绝对位置
             * @private
             * @ignore
             */
            valueFn:function () {
                var self = this;
                // 读到这里时，el 一定是已经加到 dom 树中了，否则报未知错误
                // el 不在 dom 树中 offset 报错的
                // 最早读就是在 syncUI 中，一点重复设置(读取自身 X 再调用 _uiSetX)无所谓了
                return self.get('el') && self.get('el').offset().left;
            }
        },
        y:{
            /**
             * 垂直方向绝对位置
             * @private
             * @ignore
             */
            valueFn:function () {
                var self = this;
                return self.get('el') && self.get('el').offset().top;
            }
        },
        zIndex:{
        },
        /**
         * @private
         * see {@link BUI.Component.UIBase.Box#visibleMode}.
         * @default "visibility"
         * @ignore
         */
        visibleMode:{
            value:'visibility'
        }
    };


    PositionView.prototype = {

        __createDom:function () {
            this.get('el').addClass(BUI.prefix + 'ext-position');
        },

        _uiSetZIndex:function (x) {
            this.get('el').css('z-index', x);
        },
        _uiSetX:function (x) {
            if (x != null) {
                this.get('el').offset({
                    left:x
                });
            }
        },
        _uiSetY:function (y) {
            if (y != null) {
                this.get('el').offset({
                    top:y
                });
            }
        },
        _uiSetLeft:function(left){
            if(left != null){
                this.get('el').css({left:left});
            }
        },
        _uiSetTop : function(top){
            if(top != null){
                this.get('el').css({top:top});
            }
        }
    };
  
    /**
     * @class BUI.Component.UIBase.Position
     * Position extension class.
     * Make component positionable
     */
    function Position() {
    }

    Position.ATTRS =
    /**
     * @lends BUI.Component.UIBase.Position#
     * @ignore
     */
    {
        /**
         * 水平坐标
         * @cfg {Number} x
         */
        /**
         * 水平坐标
         * <pre><code>
         *     overlay.set('x',100);
         * </code></pre>
         * @type {Number}
         */
        x:{
            view:1
        },
        /**
         * 垂直坐标
         * @cfg {Number} y
         */
        /**
         * 垂直坐标
         * <pre><code>
         *     overlay.set('y',100);
         * </code></pre>
         * @type {Number}
         */
        y:{
            view:1
        },
        /**
         * 相对于父元素的水平位置
         * @type {Number}
         * @protected
         */
        left : {
            view:1
        },
        /**
         * 相对于父元素的垂直位置
         * @type {Number}
         * @protected
         */
        top : {
            view:1
        },
        /**
         * 水平和垂直坐标
         * <pre><code>
         * var overlay = new Overlay({
         *   xy : [100,100],
         *   trigger : '#t1',
         *   srcNode : '#c1'
         * });
         * </code></pre>
         * @cfg {Number[]} xy
         */
        /**
         * 水平和垂直坐标
         * <pre><code>
         *     overlay.set('xy',[100,100]);
         * </code></pre>
         * @type {Number[]}
         */
        xy:{
            // 相对 page 定位, 有效值为 [n, m], 为 null 时, 选 align 设置
            setter:function (v) {
                var self = this,
                    xy = $.makeArray(v);
                /*
                 属性内分发特别注意：
                 xy -> x,y
                 */
                if (xy.length) {
                    xy[0] && self.set('x', xy[0]);
                    xy[1] && self.set('y', xy[1]);
                }
                return v;
            },
            /**
             * xy 纯中转作用
             * @ignore
             */
            getter:function () {
                return [this.get('x'), this.get('y')];
            }
        },
        /**
         * z-index value.
         * <pre><code>
         *   var overlay = new Overlay({
         *       zIndex : '1000'
         *   });
         * </code></pre>
         * @cfg {Number} zIndex
         */
        /**
         * z-index value.
         * <pre><code>
         *   overlay.set('zIndex','1200');
         * </code></pre>
         * @type {Number}
         */
        zIndex:{
            view:1
        },
        /**
         * Positionable element is by default visible false.
         * For compatibility in overlay and PopupMenu.
         * @default false
         * @ignore
         */
        visible:{
            view:true,
            value:true
        }
    };


    Position.prototype =
    /**
     * @lends BUI.Component.UIBase.Position.prototype
     * @ignore
     */
    {
        /**
         * Move to absolute position.
         * @param {Number|Number[]} x
         * @param {Number} [y]
         * @example
         * <pre><code>
         * move(x, y);
         * move(x);
         * move([x,y])
         * </code></pre>
         */
        move:function (x, y) {
            var self = this;
            if (BUI.isArray(x)) {
                y = x[1];
                x = x[0];
            }
            self.set('xy', [x, y]);
            return self;
        },
        //设置 x 坐标时，重置 left
        _uiSetX : function(v){
            if(v != null){
                var _self = this,
                    el = _self.get('el');
                _self.setInternal('left',el.position().left);
                if(v != -999){
                    this.set('cachePosition',null);
                }
                
            }
            
        },
        //设置 y 坐标时，重置 top
        _uiSetY : function(v){
            if(v != null){
                var _self = this,
                    el = _self.get('el');
                _self.setInternal('top',el.position().top);
                if(v != -999){
                    this.set('cachePosition',null);
                }
            }
        },
        //设置 left时，重置 x
        _uiSetLeft : function(v){
            var _self = this,
                    el = _self.get('el');
            if(v != null){
                _self.setInternal('x',el.offset().left);
            }/*else{ //如果lef 为null,同时设置过left和top，那么取对应的值
                _self.setInternal('left',el.position().left);
            }*/
        },
        //设置top 时，重置y
        _uiSetTop : function(v){
            var _self = this,
                el = _self.get('el');
            if(v != null){
                _self.setInternal('y',el.offset().top);
            }/*else{ //如果lef 为null,同时设置过left和top，那么取对应的值
                _self.setInternal('top',el.position().top);
            }*/
        }
    };

    Position.View = PositionView;
    return Position;
});

/**
 * @fileOverview 单选或者多选
 * @author  dxq613@gmail.com
 * @ignore
 */
define('bui/component/uibase/selection',function () {
    var 
        SINGLE_SELECTED = 'single';

    /**
     * @class BUI.Component.UIBase.Selection
     * 选中控件中的项（子元素或者DOM），此类选择的内容有2种
     * <ol>
     *     <li>子控件</li>
     *     <li>DOM元素</li>
     * </ol>
     * ** 当选择是子控件时，element 和 item 都是指 子控件；**
     * ** 当选择的是DOM元素时，element 指DOM元素，item 指DOM元素对应的记录 **
     * @abstract
     */
    var selection = function(){

    };

    selection.ATTRS = 
    /**
     * @lends BUI.Component.UIBase.Selection#
     * @ignore
     */
    {
        /**
         * 选中的事件
         * <pre><code>
         * var list = new List.SimpleList({
         *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
         *   idField : 'value',
         *   selectedEvent : 'mouseenter',
         *   render : '#t1',
         *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
         * });
         * </code></pre>
         * @cfg {String} [selectedEvent = 'click']
         */
        selectedEvent:{
            value : 'click'
        },
        events : {
            value : {
                /**
                   * 选中的菜单改变时发生，
                   * 多选时，选中，取消选中都触发此事件，单选时，只有选中时触发此事件
                   * @name  BUI.Component.UIBase.Selection#selectedchange
                   * @event
                   * @param {Object} e 事件对象
                   * @param {Object} e.item 当前选中的项
                   * @param {HTMLElement} e.domTarget 当前选中的项的DOM结构
                   * @param {Boolean} e.selected 是否选中
                   */
                'selectedchange' : false,

                /**
                   * 选择改变前触发，可以通过return false，阻止selectedchange事件
                   * @event
                   * @param {Object} e 事件对象
                   * @param {Object} e.item 当前选中的项
                   * @param {Boolean} e.selected 是否选中
                   */
                'beforeselectedchange' : false,

                /**
                   * 菜单选中
                   * @event
                   * @param {Object} e 事件对象
                   * @param {Object} e.item 当前选中的项
                   * @param {HTMLElement} e.domTarget 当前选中的项的DOM结构
                   */
                'itemselected' : false,
                /**
                   * 菜单取消选中
                   * @event
                   * @param {Object} e 事件对象
                   * @param {Object} e.item 当前选中的项
                   * @param {HTMLElement} e.domTarget 当前选中的项的DOM结构
                   */
                'itemunselected' : false
            }
        },
        /**
         * 数据的id字段名称，通过此字段查找对应的数据
         * <pre><code>
         * var list = new List.SimpleList({
         *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
         *   idField : 'value',
         *   render : '#t1',
         *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
         * });
         * </code></pre>
         * @cfg {String} [idField = 'id']
         */
        /**
         * 数据的id字段名称，通过此字段查找对应的数据
         * @type {String}
         * @ignore
         */
        idField : {
            value : 'id'
        },
        /**
         * 是否多选
         * <pre><code>
         * var list = new List.SimpleList({
         *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
         *   idField : 'value',
         *   render : '#t1',
         *   multipleSelect : true,
         *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
         * });
         * </code></pre>
         * @cfg {Boolean} [multipleSelect=false]
         */
        /**
         * 是否多选
         * @type {Boolean}
         * @default false
         */
        multipleSelect : {
            value : false
        }

    };

    selection.prototype = 
    /**
     * @lends BUI.Component.UIBase.Selection.prototype
     * @ignore
     */
    {
        /**
         * 清理选中的项
         * <pre><code>
         *  list.clearSelection();
         * </code></pre>
         *
         */
        clearSelection : function(){
            var _self = this,
                selection = _self.getSelection();
            BUI.each(selection,function(item){
                _self.clearSelected(item);
            });
        },
        /**
         * 获取选中的项的值
         * @template
         * @return {Array} 
         */
        getSelection : function(){

        },
        /**
         * 获取选中的第一项
         * <pre><code>
         * var item = list.getSelected(); //多选模式下第一条
         * </code></pre>
         * @return {Object} 选中的第一项或者为undefined
         */
        getSelected : function(){
            return this.getSelection()[0];
        },
        /**
         * 根据 idField 获取到的值
         * @protected
         * @return {Object} 选中的值
         */
        getSelectedValue : function(){
            var _self = this,
                field = _self.get('idField'),
                item = _self.getSelected();

            return _self.getValueByField(item,field);
        },
        /**
         * 获取选中的值集合
         * @protected
         * @return {Array} 选中值得集合
         */
        getSelectionValues:function(){
            var _self = this,
                field = _self.get('idField'),
                items = _self.getSelection();
            return $.map(items,function(item){
                return _self.getValueByField(item,field);
            });
        },
        /**
         * 获取选中的文本
         * @protected
         * @return {Array} 选中的文本集合
         */
        getSelectionText:function(){
            var _self = this,
                items = _self.getSelection();
            return $.map(items,function(item){
                return _self.getItemText(item);
            });
        },
        /**
         * 移除选中
         * <pre><code>
         *    var item = list.getItem('id'); //通过id 获取选项
         *    list.setSelected(item); //选中
         *
         *    list.clearSelected();//单选模式下清除所选，多选模式下清除选中的第一项
         *    list.clearSelected(item); //清除选项的选中状态
         * </code></pre>
         * @param {Object} [item] 清除选项的选中状态，如果未指定则清除选中的第一个选项的选中状态
         */
        clearSelected : function(item){
            var _self = this;
            item = item || _self.getSelected();
            if(item){
                _self.setItemSelected(item,false);
            } 
        },
        /**
         * 获取选项显示的文本
         * @protected
         */
        getSelectedText : function(){
            var _self = this,
                item = _self.getSelected();
            return _self.getItemText(item);
        },
        /**
         * 设置选中的项
         * <pre><code>
         *  var items = list.getItemsByStatus('active'); //获取某种状态的选项
         *  list.setSelection(items);
         * </code></pre>
         * @param {Array} items 项的集合
         */
        setSelection: function(items){
            var _self = this;

            items = BUI.isArray(items) ? items : [items];

            BUI.each(items,function(item){
                _self.setSelected(item);
            }); 
        },
        /**
         * 设置选中的项
         * <pre><code>
         *   var item = list.getItem('id');
         *   list.setSelected(item);
         * </code></pre>
         * @param {Object} item 记录或者子控件
         * @param {BUI.Component.Controller|Object} element 子控件或者DOM结构
         */
        setSelected: function(item){
            var _self = this,
                multipleSelect = _self.get('multipleSelect');

            if(!_self.isItemSelectable(item)){
                return;
            }    
            if(!multipleSelect){
                var selectedItem = _self.getSelected();
                if(item != selectedItem){
                    //如果是单选，清除已经选中的项
                    _self.clearSelected(selectedItem);
                }
               
            }
            _self.setItemSelected(item,true);
            
        },
        /**
         * 选项是否被选中
         * @template
         * @param  {*}  item 选项
         * @return {Boolean}  是否选中
         */
        isItemSelected : function(item){

        },
        /**
         * 选项是否可以选中
         * @protected
         * @param {*} item 选项
         * @return {Boolean} 选项是否可以选中
         */
        isItemSelectable : function(item){
          return true;
        },
        /**
         * 设置选项的选中状态
         * @param {*} item 选项
         * @param {Boolean} selected 选中或者取消选中
         * @protected
         */
        setItemSelected : function(item,selected){
            var _self = this,
                isSelected;
            
            //当前状态等于要设置的状态时，不触发改变事件
            if(item){
                isSelected =  _self.isItemSelected(item);
                if(isSelected == selected){
                    return;
                }
            }
            if(_self.fire('beforeselectedchange',{item : item,selected : selected}) !== false){
                _self.setItemSelectedStatus(item,selected);
            }
        },
        /**
         * 设置选项的选中状态
         * @template
         * @param {*} item 选项
         * @param {Boolean} selected 选中或者取消选中
         * @protected
         */
        setItemSelectedStatus : function(item,selected){

        },
        /**
         * 设置所有选项选中
         * <pre><code>
         *  list.setAllSelection(); //选中全部，多选状态下有效
         * </code></pre>
         * @template
         */
        setAllSelection : function(){
          
        },
        /**
         * 设置项选中，通过字段和值
         * @param {String} field 字段名,默认为配置项'idField',所以此字段可以不填写，仅填写值
         * @param {Object} value 值
         * @example
         * <pre><code>
         * var list = new List.SimpleList({
         *   itemTpl : '&lt;li id="{id}"&gt;{text}&lt;/li&gt;',
         *   idField : 'id', //id 字段作为key
         *   render : '#t1',
         *   items : [{id : '1',text : '1'},{id : '2',text : '2'}]
         * });
         *
         *   list.setSelectedByField('123'); //默认按照id字段查找
         *   //或者
         *   list.setSelectedByField('id','123');
         *
         *   list.setSelectedByField('value','123');
         * </code></pre>
         */
        setSelectedByField:function(field,value){
            if(!value){
                value = field;
                field = this.get('idField');
            }
            var _self = this,
                item = _self.findItemByField(field,value);
            _self.setSelected(item);
        },
        /**
         * 设置多个选中，根据字段和值
         * <pre><code>
         * var list = new List.SimpleList({
         *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
         *   idField : 'value', //value 字段作为key
         *   render : '#t1',
         *   multipleSelect : true,
         *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
         * });
         *   var values = ['1','2','3'];
         *   list.setSelectionByField(values);//
         *
         *   //等于
         *   list.setSelectionByField('value',values);
         * </code></pre>
         * @param {String} field 默认为idField
         * @param {Array} values 值得集合
         */
        setSelectionByField:function(field,values){
            if(!values){
                values = field;
                field = this.get('idField');
            }
            var _self = this;
            BUI.each(values,function(value){
                _self.setSelectedByField(field,value);
            });   
        },
        /**
         * 选中完成后，触发事件
         * @protected
         * @param  {*} item 选项
         * @param  {Boolean} selected 是否选中
         * @param  {jQuery} element 
         */
        afterSelected : function(item,selected,element){
            var _self = this;

            if(selected){
                _self.fire('itemselected',{item:item,domTarget:element});
                _self.fire('selectedchange',{item:item,domTarget:element,selected:selected});
            }else{
                _self.fire('itemunselected',{item:item,domTarget:element});
                if(_self.get('multipleSelect')){ //只有当多选时，取消选中才触发selectedchange
                    _self.fire('selectedchange',{item:item,domTarget:element,selected:selected});
                } 
            } 
        }

    }
    
    return selection;
});
/**
 * @fileOverview 
 * 控件包含头部（head)、内容(content)和尾部（foot)
 * @ignore
 */
define('bui/component/uibase/stdmod',function () {

    var CLS_PREFIX = BUI.prefix + 'stdmod-';
        

    /**
    * 标准模块组织的视图类
    * @class BUI.Component.UIBase.StdModView
    * @private
    */
    function StdModView() {
    }

    StdModView.ATTRS = {
        header:{
        },
        body:{
        },
        footer:{
        },
        bodyStyle:{
        },
        footerStyle:{
        },
        headerStyle:{
        },
        headerContent:{
        },
        bodyContent:{
        },
        footerContent:{
        }
    };

    StdModView.PARSER = {
        header:function (el) {
            return el.one("." + CLS_PREFIX + "header");
        },
        body:function (el) {
            return el.one("." + CLS_PREFIX + "body");
        },
        footer:function (el) {
            return el.one("." + CLS_PREFIX + "footer");
        }
    };/**/

    function createUI(self, part) {
        var el = self.get('contentEl'),
            partEl = self.get(part);
        if (!partEl) {
            partEl = $('<div class="' +
                CLS_PREFIX + part + '"' +
                ' ' +
                ' >' +
                '</div>');
            partEl.appendTo(el);
            self.setInternal(part, partEl);
        }
    }


    function _setStdModRenderContent(self, part, v) {
        part = self.get(part);
        if (BUI.isString(v)) {
            part.html(v);
        } else {
            part.html('')
                .append(v);
        }
    }

    StdModView.prototype = {

        __createDom:function () {
            createUI(this, 'header');
            createUI(this, 'body');
            createUI(this, 'footer');
        },

        _uiSetBodyStyle:function (v) {
            this.get('body').css(v);
        },

        _uiSetHeaderStyle:function (v) {
            this.get('header').css(v);
        },
        _uiSetFooterStyle:function (v) {
            this.get('footer').css(v);
        },

        _uiSetBodyContent:function (v) {
            _setStdModRenderContent(this, 'body', v);
        },

        _uiSetHeaderContent:function (v) {
            _setStdModRenderContent(this, 'header', v);
        },

        _uiSetFooterContent:function (v) {
            _setStdModRenderContent(this, 'footer', v);
        }
    };

   /**
     * @class BUI.Component.UIBase.StdMod
     * StdMod extension class.
     * Generate head, body, foot for component.
     */
    function StdMod() {
    }

    StdMod.ATTRS =
    /**
     * @lends BUI.Component.UIBase.StdMod#
     * @ignore
     */
    {
        /**
         * 控件的头部DOM. Readonly
         * @readOnly
         * @type {jQuery}
         */
        header:{
            view:1
        },
        /**
         * 控件的内容DOM. Readonly
         * @readOnly
         * @type {jQuery}
         */
        body:{
            view:1
        },
        /**
         * 控件的底部DOM. Readonly
         * @readOnly
         * @type {jQuery}
         */
        footer:{
            view:1
        },
        /**
         * 应用到控件内容的css属性，键值对形式
         * @cfg {Object} bodyStyle
         */
        /**
         * 应用到控件内容的css属性，键值对形式
         * @type {Object}
         * @protected
         */
        bodyStyle:{
            view:1
        },
        /**
         * 应用到控件底部的css属性，键值对形式
         * @cfg {Object} footerStyle
         */
        /**
         * 应用到控件底部的css属性，键值对形式
         * @type {Object}
         * @protected
         */
        footerStyle:{
            view:1
        },
        /**
         * 应用到控件头部的css属性，键值对形式
         * @cfg {Object} headerStyle
         */
        /**
         * 应用到控件头部的css属性，键值对形式
         * @type {Object}
         * @protected
         */
        headerStyle:{
            view:1
        },
        /**
         * 控件头部的html
         * <pre><code>
         * var dialog = new Dialog({
         *     headerContent: '&lt;div class="header"&gt;&lt;/div&gt;',
         *     bodyContent : '#c1',
         *     footerContent : '&lt;div class="footer"&gt;&lt;/div&gt;'
         * });
         * dialog.show();
         * </code></pre>
         * @cfg {jQuery|String} headerContent
         */
        /**
         * 控件头部的html
         * @type {jQuery|String}
         */
        headerContent:{
            view:1
        },
        /**
         * 控件内容的html
         * <pre><code>
         * var dialog = new Dialog({
         *     headerContent: '&lt;div class="header"&gt;&lt;/div&gt;',
         *     bodyContent : '#c1',
         *     footerContent : '&lt;div class="footer"&gt;&lt;/div&gt;'
         * });
         * dialog.show();
         * </code></pre>
         * @cfg {jQuery|String} bodyContent
         */
        /**
         * 控件内容的html
         * @type {jQuery|String}
         */
        bodyContent:{
            view:1
        },
        /**
         * 控件底部的html
         * <pre><code>
         * var dialog = new Dialog({
         *     headerContent: '&lt;div class="header"&gt;&lt;/div&gt;',
         *     bodyContent : '#c1',
         *     footerContent : '&lt;div class="footer"&gt;&lt;/div&gt;'
         * });
         * dialog.show();
         * </code></pre>
         * @cfg {jQuery|String} footerContent
         */
        /**
         * 控件底部的html
         * @type {jQuery|String}
         */
        footerContent:{
            view:1
        }
    };

  StdMod.View = StdModView;
  return StdMod;
});
/**
 * @fileOverview 控件模板
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/component/uibase/tpl',function () {

  /**
   * @private
   * 控件模板扩展类的渲染类(view)
   * @class BUI.Component.UIBase.TplView
   */
  function tplView () {
    
  }

  tplView.ATTRS = {
    /**
     * 模板
     * @protected
     * @type {String}
     */
    tpl:{

    }
  };

  tplView.prototype = {
    __renderUI : function(){
      var _self = this,
        contentContainer = _self.get('childContainer'),
        contentEl;

      if(contentContainer){
        contentEl = _self.get('el').find(contentContainer);
        if(contentEl.length){
          _self.set('contentEl',contentEl);
        }
      }
    },
    /**
     * 获取生成控件的模板
     * @protected
     * @param  {Object} attrs 属性值
     * @return {String} 模板
     */
    getTpl:function (attrs) {
        var _self = this,
            tpl = _self.get('tpl'),
            tplRender = _self.get('tplRender');
        attrs = attrs || _self.getAttrVals();

        if(tplRender){
          return tplRender(attrs);
        }
        if(tpl){
          return BUI.substitute(tpl,attrs);
        }
        return '';
    },
    /**
     * 如果控件设置了模板，则根据模板和属性值生成DOM
     * 如果设置了content属性，此模板不应用
     * @protected
     * @param  {Object} attrs 属性值，默认为初始化时传入的值
     */
    setTplContent:function (attrs) {
        var _self = this,
            el = _self.get('el'),
            content = _self.get('content'),
            tpl = _self.getTpl(attrs);
        if(!content && tpl){
          el.empty();
          el.html(tpl);
        }
    }
  }

  /**
   * 控件的模板扩展
   * @class BUI.Component.UIBase.Tpl
   */
  function tpl() {

  }

  tpl.ATTRS = {
    /**
    * 控件的模版，用于初始化
    * <pre><code>
    * var list = new List.List({
    *   tpl : '&lt;div class="toolbar"&gt;&lt;/div&gt;&lt;ul&gt;&lt;/ul&gt;',
    *   childContainer : 'ul'
    * });
    * //用于统一子控件模板
    * var list = new List.List({
    *   defaultChildCfg : {
    *     tpl : '&lt;span&gt;{text}&lt;/span&gt;'
    *   }
    * });
    * list.render();
    * </code></pre>
    * @cfg {String} tpl
    */
    /**
     * 控件的模板
     * <pre><code>
     *   list.set('tpl','&lt;div class="toolbar"&gt;&lt;/div&gt;&lt;ul&gt;&lt;/ul&gt;&lt;div class="bottom"&gt;&lt;/div&gt;')
     * </code></pre>
     * @type {String}
     */
    tpl : {
      view : true,
      sync: false
    },
    /**
     * <p>控件的渲染函数，应对一些简单模板解决不了的问题，例如有if,else逻辑，有循环逻辑,
     * 函数原型是function(data){},其中data是控件的属性值</p>
     * <p>控件模板的加强模式，此属性会覆盖@see {BUI.Component.UIBase.Tpl#property-tpl}属性</p>
     * //用于统一子控件模板
     * var list = new List.List({
     *   defaultChildCfg : {
     *     tplRender : funciton(item){
     *       if(item.type == '1'){
     *         return 'type1 html';
     *       }else{
     *         return 'type2 html';
     *       }
     *     }
     *   }
     * });
     * list.render();
     * @cfg {Function} tplRender
     */
    tplRender : {
      view : true,
      value : null
    },
    /**
     * 这是一个选择器，使用了模板后，子控件可能会添加到模板对应的位置,
     *  - 默认为null,此时子控件会将控件最外层 el 作为容器
     * <pre><code>
     * var list = new List.List({
     *   tpl : '&lt;div class="toolbar"&gt;&lt;/div&gt;&lt;ul&gt;&lt;/ul&gt;',
     *   childContainer : 'ul'
     * });
     * </code></pre>
     * @cfg {String} childContainer
     */
    childContainer : {
      view : true
    }
  };

  tpl.prototype = {

    __renderUI : function () {
      //使用srcNode时，不使用模板
      if(!this.get('srcNode')){
        this.setTplContent();
      }
    },
    /**
     * 根据控件的属性和模板生成控件内容
     * @protected
     */
    setTplContent : function () {
      var _self = this,
        attrs = _self.getAttrVals();
      _self.get('view').setTplContent(attrs);
    },
    //模板发生改变
    _uiSetTpl : function(){
      this.setTplContent();
    }
  };


  tpl.View = tplView;

  return tpl;
});
 


/**
 * @fileOverview  控件可以实例化的基类
 * @ignore
 * @author yiminghe@gmail.com
 * copied by dxq613@gmail.com
 */

/**
 * jQuery 事件
 * @class jQuery.Event
 * @private
 */


define('bui/component/controller',['bui/component/uibase','bui/component/manage','bui/component/view','bui/component/loader'],function(require){
    'use strict';
    var UIBase = require('bui/component/uibase'),
        Manager = require('bui/component/manage'),
        View = require('bui/component/view'),
        Loader = require('bui/component/loader'),
        wrapBehavior = BUI.wrapBehavior,
        getWrapBehavior = BUI.getWrapBehavior;

     /**
      * @ignore
      */
     function wrapperViewSetter(attrName) {
        return function (ev) {
            var self = this;
            // in case bubbled from sub component
            if (self === ev.target) {
                var value = ev.newVal,
                    view = self.get('view');
                if(view){
                    view.set(attrName, value); 
                }
               
            }
        };
    }

    /**
      * @ignore
      */
    function wrapperViewGetter(attrName) {
        return function (v) {
            var self = this,
                view = self.get('view');
            return v === undefined ? view.get(attrName) : v;
        };
    }

    /**
      * @ignore
      */
    function initChild(self, c, renderBefore) {
        // 生成父组件的 dom 结构
        self.create();
        var contentEl = self.getContentElement(),
            defaultCls = self.get('defaultChildClass');
        //配置默认 xclass
        if(!c.xclass && !(c instanceof Controller)){
            if(!c.xtype){
                c.xclass = defaultCls;
            }else{
                c.xclass = defaultCls + '-' + c.xtype;
            }
            
        }

        c = BUI.Component.create(c, self);
        c.setInternal('parent', self);
        // set 通知 view 也更新对应属性
        c.set('render', contentEl);
        c.set('elBefore', renderBefore);
        // 如果 parent 也没渲染，子组件 create 出来和 parent 节点关联
        // 子组件和 parent 组件一起渲染
        // 之前设好属性，view ，logic 同步还没 bind ,create 不是 render ，还没有 bindUI
        c.create(undefined);
        return c;
    }

    /**
     * 不使用 valueFn，
     * 只有 render 时需要找到默认，其他时候不需要，防止莫名其妙初始化
     * @ignore
     */
    function constructView(self) {
        // 逐层找默认渲染器
        var attrs,
            attrCfg,
            attrName,
            cfg = {},
            v,
            Render = self.get('xview');

      
        //将渲染层初始化所需要的属性，直接构造器设置过去

        attrs = self.getAttrs();

        // 整理属性，对纯属于 view 的属性，添加 getter setter 直接到 view
        for (attrName in attrs) {
            if (attrs.hasOwnProperty(attrName)) {
                attrCfg = attrs[attrName];
                if (attrCfg.view) {
                    // 先取后 getter
                    // 防止死循环
                    if (( v = self.get(attrName) ) !== undefined) {
                        cfg[attrName] = v;
                    }

                    // setter 不应该有实际操作，仅用于正规化比较好
                    // attrCfg.setter = wrapperViewSetter(attrName);
                    self.on('after' + BUI.ucfirst(attrName) + 'Change',
                        wrapperViewSetter(attrName));
                    // 逻辑层读值直接从 view 层读
                    // 那么如果存在默认值也设置在 view 层
                    // 逻辑层不要设置 getter
                    attrCfg.getter = wrapperViewGetter(attrName);
                }
            }
        }
        // does not autoRender for view
        delete cfg.autoRender;
        cfg.ksComponentCss = getComponentCss(self);
        return new Render(cfg);
    }

    function getComponentCss(self) {
        var constructor = self.constructor,
            cls,
            re = [];
        while (constructor && constructor !== Controller) {
            cls = Manager.getXClassByConstructor(constructor);
            if (cls) {
                re.push(cls);
            }
            constructor = constructor.superclass && constructor.superclass.constructor;
        }
        return re.join(' ');
    }

    function isMouseEventWithinElement(e, elem) {
        var relatedTarget = e.relatedTarget;
        // 在里面或等于自身都不算 mouseenter/leave
        return relatedTarget &&
            ( relatedTarget === elem[0] ||$.contains(elem,relatedTarget));
    }

    /**
     * 可以实例化的控件，作为最顶层的控件类，一切用户控件都继承此控件
     * xclass: 'controller'.
     * ** 创建子控件 ** 
     * <pre><code>
     * var Control = Controller.extend([mixin1,mixin2],{ //原型链上的函数
     *   renderUI : function(){ //创建DOM
     *   
     *   }, 
     *   bindUI : function(){  //绑定事件
     *   
     *   },
     *   destructor : funciton(){ //析构函数
     *   
     *   }
     * },{
     *   ATTRS : { //默认的属性
     *       text : {
     *       
     *       }
     *   }
     * },{
     *     xclass : 'a' //用于把对象解析成类
     * });
     * </code></pre>
     *
     * ** 创建对象 **
     * <pre><code>
     * var c1 = new Control({
     *     render : '#t1', //在t1上创建
     *     text : 'text1',
     *     children : [{xclass : 'a',text : 'a1'},{xclass : 'b',text : 'b1'}]
     * });
     *
     * c1.render();
     * </code></pre>
     * @extends BUI.Component.UIBase
     * @mixins BUI.Component.UIBase.Tpl
     * @mixins BUI.Component.UIBase.Decorate
     * @mixins BUI.Component.UIBase.Depends
     * @mixins BUI.Component.UIBase.ChildCfg
     * @class BUI.Component.Controller
     */
    var Controller = UIBase.extend([UIBase.Decorate,UIBase.Tpl,UIBase.ChildCfg,UIBase.KeyNav,UIBase.Depends],
    {
        /**
         * 是否是控件，标示对象是否是一个UI 控件
         * @type {Boolean}
         */
        isController: true,

        /**
         * 使用前缀获取类的名字
         * @param classes {String} class names without prefixCls. Separated by space.
         * @method
         * @protected
         * @return {String} class name with prefixCls
         */
        getCssClassWithPrefix: Manager.getCssClassWithPrefix,

        /**
         * From UIBase, Initialize this component.             *
         * @protected
         */
        initializer: function () {
            var self = this;

            if(!self.get('id')){
                self.set('id',self.getNextUniqueId());
            }
            Manager.addComponent(self.get('id'),self);
            // initialize view
            self.setInternal('view', constructView(self));
        },

        /**
         * 返回新的唯一的Id,结果是 'xclass' + number
         * @protected
         * @return {String} 唯一id
         */
        getNextUniqueId : function(){
            var self = this,
                xclass = Manager.getXClassByConstructor(self.constructor);
            return BUI.guid(xclass);
        },
        /**
         * From UIBase. Constructor(or get) view object to create ui elements.
         * @protected
         *
         */
        createDom: function () {
            var self = this,
                //el,
                view = self.get('view');
            view.create(undefined);
            //el = view.getKeyEventTarget();
            /*if (!self.get('allowTextSelection')) {
                //el.unselectable(undefined);
            }*/
        },

        /**
         * From UIBase. Call view object to render ui elements.
         * @protected
         *
         */
        renderUI: function () {
            var self = this, 
                loader = self.get('loader');
            self.get('view').render();
            self._initChildren();
            if(loader){
                self.setInternal('loader',loader);
            }
            /**/

        },
        _initChildren : function(children){
            var self = this, 
                i, 
                children, 
                child;
            // then render my children
            children = children || self.get('children').concat();
            self.get('children').length = 0;
            for (i = 0; i < children.length; i++) {
                child = self.addChild(children[i]);
                child.render();
            }
        },
        /**
         * bind ui for box
         * @private
         */
        bindUI:function () {
            var self = this,
                events = self.get('events');
            this.on('afterVisibleChange', function (e) {
                this.fire(e.newVal ? 'show' : 'hide');
            });
            //处理控件事件，设置事件是否冒泡
            BUI.each(events, function (v,k) {
              self.publish(k, {
                  bubbles:v
              });
            });
        },
        /**
         * 控件是否包含指定的DOM元素,包括根节点
         * <pre><code>
         *   var control = new Control();
         *   $(document).on('click',function(ev){
         *     var target = ev.target;
         *
         *     if(!control.containsElement(elem)){ //未点击在控件内部
         *       control.hide();
         *     }
         *   });
         * </code></pre>
         * @param  {HTMLElement} elem DOM 元素
         * @return {Boolean}  是否包含
         */
        containsElement : function (elem) {
          var _self = this,
            el = _self.get('el'),
            children = _self.get('children'),
            result = false;
          if(!_self.get('rendered')){
            return false;
          }
          if($.contains(el[0],elem) || el[0] === elem){
            result = true;
          }else{
            BUI.each(children,function (item) {
                if(item.containsElement(elem)){
                    result = true;
                    return false;
                }
            });
          }
          return result;
        },
        /**
         * 是否是子控件的DOM元素
         * @protected
         * @return {Boolean} 是否子控件的DOM元素
         */
        isChildrenElement : function(elem){
            var _self = this,
                children = _self.get('children'),
                rst = false;
            BUI.each(children,function(child){
                if(child.containsElement(elem)){
                    rst = true;
                    return false;
                }
            });
            return rst;
        },
        /**
         * 显示控件
         */
        show:function () {
            var self = this;
            self.render();
            self.set('visible', true);
            return self;
        },

        /**
         * 隐藏控件
         */
        hide:function () {
            var self = this;
            self.set('visible', false);
            return self;
        },
        /**
         * 交替显示或者隐藏
         * <pre><code>
         *  control.show(); //显示
         *  control.toggle(); //隐藏
         *  control.toggle(); //显示
         * </code></pre>
         */
        toggle : function(){
            this.set('visible',!this.get('visible'));
            return this;
        },
        _uiSetFocusable: function (focusable) {
            var self = this,
                t,
                el = self.getKeyEventTarget();
            if (focusable) {
                el.attr('tabIndex', 0)
                    // remove smart outline in ie
                    // set outline in style for other standard browser
                    .attr('hideFocus', true)
                    .on('focus', wrapBehavior(self, 'handleFocus'))
                    .on('blur', wrapBehavior(self, 'handleBlur'))
                    .on('keydown', wrapBehavior(self, 'handleKeydown'))
                    .on('keyup',wrapBehavior(self,'handleKeyUp'));
            } else {
                el.removeAttr('tabIndex');
                if (t = getWrapBehavior(self, 'handleFocus')) {
                    el.off('focus', t);
                }
                if (t = getWrapBehavior(self, 'handleBlur')) {
                    el.off('blur', t);
                }
                if (t = getWrapBehavior(self, 'handleKeydown')) {
                    el.off('keydown', t);
                }
                if (t = getWrapBehavior(self, 'handleKeyUp')) {
                    el.off('keyup', t);
                }
            }
        },

        _uiSetHandleMouseEvents: function (handleMouseEvents) {
            var self = this, el = self.get('el'), t;
            if (handleMouseEvents) {
                el.on('mouseenter', wrapBehavior(self, 'handleMouseEnter'))
                    .on('mouseleave', wrapBehavior(self, 'handleMouseLeave'))
                    .on('contextmenu', wrapBehavior(self, 'handleContextMenu'))
                    .on('mousedown', wrapBehavior(self, 'handleMouseDown'))
                    .on('mouseup', wrapBehavior(self, 'handleMouseUp'))
                    .on('dblclick', wrapBehavior(self, 'handleDblClick'));
            } else {
                t = getWrapBehavior(self, 'handleMouseEnter') &&
                    el.off('mouseenter', t);
                t = getWrapBehavior(self, 'handleMouseLeave') &&
                    el.off('mouseleave', t);
                t = getWrapBehavior(self, 'handleContextMenu') &&
                    el.off('contextmenu', t);
                t = getWrapBehavior(self, 'handleMouseDown') &&
                    el.off('mousedown', t);
                t = getWrapBehavior(self, 'handleMouseUp') &&
                    el.off('mouseup', t);
                t = getWrapBehavior(self, 'handleDblClick') &&
                    el.off('dblclick', t);
            }
        },

        _uiSetFocused: function (v) {
            if (v) {
                this.getKeyEventTarget()[0].focus();
            }
        },
        //当使用visiblity显示隐藏时，隐藏时把DOM移除出视图内，显示时回复原位置
        _uiSetVisible : function(isVisible){
            var self = this,
                el = self.get('el'),
                visibleMode = self.get('visibleMode');
            if (visibleMode === 'visibility') {
                if(isVisible){
                    var position = self.get('cachePosition');
                    if(position){
                        self.set('xy',position);
                    }
                }
                if(!isVisible){
                    var position = [
                        self.get('x'),self.get('y')
                    ];
                    self.set('cachePosition',position);
                    self.set('xy',[-999,-999]);
                }
            }
        },
        //设置children时
        _uiSetChildren : function(v){
            var self = this,
                children = BUI.cloneObject(v);
            //self.removeChildren(true);
            self._initChildren(children);
        },
        /**
         * 使控件可用
         */
        enable : function(){
            this.set('disabled',false);
            return this;
        },
        /**
         * 使控件不可用，控件不可用时，点击等事件不会触发
         * <pre><code>
         *  control.disable(); //禁用
         *  control.enable(); //解除禁用
         * </code></pre>
         */
        disable : function(){
            this.set('disabled',true);
            return this;
        },
        /**
         * 子组件将要渲染到的节点，在 render 类上覆盖对应方法
         * @protected
         * @ignore
         */
        getContentElement: function () {
            return this.get('view').getContentElement();
        },

        /**
         * 焦点所在元素即键盘事件处理元素，在 render 类上覆盖对应方法
         * @protected
         * @ignore
         */
        getKeyEventTarget: function () {
            return this.get('view').getKeyEventTarget();
        },

        /**
         * 添加控件的子控件，索引值为 0-based
         * <pre><code>
         *  control.add(new Control());//添加controller对象
         *  control.add({xclass : 'a'});//添加xclass 为a 的一个对象
         *  control.add({xclass : 'b'},2);//插入到第三个位置
         * </code></pre>
         * @param {BUI.Component.Controller|Object} c 子控件的实例或者配置项
         * @param {String} [c.xclass] 如果c为配置项，设置c的xclass
         * @param {Number} [index]  0-based  如果未指定索引值，则插在控件的最后
         */
        addChild: function (c, index) {
            var self = this,
                children = self.get('children'),
                renderBefore;
            if (index === undefined) {
                index = children.length;
            }
            /**
             * 添加子控件前触发
             * @event beforeAddChild
             * @param {Object} e
             * @param {Object} e.child 添加子控件时传入的配置项或者子控件
             * @param {Number} e.index 添加的位置
             */
            self.fire('beforeAddChild',{child : c,index : index});
            renderBefore = children[index] && children[index].get('el') || null;
            c = initChild(self, c, renderBefore);
            children.splice(index, 0, c);
            // 先 create 占位 再 render
            // 防止 render 逻辑里读 parent.get('children') 不同步
            // 如果 parent 已经渲染好了子组件也要立即渲染，就 创建 dom ，绑定事件
            if (self.get('rendered')) {
                c.render();
            }

            /**
             * 添加子控件后触发
             * @event afterAddChild
             * @param {Object} e
             * @param {Object} e.child 添加子控件
             * @param {Number} e.index 添加的位置
             */
            self.fire('afterAddChild',{child : c,index : index});
            return c;
        },
        /**
         * 将自己从父控件中移除
         * <pre><code>
         *  control.remove(); //将控件从父控件中移除，并未删除
         *  parent.addChild(control); //还可以添加回父控件
         *  
         *  control.remove(true); //从控件中移除并调用控件的析构函数
         * </code></pre>
         * @param  {Boolean} destroy 是否删除DON节点
         * @return {BUI.Component.Controller} 删除的子对象.
         */
        remove : function(destroy){
            var self = this,
                parent = self.get('parent');
            if(parent){
                parent.removeChild(self,destroy);
            }else if (destroy) {
                self.destroy();
            }
            return self;
        },
        /**
         * 移除子控件，并返回移除的控件
         *
         * ** 如果 destroy=true,调用移除控件的 {@link BUI.Component.UIBase#destroy} 方法,
         * 同时删除对应的DOM **
         * <pre><code>
         *  var child = control.getChild(id);
         *  control.removeChild(child); //仅仅移除
         *  
         *  control.removeChild(child,true); //移除，并调用析构函数
         * </code></pre>
         * @param {BUI.Component.Controller} c 要移除的子控件.
         * @param {Boolean} [destroy=false] 如果是true,
         * 调用控件的方法 {@link BUI.Component.UIBase#destroy} .
         * @return {BUI.Component.Controller} 移除的子控件.
         */
        removeChild: function (c, destroy) {
            var self = this,
                children = self.get('children'),
                index = BUI.Array.indexOf(c, children);

            if(index === -1){
                return;
            }
            /**
             * 删除子控件前触发
             * @event beforeRemoveChild
             * @param {Object} e
             * @param {Object} e.child 子控件
             * @param {Boolean} e.destroy 是否清除DOM
             */
            self.fire('beforeRemoveChild',{child : c,destroy : destroy});

            if (index !== -1) {
                children.splice(index, 1);
            }
            if (destroy &&
                // c is still json
                c.destroy) {
                c.destroy();
            }
            /**
             * 删除子控件前触发
             * @event afterRemoveChild
             * @param {Object} e
             * @param {Object} e.child 子控件
             * @param {Boolean} e.destroy 是否清除DOM
             */
            self.fire('afterRemoveChild',{child : c,destroy : destroy});

            return c;
        },

        /**
         * 删除当前控件的子控件
         * <pre><code>
         *   control.removeChildren();//删除所有子控件
         *   control.removeChildren(true);//删除所有子控件，并调用子控件的析构函数
         * </code></pre>
         * @see Component.Controller#removeChild
         * @param {Boolean} [destroy] 如果设置 true,
         * 调用子控件的 {@link BUI.Component.UIBase#destroy}方法.
         */
        removeChildren: function (destroy) {
            var self = this,
                i,
                t = [].concat(self.get('children'));
            for (i = 0; i < t.length; i++) {
                self.removeChild(t[i], destroy);
            }
        },

        /**
         * 根据索引获取子控件
         * <pre><code>
         *  control.getChildAt(0);//获取第一个子控件
         *  control.getChildAt(2); //获取第三个子控件
         * </code></pre>
         * @param {Number} index 0-based 索引值.
         * @return {BUI.Component.Controller} 子控件或者null 
         */
        getChildAt: function (index) {
            var children = this.get('children');
            return children[index] || null;
        },
        /**
         * 根据Id获取子控件
         * <pre><code>
         *  control.getChild('id'); //从控件的直接子控件中查找
         *  control.getChild('id',true);//递归查找所有子控件，包含子控件的子控件
         * </code></pre>
         * @param  {String} id 控件编号
         * @param  {Boolean} deep 是否继续查找在子控件中查找
         * @return {BUI.Component.Controller} 子控件或者null 
         */
        getChild : function(id,deep){
            return this.getChildBy(function(item){
                return item.get('id') === id;
            },deep);
        },
        /**
         * 通过匹配函数查找子控件，返回第一个匹配的对象
         * <pre><code>
         *  control.getChildBy(function(child){//从控件的直接子控件中查找
         *    return child.get('id') = '1243';
         *  }); 
         *  
         *  control.getChild(function(child){//递归查找所有子控件，包含子控件的子控件
         *    return child.get('id') = '1243';
         *  },true);
         * </code></pre>
         * @param  {Function} math 查找的匹配函数
         * @param  {Boolean} deep 是否继续查找在子控件中查找
         * @return {BUI.Component.Controller} 子控件或者null 
         */
        getChildBy : function(math,deep){
            return this.getChildrenBy(math,deep)[0] || null;
        },
        /**
         * 获取控件的附加高度 = control.get('el').outerHeight() - control.get('el').height()
         * @protected
         * @return {Number} 附加宽度
         */
        getAppendHeight : function(){
            var el = this.get('el');
            return el.outerHeight() - el.height();
        },
        /**
         * 获取控件的附加宽度 = control.get('el').outerWidth() - control.get('el').width()
         * @protected
         * @return {Number} 附加宽度
         */
        getAppendWidth : function(){
            var el = this.get('el');
            return el.outerWidth() - el.width();
        },
        /**
         * 查找符合条件的子控件
         * <pre><code>
         *  control.getChildrenBy(function(child){//从控件的直接子控件中查找
         *    return child.get('type') = '1';
         *  }); 
         *  
         *  control.getChildrenBy(function(child){//递归查找所有子控件，包含子控件的子控件
         *    return child.get('type') = '1';
         *  },true);
         * </code></pre>
         * @param  {Function} math 查找的匹配函数
         * @param  {Boolean} deep 是否继续查找在子控件中查找，如果符合上面的匹配函数，则不再往下查找
         * @return {BUI.Component.Controller[]} 子控件数组 
         */
        getChildrenBy : function(math,deep){
            var self = this,
                results = [];
            if(!math){
                return results;
            }

            self.eachChild(function(child){
                if(math(child)){
                    results.push(child);
                }else if(deep){

                    results = results.concat(child.getChildrenBy(math,deep));
                }
            });
            return results;
        },
        /**
         * 遍历子元素
         * <pre><code>
         *  control.eachChild(function(child,index){ //遍历子控件
         *  
         *  });
         * </code></pre>
         * @param  {Function} func 迭代函数，函数原型function(child,index)
         */
        eachChild : function(func){
            BUI.each(this.get('children'),func);
        },
        /**
         * Handle dblclick events. By default, this performs its associated action by calling
         * {@link BUI.Component.Controller#performActionInternal}.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleDblClick: function (ev) {
            this.performActionInternal(ev);
            if(!this.isChildrenElement(ev.target)){
                this.fire('dblclick',{domTarget : ev.target,domEvent : ev});
            }
        },

        /**
         * Called by it's container component to dispatch mouseenter event.
         * @private
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleMouseOver: function (ev) {
            var self = this,
                el = self.get('el');
            if (!isMouseEventWithinElement(ev, el)) {
                self.handleMouseEnter(ev);
                
            }
        },

        /**
         * Called by it's container component to dispatch mouseleave event.
         * @private
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleMouseOut: function (ev) {
            var self = this,
                el = self.get('el');
            if (!isMouseEventWithinElement(ev, el)) {
                self.handleMouseLeave(ev);
                
            }
        },

        /**
         * Handle mouseenter events. If the component is not disabled, highlights it.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleMouseEnter: function (ev) {
            var self = this;
            this.set('highlighted', !!ev);
            self.fire('mouseenter',{domTarget : ev.target,domEvent : ev});
        },

        /**
         * Handle mouseleave events. If the component is not disabled, de-highlights it.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleMouseLeave: function (ev) {
            var self = this;
            self.set('active', false);
            self.set('highlighted', !ev);
            self.fire('mouseleave',{domTarget : ev.target,domEvent : ev});
        },

        /**
         * Handles mousedown events. If the component is not disabled,
         * If the component is activeable, then activate it.
         * If the component is focusable, then focus it,
         * else prevent it from receiving keyboard focus.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleMouseDown: function (ev) {
            var self = this,
                n,
                isMouseActionButton = ev['which'] === 1,
                el;
            if (isMouseActionButton) {
                el = self.getKeyEventTarget();
                if (self.get('activeable')) {
                    self.set('active', true);
                }
                if (self.get('focusable')) {
                    el[0].focus();
                    self.set('focused', true);
                }

                if (!self.get('allowTextSelection')) {
                    // firefox /chrome 不会引起焦点转移
                    n = ev.target.nodeName;
                    n = n && n.toLowerCase();
                    // do not prevent focus when click on editable element
                    if (n !== 'input' && n !== 'textarea') {
                        ev.preventDefault();
                    }
                }
                if(!self.isChildrenElement(ev.target)){
                    self.fire('mousedown',{domTarget : ev.target,domEvent : ev});
                }
                
            }
        },

        /**
         * Handles mouseup events.
         * If this component is not disabled, performs its associated action by calling
         * {@link BUI.Component.Controller#performActionInternal}, then deactivates it.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleMouseUp: function (ev) {
            var self = this,
                isChildrenElement = self.isChildrenElement(ev.target);
            // 左键
            if (self.get('active') && ev.which === 1) {
                self.performActionInternal(ev);
                self.set('active', false);
                if(!isChildrenElement){
                    self.fire('click',{domTarget : ev.target,domEvent : ev});
                }
            }
            if(!isChildrenElement){
                self.fire('mouseup',{domTarget : ev.target,domEvent : ev});
            }
        },

        /**
         * Handles context menu.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleContextMenu: function (ev) {
        },

        /**
         * Handles focus events. Style focused class.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleFocus: function (ev) {
            this.set('focused', !!ev);
            this.fire('focus',{domEvent : ev,domTarget : ev.target});
        },

        /**
         * Handles blur events. Remove focused class.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleBlur: function (ev) {
            this.set('focused', !ev);
            this.fire('blur',{domEvent : ev,domTarget : ev.target});
        },

        /**
         * Handle enter keydown event to {@link BUI.Component.Controller#performActionInternal}.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleKeyEventInternal: function (ev) {
            var self = this,
                isChildrenElement = self.isChildrenElement(ev.target);
            if (ev.which === 13) {
                if(!isChildrenElement){
                    self.fire('click',{domTarget : ev.target,domEvent : ev});
                }
                
                return this.performActionInternal(ev);
            }
            if(!isChildrenElement){
                self.fire('keydown',{domTarget : ev.target,domEvent : ev});
            }
        },

        /**
         * Handle keydown events.
         * If the component is not disabled, call {@link BUI.Component.Controller#handleKeyEventInternal}
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        handleKeydown: function (ev) {
            var self = this;
            if (self.handleKeyEventInternal(ev)) {
                ev.halt();
                return true;
            }
        },
        handleKeyUp : function(ev){
            var self = this;
            if(!self.isChildrenElement(ev.target)){
                self.fire('keyup',{domTarget : ev.target,domEvent : ev});
            }
        },
        /**
         * Performs the appropriate action when this component is activated by the user.
         * @protected
         * @param {jQuery.Event} ev DOM event to handle.
         */
        performActionInternal: function (ev) {
        },
        /**
         * 析构函数
         * @protected
         */
        destructor: function () {
            var self = this,
                id,
                i,
                view,
                children = self.get('children');
            id = self.get('id');
            for (i = 0; i < children.length; i++) {
                children[i].destroy && children[i].destroy();
            }
            self.get('view').destroy();
            Manager.removeComponent(id);
        }
    },
    {
        ATTRS: 
        {
            /**
             * 控件的Html 内容
             * <pre><code>
             *  new Control({
             *     content : '内容',
             *     render : '#c1'
             *  });
             * </code></pre>
             * @cfg {String|jQuery} content
             */
            /**
             * 控件的Html 内容
             * @type {String|jQuery}
             */
            content:{
                view:1
            },
			/**
			 * 控件根节点使用的标签
             * <pre><code>
             *  new Control({
             *     elTagName : 'ul',
             *      content : '<li>内容</li>',  //控件的DOM &lt;ul&gt;&lt;li&gt;内容&lt;/li&gt;&lt;/ul&gt;
             *     render : '#c1'
             *  });  
             * </code></pre>
			 * @cfg {String} elTagName
			 */
			elTagName: {
				// 生成标签名字
				view : true,
				value: 'div'
			},
            /**
             * 子元素的默认 xclass,配置child的时候没必要每次都填写xclass
             * @type {String}
             */
            defaultChildClass : {
                
            },
            /**
             * 如果控件未设置 xclass，同时父元素设置了 defaultChildClass，那么
             * xclass = defaultChildClass + '-' + xtype
             * <pre><code>
             *  A.ATTRS = {
             *    defaultChildClass : {
             *        value : 'b'
             *    }
             *  }
             *  //类B 的xclass = 'b'类 B1的xclass = 'b-1',类 B2的xclass = 'b-2',那么
             *  var a = new A({
             *    children : [
             *        {content : 'b'}, //B类
             *        {content : 'b1',xtype:'1'}, //B1类
             *        {content : 'b2',xtype:'2'}, //B2类
             *    ]
             *  });
             * </code></pre>
             * @type {String}
             */
            xtype : {

            },
            /**
             * 标示控件的唯一编号，默认会自动生成
             * @cfg {String} id
             */
            /**
             * 标示控件的唯一编号，默认会自动生成
             * @type {String}
             */
            id : {
                view : true
            },
            /**
             * 控件宽度
             * <pre><code>
             * new Control({
             *   width : 200 // 200,'200px','20%'
             * });
             * </code></pre>
             * @cfg {Number|String} width
             */
            /**
             * 控件宽度
             * <pre><code>
             *  control.set('width',200);
             *  control.set('width','200px');
             *  control.set('width','20%');
             * </code></pre>
             * @type {Number|String}
             */
            width:{
                view:1
            },
            /**
             * 控件宽度
             * <pre><code>
             * new Control({
             *   height : 200 // 200,'200px','20%'
             * });
             * </code></pre>
             * @cfg {Number|String} height
             */
            /**
             * 控件宽度
             * <pre><code>
             *  control.set('height',200);
             *  control.set('height','200px');
             *  control.set('height','20%');
             * </code></pre>
             * @type {Number|String}
             */
            height:{
                view:1
            },
            /**
             * 控件根节点应用的样式
             * <pre><code>
             *  new Control({
             *   elCls : 'test',
             *   content : '内容',
             *   render : '#t1'   //&lt;div id='t1'&gt;&lt;div class="test"&gt;内容&lt;/div&gt;&lt;/div&gt;
             *  });
             * </code></pre>
             * @cfg {String} elCls
             */
            /**
             * 控件根节点应用的样式 css class
             * @type {String}
             */
            elCls:{
                view:1
            },
            /**
             * @cfg {Object} elStyle
			 * 控件根节点应用的css属性
             *  <pre><code>
             *    var cfg = {elStyle : {width:'100px', height:'200px'}};
             *  </code></pre>
             */
            /**
             * 控件根节点应用的css属性，以键值对形式
             * @type {Object}
			 *  <pre><code>
             *	 control.set('elStyle',	{
             *		width:'100px',
             *		height:'200px'
             *   });
             *  </code></pre>
             */
            elStyle:{
                view:1
            },
            /**
             * @cfg {Object} elAttrs
			 * 控件根节点应用的属性，以键值对形式:
             * <pre><code>
             *  new Control({
             *    elAttrs :{title : 'tips'}   
             *  });
             * </code></pre>
             */
            /**
             * @type {Object}
			 * 控件根节点应用的属性，以键值对形式:
             * { title : 'tips'}
             * @ignore
             */
            elAttrs:{
                view:1
            },
            /**
             * 将控件插入到指定元素前
             * <pre><code>
             *  new Control({
             *      elBefore : '#t1'
             *  });
             * </code></pre>
             * @cfg {jQuery} elBefore
             */
            /**
             * 将控件插入到指定元素前
             * @type {jQuery}
             * @ignore
             */
            elBefore:{
                // better named to renderBefore, too late !
                view:1
            },

            /**
             * 只读属性，根节点DOM
             * @type {jQuery}
             */
            el:{
                view:1
            },
            /**
             * 控件支持的事件
             * @type {Object}
             * @protected
             */
            events : {
                value : {
                    /**
                     * 点击事件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'click' : true,
                    /**
                     * 双击事件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'dblclick' : true,
                    /**
                     * 鼠标移入控件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'mouseenter' : true,
                    /**
                     * 鼠标移出控件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'mouseleave' : true,
                    /**
                     * 键盘按下按键事件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'keydown' : true,
                    /**
                     * 键盘按键抬起控件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'keyup' : true,
                    /**
                     * 控件获取焦点事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'focus' : false,
                    /**
                     * 控件丢失焦点事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'blur' : false,
                    /**
                     * 鼠标按下控件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'mousedown' : true,
                    /**
                     * 鼠标抬起控件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
                     * @event
                     * @param {Object} e 事件对象
                     * @param {BUI.Component.Controller} e.target 触发事件的对象
                     * @param {jQuery.Event} e.domEvent DOM触发的事件
                     * @param {HTMLElement} e.domTarget 触发事件的DOM节点
                     */
                    'mouseup' : true,
                    /**
                     * 控件显示
                     * @event
                     */
                    'show' : false,
                    /**
                     * 控件隐藏
                     * @event
                     */
                    'hide' : false
                }
            },
            /**
             * 指定控件的容器
             * <pre><code>
             *  new Control({
             *    render : '#t1',
             *    elCls : 'test',
             *    content : '<span>123</span>'  //&lt;div id="t1"&gt;&lt;div class="test bui-xclass"&gt;&lt;span&gt;123&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;
             *  });
             * </code></pre>
             * @cfg {jQuery} render
             */
            /**
             * 指定控件的容器
             * @type {jQuery}
             * @ignore
             */
            render:{
                view:1
            },
            /**
             * 状态相关的样式,默认情况下会使用 前缀名 + xclass + '-' + 状态名
             * <ol>
             *     <li>hover</li>
             *     <li>focused</li>
             *     <li>active</li>
             *     <li>disabled</li>
             * </ol>
             * @type {Object}
             */
            statusCls : {
                view : true,
                value : {

                }
            },
            /**
             * 控件的可视方式,值为：
             *  - 'display' 
             *  - 'visibility'
             *  <pre><code>
             *   new Control({
             *     visibleMode: 'visibility'
             *   });
             *  </code></pre>
             * @cfg {String} [visibleMode = 'display']
             */
            /**
             * 控件的可视方式,使用 css 
             *  - 'display' 或者 
             *  - 'visibility'
             * <pre><code>
             *  control.set('visibleMode','display')
             * </code></pre>
             * @type {String}
             */
            visibleMode:{
                view:1,
                value : 'display'
            },
            /**
             * 控件是否可见
             * <pre><code>
             *  new Control({
             *    visible : false   //隐藏
             *  });
             * </code></pre>
             * @cfg {Boolean} [visible = true]
             */
            /**
             * 控件是否可见
             * <pre><code>
             *  control.set('visible',true); //control.show();
             *  control.set('visible',false); //control.hide();
             * </code></pre>
             * @type {Boolean}
             * @default true
             */
            visible:{
                value:true,
                view:1
            },
            /**
             * 是否允许处理鼠标事件
             * @default true.
             * @type {Boolean}
             * @protected
             */
            handleMouseEvents: {
                value: true
            },

            /**
             * 控件是否可以获取焦点
             * @default true.
             * @protected
             * @type {Boolean}
             */
            focusable: {
                value: false,
                view: 1
            },
            /**
             * 一旦使用loader的默认配置
             * @protected
             * @type {Object}
             */
            defaultLoaderCfg : {
                value : {
                    property : 'content',
                    autoLoad : true
                }
            },
            /**
             * 控件内容的加载器
             * @type {BUI.Component.Loader}
             */
            loader : {
                getter : function(v){
                    var _self = this,
                        defaultCfg;
                    if(v && !v.isLoader){
                        v.target = _self;
                        defaultCfg = _self.get('defaultLoaderCfg')
                        v = new Loader(BUI.merge(defaultCfg,v));
                        _self.setInternal('loader',v);
                    }
                    return v;
                }
            },
            /**
             * 1. Whether allow select this component's text.<br/>
             * 2. Whether not to lose last component's focus if click current one (set false).
             *
             * Defaults to: false.
             * @type {Boolean}
             * @property allowTextSelection
             * @protected
             */
            /**
             * @ignore
             */
            allowTextSelection: {
                // 和 focusable 分离
                // grid 需求：容器允许选择里面内容
                value: true
            },

            /**
             * 控件是否可以激活
             * @default true.
             * @type {Boolean}
             * @protected
             */
            activeable: {
                value: true
            },

            /**
             * 控件是否获取焦点
             * @type {Boolean}
             * @readOnly
             */
            focused: {
                view: 1
            },

            /**
             * 控件是否处于激活状态，按钮按下还未抬起
             * @type {Boolean}
             * @default false
             * @protected
             */
            active: {
                view: 1
            },
            /**
             * 控件是否高亮
             * @cfg {Boolean} highlighted
             * @ignore
             */
            /**
             * 控件是否高亮
             * @type {Boolean}
             * @protected
             */
            highlighted: {
                view: 1
            },
            /**
             * 子控件集合
             * @cfg {BUI.Component.Controller[]} children
             */
            /**
             * 子控件集合
             * @type {BUI.Component.Controller[]}
             */
            children: {
                sync : false,
                value: []
            },
            /**
             * 控件的CSS前缀
             * @cfg {String} [prefixCls = BUI.prefix]
             */
            /**
             * 控件的CSS前缀
             * @type {String}
             * @default BUI.prefix
             */
            prefixCls: {
                value: BUI.prefix, // box srcNode need
                view: 1
            },

            /**
             * 父控件
             * @cfg {BUI.Component.Controller} parent
             * @ignore
             */
            /**
             * 父控件
             * @type {BUI.Component.Controller}
             */
            parent: {
                setter: function (p) {
                    // 事件冒泡源
                    this.addTarget(p);
                }
            },

            /**
             * 禁用控件
             * @cfg {Boolean} [disabled = false]
             */
            /**
             * 禁用控件
             * <pre><code>
             *  control.set('disabled',true); //==  control.disable();
             *  control.set('disabled',false); //==  control.enable();
             * </code></pre>
             * @type {Boolean}
             * @default false
             */
            disabled: {
                view: 1,
                value : false
            },
            /**
             * 渲染控件的View类.
             * @protected
             * @cfg {BUI.Component.View} [xview = BUI.Component.View]
             */
            /**
             * 渲染控件的View类.
             * @protected
             * @type {BUI.Component.View}
             */
            xview: {
                value: View
            }
        },
        PARSER : {
            visible : function(el){
                var _self = this,
                    display = el.css('display'),

                    visibility = el.css('visibility'),
                    visibleMode = _self.get('visibleMode');
                if((display == 'none' && visibleMode == 'display')  || (visibility == 'hidden' && visibleMode == 'visibility')){
                    return false;
                }
                return true;
            }
        }
    }, {
        xclass: 'controller',
        priority : 0
    });
    
    return Controller;
});

/**
 * @fileOverview 加载控件内容
 * @ignore
 */

define('bui/component/loader',['bui/util'],function (require) {
  'use strict';
  var BUI = require('bui/util'),
    Base = require('bui/base'),
    /**
     * @class BUI.Component.Loader
     * @extends BUI.Base
     * ** 控件的默认Loader属性是：**
     * <pre><code>
     *   
     *   defaultLoader : {
     *     value : {
     *       property : 'content',
     *       autoLoad : true
     *     }
     *   }
     * </code></pre>
     * ** 一般的控件默认读取html，作为控件的content值 **
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     *
     * ** 可以修改Loader的默认属性，加载children **
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/children.json',
     *       property : 'children',
     *       dataType : 'json'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * 加载控件内容的类，一般不进行实例化
     */
    Loader = function(config){
      Loader.superclass.constructor.call(this,config);
      this._init();
    };

  Loader.ATTRS = {

    /**
     * 加载内容的地址
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {String} url
     */
    url : {

    },
    /**
     * 对应的控件，加载完成后设置属性到对应的控件
     * @readOnly
     * @type {BUI.Component.Controller}
     */
    target : {

    },
    /**
     * @private
     * 是否load 过
     */
    hasLoad : {
      value : false
    },
    /**
     * 是否自动加载数据
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       autoLoad : false
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Boolean} [autoLoad = true]
     */
    autoLoad : {

    },
    /**
     * 延迟加载
     * 
     *   - event : 触发加载的事件
     *   - repeat ：是否重复加载
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       lazyLoad : {
     *         event : 'show',
     *         repeat : true
     *       }
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Object} [lazyLoad = null]
     */
    lazyLoad: {

    },
    /**
     * 加载返回的数据作为控件的那个属性
     * <pre><code>
     *   var control = new BUI.List.SimpleList({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       dataType : 'json',
     *       property : 'items'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {String} property
     */
    property : {

    },
    /**
     * 格式化返回的数据
     * @cfg {Function} renderer
     */
    renderer : {
      value : function(value){
        return value;
      }
    },
    /**
     * 加载数据时是否显示屏蔽层和加载提示 {@link BUI.Mask.LoadMask}
     * 
     *  -  loadMask : true时使用loadMask 默认的配置信息
     *  -  loadMask : {msg : '正在加载，请稍后。。'} LoadMask的配置信息
     *   <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       loadMask : true
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Boolean|Object} [loadMask = false]
     */
    loadMask : {
      value : false
    },
    /**
     * ajax 请求返回数据的类型
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       dataType : 'json',
     *       property : 'items'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {String} [dataType = 'text']
     */
    dataType : {
      value : 'text'
    },
    /**
     * Ajax请求的配置项,会覆盖 url,dataType数据
     * @cfg {Object} ajaxOptions
     */
    ajaxOptions : {
      value : {
        method : 'get',
        cache : false
      }
    },
    /**
     * 初始化的请求参数
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       params : {
     *         a : 'a',
     *         b : 'b'
     *       }
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Object} params
     * @default null
     */
    params : {

    },
    /**
     * 附加参数，每次请求都带的参数
     * @cfg {Object} appendParams
     */
    appendParams : {

    },
    /**
     * 最后一次请求的参数
     * @readOnly
     * @private
     * @type {Object}
     */
    lastParams : {
      value : {}
    },
    /**
     * 加载数据，并添加属性到控件后的回调函数
     *   - data : 加载的数据
     *   - params : 加载的参数
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       callback : function(text){
     *         var target = this.get('target');//control
     *         //TO DO
     *       }
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Function} callback
     */
    callback : {

    },
    /**
     * 失败的回调函数
     *   - response : 返回的错误对象
     *   - params : 加载的参数
     * @cfg {Function} failure
     */
    failure : {

    }

  };

  BUI.extend(Loader,Base);

  BUI.augment(Loader,{
    /**
     * @protected
     * 是否是Loader
     * @type {Boolean}
     */
    isLoader : true,
    //初始化
    _init : function(){
      var _self = this,
        autoLoad = _self.get('autoLoad'),
        params = _self.get('params');

      _self._initMask();
      if(autoLoad){
        _self.load(params);
      }else{
        _self._initParams();
        _self._initLazyLoad();
      }
    },
    //初始化延迟加载
    _initLazyLoad : function(){
      var _self = this,
        target = _self.get('target'),
        lazyLoad= _self.get('lazyLoad');

      if(target && lazyLoad && lazyLoad.event){
        target.on(lazyLoad.event,function(){
          if(!_self.get('hasLoad') || lazyLoad.repeat){
            _self.load();
          }
        });
      }
    },
    /**
     * 初始化mask
     * @private
     */
    _initMask : function(){
      var _self = this,
        target = _self.get('target'),
        loadMask = _self.get('loadMask');
      if(target && loadMask){
        BUI.use('bui/mask',function(Mask){
          var cfg = $.isPlainObject(loadMask) ? loadMask : {};
          loadMask = new Mask.LoadMask(BUI.mix({el : target.get('el')},cfg));
          _self.set('loadMask',loadMask);
        });
      }
    },
    //初始化查询参数
    _initParams : function(){
      var _self = this,
        lastParams = _self.get('lastParams'),
        params = _self.get('params');

      //初始化 参数
      BUI.mix(lastParams,params);
    },
    /**
     * 加载内容
     * @param {Object} params 加载数据的参数
     */
    load : function(params){
      var _self = this,
        url = _self.get('url'),
        ajaxOptions = _self.get('ajaxOptions'),
        lastParams = _self.get('lastParams'),
        appendParams = _self.get('appendParams');

      //BUI.mix(true,lastParams,appendParams,params);
      params = params || lastParams;
      params = BUI.merge(appendParams,params); //BUI.cloneObject(lastParams);
      _self.set('lastParams',params);
      //未提供加载地址，阻止加载
      if(!url){
        return;
      }

      _self.onBeforeLoad();
      _self.set('hasLoad',true);
      $.ajax(BUI.mix({
        dataType : _self.get('dataType'),
        data : params,
        url : url,
        success : function(data){
          _self.onload(data,params);
        },
        error : function(jqXHR, textStatus, errorThrown){
          _self.onException({
            jqXHR : jqXHR, 
            textStatus : textStatus, 
            errorThrown : errorThrown
          },params);
        }
      },ajaxOptions));
    },
    /**
     * @private
     * 加载前
     */
    onBeforeLoad : function(){
      var _self = this,
        loadMask = _self.get('loadMask');
      if(loadMask && loadMask.show){
        loadMask.show();
      }
    },
    /**
     * @private
     * 加载完毕
     */
    onload : function(data,params){
      var _self = this,
        loadMask = _self.get('loadMask'),
        property = _self.get('property'),
        callback = _self.get('callback'),
        renderer = _self.get('renderer'),
        target = _self.get('target');
      target.set(property,renderer.call(_self,data));

      /**/
      if(loadMask && loadMask.hide){
        loadMask.hide();
      }
      if(callback){
        callback.call(this,data,params);
      }
    },
    /**
     * @private
     * 加载出错
     */
    onException : function(response,params){
      var _self = this,
        failure = _self.get('failure');
      if(failure){
        failure.call(this,response,params);
      }
    }

  });

  return Loader;
});
/**
 * @fileOverview  Base UI控件的管理类
 * @author yiminghe@gmail.com
 * copied by dxq613@gmail.com
 * @ignore
 */



//控件类的管理器
define('bui/component/manage',function(require){

    var uis = {
        // 不带前缀 prefixCls
        /*
         "menu" :{
         priority:0,
         constructor:Menu
         }
         */
    };

    function getConstructorByXClass(cls) {
        var cs = cls.split(/\s+/), 
            p = -1, 
            t, 
            ui = null;
        for (var i = 0; i < cs.length; i++) {
            var uic = uis[cs[i]];
            if (uic && (t = uic.priority) > p) {
                p = t;
                ui = uic.constructor;
            }
        }
        return ui;
    }

    function getXClassByConstructor(constructor) {
        for (var u in uis) {
            var ui = uis[u];
            if (ui.constructor == constructor) {
                return u;
            }
        }
        return 0;
    }

    function setConstructorByXClass(cls, uic) {
        if (BUI.isFunction(uic)) {
            uis[cls] = {
                constructor:uic,
                priority:0
            };
        } else {
            uic.priority = uic.priority || 0;
            uis[cls] = uic;
        }
    }


    function getCssClassWithPrefix(cls) {
        var cs = $.trim(cls).split(/\s+/);
        for (var i = 0; i < cs.length; i++) {
            if (cs[i]) {
                cs[i] = this.get('prefixCls') + cs[i];
            }
        }
        return cs.join(' ');
    }



    var componentInstances = {};

    /**
     * Manage component metadata.
     * @class BUI.Component.Manager
     * @singleton
     */
    var Manager ={

        __instances:componentInstances,
        /**
         * 每实例化一个控件，就注册到管理器上
         * @param {String} id  控件 id
         * @param {BUI.Component.Controller} component 控件对象
         */
        addComponent:function (id, component) {
            componentInstances[id] = component;
        },
        /**
         * 移除注册的控件
         * @param  {String} id 控件 id
         */
        removeComponent:function (id) {
            delete componentInstances[id];
        },
        /**
         * 遍历所有的控件
         * @param  {Function} fn 遍历函数
         */
        eachComponent : function(fn){
            BUI.each(componentInstances,fn);
        },
        /**
         * 根据Id获取控件
         * @param  {String} id 编号
         * @return {BUI.Component.UIBase}   继承 UIBase的类对象
         */
        getComponent:function (id) {
            return componentInstances[id];
        },

        getCssClassWithPrefix:getCssClassWithPrefix,
        /**
         * 通过构造函数获取xclass.
         * @param {Function} constructor 控件的构造函数.
         * @type {Function}
         * @return {String}
         * @method
         */
        getXClassByConstructor:getXClassByConstructor,
        /**
         * 通过xclass获取控件的构造函数
         * @param {String} classNames Class names separated by space.
         * @type {Function}
         * @return {Function}
         * @method
         */
        getConstructorByXClass:getConstructorByXClass,
        /**
         * 将 xclass 同构造函数相关联.
         * @type {Function}
         * @param {String} className 控件的xclass名称.
         * @param {Function} componentConstructor 构造函数
         * @method
         */
        setConstructorByXClass:setConstructorByXClass
    };

    return Manager;
});
/**
 * @fileOverview uibase的入口文件
 * @ignore
 */
;(function(){
var BASE = 'bui/component/uibase/';
define('bui/component/uibase',[BASE + 'base',BASE + 'align',BASE + 'autoshow',BASE + 'autohide',
    BASE + 'close',BASE + 'collapseable',BASE + 'drag',BASE + 'keynav',BASE + 'list',
    BASE + 'listitem',BASE + 'mask',BASE + 'position',BASE + 'selection',BASE + 'stdmod',
    BASE + 'decorate',BASE + 'tpl',BASE + 'childcfg',BASE + 'bindable',BASE + 'depends'],function(r){

  var UIBase = r(BASE + 'base');
    
  BUI.mix(UIBase,{
    Align : r(BASE + 'align'),
    AutoShow : r(BASE + 'autoshow'),
    AutoHide : r(BASE + 'autohide'),
    Close : r(BASE + 'close'),
    Collapseable : r(BASE + 'collapseable'),
    Drag : r(BASE + 'drag'),
    KeyNav : r(BASE + 'keynav'),
    List : r(BASE + 'list'),
    ListItem : r(BASE + 'listitem'),
    Mask : r(BASE + 'mask'),
    Position : r(BASE + 'position'),
    Selection : r(BASE + 'selection'),
    StdMod : r(BASE + 'stdmod'),
    Decorate : r(BASE + 'decorate'),
    Tpl : r(BASE + 'tpl'),
    ChildCfg : r(BASE + 'childcfg'),
    Bindable : r(BASE + 'bindable'),
    Depends : r(BASE + 'depends')
  });

  BUI.mix(UIBase,{
    CloseView : UIBase.Close.View,
    CollapseableView : UIBase.Collapseable.View,
    ChildList : UIBase.List.ChildList,
    /*DomList : UIBase.List.DomList,
    DomListView : UIBase.List.DomList.View,*/
    ListItemView : UIBase.ListItem.View,
    MaskView : UIBase.Mask.View,
    PositionView : UIBase.Position.View,
    StdModView : UIBase.StdMod.View,
    TplView : UIBase.Tpl.View
  });
  return UIBase;
});   
})();

/**
 * @fileOverview  控件的视图层
 * @author yiminghe@gmail.com
 * copied by dxq613@gmail.com
 * @ignore
 */
define('bui/component/view',['bui/component/manage','bui/component/uibase'],function(require){

  var win = window,
    Manager = require('bui/component/manage'),
    UIBase = require('bui/component/uibase'),//BUI.Component.UIBase,
    doc = document;
    
    /**
     * 控件的视图层基类
     * @class BUI.Component.View
     * @protected
     * @extends BUI.Component.UIBase
     * @mixins BUI.Component.UIBase.TplView
     */
    var View = UIBase.extend([UIBase.TplView],
    {

        /**
         * Get all css class name to be applied to the root element of this component for given state.
         * the css class names are prefixed with component name.
         * @param {String} [state] This component's state info.
         */
        getComponentCssClassWithState: function (state) {
            var self = this,
                componentCls = self.get('ksComponentCss');
            state = state || '';
            return self.getCssClassWithPrefix(componentCls.split(/\s+/).join(state + ' ') + state);
        },

        /**
         * Get full class name (with prefix) for current component
         * @param classes {String} class names without prefixCls. Separated by space.
         * @method
         * @return {String} class name with prefixCls
         * @private
         */
        getCssClassWithPrefix: Manager.getCssClassWithPrefix,

        /**
         * Returns the dom element which is responsible for listening keyboard events.
         * @return {jQuery}
         */
        getKeyEventTarget: function () {
            return this.get('el');
        },
        /**
         * Return the dom element into which child component to be rendered.
         * @return {jQuery}
         */
        getContentElement: function () {
            return this.get('contentEl') || this.get('el');
        },
        /**
         * 获取状态对应的css样式
         * @param  {String} name 状态名称 例如：hover,disabled等等
         * @return {String} 状态样式
         */
        getStatusCls : function(name){
            var self = this,
                statusCls = self.get('statusCls'),
                cls = statusCls[name];
            if(!cls){
                cls = self.getComponentCssClassWithState('-' + name);
            }
            return cls;
        },
        /**
         * 渲染控件
         * @protected
         */
        renderUI: function () {
            var self = this;

            // 新建的节点才需要摆放定位,不支持srcNode模式
            if (!self.get('srcNode')) {
                var render = self.get('render'),
                    el = self.get('el'),
                    renderBefore = self.get('elBefore');
                if (renderBefore) {
                    el.insertBefore(renderBefore, undefined);
                } else if (render) {
                    el.appendTo(render, undefined);
                } else {
                    el.appendTo(doc.body, undefined);
                }
            }
        },
        /**
         * 只负责建立节点，如果是 decorate 过来的，甚至内容会丢失
         * @protected
         * 通过 render 来重建原有的内容
         */
        createDom: function () {
            var self = this,
                contentEl = self.get('contentEl'),
                el = self.get('el');
            if (!self.get('srcNode')) {

                el = $('<' + self.get('elTagName') + '>');

                if (contentEl) {
                    el.append(contentEl);
                }

                self.setInternal('el', el);   
            }
            
            el.addClass(self.getComponentCssClassWithState());
            if (!contentEl) {
                // 没取到,这里设下值, uiSet 时可以 set('content')  取到
                self.setInternal('contentEl', el);
            }
        },
        /**
         * 设置高亮显示
         * @protected
         */
        _uiSetHighlighted: function (v) {
            var self = this,
                componentCls = self.getStatusCls('hover'),
                el = self.get('el');
            el[v ? 'addClass' : 'removeClass'](componentCls);
        },

        /**
         * 设置禁用
         * @protected
         */
        _uiSetDisabled: function (v) {
            var self = this,
                componentCls = self.getStatusCls('disabled'),
                el = self.get('el');
            el[v ? 'addClass' : 'removeClass'](componentCls)
                .attr('aria-disabled', v);
      
            //如果禁用控件时，处于hover状态，则清除
            if(v && self.get('highlighted')){
            self.set('highlighted',false);
            }

            if (self.get('focusable')) {
                //不能被 tab focus 到
                self.getKeyEventTarget().attr('tabIndex', v ? -1 : 0);
            }
        },
        /**
         * 设置激活状态
         * @protected
         */
        _uiSetActive: function (v) {
            var self = this,
                componentCls = self.getStatusCls('active');
            self.get('el')[v ? 'addClass' : 'removeClass'](componentCls)
                .attr('aria-pressed', !!v);
        },
        /**
         * 设置获得焦点
         * @protected
         */
        _uiSetFocused: function (v) {
            var self = this,
                el = self.get('el'),
                componentCls = self.getStatusCls('focused');
            el[v ? 'addClass' : 'removeClass'](componentCls);
        },
        /**
         * 设置控件最外层DOM的属性
         * @protected
         */
        _uiSetElAttrs: function (attrs) {
            this.get('el').attr(attrs);
        },
        /**
         * 设置应用到控件最外层DOM的css class
         * @protected
         */
        _uiSetElCls: function (cls) {
            this.get('el').addClass(cls);
        },
        /**
         * 设置应用到控件最外层DOM的css style
         * @protected
         */
        _uiSetElStyle: function (style) {
            this.get('el').css(style);
        },
        /**
         * 设置应用到控件宽度
         * @protected
         */
        _uiSetWidth: function (w) {
            this.get('el').width(w);
        },
        /**
         * 设置应用到控件高度
         * @protected
         */
        _uiSetHeight: function (h) {
            var self = this;
            self.get('el').height(h);
        },
        /**
         * 设置应用到控件的内容
         * @protected
         */
        _uiSetContent: function (c) {
            var self = this, 
                el;
            // srcNode 时不重新渲染 content
            // 防止内部有改变，而 content 则是老的 html 内容
            if (self.get('srcNode') && !self.get('rendered')) {
            } else {
                el = self.get('contentEl');
                if (typeof c == 'string') {
                    el.html(c);
                } else if (c) {
                    el.empty().append(c);
                }
            }
        },
        /**
         * 设置应用到控件是否可见
         * @protected
         */
        _uiSetVisible: function (isVisible) {
            var self = this,
                el = self.get('el'),
                visibleMode = self.get('visibleMode');
            if (visibleMode === 'visibility') {
                el.css('visibility', isVisible ? 'visible' : 'hidden');
            } else {
                el.css('display', isVisible ? '' : 'none');
            }
        },
        /**
         * 析构函数
         * @protected
         */
        destructor : function () {
            var el = this.get('el');
            if (el) {
                el.remove();
            }
        }
    },{
        xclass : 'view',
        priority : 0
    });


    View.ATTRS = 
    {   
        /**
         * 控件根节点
         * @readOnly
         * see {@link BUI.Component.Controller#property-el}
         */
        el: {
            /**
			* @private
			*/
            setter: function (v) {
                return $(v);
            }
        },

        /**
         * 控件根节点样式
         * see {@link BUI.Component.Controller#property-elCls}
         */
        elCls: {
        },
        /**
         * 控件根节点样式属性
         * see {@link BUI.Component.Controller#property-elStyle}
         */
        elStyle: {
        },
        /**
         * 控件宽度
         * see {@link BUI.Component.Controller#property-width}
         */
        width: {
        },
        /**
         * 控件高度
         * see {@link BUI.Component.Controller#property-height}
         */
        height: {
        },
        /**
         * 状态相关的样式,默认情况下会使用 前缀名 + xclass + '-' + 状态名
         * see {@link BUI.Component.Controller#property-statusCls}
         * @type {Object}
         */
        statusCls : {
            value : {}
        },
        /**
         * 控件根节点使用的标签
         * @type {String}
         */
        elTagName: {
            // 生成标签名字
            value: 'div'
        },
        /**
         * 控件根节点属性
         * see {@link BUI.Component.Controller#property-elAttrs}
         * @ignore
         */
        elAttrs: {
        },
        /**
         * 控件内容，html,文本等
         * see {@link BUI.Component.Controller#property-content}
         */
        content: {
        },
        /**
         * 控件插入到指定元素前
         * see {@link BUI.Component.Controller#property-tpl}
         */
        elBefore: {
            // better named to renderBefore, too late !
        },
        /**
         * 控件在指定元素内部渲染
         * see {@link BUI.Component.Controller#property-render}
         * @ignore
         */
        render: {},
        /**
         * 是否可见
         * see {@link BUI.Component.Controller#property-visible}
         */
        visible: {
            value: true
        },
        /**
         * 可视模式
         * see {@link BUI.Component.Controller#property-visibleMode}
         */
        visibleMode: {
            value: 'display'
        },
        /**
         * @private
         * 缓存隐藏时的位置，对应visibleMode = 'visiblity' 的场景
         * @type {Object}
         */
        cachePosition : {

        },
        /**
         * content 设置的内容节点,默认根节点
         * @type {jQuery}
         * @default  el
         */
        contentEl: {
            valueFn: function () {
                return this.get('el');
            }
        },
        /**
         * 样式前缀
         * see {@link BUI.Component.Controller#property-prefixCls}
         */
        prefixCls: {
            value: BUI.prefix
        },
        /**
         * 可以获取焦点
         * @protected
         * see {@link BUI.Component.Controller#property-focusable}
         */
        focusable: {
            value: true
        },
        /**
         * 获取焦点
         * see {@link BUI.Component.Controller#property-focused}
         */
        focused: {},
        /**
         * 激活
         * see {@link BUI.Component.Controller#property-active}
         */
        active: {},
        /**
         * 禁用
         * see {@link BUI.Component.Controller#property-disabled}
         */
        disabled: {},
        /**
         * 高亮显示
         * see {@link BUI.Component.Controller#property-highlighted}
         */
        highlighted: {}
    };

    return View;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @ignore
 * @fileOverview cookie
 * @author lifesinger@gmail.com
 */


define('bui/cookie',function () {

    var doc = document,
        MILLISECONDS_OF_DAY = 24 * 60 * 60 * 1000,
        encode = encodeURIComponent,
        decode = decodeURIComponent;

    function isNotEmptyString(val) {
        return typeof(val) === 'string' && val !== '';
    }

    /**
     * Provide Cookie utilities.
     * @class BUI.Cookie
     * @singleton
     */
    var Cookie = {

        /**
         * Returns the cookie value for given name
         * @return {String} name The name of the cookie to retrieve
         */
        get: function (name) {
            var ret, m;

            if (isNotEmptyString(name)) {
                if ((m = String(doc.cookie).match(
                    new RegExp('(?:^| )' + name + '(?:(?:=([^;]*))|;|$)')))) {
                    ret = m[1] ? decode(m[1]) : '';
                }
            }
            return ret;
        },

        /**
         * Set a cookie with a given name and value
         * @param {String} name The name of the cookie to set
         * @param {String} val The value to set for cookie
         * @param {Number|Date} expires
         * if Number secified how many days this cookie will expire
         * @param {String} domain set cookie's domain
         * @param {String} path set cookie's path
         * @param {Boolean} secure whether this cookie can only be sent to server on https
         */
        set: function (name, val, expires, domain, path, secure) {
            var text = String(encode(val)), date = expires;

            // 从当前时间开始，多少天后过期
            if (typeof date === 'number') {
                date = new Date();
                date.setTime(date.getTime() + expires * MILLISECONDS_OF_DAY);
            }
            // expiration date
            if (date instanceof Date) {
                text += '; expires=' + date.toUTCString();
            }

            // domain
            if (isNotEmptyString(domain)) {
                text += '; domain=' + domain;
            }

            // path
            if (isNotEmptyString(path)) {
                text += '; path=' + path;
            }

            // secure
            if (secure) {
                text += '; secure';
            }

            doc.cookie = name + '=' + text;
        },

        /**
         * Remove a cookie from the machine by setting its expiration date to sometime in the past
         * @param {String} name The name of the cookie to remove.
         * @param {String} domain The cookie's domain
         * @param {String} path The cookie's path
         * @param {String} secure The cookie's secure option
         */
        remove: function (name, domain, path, secure) {
            this.set(name, '', -1, domain, path, secure);
        }
    };
    
    BUI.Cookie = Cookie;
    
    return Cookie;
});

/**
* @ignore
* 2012.02.14 yiminghe@gmail.com
* - jsdoc added
*
* 2010.04
* - get 方法要考虑 ie 下，
* 值为空的 cookie 为 'test3; test3=3; test3tt=2; test1=t1test3; test3', 没有等于号。
* 除了正则获取，还可以 split 字符串的方式来获取。
* - api 设计上，原本想借鉴 jQuery 的简明风格：S.cookie(name, ...), 但考虑到可扩展性，目前
* 独立成静态工具类的方式更优。
*/

/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 抽象数据缓冲类
 * @ignore
 */

define('bui/data/abstractstore',['bui/common','bui/data/proxy'],function (require) {
  var BUI = require('bui/common'),
    Proxy = require('bui/data/proxy');

  /**
   * @class BUI.Data.AbstractStore
   * 数据缓冲抽象类,此类不进行实例化
   * @extends BUI.Base
   */
  function AbstractStore(config){
    AbstractStore.superclass.constructor.call(this,config);
    this._init();
  }

  AbstractStore.ATTRS = {

    /**
    * 创建对象时是否自动加载
    * <pre><code>
    *   var store = new Data.Store({
    *     url : 'data.php',  //设置加载数据的URL
    *     autoLoad : true    //创建Store时自动加载数据
    *   });
    * </code></pre>
    * @cfg {Boolean} [autoLoad=false]
    */
    autoLoad: {
      value :false 
    },
    /**
     * 是否服务器端过滤数据，如果设置此属性，当调用filter()函数时发送请求
     * @type {Object}
     */
    remoteFilter: {
        value : false
    },
    /**
     * 上次查询的参数
     * @type {Object}
     * @readOnly
     */
    lastParams : {
      value : {}
    },
    /**
     * 初始化时查询的参数，在初始化时有效
     * <pre><code>
     * var store = new Data.Store({
    *     url : 'data.php',  //设置加载数据的URL
    *     autoLoad : true,    //创建Store时自动加载数据
    *     params : {         //设置请求时的参数
    *       id : '1',
    *       type : '1'
    *     }
    *   });
     * </code></pre>
     * @cfg {Object} params
     */
    params : {

    },
    /**
     * 数据代理对象,用于加载数据的ajax配置，{@link BUI.Data.Proxy}
     * <pre><code>
     *   var store = new Data.Store({
    *     url : 'data.php',  //设置加载数据的URL
    *     autoLoad : true,    //创建Store时自动加载数据
    *     proxy : {
    *       method : 'post',
    *       dataType : 'jsonp'
    *     }
    *   });
     * </code></pre>
     * @cfg {Object|BUI.Data.Proxy} proxy
     */
    proxy : {
      value : {
        
      }
    },
    /**
     * 请求数据的地址，通过ajax加载数据，
     * 此参数设置则加载远程数据
     * ** 你可以设置在proxy外部 **
     * <pre><code>
     *   var store = new Data.Store({
    *     url : 'data.php',  //设置加载数据的URL
    *     autoLoad : true,    //创建Store时自动加载数据
    *     proxy : {
    *       method : 'post',
    *       dataType : 'jsonp'
    *     }
    *   });
     * </code></pre>
     * ** 你也可以设置在proxy上 **
     * <pre><code>
     *   var store = new Data.Store({
    *     autoLoad : true,    //创建Store时自动加载数据
    *     proxy : {
    *       url : 'data.php',  //设置加载数据的URL
    *       method : 'post',
    *       dataType : 'jsonp'
    *     }
    *   });
     * </code></pre>
     * 否则把 {BUI.Data.Store#cfg-data}作为本地缓存数据加载
     * @cfg {String} url
     */
    /**
     * 请求数据的url
     * <pre><code>
     *   //更改url
     *   store.get('proxy').set('url',url);
     * </code></pre>
     * @type {String}
     */
    url : {

    },
    events : {
      value : [
        /**  
        * 数据接受改变，所有增加、删除、修改的数据记录清空
        * @name BUI.Data.Store#acceptchanges
        * @event  
        */
        'acceptchanges',
        /**  
        * 当数据加载完成后
        * @name BUI.Data.Store#load  
        * @event  
        * @param {jQuery.Event} e  事件对象，包含加载数据时的参数
        */
        'load',

        /**  
        * 当数据加载前
        * @name BUI.Data.Store#beforeload
        * @event  
        */
        'beforeload',

        /**  
        * 发生在，beforeload和load中间，数据已经获取完成，但是还未触发load事件，用于获取返回的原始数据
        * @name BUI.Data.Store#beforeProcessLoad
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.data 从服务器端返回的数据
        */
        'beforeProcessLoad',
        
        /**  
        * 当添加数据时触发该事件
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.record 添加的数据
        */
        'add',

        /**
        * 加载数据发生异常时触发
        * @event
        * @name BUI.Data.Store#exception
        * @param {jQuery.Event} e 事件对象
        * @param {String|Object} e.error 加载数据时返回的错误信息或者加载数据失败，浏览器返回的信息（httpResponse 对象 的textStatus）
        * @param {String} e.responseText 网络或者浏览器加载数据发生错误是返回的httpResponse 对象的responseText
        */
        'exception',

        /**  
        * 当删除数据是触发该事件
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.data 删除的数据
        */
        'remove',
        
        /**  
        * 当更新数据指定字段时触发该事件 
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.record 更新的数据
        * @param {Object} e.field 更新的字段
        * @param {Object} e.value 更新的值
        */
        'update',

        /**  
        * 前端发生排序时触发
        * @name BUI.Data.Store#localsort
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.field 排序的字段
        * @param {Object} e.direction 排序的方向 'ASC'，'DESC'
        */
        'localsort'
      ]
    },
    /**
     * 本地数据源,使用本地数据源时会使用{@link BUI.Data.Proxy.Memery}
     * @cfg {Array} data
     */
    /**
     * 本地数据源
     * @type {Array}
     */
    data : {
      setter : function(data){
        var _self = this,
          proxy = _self.get('proxy');
        if(proxy.set){
          proxy.set('data',data);
        }else{
          proxy.data = data;
        }
        //设置本地数据时，把autoLoad置为true
        _self.set('autoLoad',true);
      }
    }
  };

  BUI.extend(AbstractStore,BUI.Base);

  BUI.augment(AbstractStore,{
    /**
     * 是否是数据缓冲对象，用于判断对象
     * @type {Boolean}
     */
    isStore : true,
    /**
     * @private
     * 初始化
     */
    _init : function(){
      var _self = this;

      _self.beforeInit();
      //初始化结果集
      _self._initParams();
      _self._initProxy();
      _self._initData();
    },
    /**
     * @protected
     * 初始化之前
     */
    beforeInit : function(){

    },
    //初始化数据,如果默认加载数据，则加载数据
    _initData : function(){
      var _self = this,
        autoLoad = _self.get('autoLoad');

      if(autoLoad){
        _self.load();
      }
    },
    //初始化查询参数
    _initParams : function(){
      var _self = this,
        lastParams = _self.get('lastParams'),
        params = _self.get('params');

      //初始化 参数
      BUI.mix(lastParams,params);
    },
    /**
     * @protected
     * 初始化数据代理类
     */
    _initProxy : function(){
      var _self = this,
        url = _self.get('url'),
        proxy = _self.get('proxy');

      if(!(proxy instanceof Proxy)){

        if(url){
          proxy.url = url;
        }

        //异步请求的代理类
        if(proxy.type === 'ajax' || proxy.url){
          proxy = new Proxy.Ajax(proxy);
        }else{
          proxy = new Proxy.Memery(proxy);
        }

        _self.set('proxy',proxy);
      }
    },
    /**
     * 加载数据
     * <pre><code>
     *  //一般调用
     *  store.load(params);
     *  
     *  //使用回调函数
     *  store.load(params,function(data){
     *  
     *  });
     *
     *  //load有记忆参数的功能
     *  store.load({id : '123',type="1"});
     *  //下一次调用
     *  store.load();默认使用上次的参数，可以对对应的参数进行覆盖
     * </code></pre>
     * @param  {Object} params 参数键值对
     * @param {Function} fn 回调函数，默认为空
     */
    load : function(params,callback){
      var _self = this,
        proxy = _self.get('proxy'),
        lastParams = _self.get('lastParams');

      BUI.mix(lastParams,_self.getAppendParams(),params);

      _self.fire('beforeload',{params:lastParams});

      //防止异步请求未结束，又发送新请求回调参数错误
      params = BUI.cloneObject(lastParams);
      proxy.read(lastParams,function(data){
        _self.onLoad(data,params);
        if(callback){
          callback(data,params);
        }
      },_self);
    },
    /**
     * 触发过滤
     * @protected
     */
    onFiltered : function(data,filter){
      var _self = this;
      _self.fire('filtered',{data : data,filter : filter});
    },
    /**
     * 加载完数据
     * @protected
     * @template
     */
    onLoad : function(data,params){
      var _self = this;

      var processResult = _self.processLoad(data,params);
      //如果处理成功，返回错误时，不进行后面的处理
      if(processResult){
        _self.afterProcessLoad(data,params);
      }
    },
    /**
     * 过滤数据，此函数的执行同属性 remoteFilter关联密切
     *
     *  - remoteFilter == true时：此函数只接受字符串类型的过滤参数，将{filter : filterStr}参数传输到服务器端
     *  - remoteFilter == false时：此函数接受比对函数，只有当函数返回true时生效
     *  
     * @param {Function|String} fn 过滤函数
     * @return {Array} 过滤结果
     */
    filter : function(filter){
        var _self = this,
            remoteFilter = _self.get('remoteFilter'),
            result;

        if(remoteFilter){
            _self.load({filter : filter});
        }else{
            _self.set('filter',filter);
            result = _self._filterLocal(filter);
            _self.onFiltered(result,filter);
        }
    },
    /**
     * @protected
     * 过滤缓存的数据
     * @param  {Function} fn 过滤函数
     * @return {Array} 过滤结果
     */
    _filterLocal : function(fn){
        
    },
    _clearLocalFilter : function(){
        this._filterLocal(function(){
            return true;
        });
    },
    /**
     * 清理过滤
     */
    clearFilter : function(){
        var _self = this,
            remoteFilter = _self.get('remoteFilter'),
            result;

        if(remoteFilter){
            _self.load({filter : ''});
        }else{
            _self._clearLocalFilter();
        }
    },
    /**
     * @private
     * 加载完数据处理数据
     */
    processLoad : function(data,params){
      var _self = this,
        hasErrorField = _self.get('hasErrorProperty');
      //获取的原始数据
      _self.fire('beforeProcessLoad',data);

      if(data[hasErrorField] || data.exception){
        _self.onException(data);
        return false;
      }
      return true;
    },
    /**
     * @protected
     * @template
     * 处理数据后
     */
    afterProcessLoad : function(data,params){

    },
    /**
     * @protected
     * 处理错误函数
     * @param  {*} data 出错对象
     */
    onException : function(data){
      var _self = this,
        errorProperty = _self.get('errorProperty'),
        obj = {};
      //网络异常、转码错误之类，发生在json获取或转变时
      if(data.exception){
        obj.type = 'exception';
        obj[errorProperty] = data.exception;
      }else{//用户定义的错误
        obj.type = 'error';
        obj[errorProperty] = data[errorProperty];
      }
      _self.fire('exception',obj);

    },
    /**
     * 是否包含数据
     * @return {Boolean} 
     */
    hasData : function(){

    },
    /**
     * 获取附加的参数
     * @template
     * @protected
     * @return {Object} 附加的参数
     */
    getAppendParams : function(){
      return {};
    }
  });

  return AbstractStore;
});
/**
 * @fileOverview Data 命名空间的入口文件
 * @ignore
 */
(function(){
var BASE = 'bui/data/';
define('bui/data',['bui/common',BASE + 'sortable',BASE + 'proxy',BASE + 'abstractstore',BASE + 'store',
  BASE + 'node',BASE + 'treestore'],function(r) {
  
  var BUI = r('bui/common'),
    Data = BUI.namespace('Data');
  BUI.mix(Data,{
    Sortable : r(BASE + 'sortable'),
    Proxy : r(BASE + 'proxy'),
    AbstractStore : r(BASE + 'abstractstore'),
    Store : r(BASE + 'store'),
    Node : r(BASE + 'node'),
    TreeStore : r(BASE + 'treestore')
  });

  return Data;
});
})();

/**
 * @fileOverview 树形数据结构的节点类，无法直接使用数据作为节点，所以进行一层封装
 * 可以直接作为TreeNode控件的配置项
 * @ignore
 */

define('bui/data/node',['bui/common'],function (require) {
  var BUI = require('bui/common');

  function mapNode(cfg,map){
    var rst = {};
    if(map){
      BUI.each(cfg,function(v,k){
        var name = map[k] || k;
        rst[name] = v;
      });
      rst.record = cfg;
    }else{
      rst = cfg;
    }
    return rst;
  }
  /**
   * @class BUI.Data.Node
   * 树形数据结构的节点类
   */
  function Node (cfg,map) {
    var _self = this;
    cfg = mapNode(cfg,map);
    BUI.mix(this,cfg);
  }

  BUI.augment(Node,{
    /**
     * 是否根节点
     * @type {Boolean}
     */
    root : false,
    /**
     * 是否叶子节点
     * @type {Boolean}
     */
    leaf : null,
    /**
     * 显示节点时显示的文本
     * @type {Object}
     */
    text : '',
    /**
     * 代表节点的编号
     * @type {String}
     */
    id : null,
    /**
     * 子节点是否已经加载过
     * @type {Boolean}
     */
    loaded : false,
    /**
     * 从根节点到此节点的路径，id的集合如： ['0','1','12'],
     * 便于快速定位节点
     * @type {Array}
     */
    path : null,
    /**
     * 父节点
     * @type {BUI.Data.Node}
     */
    parent : null,
    /**
     * 树节点的等级
     * @type {Number}
     */
    level : 0,
    /**
     * 节点是否由一条记录封装而成
     * @type {Object}
     */
    record : null,
    /**
     * 子节点集合
     * @type {BUI.Data.Node[]}
     */
    children : null,
    /**
     * 是否是Node对象
     * @type {Object}
     */
    isNode : true
  });
  return Node;
});

define('bui/data/proxy',['bui/data/sortable'],function(require) {

  var Sortable = require('bui/data/sortable');

  /**
   * 数据代理对象，加载数据,
   * 一般不直接使用，在store里面决定使用什么类型的数据代理对象
   * @class BUI.Data.Proxy
   * @extends BUI.Base
   * @abstract 
   */
  var proxy = function(config){
    proxy.superclass.constructor.call(this,config);
  };

  proxy.ATTRS = {
    
  };

  BUI.extend(proxy,BUI.Base);

  BUI.augment(proxy,
  /**
   * @lends BUI.Data.Proxy.prototype
   * @ignore
   */
  {
    /**
     * @protected
     * @private
     */
    _read : function(params,callback){

    },
    /**
     * 读数据
     * @param  {Object} params 键值对形式的参数
     * @param {Function} callback 回调函数，函数原型 function(data){}
     * @param {Object} scope 回调函数的上下文
     */
    read : function(params,callback,scope){
      var _self = this;
      scope = scope || _self;

      _self._read(params,function(data){
        callback.call(scope,data);
      });
    },
    /**
     * 更新数据
     * @protected
     */
    update : function(params,callback,scope){

    }
  });

  /**
   * 异步加载数据的代理
   * @class BUI.Data.Proxy.Ajax
   * @extends BUI.Data.Proxy
   */
  var ajaxProxy = function(config){
    ajaxProxy.superclass.constructor.call(this,config);
  };

  ajaxProxy.ATTRS = BUI.mix(true,proxy.ATTRS,
  /**
   * @lends BUI.Data.Proxy.Ajax#
   * @ignore
   */
  {
    /**
     * 限制条数
     * @cfg {String} [limitParam='limit'] 
     */
    /**
     * 限制条数
     * @type {String}
     * @default 'limit'
     */
    limitParam : {
      value : 'limit'
    },
    /**
     * 起始纪录代表的字段
     * @cfg {String} [startParam='start']
     */
    /**
     * 起始纪录代表的字段
     * @type {String}
     */
    startParam : {
      value : 'start'
    },
    /**
     * 页码的字段名
     * @cfg {String} [pageIndexParam='pageIndex']
     */
    /**
     * 页码的字段名
     * @type {String}
     * @default 'pageIndex'
     */
    pageIndexParam : {
      value : 'pageIndex'
    },
    /**
     * 传递到后台，分页开始的页码，默认从0开始
     * @type {Number}
     */
    pageStart : {
      value : 0
    },
    /**
    * 加载数据时，返回的格式,目前只支持"json、jsonp"格式<br>
    * @cfg {String} [dataType='json']
    */
   /**
    * 加载数据时，返回的格式,目前只支持"json、jsonp"格式<br>
    * @type {String}
    * @default "json"
    */
    dataType: {
      value : 'json'
    },
    /**
     * 获取数据的方式,'GET'或者'POST',默认为'GET'
     * @cfg {String} [method='GET']
     */
    /**
     * 获取数据的方式,'GET'或者'POST',默认为'GET'
     * @type {String}
     * @default 'GET'
     */
    method : {
      value : 'GET'
    },
    /**
     * 是否使用Cache
     * @type {Boolean}
     */
    cache : {
      value : false
    },
    /**
     * 加载数据的链接
     * @cfg {String} url
     * @required
     */
    /**
     * 加载数据的链接
     * @type {String}
     * @required
     */
    url :{

    }

  });
  BUI.extend(ajaxProxy,proxy);

  BUI.augment(ajaxProxy,{
    _processParams : function(params){
      var _self = this,
        pageStart = _self.get('pageStart'),
        arr = ['start','limit','pageIndex'];
      if(params.pageIndex != null){
        params.pageIndex = params.pageIndex + pageStart;
      }
      BUI.each(arr,function(field){
        var fieldParam = _self.get(field+'Param');
        if(fieldParam !== field){
          params[fieldParam] = params[field];
          delete params[field];
        }
      });
    },
    /**
     * @protected
     * @private
     */
    _read : function(params,callback){
      var _self = this;

      params = BUI.cloneObject(params);
      _self._processParams(params);

      $.ajax({
        url: _self.get('url'),
        type : _self.get('method'),
        dataType: _self.get('dataType'),
        data : params,
        cache : _self.get('cache'),
        success: function(data) {
          callback(data);
        },
        error : function(jqXHR, textStatus, errorThrown){
          var result = {
            exception : {
              status : textStatus,
              errorThrown: errorThrown,
              jqXHR : jqXHR
            }
          };
          callback(result);
        }
      });
    }
  });

  /**
   * 读取缓存的代理
   * @class BUI.Data.Proxy.Memery
   * @extends BUI.Data.Proxy
   * @mixins BUI.Data.Sortable
   */
  var memeryProxy = function(config){
    memeryProxy.superclass.constructor.call(this,config);
  };
  memeryProxy.ATTRS = {
    /**
     * 匹配的字段名
     * @type {Array}
     */
    matchFields : {
      value : []
    }
  };

  BUI.extend(memeryProxy,proxy);

  BUI.mixin(memeryProxy,[Sortable]);

  BUI.augment(memeryProxy,{
    /**
     * @protected
     * @ignore
     */
    _read : function(params,callback){
      var _self = this,
        pageable = params.pageable,
        start = params.start,
        sortField = params.sortField,
        sortDirection = params.sortDirection,
        limit = params.limit,
        data = _self.get('data'),
        rows = []; 

      data = _self._getMatches(params);
      _self.sortData(sortField,sortDirection); 

      if(limit){//分页时
        rows = data.slice(start,start + limit);
        callback({rows:rows,results:data.length});
      }else{//不分页时
        rows = data.slice(start);
        callback(rows);
      }
      
    },
    //获取匹配函数
    _getMatchFn : function(params, matchFields){
      var _self = this;
      return function(obj){
        var result = true;
        BUI.each(matchFields,function(field){
          if(params[field] != null && !(params[field] === obj[field])){
            result = false;
            return false;
          }
        });
        return result;
      }
    },
    //获取匹配的值
    _getMatches : function(params){
      var _self = this,
        matchFields = _self.get('matchFields'),
        matchFn,
        data = _self.get('data') || [];
      if(params && matchFields.length){
        matchFn = _self._getMatchFn(params,matchFields);
        data = BUI.Array.filter(data,matchFn);
      }
      return data;
    }

  });

  proxy.Ajax = ajaxProxy;
  proxy.Memery = memeryProxy;

  return proxy;


});

/**
 * @fileOverview 可排序扩展类
 * @ignore
 */

define('bui/data/sortable',function() {

  var ASC = 'ASC',
    DESC = 'DESC';
  /**
   * 排序扩展方法，无法直接使用
   * 请在继承了 {@link BUI.Base}的类上使用
   * @class BUI.Data.Sortable
   * @extends BUI.Base
   */
  var sortable = function(){

  };

  sortable.ATTRS = 
  /**
   * @lends BUI.Data.Sortable#
   * @ignore
   */
  {
    /**
     * 比较函数
     * @cfg {Function} compareFunction
     * 函数原型 function(v1,v2)，比较2个字段是否相等
     * 如果是字符串则按照本地比较算法，否则使用 > ,== 验证
     */
    compareFunction:{
      value : function(v1,v2){
        if(v1 === undefined){
          v1 = '';
        }
        if(v2 === undefined){
          v2 = '';
        }
        if(BUI.isString(v1)){
          return v1.localeCompare(v2);
        }

        if(v1 > v2){
          return 1;
        }else if(v1 === v2){
          return 0;
        }else{
          return  -1;
        }
      }
    },
    /**
     * 排序字段
     * @cfg {String} sortField
     */
    /**
     * 排序字段
     * @type {String}
     */
    sortField : {

    },
    /**
     * 排序方向,'ASC'、'DESC'
     * @cfg {String} [sortDirection = 'ASC']
     */
    /**
     * 排序方向,'ASC'、'DESC'
     * @type {String}
     */
    sortDirection : {
      value : 'ASC'
    },
    /**
     * 排序信息
     * <ol>
     * <li>field: 排序字段</li>
     * <li>direction: 排序方向,ASC(默认),DESC</li>
     * </ol>
     * @cfg {Object} sortInfo
     */
    /**
     * 排序信息
     * <ol>
     * <li>field: 排序字段</li>
     * <li>direction: 排序方向,ASC(默认),DESC</li>
     * </ol>
     * @type {Object}
     */
    sortInfo: {
      getter : function(){
        var _self = this,
          field = _self.get('sortField');

        return {
          field : field,
          direction : _self.get('sortDirection')
        };
      },
      setter: function(v){
        var _self = this;

        _self.set('sortField',v.field);
        _self.set('sortDirection',v.direction);
      }
    }
  };

  BUI.augment(sortable,
  /**
   * @lends BUI.Data.Sortable.prototype
   * @ignore
   */
  {
    compare : function(obj1,obj2,field,direction){

      var _self = this,
        dir;
      field = field || _self.get('sortField');
      direction = direction || _self.get('sortDirection');
      //如果未指定排序字段，或方向，则按照默认顺序
      if(!field || !direction){
        return 1;
      }
      dir = direction === ASC ? 1 : -1;

      return _self.get('compareFunction')(obj1[field],obj2[field]) * dir;
    },
    /**
     * 获取排序的集合
     * @protected
     * @return {Array} 排序集合
     */
    getSortData : function(){

    },
    /**
     * 排序数据
     * @param  {String|Array} field   排序字段或者数组
     * @param  {String} direction 排序方向
     * @param {Array} records 排序
     * @return {Array}    
     */
    sortData : function(field,direction,records){
      var _self = this,
        records = records || _self.getSortData();

      if(BUI.isArray(field)){
        records = field;
        field = null;
      }

      field = field || _self.get('sortField');
      direction = direction || _self.get('sortDirection');

      _self.set('sortField',field);
      _self.set('sortDirection',direction);

      if(!field || !direction){
        return records;
      }

      records.sort(function(obj1,obj2){
        return _self.compare(obj1,obj2,field,direction);
      });
      return records;
    }
  });

  return sortable;
});
/**
 * @fileOverview 数据缓冲对象
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/data/store',['bui/data/proxy','bui/data/abstractstore','bui/data/sortable'],function(require) {
  
  var Proxy = require('bui/data/proxy'),
    AbstractStore = require('bui/data/abstractstore'),
    Sortable = require('bui/data/sortable');

  //移除数据
  function removeAt(index,array){
    if(index < 0){
      return;
    }
    var records = array,
      record = records[index];
    records.splice(index,1);
    return record;
  }

  function removeFrom(record,array){
    var index = BUI.Array.indexOf(record,array);   
    if(index >= 0){
      removeAt(index,array);
    }
  }

  function contains(record,array){
    return BUI.Array.indexOf(record,array) !== -1;
  }
  /**
   * 用于加载数据，缓冲数据的类
   * <p>
   * <img src="../assets/img/class-data.jpg"/>
   * </p>
   * ** 缓存静态数据 ** 
   * <pre><code>
   *  var store = new Store({
   *    data : [{},{}]
   *  });
   * </code></pre>
   * ** 异步加载数据 **
   * <pre><code>
   *  var store = new Store({
   *    url : 'data.json',
   *    autoLoad : true,
   *    params : {id : '123'},
   *    sortInfo : {
   *      field : 'id',
   *      direction : 'ASC' //ASC,DESC
   *    }
   *  });
   * </code></pre>
   * 
   * @class BUI.Data.Store
   * @extends BUI.Data.AbstractStore
   * @mixins BUI.Data.Sortable
   */
  var store = function(config){
    store.superclass.constructor.call(this,config);
    //this._init();
  };

  store.ATTRS = 
  /**
   * @lends BUI.Data.Store#
   * @ignore
   */
  {
    /**
     * 当前页码
     * @cfg {Number} [currentPage=0]
     * @ignore
     */
    /**
     * 当前页码
     * @type {Number}
     * @ignore
     * @readOnly
     */
    currentPage:{
      value : 0
    },
    
    /**
     * 删除掉的纪录
     * @readOnly
     * @private
     * @type {Array}
     */
    deletedRecords : {
      value:[]
    },
    /**
     * 错误字段,包含在返回信息中表示错误信息的字段
     * <pre><code>
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     * @cfg {String} [errorProperty='error']
     */
    /**
     * 错误字段
     * @type {String}
     * @ignore
     */
    errorProperty : {
      value : 'error'
    },
    /**
     * 是否存在错误,加载数据时如果返回错误，此字段表示有错误发生
     * <pre><code>
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     * @cfg {String} [hasErrorProperty='hasError']
     */
    /**
     * 是否存在错误
     * @type {String}
     * @default 'hasError'
     * @ignore
     */
    hasErrorProperty : {
      value : 'hasError'
    },

    /**
     * 对比2个对象是否相当，在去重、更新、删除，查找数据时使用此函数
     * @default  
     * function(obj1,obj2){
     *   return obj1 == obj2;
     * }
     * @type {Object}
     * @example
     * function(obj1 ,obj2){
     *   //如果id相等，就认为2个数据相等，可以在添加对象时去重
     *   //更新对象时，仅提供改变的字段
     *   return obj1.id == obj2.id;
     * }
     * 
     */
    matchFunction : {
      value : function(obj1,obj2){
        return obj1 == obj2;
      }
    },
    /**
     * 更改的纪录集合
     * @type {Array}
     * @private
     * @readOnly
     */
    modifiedRecords : {
      value:[]
    },
    /**
     * 新添加的纪录集合，只读
     * @type {Array}
     * @private
     * @readOnly
     */
    newRecords : {
      value : []
    },
    /**
     * 是否远程排序，默认状态下内存排序
     *   - 由于当前Store存储的不一定是数据源的全集，所以此配置项需要重新读取数据
     *   - 在分页状态下，进行远程排序，会进行全集数据的排序，并返回首页的数据
     *   - remoteSort为 false的情况下，仅对当前页的数据进行排序
     * @cfg {Boolean} [remoteSort=false]
     */
    remoteSort : {
      value : false
    },
    /**
     * 缓存的数据，包含以下几个字段
     * <ol>
     * <li>rows: 数据集合</li>
     * <li>results: 总的数据条数</li>
     * </ol>
     * @type {Object}
     * @private
     * @readOnly
     */
    resultMap : {
      value : {}
    },
    /**
     * 加载数据时，返回数据的根目录
     * @cfg {String} [root='rows']
     * <pre><code>
     *    //默认返回数据类型：
     *    '{"rows":[{"name":"abc"},{"name":"bcd"}],"results":100}'
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     *   
     */
    root: { value : 'rows'}, 

    /**
     * 当前Store缓存的数据条数
     * @type {Number}
     * @private
     * @readOnly
     */
    rowCount :{
      value : 0
    },
    /**
     * 加载数据时，返回记录的总数的字段，用于分页
     * @cfg {String} [totalProperty='results']
     *<pre><code>
     *    //默认返回数据类型：
     *    '{"rows":[{"name":"abc"},{"name":"bcd"}],"results":100}'
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     */
    totalProperty: {value :'results'}, 

    /**
     * 加载数据的起始位置
     * <pre><code>
     *  //初始化时，可以在params中配置
     *  var store = new Store({
     *    url : 'data.json',
     *    params : {
     *      start : 100
     *    }
     *  });
     * </code></pre>
     * @type {Object}
     */
    start:{
      value : 0
    },
    /**
     * 每页多少条记录,默认为null,此时不分页，当指定了此值时分页
     * <pre><code>
     *  //当请求的数据分页时
     *  var store = new Store({
     *    url : 'data.json',
     *    pageSize : 30
     *  });
     * </code></pre>
     * @cfg {Number} pageSize
     */
    pageSize : {

    }
  };
  BUI.extend(store,AbstractStore);

  BUI.mixin(store,[Sortable]);

  BUI.augment(store,
  /**
   * @lends BUI.Data.Store.prototype
   * @ignore
   */
  {
    /**
    * 添加记录,默认添加在后面
    * <pre><code>
    *  //添加记录
    *  store.add({id : '2',text: 'new data'});
    *  //是否去重，重复数据不能添加
    *  store.add(obj,true); //不能添加重复数据，此时用obj1 === obj2判断
    *  //使用匹配函去重
    *  store.add(obj,true,function(obj1,obj2){
    *    return obj1.id == obj2.id;
    *  });
    *  
    * </code></pre>
    * @param {Array|Object} data 添加的数据，可以是数组，可以是单条记录
    * @param {Boolean} [noRepeat = false] 是否去重,可以为空，默认： false 
    * @param {Function} [match] 匹配函数，可以为空，
    * @default 配置项中 matchFunction 属性传入的函数，默认是：<br>
    *  function(obj1,obj2){
    *    return obj1 == obj2;
    *  }
    * 
    */
    add :function(data,noRepeat,match){
      var _self = this,
        count = _self.getCount();
      _self.addAt(data,count,noRepeat,match)
    },
    /**
    * 添加记录,指定索引值
    * <pre><code>
    *  //使用方式跟类似于add,增加了index参数
    *  store.add(obj,0);//添加在最前面
    * </code></pre>
    * @param {Array|Object} data 添加的数据，可以是数组，可以是单条记录
    * @param {Number} index 开始添加数据的位置
    * @param {Boolean} [noRepeat = false] 是否去重,可以为空，默认： false 
    * @param {Function} [match] 匹配函数，可以为空，
     */
    addAt : function(data,index,noRepeat,match){
      var _self = this;

      match = match || _self._getDefaultMatch();
      if(!BUI.isArray(data)){
        data = [data];
      }

      $.each(data,function(pos,element){
        if(!noRepeat || !_self.contains(element,match)){
          _self._addRecord(element,pos + index);

          _self.get('newRecords').push(element);

          removeFrom(element,_self.get('deletedRecords'));
          removeFrom(element,_self.get('modifiedRecords'));
        }
      });
    },
    /**
    * 验证是否存在指定记录
    * <pre><code>
    *  store.contains(obj); //是否包含指定的记录
    *
    *  store.contains(obj,function(obj1,obj2){ //使用匹配函数
    *    return obj1.id == obj2.id;
    *  });
    * </code></pre>
    * @param {Object} record 指定的记录
    * @param {Function} [match = function(obj1,obj2){return obj1 == obj2}] 默认为比较2个对象是否相同
    * @return {Boolean}
    */
    contains :function(record,match){
      return this.findIndexBy(record,match)!==-1;
    },
    /**
    * 查找记录，仅返回第一条
    * <pre><code>
    *  var record = store.find('id','123');
    * </code></pre>
    * @param {String} field 字段名
    * @param {String} value 字段值
    * @return {Object|null}
    */
    find : function(field,value){
      var _self = this,
        result = null,
        records = _self.getResult();
      $.each(records,function(index,record){
        if(record[field] === value){
          result = record;
          return false;
        }
      });
      return result;
    },
    /**
    * 查找记录，返回所有符合查询条件的记录
    * <pre><code>
    *   var records = store.findAll('type','0');
    * </code></pre>
    * @param {String} field 字段名
    * @param {String} value 字段值
    * @return {Array}
    */
    findAll : function(field,value){
      var _self = this,
        result = [],
        records = _self.getResult();
      $.each(records,function(index,record){
        if(record[field] === value){
          result.push(record);
        }
      });
      return result;
    },
    /**
    * 根据索引查找记录
    * <pre><code>
    *  var record = store.findByIndex(1);
    * </code></pre>
    * @param {Number} index 索引
    * @return {Object} 查找的记录
    */
    findByIndex : function(index){
      return this.getResult()[index];
    },
    /**
    * 查找数据所在的索引位置,若不存在返回-1
    * <pre><code>
    *  var index = store.findIndexBy(obj);
    *
    *  var index = store.findIndexBy(obj,function(obj1,obj2){
    *    return obj1.id == obj2.id;
    *  });
    * </code></pre>
    * @param {Object} target 指定的记录
    * @param {Function} [match = matchFunction] @see {BUI.Data.Store#matchFunction}默认为比较2个对象是否相同
    * @return {Number}
    */
    findIndexBy :function(target,match){
      var _self = this,
        position = -1,
        records = _self.getResult();
      match = match || _self._getDefaultMatch();
      if(target === null || target === undefined){
        return -1;
      }
      $.each(records,function(index,record){
        if(match(target,record)){
          position = index;
          return false;
        }
      });
      return position;
    },
    /**
    * 获取下一条记录
    * <pre><code>
    *  var record = store.findNextRecord(obj);
    * </code></pre>
    * @param {Object} record 当前记录
    * @return {Object} 下一条记录
    */
    findNextRecord : function(record){
      var _self = this,
        index = _self.findIndexBy(record);
      if(index >= 0){
        return _self.findByIndex(index + 1);
      }
      return;
    },

    /**
     * 获取缓存的记录数
     * <pre><code>
     *  var count = store.getCount(); //缓存的数据数量
     *
     *  var totalCount = store.getTotalCount(); //数据的总数，如果有分页时，totalCount != count
     * </code></pre>
     * @return {Number} 记录数
     */
    getCount : function(){
      return this.getResult().length;
    },
    /**
     * 获取数据源的数据总数，分页时，当前仅缓存当前页数据
     * <pre><code>
     *  var count = store.getCount(); //缓存的数据数量
     *
     *  var totalCount = store.getTotalCount(); //数据的总数，如果有分页时，totalCount != count
     * </code></pre>
     * @return {Number} 记录的总数
     */
    getTotalCount : function(){
      var _self = this,
        resultMap = _self.get('resultMap'),
        total = _self.get('totalProperty');
      return resultMap[total] || 0;
    },
    /**
     * 获取当前缓存的纪录
     * <pre><code>
     *   var records = store.getResult();
     * </code></pre>
     * @return {Array} 纪录集合
     */
    getResult : function(){
      var _self = this,
        resultMap = _self.get('resultMap'),
        root = _self.get('root');
      return resultMap[root];
    },
    /**
     * 是否包含数据
     * @return {Boolean} 
     */
    hasData : function(){
      return this.getCount() !== 0;
    },
    /**
     * 设置数据源,非异步加载时，设置缓存的数据
     * <pre><code>
     *   store.setResult([]); //清空数据
     *
     *   var data = [{},{}];
     *   store.setResult(data); //重设数据
     * </code></pre>
     */
    setResult : function(data){
      var _self = this,
        proxy = _self.get('proxy');
      if(proxy instanceof Proxy.Memery){
        _self.set('data',data);
        _self.load({start:0});
      }else{
        _self._setResult(data);
      }
    },

    /**
    * 删除一条或多条记录触发 remove 事件.
    * <pre><code>
    *  store.remove(obj);  //删除一条记录
    *
    *  store.remove([obj1,obj2...]); //删除多个条记录
    *
    *  store.remvoe(obj,funciton(obj1,obj2){ //使用匹配函数
    *    return obj1.id == obj2.id;
    *  });
    * </code></pre>
    * @param {Array|Object} data 添加的数据，可以是数组，可以是单条记录
    * @param {Function} [match = function(obj1,obj2){return obj1 == obj2}] 匹配函数，可以为空
    */
    remove :function(data,match){
      var _self =this,
        delData=[];
      match = match || _self._getDefaultMatch();
      if(!BUI.isArray(data)){
        data = [data];
      }
      $.each(data,function(index,element){
        var index = _self.findIndexBy(element,match),
            record = removeAt(index,_self.getResult());
        //添加到已删除队列中,如果是新添加的数据，不计入删除的数据集合中
        if(!contains(record,_self.get('newRecords')) && !contains(record,_self.get('deletedRecords'))){
          _self.get('deletedRecords').push(record);
        }
        removeFrom(record,_self.get('newRecords'));
        removeFrom(record,_self.get('modifiedRecords'));
        _self.fire('remove',{record:record});
      }); 
    },
    /**
     * 排序，如果remoteSort = true,发送请求，后端排序
     * <pre><code>
     *   store.sort('id','DESC'); //以id为排序字段，倒序排序
     * </code></pre>
     * @param  {String} field     排序字段
     * @param  {String} direction 排序方向
     */
    sort : function(field,direction){
      var _self = this,
        remoteSort = _self.get('remoteSort');

      if(!remoteSort){
        _self._localSort(field,direction);
      }else{
        _self.set('sortField',field);
        _self.set('sortDirection',direction);
        _self.load(_self.get('sortInfo'));
      }
    },
    /**
     * 计算指定字段的和
     * <pre><code>
     *   var sum = store.sum('number');
     * </code></pre>
     * @param  {String} field 字段名
     * @param  {Array} [data] 计算的集合，默认为Store中的数据集合
     * @return {Number} 汇总和
     */
    sum : function(field,data){
      var  _self = this,
        records = data || _self.getResult(),
        sum = 0;
      BUI.each(records,function(record){
        var val = record[field];
        if(!isNaN(val)){
          sum += parseFloat(val);
        }
      });
      return sum;
    },
    /**
    * 设置记录的值 ，触发 update 事件
    * <pre><code>
    *  store.setValue(obj,'value','new value');
    * </code></pre>
    * @param {Object} obj 修改的记录
    * @param {String} field 修改的字段名
    * @param {Object} value 修改的值
    */
    setValue : function(obj,field,value){
      var record = obj,
        _self = this;

      record[field]=value;
      if(!contains(record,_self.get('newRecords')) && !contains(record,_self.get('modifiedRecords'))){
          _self.get('modifiedRecords').push(record);
      }
      _self.fire('update',{record:record,field:field,value:value});
    },
    /**
    * 更新记录 ，触发 update事件
    * <pre><code>
    *   var record = store.find('id','12');
    *   record.value = 'new value';
    *   record.text = 'new text';
    *   store.update(record); //触发update事件，引起绑定了store的控件更新
    * </code></pre>
    * @param {Object} obj 修改的记录
    * @param {Boolean} [isMatch = false] 是否需要进行匹配，检测指定的记录是否在集合中
    */
    update : function(obj,isMatch){
      var record = obj,
        _self = this,
        match = null,
        index = null;
      if(isMatch){
        match = _self._getDefaultMatch();
        index = _self.findIndexBy(obj,match);
        if(index >=0){
          record = _self.getResult()[index];
        }
      }
      record = BUI.mix(record,obj);
      if(!contains(record,_self.get('newRecords')) && !contains(record,_self.get('modifiedRecords'))){
          _self.get('modifiedRecords').push(record);
      }
      _self.fire('update',{record:record});
    },
    //添加纪录
    _addRecord :function(record,index){
      var records = this.getResult();
      if(index == undefined){
        index = records.length;
      }
      records.splice(index,0,record);
      this.fire('add',{record:record,index:index});
    },
    //清除改变的数据记录
    _clearChanges : function(){
      var _self = this;
      _self.get('newRecords').splice(0);
      _self.get('modifiedRecords').splice(0);
      _self.get('deletedRecords').splice(0);
    },
    /**
     * @protected
     * 过滤缓存的数据
     * @param  {Function} fn 过滤函数
     * @return {Array} 过滤结果
     */
    _filterLocal : function(fn,data){

      var _self = this,
        rst = [];
      data = data || _self.getResult();
      if(!fn){ //没有过滤器时直接返回
        return data;
      }
      BUI.each(data,function(record){
        if(fn(record)){
          rst.push(record);
        }
      });
      return rst;
    },
    //获取默认的匹配函数
    _getDefaultMatch :function(){

      return this.get('matchFunction');
    },

    //获取分页相关的信息
    _getPageParams : function(){
      var _self = this,
        sortInfo = _self.get('sortInfo'),
        start = _self.get('start'),
        limit = _self.get('pageSize'),
        pageIndex = _self.get('pageIndex') || (limit ? start/limit : 0);

        params = {
          start : start,
          limit : limit,
          pageIndex : pageIndex //一般而言，pageIndex = start/limit
        };

      if(_self.get('remoteSort')){
        BUI.mix(params,sortInfo);
      }

      return params;
    },
     /**
     * 获取附加的参数,分页信息，排序信息
     * @override
     * @protected
     * @return {Object} 附加的参数
     */
    getAppendParams : function(){
      return this._getPageParams();
    },
    /**
     * @protected
     * 初始化之前
     */
    beforeInit : function(){
      //初始化结果集
      this._setResult([]);
    },
    //本地排序
    _localSort : function(field,direction){
      var _self = this;

      _self._sortData(field,direction);

      _self.fire('localsort');
    },
    _sortData : function(field,direction,data){
      var _self = this;
      data = data || _self.getResult();

      _self.sortData(field,direction,data);
    },
    //处理数据
    afterProcessLoad : function(data,params){
      var _self = this,
        root = _self.get('root'),
        start = params.start,
        limit = params.limit,
        totalProperty = _self.get('totalProperty');

      if(BUI.isArray(data)){
        _self._setResult(data);
      }else{
        _self._setResult(data[root],data[totalProperty]);
      }

      _self.set('start',start);

      if(limit){
        _self.set('pageIndex',start/limit);
      }

      //如果本地排序,则排序
      if(!_self.get('remoteSort')){
        _self._sortData();
      }

      _self.fire('load',{ params : params });
    },
    //设置结果集
    _setResult : function(rows,totalCount){
      var _self = this,
        resultMap = _self.get('resultMap');

      totalCount = totalCount || rows.length;
      resultMap[_self.get('root')] = rows;
      resultMap[_self.get('totalProperty')] = totalCount;

      //清理之前发生的改变
      _self._clearChanges();
    }
  });

  return store;
});
/**
 * @fileOverview 树形对象缓冲类
 * @ignore
 */

define('bui/data/treestore',['bui/common','bui/data/node','bui/data/abstractstore','bui/data/proxy'],function (require) {

  var BUI = require('bui/common'),
    Node = require('bui/data/node'),
    Proxy = require('bui/data/proxy'),
    AbstractStore = require('bui/data/abstractstore');

  /**
   * @class BUI.Data.TreeStore
   * 树形数据缓冲类
   * <p>
   * <img src="../assets/img/class-data.jpg"/>
   * </p>
   * <pre><code>
   *   //加载静态数据
   *   var store = new TreeStore({
   *     root : {
   *       text : '根节点',
   *       id : 'root'
   *     },
   *     data : [{id : '1',text : 1},{id : '2',text : 2}] //会加载成root的children
   *   });
   *   //异步加载数据，自动加载数据时，会调用store.load({id : 'root'}); //root为根节点的id
   *   var store = new TreeStore({
   *     root : {
   *       text : '根节点',
   *       id : 'root'
   *     },
   *     url : 'data/nodes.php',
   *     autoLoad : true  //设置自动加载，初始化后自动加载数据
   *   });
   *
   *   //加载指定节点
   *   var node = store.findNode('1');
   *   store.loadNode(node);
   *   //或者
   *   store.load({id : '1'});//可以配置自定义参数，返回值附加到指定id的节点上
   * </code></pre>
   * @extends BUI.Data.AbstractStore
   */
  function TreeStore(config){
    TreeStore.superclass.constructor.call(this,config);
  }

  TreeStore.ATTRS = {
    /**
     * 根节点
     * <pre><code>
     *  var store = new TreeStore({
     *    root : {text : '根节点',id : 'rootId',children : [{id : '1',text : '1'}]}
     *  });
     * </code></pre>
     * @cfg {Object} root
     */
    /**
     * 根节点,初始化后不要更改对象，可以更改属性值
     * <pre><code>
     *  var root = store.get('root');
     *  root.text = '修改的文本'；
     *  store.update(root);
     * </code></pre>
     * @type {Object}
     * @readOnly
     */
    root : {

    },
    /**
     * 数据映射，用于设置的数据跟@see {BUI.Data.Node} 不一致时，进行匹配。
     * 如果此属性为null,那么假设设置的对象是Node对象
     * <pre><code>
     *   //例如原始数据为 {name : '123',value : '文本123',isLeaf: false,nodes : []}
     *   var store = new TreeStore({
     *     map : {
     *       'name' : 'id',
     *       'value' : 'text',
     *       'isLeaf' : 'leaf' ,
     *       'nodes' : 'children'
     *     }
     *   });
     *   //映射后，记录会变成  {id : '123',text : '文本123',leaf: false,children : []};
     *   //此时原始记录会作为对象的 record属性
     *   var node = store.findNode('123'),
     *     record = node.record;
     * </code></pre> 
     * **Notes:**
     * 使用数据映射的记录仅做于展示数据，不作为可更改的数据，add,update不会更改数据的原始数据
     * @cfg {Object} map
     */
    map : {

    },
    /**
     * 标示父元素id的字段名称
     * @type {String}
     */
    pidField : {
      
    },
    /**
     * 返回数据标示数据的字段</br>
     * 异步加载数据时，返回数据可以使数组或者对象
     * - 如果返回的是对象,可以附加其他信息,那么取对象对应的字段 {nodes : [],hasError:false}
     * - 如何获取附加信息参看 @see {BUI.Data.AbstractStore-event-beforeProcessLoad}
     * <pre><code>
     *  //返回数据为数组 [{},{}]，会直接附加到加载的节点后面
     *  
     *  var node = store.loadNode('123');
     *  store.loadNode(node);
     *  
     * </code></pre>
     * @cfg {Object} [dataProperty = 'nodes']
     */
    dataProperty : {
      value : 'nodes'
    },
    events : {
      value : [
        /**  
        * 当添加数据时触发该事件
        * @event  
        * <pre><code>
        *  store.on('add',function(ev){
        *    list.addItem(e.node,index);
        *  });
        * </code></pre>
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.node 添加的节点
        * @param {Number} index 添加的位置
        */
        'add',
        /**  
        * 当更新数据指定字段时触发该事件 
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.node 更新的节点
        */
        'update',
        /**  
        * 当删除数据时触发该事件
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.node 删除的节点
        * @param {Number} index 删除节点的索引
        */
        'remove',
        /**  
        * 节点加载完毕触发该事件
        * <pre></code>
        *   //异步加载节点,此时节点已经附加到加载节点的后面
        *   store.on('load',function(ev){
        *     var params = ev.params,
        *       id = params.id,
        *       node = store.findNode(id),
        *       children = node.children;  //节点的id
        *     //TO DO
        *   });
        * </code></pre>
        * 
        * @event  
        * @param {jQuery.Event} e  事件对象
        * @param {Object} e.node 加载的节点
        * @param {Object} e.params 加载节点时的参数
        */
        'load'
      ]
    }
  }

  BUI.extend(TreeStore,AbstractStore);

  BUI.augment(TreeStore,{
    /**
     * @protected
     * @override
     * 初始化前
     */
    beforeInit:function(){
      this.initRoot();
    },
    //初始化数据,如果默认加载数据，则加载数据
    _initData : function(){
      var _self = this,
        autoLoad = _self.get('autoLoad'),
        pidField = _self.get('pidField'),
        proxy = _self.get('proxy'),
        root = _self.get('root');

      //添加默认的匹配父元素的字段
      if(!proxy.get('url') && pidField){
        proxy.get('matchFields').push(pidField);
      }
      
      if(autoLoad && !root.children){
        //params = root.id ? {id : root.id}: {};
        _self.loadNode(root);
      }
    },
    /**
     * @protected
     * 初始化根节点
     */
    initRoot : function(){
      var _self = this,
        map = _self.get('map'),
        root = _self.get('root');
      if(!root){
        root = {};
      }
      if(!root.isNode){
        root = new Node(root,map);
        //root.children= [];
      }
      root.path = [root.id];
      root.level = 0;
      if(root.children){
        _self.setChildren(root,root.children);
      }
      _self.set('root',root);
    },
    /**
     * 添加节点，触发{@link BUI.Data.TreeStore#event-add} 事件
     * <pre><code>
     *  //添加到根节点下
     *  store.add({id : '1',text : '1'});
     *  //添加到指定节点
     *  var node = store.findNode('1'),
     *    subNode = store.add({id : '11',text : '11'},node);
     *  //插入到节点的指定位置
     *  var node = store.findNode('1'),
     *    subNode = store.add({id : '12',text : '12'},node,0);
     * </code></pre>
     * @param {BUI.Data.Node|Object} node 节点或者数据对象
     * @param {BUI.Data.Node} [parent] 父节点,如果未指定则为根节点
     * @param {Number} [index] 添加节点的位置
     * @return {BUI.Data.Node} 添加完成的节点
     */
    add : function(node,parent,index){
      var _self = this;

      node = _self._add(node,parent,index);
      _self.fire('add',{node : node,index : index});
      return node;
    },
    //
    _add : function(node,parent,index){
      parent = parent || this.get('root');  //如果未指定父元素，添加到跟节点
      var _self = this,
        map = _self.get('map'),
        nodes = parent.children,
        nodeChildren;

      if(!node.isNode){
        node = new Node(node,map);
      }

      nodeChildren = node.children || []

      if(nodeChildren.length == 0 && node.leaf == null){
        node.leaf = true;
      }
      if(parent){
        parent.leaf = false;
      }
      
      node.parent = parent;
      node.level = parent.level + 1;
      node.path = parent.path.concat(node.id);
      index = index == null ? parent.children.length : index;
      BUI.Array.addAt(nodes,node,index);

      _self.setChildren(node,nodeChildren);
      return node;
    },
    /**
     * 移除节点，触发{@link BUI.Data.TreeStore#event-remove} 事件
     * 
     * <pre><code>
     *  var node = store.findNode('1'); //根据节点id 获取节点
     *  store.remove(node);
     * </code></pre>
     * 
     * @param {BUI.Data.Node} node 节点或者数据对象
     * @return {BUI.Data.Node} 删除的节点
     */
    remove : function(node){
      var parent = node.parent || _self.get('root'),
        index = BUI.Array.indexOf(node,parent.children) ;

      BUI.Array.remove(parent.children,node);
      if(parent.children.length === 0){
        parent.leaf = true;
      }
      this.fire('remove',{node : node , index : index});
      node.parent = null;
      return node;
    },
    /**
     * 更新节点
     * <pre><code>
     *  var node = store.findNode('1'); //根据节点id 获取节点
     *  node.text = 'modify text'; //修改文本
     *  store.update(node);        //此时会触发update事件，绑定了store的控件会更新对应的DOM
     * </code></pre>
     * @return {BUI.Data.Node} 更新节点
     */
    update : function(node){
      this.fire('update',{node : node});
    },
    /**
     * 返回缓存的数据，根节点的直接子节点集合
     * <pre><code>
     *   //获取根节点的所有子节点
     *   var data = store.getResult();
     *   //获取根节点
     *   var root = store.get('root');
     * </code></pre>
     * @return {Array} 根节点下面的数据
     */
    getResult : function(){
      return this.get('root').children;
    },
    /**
     * 设置缓存的数据，设置为根节点的数据
    *   <pre><code>
    *     var data = [
    *       {id : '1',text : '文本1'},
    *       {id : '2',text : '文本2',children:[
    *         {id : '21',text : '文本21'}
    *       ]},
    *       {id : '3',text : '文本3'}
    *     ];
    *     store.setResult(data); //会对数据进行格式化，添加leaf等字段：
    *                            //[{id : '1',text : '文本1',leaf : true},{id : '2',text : '文本2',leaf : false,children:[...]}....]
    *   </code></pre>
     * @param {Array} data 缓存的数据
     */
    setResult : function(data){
      var _self = this,
        proxy = _self.get('proxy'),
        root = _self.get('root');
      if(proxy instanceof Proxy.Memery){
        _self.set('data',data);
        _self.load({id : root.id});
      }else{
        _self.setChildren(root,data);
      }
    },
    /**
     * 设置子节点
     * @protected
     * @param {BUI.Data.Node} node  节点
     * @param {Array} children 子节点
     */
    setChildren : function(node,children){
      var _self = this;
      node.children = [];
      if(!children.length){
        return;
      }
      BUI.each(children,function(item){
        _self._add(item,node);
      });
    },
    /**
     * 查找节点
     * <pre><code>
     *  var node = store.findNode('1');//从根节点开始查找节点
     *  
     *  var subNode = store.findNode('123',node); //从指定节点开始查找
     * </code></pre>
     * @param  {String} id 节点Id
     * @param  {BUI.Data.Node} [parent] 父节点
     * @param {Boolean} [deep = true] 是否递归查找
     * @return {BUI.Data.Node} 节点
     */
    findNode : function(id,parent,deep){
      var _self = this;
      deep = deep == null ? true : deep;
      if(!parent){
        var root = _self.get('root');
        if(root.id === id){
          return root;
        }
        return _self.findNode(id,root);
      }
      var children = parent.children,
        rst = null;
      BUI.each(children,function(item){
        if(item.id === id){
          rst = item;
        }else if(deep){
          rst = _self.findNode(id,item);
        }
        if(rst){
          return false;
        }
      });
      return rst;
    },
    /**
     * 查找节点,根据匹配函数查找
     * <pre><code>
     *  var nodes = store.findNodesBy(function(node){
     *   if(node.status == '0'){
     *     return true;
     *   }
     *   return false;
     *  });
     * </code></pre>
     * @param  {Function} func 匹配函数
     * @param  {BUI.Data.Node} [parent] 父元素，如果不存在，则从根节点查找
     * @return {Array} 节点数组
     */
    findNodesBy : function(func,parent){
      var _self = this,
        root,
        rst = [];

      if(!parent){
        parent = _self.get('root');
      }

      BUI.each(parent.children,function(item){
        if(func(item)){
          rst.push(item);
        }
        rst = rst.concat(_self.findNodesBy(func,item));
      });

      return rst;
    },
    /**
     * 根据path查找节点
     * @return {BUI.Data.Node} 节点
     * @ignore
     */
    findNodeByPath : function(path){
      if(!path){
        return null;
      }
      var _self = this,
        root = _self.get('root'),
        pathArr = path.split(','),
        node,
        i,
        tempId = pathArr[0];
      if(!tempId){
        return null;
      }
      if(root.id == tempId){
        node = root;
      }else{
        node = _self.findNode(tempId,root,false);
      }
      if(!node){
        return;
      }
      for(i = 1 ; i < pathArr.length ; i = i + 1){
        var tempId = pathArr[i];
        node = _self.findNode(tempId,node,false);
        if(!node){
          break;
        }
      }
      return node;
    },
    /**
     * 是否包含指定节点，如果未指定父节点，从根节点开始搜索
     * <pre><code>
     *  store.contains(node); //是否存在节点
     *
     *  store.contains(subNode,node); //节点是否存在指定子节点
     * </code></pre>
     * @param  {BUI.Data.Node} node 节点
     * @param  {BUI.Data.Node} parent 父节点
     * @return {Boolean} 是否包含指定节点
     */
    contains : function(node,parent){
      var _self = this,
        findNode = _self.findNode(node.id,parent);
      return !!findNode;
    },
    /**
     * 加载完数据
     * @protected
     * @override
     */
    afterProcessLoad : function(data,params){
      var _self = this,
        pidField = _self.get('pidField'),
        id = params.id || params[pidField],
        dataProperty = _self.get('dataProperty'),
        node = _self.findNode(id) || _self.get('root');//如果找不到父元素，则放置在跟节点

      if(BUI.isArray(data)){
        _self.setChildren(node,data);
      }else{
        _self.setChildren(node,data[dataProperty]);
      }
      _self.fire('load',{node : node,params : params});
    },
    /**
     * 是否包含数据
     * @return {Boolean} 
     */
    hasData : function(){
      //return true;
      return this.get('root').children && this.get('root').children.length !== 0;
    },
    /**
     * 是否已经加载过，叶子节点或者存在字节点的节点
     * @param   {BUI.Data.Node} node 节点
     * @return {Boolean}  是否加载过
     */
    isLoaded : function(node){
      var root = this.get('root');
      if(node == root && !root.children){
        return false;
      }
      if(!this.get('url') && !this.get('pidField')){ //如果不从远程加载数据,默认已经加载
        return true;
      }
      
      return node.leaf || (node.children && node.children.length);
    },
    /**
     * 加载节点的子节点
     * @param  {BUI.Data.Node} node 节点
     */
    loadNode : function(node){
      var _self = this;
      //如果已经加载过，或者节点是叶子节点
      if(_self.isLoaded(node)){
        return ;
      }
      if(!_self.get('url') && _self.get('data')){ //如果不从远程加载数据，不是根节点的话，取消加载
        var pidField = _self.get('pidField'),
          params = {id : node.id};
        if(pidField){
          params[pidField] = node.id;
        }
        _self.load(params);
        return;
      }else{
        _self.load({id:node.id,path : ''});
      }
      
    },
    /**
     * 加载节点，根据path
     * @param  {String} path 加载路径
     * @ignore
     */
    loadPath : function(path){
      var _self = this,
        arr = path.split(','),
        id = arr[0];
      if(_self.findNodeByPath(path)){ //加载过
        return;
      }
      _self.load({id : id,path : path});
    }
  });

  return TreeStore;

});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 编辑器命名空间入口
 * @ignore
 */

define('bui/editor',['bui/common','bui/form','bui/editor/editor','bui/editor/record','bui/editor/dialog'],function (require) {
  var BUI = require('bui/common'),
    Form = require('bui/form'),
    Editor = BUI.namespace('Editor');

  BUI.mix(Editor,{
    Editor : require('bui/editor/editor'),
    RecordEditor : require('bui/editor/record'),
    DialogEditor : require('bui/editor/dialog')
  });
  return Editor;
});
/**
 * @fileOverview 使用弹出框作为编辑器
 * @ignore
 */

define('bui/editor/dialog',['bui/overlay','bui/editor/mixin'],function (require) {
  var Dialog = require('bui/overlay').Dialog,
    Mixin = require('bui/editor/mixin');

   /**
   * @class BUI.Editor.DialogEditor
   * @extends BUI.Overlay.Dialog
   * @mixins BUI.Editor.Mixin
   * 编辑器
   */
  var editor = Dialog.extend([Mixin],{
    /**
     * @protected
     * @override
     * 获取编辑的源数据
     * @return {String} 返回需要编辑的文本
     */
    getSourceValue : function(){
      return this.get('record');
    },
    /**
     * @protected
     * @override
     * 处理enter键
     */
    handleNavEnter : function(ev){
      var _self = this,
        success = _self.get('success'),
        sender = ev.target;
      if(sender.tagName === 'TEXTAREA'){ //文本输入框，不确定隐藏
        return;
      }
      if(sender.tagName === 'BUTTON'){
        $(sender).trigger('click');
      }
      if(success){
        success.call(_self);
      }else{
        this.accept();
      }
    },
    /**
     * 取消编辑
     */
    cancel : function(){
      if(this.onCancel()!== false){
        this.fire('cancel');
        this.clearValue();
        this.close();
      } 
    },
    /**
     * @protected
     * 更新文本
     * @param  {Object} value 编辑器的值
     */
    updateSource : function(value){
      var _self = this,
        record = _self.get('record');
      BUI.mix(record,value);
    },
    _uiSetRecord : function(v){
      this.setValue(v);
    }
  },{
    ATTRS : {
      /**
       * 内部控件的代表Value的字段
       * @protected
       * @override
       * @type {String}
       */
      innerValueField : {
        value : 'record'
      },
      /**
       * 接受更改的事件
       * @type {String}
       */
      acceptEvent : {
        value : ''
      },
      /**
       * 编辑的记录
       * @type {Object}
       */
      record : {
        value : {}
      },
      /**
       * 空值的数据，清空编辑器时使用
       * @protected
       * @type {*}
       */
      emptyValue : {
        value : {}
      },
      /**
       * 内部控件配置项的字段
       * @protected
       * @type {String}
       */
      controlCfgField : {
        value : 'form'
      },
      /**
       * dialog 编辑器一般由按钮触发，在触发时设置数据源
       * @override
       * @type {String}
       */
      changeSourceEvent : {
        value : ''
      },
      /**
       * 默认的字段域配置项
       * @type {Object}
       */
      defaultChildCfg : {
        value : {
          xclass : 'form-horizontal'
        }
      },
      /**
       * 设置可以获取交单
       * @type {Boolean}
       */
      focusable : {
        value : true
      },
      success : {
        value : function () {
          this.accept();
        }
      },
      /**
       * 编辑器内表单的配置项
       * @type {Object}
       */
      form : {
        value : {}
      }
    }
  },{
    xclass : 'dialog-editor'
  });

  return editor;
});
/**
 * @ignore
 * @fileOverview 编辑器
 * @author dxq613@gmail.com
 */

define('bui/editor/editor',['bui/common','bui/overlay','bui/editor/mixin'],function (require) {
  var BUI = require('bui/common'),
    Overlay = require('bui/overlay').Overlay
    CLS_TIPS = 'x-editor-tips',
    Mixin = require('bui/editor/mixin');

  /**
   * @class BUI.Editor.Editor
   * @extends BUI.Overlay.Overlay
   * @mixins BUI.Editor.Mixin
   * 编辑器
   * <p>
   * <img src="../assets/img/class-editor.jpg"/>
   * </p>
   */
  var editor = Overlay.extend([Mixin],{
    bindUI : function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      _self.on('validchange',function(ev){
        if(!_self.isValid() && _self.get('visible')){
          _self._showError(_self.getErrors());
        }else{
          _self._hideError();
        }
      });
      _self.on('hide',function(){
        _self._hideError();
      });

      _self.on('show',function(){
        if(!_self.isValid()){
          _self._showError(_self.getErrors());
        }
      });
    },
    _initOverlay : function(){
      var _self = this,
        overlay = new Overlay({
          children : [{
            xclass : 'simple-list',
            itemTpl : '<li><span class="x-icon x-icon-mini x-icon-error" title="{error}">!</span>&nbsp;<span>{error}</span></li>'
          }],
          elCls : CLS_TIPS,
          autoRender : true
        });
      _self.set('overlay',overlay);
      return overlay;
    },
    //获取显示错误列表
    _getErrorList : function(){
      var _self = this,
        overlay = _self.get('overlay');
      return overlay && overlay.get('children')[0];
    },
    _showError : function(errors){
      var _self = this,
        overlay = _self.get('overlay') || _self._initOverlay(),
        list = _self._getErrorList(),
        align = _self.get('errorAlign'),
        items = BUI.Array.map(errors,function(text){
          return {error : text};
        });
      list.set('items',items);
      align.node = _self.get('el');
      overlay.set('align',align);
      overlay.show();
    },
    //隐藏错误
    _hideError : function(){
      var _self = this,
        overlay = _self.get('overlay');
      overlay && overlay.hide();
    },
    /**
     * @protected
     * @override
     * 获取编辑的源数据
     * @return {String} 返回需要编辑的文本
     */
    getSourceValue : function(){
      var _self = this,
        trigger = _self.get('curTrigger');
      return trigger.text();
    },
    /**
     * @protected
     * 更新文本
     * @param  {String} text 编辑器的值
     */
    updateSource : function(text){
      var _self = this,
        trigger = _self.get('curTrigger');
      if(trigger && trigger.length){
        trigger.text(text);
      }
    },
    _uiSetWidth : function(v){
      var _self = this;
      if(v != null){
        var innerControl = _self.getInnerControl();
        if(innerControl.set){
          innerControl.set('width',v);
        }
      }
    }
  },{
    ATTRS : {
      /**
       * 内部控件的代表Value的字段
       * @protected
       * @override
       * @type {String}
       */
      innerValueField : {
        value : 'value'
      },
      /**
       * 空值的数据，清空编辑器时使用
       * @protected
       * @type {*}
       */
      emptyValue : {
        value : ''
      },
      /**
       * 是否自动隐藏
       * @override
       * @type {Boolean}
       */
      autoHide : {
        value : true
      },
      /**
       * 内部控件配置项的字段
       * @protected
       * @type {String}
       */
      controlCfgField : {
        value : 'field'
      },
      /**
       * 默认的字段域配置项
       * @type {Object}
       */
      defaultChildCfg : {
        value : {
          tpl : '',
          forceFit : true,
          errorTpl : ''//
        }
      },
      defaultChildClass : {
        value : 'form-field'
      },
      align : {
        value : {
          points: ['tl','tl']
        }
      },
      /**
       * 错误信息的对齐方式
       * @type {Object}
       */
      errorAlign : {
        value : {
          points: ['bl','tl'],
          offset : [0,10]
        }
      },
      /**
       * 显示错误的弹出层
       * @type {BUI.Overlay.Overlay}
       */
      overlay : {

      },
      /**
       * 编辑器中默认使用文本字段域来编辑数据
       * @type {Array}
       */
      field : {
        value : {}
      }
    }
  },{
    xclass : 'editor'
  });

  return editor;
});
/**
 * @fileOverview 编辑器扩展类，引入这个扩展，控件可以支持编辑器功能。
 * @ignore
 */

define('bui/editor/mixin',function (require) {

  function initEditor (self) {
   var _self = self,
      controlCfgField = _self.get('controlCfgField'),
      control = _self.get(controlCfgField),
      c = _self.addChild(control);
    _self.setInternal(controlCfgField,c);
  }

  /**
   * @class BUI.Editor.Mixin
   * 编辑器扩展类
   */
  var Mixin = function () {
    initEditor(this);
  };

  Mixin.ATTRS = {
    /**
     * 接受更改的事件
     * @protected
     * @type {String}
     */
    acceptEvent : {
      value : 'autohide'
    },
    /**
     * 当发生错误时是否阻止编辑器消失
     * @type {Boolean}
     */
    preventHide : {
      value : true
    },
    /**
     * 重置数据时的事件
     * @type {String}
     */
    changeSourceEvent : {
      value : 'show triggerchange'
    },
    /**
     * 是否忽略掉输入框之类的键盘事件
     * @protected
     * @type {Boolean}
     */
    ignoreInputFields: {
      value :false
    },
    /**
     * 内部控件的代表Value的字段
     * @protected
     * @type {String}
     */
    innerValueField : {

    },
    /**
     * 空值的数据，清空编辑器时使用
     * @protected
     * @type {*}
     */
    emptyValue : {

    },
    /**
     * 内部控件配置项的字段
     * @protected
     * @type {String}
     */
    controlCfgField : {

    },
    autoUpdate : {
      value : true
    },
    events : {
      value : {
        /**
         * @event
         * 接受更改
         */
        accept : false,
        /**
         * @event
         * 取消更改
         */
        cancel : false
      }
    }
  };

  Mixin.prototype = {
    //绑定事件
    __bindUI : function(){
      var _self = this,
      acceptEvent = _self.get('acceptEvent'),
      changeSourceEvent = _self.get('changeSourceEvent');

      if(acceptEvent){
        _self.on(acceptEvent,function(){
          if(_self.accept()){
            return ;
          }else if(_self.get('preventHide')){
            return false;
          }else{
            _self.cancel();
          }
        });
      }
      if(changeSourceEvent){
        _self.on(changeSourceEvent,function(){
          _self.setValue(_self.getSourceValue());
          if(_self.get('visible')){
            _self.focus();
          }
        });
      }
    },
    /**
     * @protected
     * 获取编辑器的内部控件
     * @return {BUI.Component.Controller} 用于编辑数据的内部数据
     */
    getInnerControl : function(){
      var _self = this,
        children = _self.get('children');
      return children[0];
    },
    /**
     * 设置值，值的类型取决于编辑器编辑的数据
     * @param {String|Object} value 编辑器显示的值
     */
    setValue : function(value){
      var _self = this,
        innerControl = _self.getInnerControl();
      _self.set('editValue',value);
      _self.clearControlValue();
      innerControl.set(_self.get('innerValueField'),value);
      if(!value){//编辑的值等于空，则可能不会触发验证
        _self.valid();
      }
    },
    /**
     * 获取编辑器的值
     * @return {String|Object} 编辑器的值
     */
    getValue :function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      return innerControl.get(_self.get('innerValueField'));
    },
    /**
     * 编辑的内容是否通过验证
     * @return {Boolean} 是否通过验证
     */
    isValid : function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      return innerControl.isValid ? innerControl.isValid() : true;
    },
    /**
     * 验证内容是否通过验证
     */
    valid : function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.valid && innerControl.valid();
    },
    /**
     * 获取错误信息
     * @return {Array} 错误信息
     */
    getErrors : function(){
       var _self = this,
        innerControl = _self.getInnerControl();
      return innerControl.getErrors ? innerControl.getErrors() : [];
    },
    /**
     * 编辑的内容是否发生改变
     * @return {Boolean}
     */
    isChange : function(){
      var _self = this,
        editValue = _self.get('editValue'),
        value = _self.getValue();
      return editValue !== value;
    },
    /**
     * 清除编辑的值
     */
    clearValue : function(){
      this.clearControlValue();
      this.clearErrors();
    },
    /**
     * 清除编辑的控件的值
     * @protected
     * @template
     */
    clearControlValue : function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.set(_self.get('innerValueField'),_self.get('emptyValue'));
    },
    /**
     * 清除错误
     */
    clearErrors : function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.clearErrors();
    },
    /**
     * @protected
     * @template
     * 获取编辑的源数据
     */
    getSourceValue : function(){

    },
    /**
     * @protected
     * @template
     * 更新编辑的源数据
     */
    updateSource : function(){

    },
    /**
     * @protected
     * @override
     * 处理esc键
     */
    handleNavEsc : function(){
      this.cancel();
    },
    /**
     * @protected
     * @override
     * 处理enter键
     */
    handleNavEnter : function(ev){
      var sender = ev.target;
      if(sender.tagName === 'TEXTAREA'){ //文本输入框，不确定隐藏
        return;
      }
      if(sender.tagName === 'BUTTON'){
        $(sender).trigger('click');
      }
      this.accept();
    },
    /**
     * 设置获取焦点
     */
    focus : function(){
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.focus && innerControl.focus()
    },
    /**
     * 接受编辑器的编辑结果
     * @return {Boolean} 是否成功接受编辑
     */
    accept : function(){
      var _self = this,
        value;
      _self.valid();
      if(!_self.isValid()){
        return false;
      }
      value = _self.getValue();

      if(_self.get('autoUpdate')){
        _self.updateSource(value);
      }
      if(_self.fire('beforeaccept',{value :value}) == false){
        return;
      }
      _self.fire('accept',{value :value,editValue : _self.get('editValue')});/**/
      _self.hide();
      return true;
    },
    /**
     * 取消编辑
     */
    cancel : function(){
      this.fire('cancel');
      this.clearValue();
      this.close();
    }
  };

  return Mixin;
});
/**
 * @fileOverview 对象编辑器
 * @ignore
 */

define('bui/editor/record',['bui/common','bui/editor/editor'],function (require) {
  var BUI = require('bui/common'),
    Editor = require('bui/editor/editor');

  /**
   * @class BUI.Editor.RecordEditor
   * @extends BUI.Editor.Editor
   * 编辑器
   */
  var editor = Editor.extend({
    /**
     * @protected
     * @override
     * 获取编辑的源数据
     * @return {String} 返回需要编辑的文本
     */
    getSourceValue : function(){
      return this.get('record');
    },
    /**
     * @protected
     * 更新文本
     * @param  {Object} value 编辑器的值
     */
    updateSource : function(value){
      var _self = this,
        record = _self.get('record');
      BUI.mix(record,value);
    },
    _uiSetRecord : function(v){
      this.setValue(v);
    }
  },{
    ATTRS : {

      /**
       * 内部控件的代表Value的字段
       * @protected
       * @override
       * @type {String}
       */
      innerValueField : {
        value : 'record'
      },
      /**
       * 接受更改的事件
       * @type {String}
       */
      acceptEvent : {
        value : ''
      },
      /**
       * 空值的数据，清空编辑器时使用
       * @protected
       * @type {*}
       */
      emptyValue : {
        value : {}
      },
      /**
       * 是否自动隐藏
       * @override
       * @type {Boolean}
       */
      autoHide : {
        value : false
      },
      /**
       * 编辑的记录
       * @type {Object}
       */
      record : {
        value : {}
      },
      /**
       * 内部控件配置项的字段
       * @protected
       * @type {String}
       */
      controlCfgField : {
        value : 'form'
      },
      /**
       * 编辑器内表单的配置项
       * @type {Object}
       */
      form : {
        value : {}
      },
      /**
       * 错误信息的对齐方式
       * @type {Object}
       */
      errorAlign : {
        value : {
          points: ['tr','tl'],
          offset : [10,0]
        }
      },
      /**
       * 默认的字段域配置项
       * @type {Object}
       */
      defaultChildCfg : {
        valueFn : function(){
          var _self = this;
          return {
            xclass : 'form',
            errorTpl : '',
            showError : true,
            showChildError : true,
            defaultChildCfg : {
              elCls : 'bui-inline-block',
              tpl : '',
              forceFit : true
            },
            buttons : [
            {
              btnCls : 'button button-primary',
              text : '确定',
              handler : function(){
                _self.accept();
              }
            },
            {
              btnCls : 'button',
              text : '取消',
              handler : function(){
                _self.cancel();
              }
            }]
          }
        }
      }
    }
  },{
    xclass : 'record-editor'
  });

  return editor;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview form 命名空间入口
 * @ignore
 */
;(function(){
var BASE = 'bui/form/';
define('bui/form',['bui/common',BASE + 'fieldcontainer',BASE + 'form',BASE + 'row',BASE + 'fieldgroup',BASE + 'horizontal',BASE + 'rules',BASE + 'field',BASE + 'fieldgroup'],function (r) {
  var BUI = r('bui/common'),
    Form = BUI.namespace('Form'),
    Tips = r(BASE + 'tips');

  BUI.mix(Form,{
    Tips : Tips,
    TipItem : Tips.Item,
    FieldContainer : r(BASE + 'fieldcontainer'),
    Form : r(BASE + 'form'),
    Row : r(BASE + 'row'),
    Group : r(BASE + 'fieldgroup'),
    HForm : r(BASE + 'horizontal'),
    Rules : r(BASE + 'rules'),
    Field : r(BASE + 'field'),
    FieldGroup : r(BASE + 'fieldgroup')
  });
  return Form;
});
})();

/**
 * @fileOverview 表单域的入口文件
 * @ignore
 */
;(function(){
var BASE = 'bui/form/';
define(BASE + 'field',['bui/common',BASE + 'textfield',BASE + 'datefield',BASE + 'selectfield',BASE + 'hiddenfield',
  BASE + 'numberfield',BASE + 'checkfield',BASE + 'radiofield',BASE + 'checkboxfield',BASE + 'plainfield',BASE + 'listfield',
  BASE + 'checklistfield',BASE + 'radiolistfield'],function (require) {
  var BUI = require('bui/common'),
    Field = require(BASE + 'basefield');

  BUI.mix(Field,{
    Text : require(BASE + 'textfield'),
    Date : require(BASE + 'datefield'),
    Select : require(BASE + 'selectfield'),
    Hidden : require(BASE + 'hiddenfield'),
    Number : require(BASE + 'numberfield'),
    Check : require(BASE + 'checkfield'),
    Radio : require(BASE + 'radiofield'),
    Checkbox : require(BASE + 'checkboxfield'),
    Plain : require(BASE + 'plainfield'),
    List : require(BASE + 'listfield'),
    CheckList : require(BASE + 'checklistfield'),
    RadioList : require(BASE + 'radiolistfield')
  });

  return Field;
});

})();

/**
 * @fileOverview 表单字段的容器扩展
 * @ignore
 */
define('bui/form/fieldcontainer',['bui/common','bui/form/field','bui/form/groupvalid'],function (require) {
  var BUI = require('bui/common'),
    Field = require('bui/form/field'),
    GroupValid = require('bui/form/groupvalid'),
    PREFIX = BUI.prefix;

  var FIELD_XCLASS = 'form-field',
    CLS_FIELD = PREFIX + FIELD_XCLASS,
    CLS_GROUP = PREFIX + 'form-group',
    FIELD_TAGS = 'input,select,textarea';

  function isField(node){
    return node.is(FIELD_TAGS);
  }
  /**
   * 获取节点需要封装的子节点
   * @ignore
   */
  function getDecorateChilds(node,srcNode){

    if(node != srcNode){

      if(isField(node)){
        return [node];
      }
      var cls = node.attr('class');
      if(cls && (cls.indexOf(CLS_GROUP) !== -1 || cls.indexOf(CLS_FIELD) !== -1)){
        return [node];
      }
    }
    var rst = [],
      children = node.children();
    BUI.each(children,function(subNode){
      rst = rst.concat(getDecorateChilds($(subNode),srcNode));
    });
    return rst;
  }

  var containerView = BUI.Component.View.extend([GroupValid.View]);

  /**
   * 表单字段容器的扩展类
   * @class BUI.Form.FieldContainer
   * @extends BUI.Component.Controller
   * @mixins BUI.Form.GroupValid
   */
  var container = BUI.Component.Controller.extend([GroupValid],
    {
      //同步数据
      syncUI : function(){
        var _self = this,
          fields = _self.getFields(),
          validators = _self.get('validators');

        BUI.each(fields,function(field){
          var name = field.get('name');
          if(validators[name]){
            field.set('validator',validators[name]);
          }
        });
        BUI.each(validators,function(item,key){
          //按照ID查找
          if(key.indexOf('#') == 0){
            var id = key.replace('#',''),
              child = _self.getChild(id,true);
            if(child){
              child.set('validator',item);
            }
          }
        });
      },
      /**
       * 获取封装的子控件节点
       * @protected
       * @override
       */
      getDecorateElments : function(){
        var _self = this,
          el = _self.get('el');
        var items = getDecorateChilds(el,el);
        return items;
      },
      /**
       * 根据子节点获取对应的子控件 xclass
       * @protected
       * @override
       */
      findXClassByNode : function(childNode, ignoreError){


        if(childNode.attr('type') === 'checkbox'){
          return FIELD_XCLASS + '-checkbox';
        }

        if(childNode.attr('type') === 'radio'){
          return FIELD_XCLASS + '-radio';
        }

        if(childNode.attr('type') === 'number'){
          return FIELD_XCLASS + '-number';
        }

        if(childNode.hasClass('calendar')){
          return FIELD_XCLASS + '-date';
        }

        if(childNode[0].tagName == "SELECT"){
          return FIELD_XCLASS + '-select';
        }

        if(isField(childNode)){
          return FIELD_XCLASS;
        }

        return BUI.Component.Controller.prototype.findXClassByNode.call(this,childNode, ignoreError);
      },
      /**
       * 获取表单编辑的对象
       * @return {Object} 编辑的对象
       */
      getRecord : function(){
        var _self = this,
          rst = {},
          fields = _self.getFields();
        BUI.each(fields,function(field){
          var name = field.get('name'),
            value = _self._getFieldValue(field);

          if(!rst[name]){//没有值，直接赋值
            rst[name] = value;
          }else if(BUI.isArray(rst[name]) && value != null){//已经存在值，并且是数组，加入数组
            rst[name].push(value);
          }else if(value != null){          //否则封装成数组，并加入数组
            var arr = [rst[name]]
            arr.push(value);
            rst[name] = arr; 
          }
        });
        return rst;
      },
      /**
       * 获取表单字段
       * @return {Array} 表单字段
       */
      getFields : function(name){
        var _self = this,
          rst = [],
          children = _self.get('children');
        BUI.each(children,function(item){
          if(item instanceof Field){
            if(!name || item.get('name') == name){
              rst.push(item);
            }
          }else if(item.getFields){
            rst = rst.concat(item.getFields(name));
          }
        });
        return rst;
      },
      /**
       * 根据name 获取表单字段
       * @param  {String} name 字段名
       * @return {BUI.Form.Field}  表单字段或者 null
       */
      getField : function(name){
        var _self = this,
          fields = _self.getFields(),
          rst = null;

        BUI.each(fields,function(field){
          if(field.get('name') === name){
            rst = field;
            return false;
          }
        });
        return rst;
      },
      /**
       * 根据索引获取字段的name
       * @param  {Number} index 字段的索引
       * @return {String}   字段名称
       */
      getFieldAt : function (index) {
        return this.getFields()[index];
      },
      /**
       * 根据字段名
       * @param {String} name 字段名
       * @param {*} value 字段值
       */
      setFieldValue : function(name,value){
        var _self = this,
          fields = _self.getFields(name);
          BUI.each(fields,function(field){
            _self._setFieldValue(field,value);
          });
      },
      //设置字段域的值
      _setFieldValue : function(field,value){
        //如果字段不可用，则不能设置值
        if(field.get('disabled')){
          return;
        }
        //如果是可勾选的
        if(field instanceof Field.Check){
          var fieldValue = field.get('value');
          if(value && (fieldValue === value || (BUI.isArray(value) && BUI.Array.contains(fieldValue,value)))){
            field.set('checked',true);
          }else{
            field.set('checked',false);
          }
        }else{
          if(value == null){
            value = '';
          }
          field.set('value',value);
        }
      },
      /**
       * 获取字段值,不存在字段时返回null,多个同名字段时，checkbox返回一个数组
       * @param  {String} name 字段名
       * @return {*}  字段值
       */
      getFieldValue : function(name){
        var _self = this,
          fields = _self.getFields(name),
          rst = [];

        BUI.each(fields,function(field){
          var value = _self._getFieldValue(field);
          if(value){
            rst.push(value);
          }
        });
        if(rst.length === 0){
          return null;
        }
        if(rst.length === 1){
          return rst[0]
        }
        return rst;
      },
      //获取字段域的值
      _getFieldValue : function(field){
        if(!(field instanceof Field.Check) || field.get('checked')){
          return field.get('value');
        }
        return null;
      },
      /**
       * 清除所有表单域的值
       */
      clearFields : function(){
        this.clearErrors();
        this.setRecord({})
      },
      /**
       * 设置表单编辑的对象
       * @param {Object} record 编辑的对象
       */
      setRecord : function(record){
        var _self = this,
          fields = _self.getFields();

        BUI.each(fields,function(field){
          var name = field.get('name');
          _self._setFieldValue(field,record[name]);
        });
      },
      /**
       * 更新表单编辑的对象
       * @param  {Object} record 编辑的对象
       */
      updateRecord : function(record){
        var _self = this,
          fields = _self.getFields();

        BUI.each(fields,function(field){
          var name = field.get('name');
          if(record.hasOwnProperty(name)){
            _self._setFieldValue(field,record[name]);
          }
        });
      },
      /**
       * 设置控件获取焦点，设置第一个子控件获取焦点
       */
      focus : function(){
        var _self = this,
          fields = _self.getFields(),
          firstField = fields[0];
        if(firstField){
          firstField.focus();
        }
      },
      //禁用控件
      _uiSetDisabled : function(v){
        var _self = this,
          children = _self.get('children');

        BUI.each(children,function(item){
          item.set('disabled',v);
        });
      }
    },
    {
      ATTRS : {
        /**
         * 表单的数据记录，以键值对的形式存在
         * @type {Object}
         */
        record : {
          setter : function(v){
            this.setRecord(v);
          },
          getter : function(){
            return this.getRecord();
          }
        },
        /**
         * 内部元素的验证函数，可以使用2中选择器
         * <ol>
         *   <li>id: 使用以'#'为前缀的选择器，可以查找字段或者分组，添加联合校验</li>
         *   <li>name: 不使用任何前缀，没查找表单字段</li>
         * </ol>
         * @type {Object}
         */
        validators : {
          value : {

          }
        },
        /**
         * 默认的加载控件内容的配置,默认值：
         * <pre>
         *  {
         *   property : 'children',
         *   dataType : 'json'
         * }
         * </pre>
         * @type {Object}
         */
        defaultLoaderCfg  : {
          value : {
            property : 'children',
            dataType : 'json'
          }
        },
        disabled : {
          sync : false
        },
        isDecorateChild : {
          value : true
        },
        xview : {
          value : containerView
        }
      }
    },{
      xclass : 'form-field-container'
    }
  ); 
  container.View = containerView;
  return container;
  
});
/**
 * @fileOverview 表单文本域组，可以包含一个至多个字段
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/form/fieldgroup',['bui/common','bui/form/group/base','bui/form/group/range','bui/form/group/check','bui/form/group/select'],function (require) {
  var BUI = require('bui/common'),
    Group = require('bui/form/group/base');

  BUI.mix(Group,{
    Range : require('bui/form/group/range'),
    Check : require('bui/form/group/check'),
    Select : require('bui/form/group/select')
  });
  return Group;
});
/**
 * @fileOverview 创建表单
 * @ignore
 */

define('bui/form/form',['bui/common','bui/toolbar','bui/form/fieldcontainer'],function (require) {
  
  var BUI = require('bui/common'),
    Bar = require('bui/toolbar').Bar,
    TYPE_SUBMIT = {
      NORMAL : 'normal',
      AJAX : 'ajax',
      IFRAME : 'iframe'
    },
    FieldContainer = require('bui/form/fieldcontainer'),
    Component = BUI.Component;

  var FormView = FieldContainer.View.extend({
    _uiSetMethod : function(v){
      this.get('el').attr('method',v);
    },
    _uiSetAction : function(v){
      this.get('el').attr('action',v);
    }
  },{
    ATTRS : {
      method : {},
      action : {}
    }
  },{
    xclass: 'form-view'
  });

  /**
   * @class BUI.Form.Form
   * 表单控件,表单相关的类图：
   * <img src="../assets/img/class-form.jpg"/>
   * @extends BUI.Form.FieldContainer
   */
  var Form = FieldContainer.extend({
    renderUI : function(){
      var _self = this,
        buttonBar = _self.get('buttonBar'),
        cfg;
      if($.isPlainObject(buttonBar) && _self.get('buttons')){
        cfg = BUI.merge(_self.getDefaultButtonBarCfg(),buttonBar);
        buttonBar = new Bar(cfg);
        _self.set('buttonBar',buttonBar);
      }
      _self._initSubmitMask();
    },
    bindUI : function(){
      var _self = this,
        formEl = _self.get('el');

      formEl.on('submit',function(ev){
        _self.valid();
        if(!_self.isValid() || _self.onBeforeSubmit() === false){
          ev.preventDefault();
        }
        if(_self.isValid() && _self.get('submitType') === TYPE_SUBMIT.AJAX){
          ev.preventDefault();
          _self.ajaxSubmit();
        }

      });
    },
    /**
     * 获取按钮栏默认的配置项
     * @protected
     * @return {Object} 
     */
    getDefaultButtonBarCfg : function(){
      var _self = this,
        buttons = _self.get('buttons');
      return {
        autoRender : true,
        elCls :'toolbar',
        render : _self.get('el'),
        items : buttons,
        defaultChildClass : 'bar-item-button'
      };
    },
    /**
     * 表单提交，如果未通过验证，则阻止提交
     */
    submit : function(options){
      var _self = this,
        submitType = _self.get('submitType');
      _self.valid();
      if(_self.isValid()){
        if(_self.onBeforeSubmit() == false){
          return;
        }
        if(submitType === TYPE_SUBMIT.NORMAL){
          _self.get('el')[0].submit();
        }else if(submitType === TYPE_SUBMIT.AJAX){
          _self.ajaxSubmit(options);
        }
      }
    },
    /**
     * 异步提交表单
     */
    ajaxSubmit : function(options){
      var _self = this,
        method = _self.get('method'),
        action = _self.get('action'),
        callback = _self.get('callback'),
        submitMask = _self.get('submitMask'),
        data = _self.serializeToObject(), //获取表单数据
        success,
        ajaxParams = BUI.merge(true,{ //合并请求参数
          url : action,
          type : method,
          dataType : 'json',
          data : data
        },options);

      if(options && options.success){
        success = options.success;
      }
      ajaxParams.success = function(data){ //封装success方法
        if(submitMask && submitMask.hide){
          submitMask.hide();
        }
        if(success){
          success(data);
        }
        callback && callback.call(_self,data);
      } 
      if(submitMask && submitMask.show){
        submitMask.show();
      }
      $.ajax(ajaxParams); 
    },
    //获取提交的屏蔽层
    _initSubmitMask : function(){
      var _self = this,
        submitType = _self.get('submitType'),
        submitMask = _self.get('submitMask');
      if(submitType === TYPE_SUBMIT.AJAX && submitMask){
        BUI.use('bui/mask',function(Mask){
          var cfg = $.isPlainObject(submitMask) ? submitMask : {};
          submitMask = new Mask.LoadMask(BUI.mix({el : _self.get('el')},cfg));
          _self.set('submitMask',submitMask);
        });
      }
    },
    /**
     * 序列化表单成对象
     * @return {Object} 序列化成对象
     */
    serializeToObject : function(){
      return BUI.FormHelper.serializeToObject(this.get('el')[0]);
    },
    /**
     * 表单提交前
     * @protected
     * @return {Boolean} 是否取消提交
     */
    onBeforeSubmit : function(){
      return this.fire('beforesubmit');
    },
    /**
     * 表单恢复初始值
     */
    reset : function(){
      var _self = this,
        initRecord = _self.get('initRecord');
      _self.setRecord(initRecord);
    },
    /**
     * 重置提示信息，因为在表单隐藏状态下，提示信息定位错误
     * <pre><code>
     * dialog.on('show',function(){
     *   form.resetTips();
     * });
     *   
     * </code></pre>
     */
    resetTips : function(){
      var _self = this,
        fields = _self.getFields();
      BUI.each(fields,function(field){
        field.resetTip();
      });
    },
    /**
     * @protected
     * @ignore
     */
    destructor : function(){
      var _self = this,
        buttonBar = _self.get('buttonBar'),
        submitMask = _self.get('submitMask');
      if(buttonBar && buttonBar.destroy){
        buttonBar.destroy();
      }
      if(submitMask && submitMask.destroy){
        submitMask.destroy();
      }
    },
    //设置表单的初始数据
    _uiSetInitRecord : function(v){
      //if(v){
        this.setRecord(v);
      //}
      
    }
  },{
    ATTRS : {
      /**
       * 提交的路径
       * @type {String}
       */
      action : {
        view : true,
        value : ''
      },
      allowTextSelection:{
        value : true
      },
      events : {
        value : {
          /**
           * @event
           * 表单提交前触发，如果返回false会阻止表单提交
           */
          beforesubmit : false
        }
      },
      /**
       * 提交的方式
       * @type {String}
       */
      method : {
        view : true,
        value : 'get'
      },
      /**
       * 默认的loader配置
       * <pre>
       * {
       *   autoLoad : true,
       *   property : 'record',
       *   dataType : 'json'
       * }
       * </pre>
       * @type {Object}
       */
      defaultLoaderCfg : {
        value : {
          autoLoad : true,
          property : 'record',
          dataType : 'json'
        }
      },
      /**
       * 异步提交表单时的屏蔽
       * @type {BUI.Mask.LoadMask|Object}
       */
      submitMask : {
        value : {
          msg : '正在提交。。。'
        }
      },
      /**
       * 提交表单的方式
       *
       *  - normal 普通方式，直接提交表单
       *  - ajax 异步提交方式，在submit指定参数
       *  - iframe 使用iframe提交,开发中。。。
       * @cfg {String} [submitType='normal']
       */
      submitType : {
        value : 'normal'
      },
      /**
       * 表单提交成功后的回调函数，普通提交方式 submitType = 'normal'，不会调用
       * @type {Object}
       */
      callback : {

      },
      decorateCfgFields : {
        value : {
          'method' : true,
          'action' : true
        }
      },
      /**
       * 默认的子控件时文本域
       * @type {String}
       */
      defaultChildClass : {
        value : 'form-field'
      },
      /**
       * 使用的标签，为form
       * @type {String}
       */
      elTagName : {
        value : 'form'
      },
      /**
       * 表单按钮
       * @type {Array}
       */
      buttons : {

      },
      /**
       * 按钮栏
       * @type {BUI.Toolbar.Bar}
       */
      buttonBar : {
        value : {

        }
      },
      childContainer : {
        value : '.x-form-fields'
      },
      /**
       * 表单初始化的数据，用于初始化或者表单回滚
       * @type {Object}
       */
      initRecord : {

      },
      /**
       * 表单默认不显示错误，不影响表单分组和表单字段
       * @type {Boolean}
       */
      showError : {
        value : false
      },
      xview : {
        value : FormView
      },
      tpl : {
        value : '<div class="x-form-fields"></div>'
      }
    }
  },{
    xclass : 'form'
  });
  
  Form.View = FormView;
  return Form;
});
/**
 * @fileOverview 表单分组验证
 * @ignore
 */

define('bui/form/groupvalid',['bui/form/valid'],function (require) {
  
  var CLS_ERROR = 'x-form-error',
    Valid = require('bui/form/valid');

   /**
   * @class BUI.Form.GroupValidView
   * @private
   * 表单分组验证视图
   * @extends BUI.Form.ValidView
   */
  function GroupValidView(){

  }

  BUI.augment(GroupValidView,Valid.View,{
    /**
     * 显示一条错误
     * @private
     * @param  {String} msg 错误信息
     */
    showError : function(msg,errorTpl,container){
      var errorMsg = BUI.substitute(errorTpl,{error : msg}),
           el = $(errorMsg);
        el.appendTo(container);
        el.addClass(CLS_ERROR);
    },
    /**
     * 清除错误
     */
    clearErrors : function(){
      var _self = this,
        errorContainer = _self.getErrorsContainer();
      errorContainer.children('.' + CLS_ERROR).remove();
    }
  });

  /**
   * @class BUI.Form.GroupValid
   * 表单分组验证
   * @extends BUI.Form.Valid
   */
  function GroupValid(){

  }

  GroupValid.ATTRS = ATTRS =BUI.merge(true,Valid.ATTRS,{
    events: {
      value : {
        validchange : true,
        change : true
      }
    }
  });

  BUI.augment(GroupValid,Valid,{
    __bindUI : function(){
      var _self = this,
        validEvent =  'validchange change';

      //当不需要显示子控件错误时，仅需要监听'change'事件即可
      _self.on(validEvent,function(ev){
        var sender = ev.target;
        if(sender != this && _self.get('showError')){
          var valid = _self.isChildrenValid();
          if(valid){
            _self.validControl(_self.getRecord());
            valid = _self.isSelfValid();
          }
          if(!valid){
            _self.showErrors();
          }else{
            _self.clearErrors();
          }
        }
      });
    },
    /**
     * 是否通过验证
     */
    isValid : function(){
      var _self = this,
        isValid = _self.isChildrenValid();
      return isValid && _self.isSelfValid();
    },
    /**
     * 进行验证
     */
    valid : function(){
      var _self = this,
        children = _self.get('children');

      BUI.each(children,function(item){
        item.valid();
      });
    },
    /**
     * 所有子控件是否通过验证
     * @protected
     * @return {Boolean} 所有子控件是否通过验证
     */
    isChildrenValid : function(){
      var _self = this,
        children = _self.get('children'),
        isValid = true;

      BUI.each(children,function(item){
        if(!item.isValid()){
          isValid = false;
          return false;
        }
      });
      return isValid;
    },
    isSelfValid : function () {
      return !this.get('error');
    },
    /**
     * 验证控件内容
     * @protected
     * @return {Boolean} 是否通过验证
     */
    validControl : function (record) {
      var _self = this,
        error = _self.getValidError(record);
      _self.set('error',error);
    },
    /**
     * 获取验证出错信息，包括自身和子控件的验证错误信息
     * @return {Array} 出错信息
     */
    getErrors : function(){
      var _self = this,
        children = _self.get('children'),
        showChildError = _self.get('showChildError'),
        validError = null,
        rst = [];
      if(showChildError){
        BUI.each(children,function(child){
          if(child.getErrors){
            rst = rst.concat(child.getErrors());
          }
        });
      }
      //如果所有子控件通过验证，才显示自己的错误
      if(_self.isChildrenValid()){
        validError = _self.get('error');
        if(validError){
          rst.push(validError);
        }
      }
      
      return rst;
    },  
    //设置错误模板时，覆盖子控件设置的错误模板
    _uiSetErrorTpl : function(v){
      var _self = this,
        children = _self.get('children');

      BUI.each(children,function(item){
        item.set('errorTpl',v);
      });
    }
  });

  GroupValid.View = GroupValidView;

  return GroupValid;
});
/**
 * @fileOverview 垂直表单
 * @ignore
 */

define('bui/form/horizontal',['bui/common','bui/form/form'],function (require) {
  var BUI = require('bui/common'),
    Form = require('bui/form/form');

  /**
   * @class BUI.Form.Horizontal
   * 水平表单，字段水平排列
   * @extends BUI.Form.Form
   * 
   */
  var Horizontal = Form.extend({
    /**
     * 获取按钮栏默认的配置项
     * @protected
     * @return {Object} 
     */
    getDefaultButtonBarCfg : function(){
      var _self = this,
        buttons = _self.get('buttons');
      return {
        autoRender : true,
        elCls : 'actions-bar toolbar row',
        tpl : '<div class="form-actions span21 offset3"></div>',
        childContainer : '.form-actions',
        render : _self.get('el'),
        items : buttons,
        defaultChildClass : 'bar-item-button'
      };
    }
  },{
    ATTRS : {
      defaultChildClass : {
        value : 'form-row'
      },
      errorTpl : {
        value : '<span class="valid-text"><span class="estate error"><span class="x-icon x-icon-mini x-icon-error">!</span><em>{error}</em></span></span>'
      },
      elCls : {
        value : 'form-horizontal'
      }
    },
    PARSER : {
      
    }
  },{
    xclass : 'form-horizontal'
  });
  return Horizontal;
});
/**
 * @fileOverview 表单异步请求，异步校验、远程获取数据
 * @ignore
 */

define('bui/form/remote',['bui/common'],function(require) {
  var BUI = require('bui/common');

  /**
   * @class BUI.Form.RemoteView
   * @private
   * 表单异步请求类的视图类
   */
  var RemoteView = function () {
    // body...
  };

  RemoteView.ATTRS = {
    isLoading : {},
    loadingEl : {}
  };

  RemoteView.prototype = {

    /**
     * 获取显示加载状态的容器
     * @protected
     * @template
     * @return {jQuery} 加载状态的容器
     */
    getLoadingContainer : function () {
      // body...
    },
    _setLoading : function () {
      var _self = this,
        loadingEl = _self.get('loadingEl'),
        loadingTpl = _self.get('loadingTpl');
      if(!loadingEl){
        loadingEl = $(loadingTpl).appendTo(_self.getLoadingContainer());
        _self.setInternal('loadingEl',loadingEl);
      }
    },
    _clearLoading : function () {
      var _self = this,
        loadingEl = _self.get('loadingEl');
      if(loadingEl){
        loadingEl.remove();
        _self.setInternal('loadingEl',null);
      }
    },
    _uiSetIsLoading : function (v) {
      var _self = this;
      if(v){
        _self._setLoading();
      }else{
        _self._clearLoading();
      }
    }
  };

  /**
   * @class  BUI.Form.Remote
   * 表单异步请求，所有需要实现异步校验、异步请求的类可以使用。
   */
  var Remote = function(){

  };

  Remote.ATTRS = {

    /**
     * 默认的异步请求配置项：
     * method : 'GET',
     * cache : true,
     * dataType : 'text'
     * @protected
     * @type {Object}
     */
    defaultRemote : {
      value : {
        method : 'GET',
        cache : true,
        callback : function (data) {
          return data;
        }
      }
    },
    /**
     * 异步请求延迟的时间，当字段验证通过后，不马上进行异步请求，等待继续输入，
     * 300（默认）毫秒后，发送请求，在这个过程中，继续输入，则取消异步请求。
     * @type {Object}
     */
    remoteDaly : {
      value : 500
    },
    /**
     * 加载的模板
     * @type {String}
     */
    loadingTpl : {
      view : true,
      value : '<img src="http://img02.taobaocdn.com/tps/i2/T1NU8nXCVcXXaHNz_X-16-16.gif" alt="loading"/>'
    },
    /**
     * 是否正在等待异步请求结果
     * @type {Boolean}
     */
    isLoading : {
      view : true,
      value : false
    },
    /**
     * 异步请求的配置项，参考jQuery的 ajax配置项，如果为字符串则为 url。
     * 请不要覆盖success属性，如果需要回调则使用 callback 属性
     *
     *        {
     *          remote : {
     *            url : 'test.php',
     *            dataType:'json',//默认为字符串
     *            callback : function(data){
     *              if(data.success){ //data为默认返回的值
     *                return ''  //返回值为空时，验证成功
     *              }else{
     *                return '验证失败，XX错误！' //显示返回的字符串为错误
     *              }
     *            }
     *          }
     *        }
     * @type {String|Object}
     */
    remote : {
      setter : function  (v) {
        if(BUI.isString(v)){
          v = {url : v}
        }
        return v;
      }
    },
    /**
     * 异步请求的函数指针，仅内部使用
     * @private
     * @type {Number}
     */
    remoteHandler : {

    },
    events : {
      value : {
        /**
         * 异步请求结束
         * @event
         * @param {Object} e 事件对象
         * @param {*} e.error 是否验证成功
         */
        remotecomplete : false,
        /**
         * 异步请求开始
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.data 发送的对象，是一个键值对，可以修改此对象，附加信息
         */
        remotestart : false
      }
    }
  };

  Remote.prototype = {

    __bindUI : function(){
      var _self = this;

      _self.on('change',function (ev) {
        if(_self.get('remote') && _self.isValid()){
          var data = _self.getRemoteParams();
          _self._startRemote(data);
        }
      });

      _self.on('error',function (ev) {
        if(_self.get('remote')){
          _self._cancelRemote();
        }
      });

    },
    //开始异步请求
    _startRemote : function(data){
      var _self = this,
        remoteHandler = _self.get('remoteHandler'),
        remoteDaly = _self.get('remoteDaly');
      if(remoteHandler){
        //如果前面已经发送过异步请求，取消掉
        _self._cancelRemote(remoteHandler);
      }
      //使用闭包进行异步请求
      function dalayFunc(){
        _self._remoteValid(data,remoteHandler);
        _self.set('isLoading',true);
      }
      remoteHandler = setTimeout(dalayFunc,remoteDaly);
      _self.setInternal('remoteHandler',remoteHandler);
      
    },
    //异步请求
    _remoteValid : function(data,remoteHandler){
      var _self = this,
        remote = _self.get('remote'),
        defaultRemote = _self.get('defaultRemote'),
        options = BUI.merge(defaultRemote,remote,{data : data});

      function complete (error,data) {
        //确认当前返回的错误是当前请求的结果，防止覆盖后面的请求
        if(remoteHandler == _self.get('remoteHandler')){
          _self.fire('remotecomplete',{error : error,data : data});
          _self.set('isLoading',false);
          _self.setInternal('remoteHandler',null);
        } 
      }

      options.success = function (data) {
        var callback = options.callback,
          error = callback(data);
        complete(error,data);
      };

      options.error = function (jqXHR, textStatus,errorThrown){
        complete(errorThrown);
      };

      _self.fire('remotestart',{data : data});
      $.ajax(options);
    },
    /**
     * 获取异步请求的键值对
     * @template
     * @protected
     * @return {Object} 远程验证的参数，键值对
     */
    getRemoteParams : function() {

    },
    //取消异步请求
    _cancelRemote : function(remoteHandler){
      var _self = this;

      remoteHandler = remoteHandler || _self.get('remoteHandler');
      if(remoteHandler){
        clearTimeout(remoteHandler);
        _self.setInternal('remoteHandler',null);
      }
      _self.set('isLoading',false);
    }

  };

  Remote.View = RemoteView;
  return Remote;
});
/**
 * @fileOverview 表单里的一行元素
 * @ignore
 */

define('bui/form/row',['bui/common','bui/form/fieldcontainer'],function (require) {
  var BUI = require('bui/common'),
    FieldContainer = require('bui/form/fieldcontainer');

  /**
   * @class BUI.Form.Row
   * 表单行
   * @extends BUI.Form.FieldContainer
   */
  var Row = FieldContainer.extend({

  },{
    ATTRS : {
      elCls : {
        value : 'row'
      },
      defaultChildCfg:{
        value : {
          tpl : ' <label class="control-label">{label}</label>\
                <div class="controls">\
                </div>',
          childContainer : '.controls',
          showOneError : true,
          controlContainer : '.controls',
          elCls : 'control-group span8',
          errorTpl : '<span class="valid-text"><span class="estate error"><span class="x-icon x-icon-mini x-icon-error">!</span><em>{error}</em></span></span>'
        }
        
      },
      defaultChildClass : {
        value : 'form-field-text'
      }
    }
  },{
    xclass:'form-row'
  });

  return Row;
});
/**
 * @fileOverview 验证规则
 * @ignore
 */

define('bui/form/rule',['bui/common'],function (require) {

  var BUI = require('bui/common');
  /**
   * @class BUI.Form.Rule
   * 验证规则
   * @extends BUI.Base
   */
  var Rule = function (config){
    Rule.superclass.constructor.call(this,config);
  }

  BUI.extend(Rule,BUI.Base);

  Rule.ATTRS = {
    /**
     * 规则名称
     * @type {String}
     */
    name : {

    },
    /**
     * 验证失败信息
     * @type {String}
     */
    msg : {

    },
    /**
     * 验证函数
     * @type {Function}
     */
    validator : {
      value : function(value,baseValue,formatedMsg,control){

      }
    }
  }

  //是否通过验证
  function valid(self,value,baseValue,msg,control){
    var _self = self,
      validator = _self.get('validator'),
      formatedMsg = formatError(self,baseValue,msg),
      valid = true;
    value = value == null ? '' : value;
    return validator.call(_self,value,baseValue,formatedMsg,control);
  }

  function parseParams(values){

    if(values == null){
      return {};
    }

    if($.isPlainObject(values)){
      return values;
    }

    var ars = values,
        rst = {};
    if(BUI.isArray(values)){

      for(var i = 0; i < ars.length; i++){
        rst[i] = ars[i];
      }
      return rst;
    }

    return {'0' : values};
  }

  function formatError(self,values,msg){
    var ars = parseParams(values); 
    msg = msg || self.get('msg');
    return BUI.substitute(msg,ars);
  }

  BUI.augment(Rule,{

    /**
     * 是否通过验证，该函数可以接收多个参数
     * @param  {*}  [value] 验证的值
     * @param  {*} [baseValue] 跟传入值相比较的值
     * @param {String} [msg] 验证失败后的错误信息，显示的错误中可以显示 baseValue中的信息
     * @param {BUI.Form.Field|BUI.Form.Group} [control] 发生验证的控件
     * @return {String}   通过验证返回 null ,未通过验证返回错误信息
     * 
     *         var msg = '输入数据必须在{0}和{1}之间！',
     *           rangeRule = new Rule({
     *             name : 'range',
     *             msg : msg,
     *             validator :function(value,range,msg){
     *               var min = range[0], //此处我们把range定义为数组，也可以定义为{min:0,max:200},那么在传入校验时跟此处一致即可
     *                 max = range[1];   //在错误信息中，使用用 '输入数据必须在{min}和{max}之间！',验证函数中的字符串已经进行格式化
     *               if(value < min || value > max){
     *                 return false;
     *               }
     *               return true;
     *             }
     *           });
     *         var range = [0,200],
     *           val = 100,
     *           error = rangeRule.valid(val,range);//msg可以在此处重新传入
     *         
     */
    valid : function(value,baseValue,msg,control){
      var _self = this;
      return valid(_self,value,baseValue,msg,control);
    }
  });

  return Rule;


});
/**
 * @fileOverview 验证集合
 * @ignore
 */

define('bui/form/rules',['bui/form/rule'],function (require) {

  var Rule = require('bui/form/rule');

  function toNumber(value){
    return parseFloat(value);
  }

  function toDate(value){
    return BUI.Date.parse(value);
  }

  var ruleMap = {

  };

  /**
   * @class BUI.Form.Rules
   * @singleton
   * 表单验证的验证规则管理器
   */
  var rules = {
    /**
     * 添加验证规则
     * @param {Object|BUI.Form.Rule} rule 验证规则配置项或者验证规则对象
     * @param  {String} name 规则名称
     */
    add : function(rule){
      var name;
      if($.isPlainObject(rule)){
        name = rule.name;
        ruleMap[name] = new Rule(rule);        
      }else if(rule.get){
        name = rule.get('name'); 
        ruleMap[name] = rule;
      }
      return ruleMap[name];
    },
    /**
     * 删除验证规则
     * @param  {String} name 规则名称
     */
    remove : function(name){
      delete ruleMap[name];
    },
    /**
     * 获取验证规则
     * @param  {String} name 规则名称
     * @return {BUI.Form.Rule}  验证规则
     */
    get : function(name){
      return ruleMap[name];
    },
    /**
     * 验证指定的规则
     * @param  {String} name 规则类型
     * @param  {*} value 验证值
     * @param  {*} [baseValue] 用于验证的基础值
     * @param  {String} [msg] 显示错误的模板
     * @param  {BUI.Form.Field|BUI.Form.Group} [control] 显示错误的模板
     * @return {String} 通过验证返回 null,否则返回错误信息
     */
    valid : function(name,value,baseValue,msg,control){
      var rule = rules.get(name);
      if(rule){
        return rule.valid(value,baseValue,msg,control);
      }
      return null;
    },
    /**
     * 验证指定的规则
     * @param  {String} name 规则类型
     * @param  {*} values 验证值
     * @param  {*} [baseValue] 用于验证的基础值
     * @param  {BUI.Form.Field|BUI.Form.Group} [control] 显示错误的模板
     * @return {Boolean} 是否通过验证
     */
    isValid : function(name,value,baseValue,control){
      return rules.valid(name,value,baseValue,control) == null;
    }
  };
  
  /**
   * 非空验证,会对值去除空格
   * <ol>
   *  <li>name: required</li>
   *  <li>msg: 不能为空！</li>
   *  <li>required: boolean 类型</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var required = rules.add({
    name : 'required',
    msg : '不能为空！',
    validator : function(value,required,formatedMsg){
      if(required !== false && /^\s*$/.test(value)){
        return formatedMsg;
      }
    }
  });

  /**
   * 相等验证
   * <ol>
   *  <li>name: equalTo</li>
   *  <li>msg: 两次输入不一致！</li>
   *  <li>equalTo: 一个字符串，id（#id_name) 或者 name</li>
   * </ol>
   *         {
   *           equalTo : '#password'
   *         }
   *         //或者
   *         {
   *           equalTo : 'password'
   *         } 
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var equalTo = rules.add({
    name : 'equalTo',
    msg : '两次输入不一致！',
    validator : function(value,equalTo,formatedMsg){
      var el = $(equalTo);
      if(el.length){
        equalTo = el.val();
      } 
      return value === equalTo ? undefined : formatedMsg;
    }
  });


  /**
   * 不小于验证
   * <ol>
   *  <li>name: min</li>
   *  <li>msg: 输入值不能小于{0}！</li>
   *  <li>min: 数字，字符串</li>
   * </ol>
   *         {
   *           min : 5
   *         }
   *         //字符串
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var min = rules.add({
    name : 'min',
    msg : '输入值不能小于{0}！',
    validator : function(value,min,formatedMsg){
      if(value !== '' && toNumber(value) < toNumber(min)){
        return formatedMsg;
      }
    }
  });

  /**
   * 不小于验证,用于数值比较
   * <ol>
   *  <li>name: max</li>
   *  <li>msg: 输入值不能大于{0}！</li>
   *  <li>max: 数字、字符串</li>
   * </ol>
   *         {
   *           max : 100
   *         }
   *         //字符串
   *         {
   *           max : '100'
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var max = rules.add({
    name : 'max',
    msg : '输入值不能大于{0}！',
    validator : function(value,max,formatedMsg){
      if(value !== '' && toNumber(value) > toNumber(max)){
        return formatedMsg;
      }
    }
  });

  /**
   * 输入长度验证，必须是指定的长度
   * <ol>
   *  <li>name: length</li>
   *  <li>msg: 输入值长度为{0}！</li>
   *  <li>length: 数字</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var length = rules.add({
    name : 'length',
    msg : '输入值长度为{0}！',
    validator : function(value,len,formatedMsg){
      if(value != null){
        value = $.trim(value.toString());
        if(len != value.length){
          return formatedMsg;
        }
      }
    }
  });
  /**
   * 最短长度验证,会对值去除空格
   * <ol>
   *  <li>name: minlength</li>
   *  <li>msg: 输入值长度不小于{0}！</li>
   *  <li>minlength: 数字</li>
   * </ol>
   *         {
   *           minlength : 5
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var minlength = rules.add({
    name : 'minlength',
    msg : '输入值长度不小于{0}！',
    validator : function(value,min,formatedMsg){
      if(value != null){
        value = $.trim(value.toString());
        var len = value.length;
        if(len < min){
          return formatedMsg;
        }
      }
    }
  });

  /**
   * 最短长度验证,会对值去除空格
   * <ol>
   *  <li>name: maxlength</li>
   *  <li>msg: 输入值长度不大于{0}！</li>
   *  <li>maxlength: 数字</li>
   * </ol>
   *         {
   *           maxlength : 10
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}   
   */
  var maxlength = rules.add({
    name : 'maxlength',
    msg : '输入值长度不大于{0}！',
    validator : function(value,max,formatedMsg){
      if(value){
        value = $.trim(value.toString());
        var len = value.length;
        if(len > max){
          return formatedMsg;
        }
      }
    }
  });

  /**
   * 正则表达式验证,如果正则表达式为空，则不进行校验
   * <ol>
   *  <li>name: regexp</li>
   *  <li>msg: 输入值不符合{0}！</li>
   *  <li>regexp: 正则表达式</li>
   * </ol> 
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var regexp = rules.add({
    name : 'regexp',
    msg : '输入值不符合{0}！',
    validator : function(value,regexp,formatedMsg){
      if(regexp){
        return regexp.test(value) ? undefined : formatedMsg;
      }
    }
  });

  /**
   * 邮箱验证,会对值去除空格，无数据不进行校验
   * <ol>
   *  <li>name: email</li>
   *  <li>msg: 不是有效的邮箱地址！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var email = rules.add({
    name : 'email',
    msg : '不是有效的邮箱地址！',
    validator : function(value,baseValue,formatedMsg){
      value = $.trim(value);
      if(value){
        return /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(value) ? undefined : formatedMsg;
      }
    }
  });

  /**
   * 日期验证，会对值去除空格，无数据不进行校验，
   * 如果传入的值不是字符串，而是数字，则认为是有效值
   * <ol>
   *  <li>name: date</li>
   *  <li>msg: 不是有效的日期！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var date = rules.add({
    name : 'date',
    msg : '不是有效的日期！',
    validator : function(value,baseValue,formatedMsg){
      if(BUI.isNumber(value)){ //数字认为是日期
        return;
      }
      if(BUI.isDate(value)){
        return;
      }
      value = $.trim(value);
      if(value){
        return BUI.Date.isDateString(value) ? undefined : formatedMsg;
      }
    }
  });

  /**
   * 不小于验证
   * <ol>
   *  <li>name: minDate</li>
   *  <li>msg: 输入日期不能小于{0}！</li>
   *  <li>minDate: 日期，字符串</li>
   * </ol>
   *         {
   *           minDate : '2001-01-01';
   *         }
   *         //字符串
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var minDate = rules.add({
    name : 'minDate',
    msg : '输入日期不能小于{0}！',
    validator : function(value,minDate,formatedMsg){
      if(value){
        var date = toDate(value);
        if(date && date < toDate(minDate)){
           return formatedMsg;
        }
      }
    }
  });

  /**
   * 不小于验证,用于数值比较
   * <ol>
   *  <li>name: maxDate</li>
   *  <li>msg: 输入值不能大于{0}！</li>
   *  <li>maxDate: 日期、字符串</li>
   * </ol>
   *         {
   *           maxDate : '2001-01-01';
   *         }
   *         //或日期
   *         {
   *           maxDate : new Date('2001-01-01');
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var maxDate = rules.add({
    name : 'maxDate',
    msg : '输入日期不能大于{0}！',
    validator : function(value,maxDate,formatedMsg){
      if(value){
        var date = toDate(value);
        if(date && date > toDate(maxDate)){
           return formatedMsg;
        }
      }
    }
  });
  /**
   * 数字验证，会对值去除空格，无数据不进行校验
   * 允许千分符，例如： 12,000,000的格式
   * <ol>
   *  <li>name: number</li>
   *  <li>msg: 不是有效的数字！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var number = rules.add({
    name : 'number',
    msg : '不是有效的数字！',
    validator : function(value,baseValue,formatedMsg){
      if(BUI.isNumber(value)){
        return;
      }
      value = value.replace(/\,/g,'');
      return !isNaN(value) ? undefined : formatedMsg;
    }
  });

  //测试范围
  function testRange (baseValue,curVal,prevVal) {
    var allowEqual = baseValue && (baseValue.equals !== false);

    if(allowEqual){
      return prevVal <= curVal;
    }

    return prevVal < curVal;
  }
  function isEmpty(value){
    return value == '' || value == null;
  }
  //测试是否后面的数据大于前面的
  function rangeValid(value,baseValue,formatedMsg,group){
    var fields = group.getFields(),
      valid = true;
    for(var i = 1; i < fields.length ; i ++){
      var cur = fields[i],
        prev = fields[i-1],
        curVal,
        prevVal;
      if(cur && prev){
        curVal = cur.get('value');
        prevVal = prev.get('value');
        if(!isEmpty(curVal) && !isEmpty(prevVal) && !testRange(baseValue,curVal,prevVal)){
          valid = false;
          break;
        }
      }
    }
    if(!valid){
      return formatedMsg;
    }
    return null;
  }
  /**
   * 起始结束日期验证，前面的日期不能大于后面的日期
   * <ol>
   *  <li>name: dateRange</li>
   *  <li>msg: 起始日期不能大于结束日期！</li>
   *  <li>dateRange: 可以使true或者{equals : fasle}，标示是否允许相等</li>
   * </ol>
   *         {
   *           dateRange : true
   *         }
   *         {
   *           dateRange : {equals : false}
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}   
   */
  var dateRange = rules.add({
    name : 'dateRange',
    msg : '结束日期不能小于起始日期！',
    validator : rangeValid
  });

  /**
   * 数字范围
   * <ol>
   *  <li>name: numberRange</li>
   *  <li>msg: 起始数字不能大于结束数字！</li>
   *  <li>numberRange: 可以使true或者{equals : fasle}，标示是否允许相等</li>
   * </ol>
   *         {
   *           numberRange : true
   *         }
   *         {
   *           numberRange : {equals : false}
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}   
   */
  var numberRange = rules.add({
    name : 'numberRange',
    msg : '结束数字不能小于开始数字！',
    validator : rangeValid
  });

  function getFieldName (self) {
    var firstField = self.getFieldAt(0);
    if(firstField){
      return firstField.get('name');
    }
    return '';
  }

  function testCheckRange(value,range){
    if(!BUI.isArray(range)){
      range = [range];
    }
    //不存在值
    if(!value || !range.length){
      return false;
    }
    var len = !value ? 0 : !BUI.isArray(value) ? 1 : value.length;
    //如果只有一个限定值
    if(range.length == 1){
      var number = range [0];
      if(!number){//range = [0],则不必选
        return true;
      }
      if(number > len){
        return false;
      }
    }else{
      var min = range [0],
        max = range[1];
      if(min > len || max < len){
        return false;
      }
    }
    return true;
  }

  /**
   * 勾选的范围
   * <ol>
   *  <li>name: checkRange</li>
   *  <li>msg: 必须选中{0}项！</li>
   *  <li>checkRange: 勾选的项范围</li>
   * </ol>
   *         //至少勾选一项
   *         {
   *           checkRange : 1
   *         }
   *         //只能勾选两项
   *         {
   *           checkRange : [2,2]
   *         }
   *         //可以勾选2-4项
   *         {
   *           checkRange : [2,4
   *           ]
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}   
   */
  var checkRange = rules.add({
    name : 'checkRange',
    msg : '必须选中{0}项！',
    validator : function(record,baseValue,formatedMsg,group){
      var name = getFieldName(group),
        value,
        range = baseValue;
        
      if(name && range){
        value = record[name];
        if(!testCheckRange(value,range)){
          return formatedMsg;
        }
      }
      return null;
    }
  });
  

  return rules;
});
/**
 * @fileOverview 输入提示信息
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/form/tips',['bui/common','bui/overlay'],function (require) {

  var BUI = require('bui/common'),
    prefix = BUI.prefix,
    Overlay = require('bui/overlay').Overlay,
    FIELD_TIP = 'data-tip',
    CLS_TIP_CONTAINER = prefix + 'form-tip-container';

  /**
   * 表单提示信息类
   * xclass:'form-tip'
   * @class BUI.Form.TipItem
   * @extends BUI.Overlay.Overlay
   */
  var tipItem = Overlay.extend(
  /**
   * @lends BUI.Form.TipItem.prototype
   * @ignore
   */
  {
    initializer : function(){
      var _self = this,
        render = _self.get('render');
      if(!render){
        var parent = $(_self.get('trigger')).parent();
        _self.set('render',parent);
      }
    },
    renderUI : function(){
      var _self = this;

      _self.resetVisible();
      
    },
    /**
     * 重置是否显示
     */
    resetVisible : function(){
      var _self = this,
        triggerEl = $(_self.get('trigger'));

      if(triggerEl.val()){//如果默认有文本则不显示，否则显示
        _self.set('visible',false);
      }else{
        _self.set('align',{
          node:$(_self.get('trigger')),
          points: ['cl','cl']
        });
        _self.set('visible',true);
      }
    },
    bindUI : function(){
      var _self = this,
        triggerEl = $(_self.get('trigger'));

      _self.get('el').on('click',function(){
        _self.hide();
        triggerEl.focus();
      });
      triggerEl.on('click focus',function(){
        _self.hide();
      });

      triggerEl.on('blur',function(){
        _self.resetVisible();
      });
    }
  },{
    ATTRS : 
    /**
     * @lends BUI.Form.TipItem#
     * @ignore
     */
    {
      /**
       * 提示的输入框 
       * @cfg {String|HTMLElement|jQuery} trigger
       */
      /**
       * 提示的输入框
       * @type {String|HTMLElement|jQuery}
       */
      trigger:{

      },
      /**
       * 提示文本
       * @cfg {String} text
       */
      /**
       * 提示文本
       * @type {String}
       */
      text : {

      },
      /**
       * 提示文本上显示的icon样式
       * @cfg {String} iconCls
       *     iconCls : icon-ok
       */
      /**
       * 提示文本上显示的icon样式
       * @type {String}
       *     iconCls : icon-ok
       */
      iconCls:{

      },
      /**
       * 默认的模版
       * @type {String}
       * @default '<span class="{iconCls}"></span><span class="tip-text">{text}</span>'
       */
      tpl:{
        value:'<span class="{iconCls}"></span><span class="tip-text">{text}</span>'
      }
    }
  },{
    xclass : 'form-tip'
  });

  /**
   * 表单提示信息的管理类
   * @class BUI.Form.Tips
   * @extends BUI.Base
   */
  var Tips = function(config){
    if (this.constructor !== Tips){
      return new Tips(config);
    }

    Tips.superclass.constructor.call(this,config);
    this._init();
  };

  Tips.ATTRS = 
  /**
   * @lends BUI.Form.Tips
   * @ignore
   */
  {

    /**
     * 表单的选择器
     * @cfg {String|HTMLElement|jQuery} form
     */
    /**
     * 表单的选择器
     * @type {String|HTMLElement|jQuery}
     */
    form : {

    },
    /**
     * 表单提示项对象 {@link BUI.Form.TipItem}
     * @readOnly
     * @type {Array} 
     */
    items : {
      value:[]
    }
  };

  BUI.extend(Tips,BUI.Base);

  BUI.augment(Tips,{
    _init : function(){
      var _self = this,
        form = $(_self.get('form'));
      if(form.length){
        BUI.each($.makeArray(form[0].elements),function(elem){
          var tipConfig = $(elem).attr(FIELD_TIP);
          if(tipConfig){
            _self._initFormElement(elem,$.parseJSON(tipConfig));
          }
        });
        form.addClass(CLS_TIP_CONTAINER);
      }
    },
    _initFormElement : function(element,config){
      if(config){
        config.trigger = element;
        //config.render = this.get('form');
      }
      var _self = this,
        items = _self.get('items'),
        item = new tipItem(config);
      items.push(item);
    },
    /**
     * 获取提示项
     * @param {String} name 字段的名称
     * @return {BUI.Form.TipItem} 提示项
     */
    getItem : function(name){
      var _self = this,
        items = _self.get('items'),
        result = null;
      BUI.each(items,function(item){

        if($(item.get('trigger')).attr('name') === name){
          result = item;
          return false;
        }

      });

      return result;
    },
    /**
     * 重置所有提示的可视状态
     */
    resetVisible : function(){
      var _self = this,
        items = _self.get('items');

      BUI.each(items,function(item){
        item.resetVisible();
      });
    },
    /**
     * 生成 表单提示
     */
    render:function(){
       var _self = this,
        items = _self.get('items');
      BUI.each(items,function(item){
        item.render();
      });
    },
    /**
     * 删除所有提示
     */
    destroy:function(){
      var _self = this,
        items = _self.get(items);

      BUI.each(items,function(item){
        item.destroy();
      });
    }
  });
  
  Tips.Item = tipItem;
  return Tips;

});
/**
 * @fileOverview 表单验证
 * @ignore
 */

define('bui/form/valid',['bui/common','bui/form/rules'],function (require) {

  var BUI = require('bui/common'),
    Rules = require('bui/form/rules');

  /**
   * @class BUI.Form.ValidView
   * @private
   * 对控件内的字段域进行验证的视图
   */
  var ValidView = function(){

  };

  ValidView.prototype = {
    /**
     * 获取错误信息的容器
     * @protected
     * @return {jQuery} 
     */
    getErrorsContainer : function(){
      var _self = this,
        errorContainer = _self.get('errorContainer');
      if(errorContainer){
        if(BUI.isString(errorContainer)){
          return _self.get('el').find(errorContainer);
        }
        return errorContainer;
      }
      return _self.getContentElement();
    },
    /**
     * 显示错误
     */
    showErrors : function(errors){
      var _self = this,
        errorsContainer = _self.getErrorsContainer(),
        errorTpl = _self.get('errorTpl');     
      _self.clearErrors(); 

      if(!_self.get('showError')){
        return ;
      }
      //如果仅显示第一条错误记录
      if(_self.get('showOneError')){
        if(errors && errors.length){
          _self.showError(errors[0],errorTpl,errorsContainer);
        }
        return ;
      }

      BUI.each(errors,function(error){
        if(error){
          _self.showError(error,errorTpl,errorsContainer);
        }
      });
    },
    /**
     * 显示一条错误
     * @protected
     * @template
     * @param  {String} msg 错误信息
     */
    showError : function(msg,errorTpl,container){

    },
    /**
     * @protected
     * @template
     * 清除错误
     */
    clearErrors : function(){

    }
  };
  /**
   * 对控件内的字段域进行验证
   * @class  BUI.Form.Valid
   */
  var Valid = function(){

  };

  Valid.ATTRS = {

    /**
     * 控件固有的验证规则，例如，日期字段域，有的date类型的验证
     * @protected
     * @type {Object}
     */
    defaultRules : {
      value : {}
    },
    /**
     * 控件固有的验证出错信息，例如，日期字段域，不是有效日期的验证字段
     * @protected
     * @type {Object}
     */
    defaultMessages : {
      value : {}
    },
    /**
     * 验证规则
     * @type {Object}
     */
    rules : {
      value : {}
    },
    /**
     * 验证信息集合
     * @type {Object}
     */
    messages : {
      value : {}
    },
    /**
     * 验证器 验证容器内的表单字段是否通过验证
     * @type {Function}
     */
    validator : {

    },
    /**
     * 存放错误信息容器的选择器，如果未提供则默认显示在控件中
     * @private
     * @type {String}
     */
    errorContainer : {
      view : true
    },
    /**
     * 显示错误信息的模板
     * @type {Object}
     */
    errorTpl : {
      view : true,
      value : '<span class="x-field-error"><span class="x-icon x-icon-mini x-icon-error">!</span><label class="x-field-error-text">{error}</label></span>'
    },
    /**
     * 显示错误
     * @type {Boolean}
     */
    showError : {
      view : true,
      value : true
    },
    /**
     * 是否仅显示一个错误
     * @type {Boolean}
     */
    showOneError: {

    },
    /**
     * 错误信息，这个验证错误不包含子控件的验证错误
     * @type {String}
     */
    error : {

    }
  };

  Valid.prototype = {
    /**
     * 是否通过验证
     * @template
     * @return {Boolean} 是否通过验证
     */
    isValid : function(){

    },
    /**
     * 进行验证
     */
    valid : function(){

    },
    /**
     * @protected
     * @template
     * 验证自身的规则和验证器
     */
    validControl : function(){

    },
    //验证规则
    validRules : function(rules,value){
      var _self = this,
        messages = _self._getValidMessages(),
        error = null;

      for(var name in rules){
        if(rules.hasOwnProperty(name)){
          var baseValue = rules[name];
          error = Rules.valid(name,value,baseValue,messages[name],_self);
          if(error){
            break;
          }
        }
      }
      return error;
    },
    //获取验证错误信息
    _getValidMessages : function(){
      var _self = this,
        defaultMessages = _self.get('defaultMessages'),
        messages = _self.get('messages');
      return BUI.merge(defaultMessages,messages);
    },
    /**
     * @template
     * @protected
     * 控件本身是否通过验证，不考虑子控件
     * @return {String} 验证的错误
     */
    getValidError : function(value){
      var _self = this,
        validator = _self.get('validator'),
        error = null;

      error = _self.validRules(_self.get('defaultRules'),value) || _self.validRules(_self.get('rules'),value);

      if(!error){
        if(_self.parseValue){
          value = _self.parseValue(value);
        }
        error = validator ? validator.call(this,value) : '';
      }

      return error;
    },
    /**
     * 获取验证出错信息，包括自身和子控件的验证错误信息
     * @return {Array} 出错信息
     */
    getErrors : function(){

    },
    /**
     * 显示错误
     * @param {Array} 显示错误
     */
    showErrors : function(errors){
      var _self = this,
        errors = errors || _self.getErrors();
      _self.get('view').showErrors(errors);
    },
    /**
     * 清除错误
     */
    clearErrors : function(){
      var _self = this,
        children = _self.get('children');

      BUI.each(children,function(item){
        item.clearErrors && item.clearErrors();
      });
      _self.set('error',null);
      _self.get('view').clearErrors();
    },
    /**
     * 添加验证规则
     * @param {String} name 规则名称
     * @param {*} [value] 规则进行校验的进行对比的值，如max : 10 
     * @param {String} [message] 出错信息,可以使模板
     * <ol>
     *   <li>如果 value 是单个值，例如最大值 value = 10,那么模板可以写成： '输入值不能大于{0}!'</li>
     *   <li>如果 value 是个复杂对象，数组时，按照索引，对象时按照 key 阻止。如：value= {max:10,min:5} ，则'输入值不能大于{max},不能小于{min}'</li>
     * </ol>
     *         var field = form.getField('name');
     *         field.addRule('required',true);
     *
     *         field.addRule('max',10,'不能大于{0}');
     */
    addRule : function(name,value,message){
      var _self = this,
        rules = _self.get('rules'),
        messages = _self.get('messages');
      rules[name] = value;
      if(message){
        messages[name] = message;
      }
      
    },
    /**
     * 添加多个验证规则
     * @param {Object} rules 多个验证规则
     * @param {Object} [messages] 验证规则的出错信息
     *         var field = form.getField('name');
     *         field.addRules({
     *           required : true,
     *           max : 10
     *         });
     */
    addRules : function(rules,messages){
      var _self = this;

      BUI.each(rules,function(value,name){
        var msg = messages ? messages[name] : null;
        _self.addRule(name,value,msg);
      });
    },
    /**
     * 移除指定名称的验证规则
     * @param  {String} name 验证规则名称
     *         var field = form.getField('name');
     *         field.remove('required');   
     */
    removeRule : function(name){
      var _self = this,
        rules = _self.get('rules');
      delete rules[name];
    },
    /**
     * 清理验证规则
     */
    clearRules : function(){
      var _self = this;
      _self.set('rules',{});
    }
  };

  Valid.View = ValidView;
  return Valid;
});
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
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
//不使用seajs时，模拟seajs的几个方法
//define,use,require

var BUI = BUI || {};
seajs || (function () {
  var toString = Object.prototype.toString;

  function module(id,factory){
    this.id = id;
    this.factory = factory;
    this.isInit = false;
  }

  module.init = function(){
    this.result = this.factory(require);
  }

  window.__module = {};

  function require(id){

  }

  function saveModule(id,factory){
    window.__module[id] = {

    };
  }
  function getModule(id){
    var factory = window.__module[id];
    if(factory){
      return factory();
    }
  }
  window.define = window.define || function(id,factory){
    saveModule(id,factory);
  };

  BUI.use = function(ids,factory){
    
  };

})();
/**
 * @preserve SeaJS - A Module Loader for the Web
 * v1.3.0 | seajs.org | MIT Licensed
 */


/**
 * Base namespace for the framework.
 */
this.seajs = { _seajs: this.seajs }


/**
 * The version of the framework. It will be replaced with "major.minor.patch"
 * when building.
 */
seajs.version = '1.3.0'


/**
 * The private utilities. Internal use only.
 */
seajs._util = {}


/**
 * The private configuration data. Internal use only.
 */
seajs._config = {

  /**
   * Debug mode. It will be turned off automatically when compressing.
   */
  debug: '%DEBUG%',

  /**
   * Modules that are needed to load before all other modules.
   */
  preload: []
}

/**
 * The minimal language enhancement
 */
;(function(util) {

  var toString = Object.prototype.toString
  var AP = Array.prototype


  util.isString = function(val) {
    return toString.call(val) === '[object String]'
  }


  util.isFunction = function(val) {
    return toString.call(val) === '[object Function]'
  }


  util.isRegExp = function(val) {
    return toString.call(val) === '[object RegExp]'
  }


  util.isObject = function(val) {
    return val === Object(val)
  }


  util.isArray = Array.isArray || function(val) {
    return toString.call(val) === '[object Array]'
  }


  util.indexOf = AP.indexOf ?
      function(arr, item) {
        return arr.indexOf(item)
      } :
      function(arr, item) {
        for (var i = 0; i < arr.length; i++) {
          if (arr[i] === item) {
            return i
          }
        }
        return -1
      }


  var forEach = util.forEach = AP.forEach ?
      function(arr, fn) {
        arr.forEach(fn)
      } :
      function(arr, fn) {
        for (var i = 0; i < arr.length; i++) {
          fn(arr[i], i, arr)
        }
      }


  util.map = AP.map ?
      function(arr, fn) {
        return arr.map(fn)
      } :
      function(arr, fn) {
        var ret = []
        forEach(arr, function(item, i, arr) {
          ret.push(fn(item, i, arr))
        })
        return ret
      }


  util.filter = AP.filter ?
      function(arr, fn) {
        return arr.filter(fn)
      } :
      function(arr, fn) {
        var ret = []
        forEach(arr, function(item, i, arr) {
          if (fn(item, i, arr)) {
            ret.push(item)
          }
        })
        return ret
      }


  var keys = util.keys = Object.keys || function(o) {
    var ret = []

    for (var p in o) {
      if (o.hasOwnProperty(p)) {
        ret.push(p)
      }
    }

    return ret
  }


  util.unique = function(arr) {
    var o = {}

    forEach(arr, function(item) {
      o[item] = 1
    })

    return keys(o)
  }


  util.now = Date.now || function() {
    return new Date().getTime()
  }

})(seajs._util)

/**
 * The tiny console
 */
;(function(util) {

  /**
   * The safe wrapper of console.log/error/...
   */
  util.log = function() {
    if (typeof console === 'undefined') return

    var args = Array.prototype.slice.call(arguments)

    var type = 'log'
    var last = args[args.length - 1]
    console[last] && (type = args.pop())

    // Only show log info in debug mode
    if (type === 'log' && !seajs.debug) return

    if (console[type].apply) {
      console[type].apply(console, args)
      return
    }

    // See issue#349
    var length = args.length
    if (length === 1) {
      console[type](args[0])
    }
    else if (length === 2) {
      console[type](args[0], args[1])
    }
    else if (length === 3) {
      console[type](args[0], args[1], args[2])
    }
    else {
      console[type](args.join(' '))
    }
  }

})(seajs._util)

/**
 * Path utilities
 */
;(function(util, config, global) {

  var DIRNAME_RE = /.*(?=\/.*$)/
  var MULTIPLE_SLASH_RE = /([^:\/])\/\/+/g
  var FILE_EXT_RE = /\.(?:css|js)$/
  var ROOT_RE = /^(.*?\w)(?:\/|$)/


  /**
   * Extracts the directory portion of a path.
   * dirname('a/b/c.js') ==> 'a/b/'
   * dirname('d.js') ==> './'
   * @see http://jsperf.com/regex-vs-split/2
   */
  function dirname(path) {
    var s = path.match(DIRNAME_RE)
    return (s ? s[0] : '.') + '/'
  }


  /**
   * Canonicalizes a path.
   * realpath('./a//b/../c') ==> 'a/c'
   */
  function realpath(path) {
    MULTIPLE_SLASH_RE.lastIndex = 0

    // 'file:///a//b/c' ==> 'file:///a/b/c'
    // 'http://a//b/c' ==> 'http://a/b/c'
    if (MULTIPLE_SLASH_RE.test(path)) {
      path = path.replace(MULTIPLE_SLASH_RE, '$1\/')
    }

    // 'a/b/c', just return.
    if (path.indexOf('.') === -1) {
      return path
    }

    var original = path.split('/')
    var ret = [], part

    for (var i = 0; i < original.length; i++) {
      part = original[i]

      if (part === '..') {
        if (ret.length === 0) {
          throw new Error('The path is invalid: ' + path)
        }
        ret.pop()
      }
      else if (part !== '.') {
        ret.push(part)
      }
    }

    return ret.join('/')
  }


  /**
   * Normalizes an uri.
   */
  function normalize(uri) {
    uri = realpath(uri)
    var lastChar = uri.charAt(uri.length - 1)

    if (lastChar === '/') {
      return uri
    }

    // Adds the default '.js' extension except that the uri ends with #.
    // ref: http://jsperf.com/get-the-last-character
    if (lastChar === '#') {
      uri = uri.slice(0, -1)
    }
    else if (uri.indexOf('?') === -1 && !FILE_EXT_RE.test(uri)) {
      uri += '.js'
    }

    // Remove ':80/' for bug in IE
    if (uri.indexOf(':80/') > 0) {
      uri = uri.replace(':80/', '/')
    }

    return uri
  }


  /**
   * Parses alias in the module id. Only parse the first part.
   */
  function parseAlias(id) {
    // #xxx means xxx is already alias-parsed.
    if (id.charAt(0) === '#') {
      return id.substring(1)
    }

    var alias = config.alias

    // Only top-level id needs to parse alias.
    if (alias && isTopLevel(id)) {
      var parts = id.split('/')
      var first = parts[0]

      if (alias.hasOwnProperty(first)) {
        parts[0] = alias[first]
        id = parts.join('/')
      }
    }

    return id
  }


  var mapCache = {}

  /**
   * Converts the uri according to the map rules.
   */
  function parseMap(uri) {
    // map: [[match, replace], ...]
    var map = config.map || []
    if (!map.length) return uri

    var ret = uri

    // Apply all matched rules in sequence.
    for (var i = 0; i < map.length; i++) {
      var rule = map[i]

      if (util.isArray(rule) && rule.length === 2) {
        var m = rule[0]

        if (util.isString(m) && ret.indexOf(m) > -1 ||
            util.isRegExp(m) && m.test(ret)) {
          ret = ret.replace(m, rule[1])
        }
      }
      else if (util.isFunction(rule)) {
        ret = rule(ret)
      }
    }

    if (!isAbsolute(ret)) {
      ret = realpath(dirname(pageUri) + ret)
    }

    if (ret !== uri) {
      mapCache[ret] = uri
    }

    return ret
  }


  /**
   * Gets the original uri.
   */
  function unParseMap(uri) {
    return mapCache[uri] || uri
  }


  /**
   * Converts id to uri.
   */
  function id2Uri(id, refUri) {
    if (!id) return ''

    id = parseAlias(id)
    refUri || (refUri = pageUri)

    var ret

    // absolute id
    if (isAbsolute(id)) {
      ret = id
    }
    // relative id
    else if (isRelative(id)) {
      // Converts './a' to 'a', to avoid unnecessary loop in realpath.
      if (id.indexOf('./') === 0) {
        id = id.substring(2)
      }
      ret = dirname(refUri) + id
    }
    // root id
    else if (isRoot(id)) {
      ret = refUri.match(ROOT_RE)[1] + id
    }
    // top-level id
    else {
      ret = config.base + '/' + id
    }

    return normalize(ret)
  }


  function isAbsolute(id) {
    return id.indexOf('://') > 0 || id.indexOf('//') === 0
  }


  function isRelative(id) {
    return id.indexOf('./') === 0 || id.indexOf('../') === 0
  }


  function isRoot(id) {
    return id.charAt(0) === '/' && id.charAt(1) !== '/'
  }


  function isTopLevel(id) {
    var c = id.charAt(0)
    return id.indexOf('://') === -1 && c !== '.' && c !== '/'
  }


  /**
   * Normalizes pathname to start with '/'
   * Ref: https://groups.google.com/forum/#!topic/seajs/9R29Inqk1UU
   */
  function normalizePathname(pathname) {
    if (pathname.charAt(0) !== '/') {
      pathname = '/' + pathname
    }
    return pathname
  }


  var loc = global['location']
  var pageUri = loc.protocol + '//' + loc.host +
      normalizePathname(loc.pathname)

  // local file in IE: C:\path\to\xx.js
  if (pageUri.indexOf('\\') > 0) {
    pageUri = pageUri.replace(/\\/g, '/')
  }


  util.dirname = dirname
  util.realpath = realpath
  util.normalize = normalize

  util.parseAlias = parseAlias
  util.parseMap = parseMap
  util.unParseMap = unParseMap

  util.id2Uri = id2Uri
  util.isAbsolute = isAbsolute
  util.isRoot = isRoot
  util.isTopLevel = isTopLevel

  util.pageUri = pageUri

})(seajs._util, seajs._config, this)

/**
 * Utilities for fetching js and css files
 */
;(function(util, config) {

  var doc = document
  var head = doc.head ||
      doc.getElementsByTagName('head')[0] ||
      doc.documentElement

  var baseElement = head.getElementsByTagName('base')[0]

  var IS_CSS_RE = /\.css(?:\?|$)/i
  var READY_STATE_RE = /loaded|complete|undefined/

  var currentlyAddingScript
  var interactiveScript


  util.fetch = function(url, callback, charset) {
    var isCSS = IS_CSS_RE.test(url)
    var node = document.createElement(isCSS ? 'link' : 'script')

    if (charset) {
      var cs = util.isFunction(charset) ? charset(url) : charset
      cs && (node.charset = cs)
    }

    assetOnload(node, callback || noop)

    if (isCSS) {
      node.rel = 'stylesheet'
      node.href = url
    } else {
      node.async = 'async'
      node.src = url
    }

    // For some cache cases in IE 6-9, the script executes IMMEDIATELY after
    // the end of the insertBefore execution, so use `currentlyAddingScript`
    // to hold current node, for deriving url in `define`.
    currentlyAddingScript = node

    // ref: #185 & http://dev.jquery.com/ticket/2709
    baseElement ?
        head.insertBefore(node, baseElement) :
        head.appendChild(node)

    currentlyAddingScript = null
  }

  function assetOnload(node, callback) {
    if (node.nodeName === 'SCRIPT') {
      scriptOnload(node, callback)
    } else {
      styleOnload(node, callback)
    }
  }

  function scriptOnload(node, callback) {

    node.onload = node.onerror = node.onreadystatechange = function() {
      if (READY_STATE_RE.test(node.readyState)) {

        // Ensure only run once and handle memory leak in IE
        node.onload = node.onerror = node.onreadystatechange = null

        // Remove the script to reduce memory leak
        if (node.parentNode && !config.debug) {
          head.removeChild(node)
        }

        // Dereference the node
        node = undefined

        callback()
      }
    }

  }

  function styleOnload(node, callback) {

    // for Old WebKit and Old Firefox
    if (isOldWebKit || isOldFirefox) {
      util.log('Start poll to fetch css')

      setTimeout(function() {
        poll(node, callback)
      }, 1) // Begin after node insertion
    }
    else {
      node.onload = node.onerror = function() {
        node.onload = node.onerror = null
        node = undefined
        callback()
      }
    }

  }

  function poll(node, callback) {
    var isLoaded

    // for WebKit < 536
    if (isOldWebKit) {
      if (node['sheet']) {
        isLoaded = true
      }
    }
    // for Firefox < 9.0
    else if (node['sheet']) {
      try {
        if (node['sheet'].cssRules) {
          isLoaded = true
        }
      } catch (ex) {
        // The value of `ex.name` is changed from
        // 'NS_ERROR_DOM_SECURITY_ERR' to 'SecurityError' since Firefox 13.0
        // But Firefox is less than 9.0 in here, So it is ok to just rely on
        // 'NS_ERROR_DOM_SECURITY_ERR'
        if (ex.name === 'NS_ERROR_DOM_SECURITY_ERR') {
          isLoaded = true
        }
      }
    }

    setTimeout(function() {
      if (isLoaded) {
        // Place callback in here due to giving time for style rendering.
        callback()
      } else {
        poll(node, callback)
      }
    }, 1)
  }

  function noop() {
  }


  util.getCurrentScript = function() {
    if (currentlyAddingScript) {
      return currentlyAddingScript
    }

    // For IE6-9 browsers, the script onload event may not fire right
    // after the the script is evaluated. Kris Zyp found that it
    // could query the script nodes and the one that is in "interactive"
    // mode indicates the current script.
    // Ref: http://goo.gl/JHfFW
    if (interactiveScript &&
        interactiveScript.readyState === 'interactive') {
      return interactiveScript
    }

    var scripts = head.getElementsByTagName('script')

    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i]
      if (script.readyState === 'interactive') {
        interactiveScript = script
        return script
      }
    }
  }

  util.getScriptAbsoluteSrc = function(node) {
    return node.hasAttribute ? // non-IE6/7
        node.src :
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        node.getAttribute('src', 4)
  }


  util.importStyle = function(cssText, id) {
    // Don't add multi times
    if (id && doc.getElementById(id)) return

    var element = doc.createElement('style')
    id && (element.id = id)

    // Adds to DOM first to avoid the css hack invalid
    head.appendChild(element)

    // IE
    if (element.styleSheet) {
      element.styleSheet.cssText = cssText
    }
    // W3C
    else {
      element.appendChild(doc.createTextNode(cssText))
    }
  }


  var UA = navigator.userAgent

  // `onload` event is supported in WebKit since 535.23
  // Ref:
  //  - https://bugs.webkit.org/show_activity.cgi?id=38995
  var isOldWebKit = Number(UA.replace(/.*AppleWebKit\/(\d+)\..*/, '$1')) < 536

  // `onload/onerror` event is supported since Firefox 9.0
  // Ref:
  //  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
  //  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
  var isOldFirefox = UA.indexOf('Firefox') > 0 &&
      !('onload' in document.createElement('link'))


  /**
   * References:
   *  - http://unixpapa.com/js/dyna.html
   *  - ../test/research/load-js-css/test.html
   *  - ../test/issues/load-css/test.html
   *  - http://www.blaze.io/technical/ies-premature-execution-problem/
   */

})(seajs._util, seajs._config, this)

/**
 * The parser for dependencies
 */
;(function(util) {

  var REQUIRE_RE = /(?:^|[^.$])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g


  util.parseDependencies = function(code) {
    // Parse these `requires`:
    //   var a = require('a');
    //   someMethod(require('b'));
    //   require('c');
    //   ...
    // Doesn't parse:
    //   someInstance.require(...);
    var ret = [], match

    code = removeComments(code)
    REQUIRE_RE.lastIndex = 0

    while ((match = REQUIRE_RE.exec(code))) {
      if (match[2]) {
        ret.push(match[2])
      }
    }

    return util.unique(ret)
  }

  // See: research/remove-comments-safely
  function removeComments(code) {
    return code
        .replace(/^\s*\/\*[\s\S]*?\*\/\s*$/mg, '') // block comments
        .replace(/^\s*\/\/.*$/mg, '') // line comments
  }

})(seajs._util)

/**
 * The core of loader
 */
;(function(seajs, util, config) {

  var cachedModules = {}
  var cachedModifiers = {}
  var compileStack = []

  var STATUS = {
    'FETCHING': 1,  // The module file is fetching now.
    'FETCHED': 2,   // The module file has been fetched.
    'SAVED': 3,     // The module info has been saved.
    'READY': 4,     // All dependencies and self are ready to compile.
    'COMPILING': 5, // The module is in compiling now.
    'COMPILED': 6   // The module is compiled and module.exports is available.
  }


  function Module(uri, status) {
    this.uri = uri
    this.status = status || 0

    // this.id is set when saving
    // this.dependencies is set when saving
    // this.factory is set when saving
    // this.exports is set when compiling
    // this.parent is set when compiling
    // this.require is set when compiling
  }


  Module.prototype._use = function(ids, callback) {
    util.isString(ids) && (ids = [ids])
    var uris = resolve(ids, this.uri)

    this._load(uris, function() {
      // Loads preload files introduced in modules before compiling.
      preload(function() {
        var args = util.map(uris, function(uri) {
          return uri ? cachedModules[uri]._compile() : null
        })

        if (callback) {
          callback.apply(null, args)
        }
      })
    })
  }


  Module.prototype._load = function(uris, callback) {
    var unLoadedUris = util.filter(uris, function(uri) {
      return uri && (!cachedModules[uri] ||
          cachedModules[uri].status < STATUS.READY)
    })

    var length = unLoadedUris.length
    if (length === 0) {
      callback()
      return
    }

    var remain = length

    for (var i = 0; i < length; i++) {
      (function(uri) {
        var module = cachedModules[uri] ||
            (cachedModules[uri] = new Module(uri, STATUS.FETCHING))

        module.status >= STATUS.FETCHED ? onFetched() : fetch(uri, onFetched)

        function onFetched() {
          // cachedModules[uri] is changed in un-correspondence case
          module = cachedModules[uri]

          if (module.status >= STATUS.SAVED) {
            var deps = getPureDependencies(module)

            if (deps.length) {
              Module.prototype._load(deps, function() {
                cb(module)
              })
            }
            else {
              cb(module)
            }
          }
          // Maybe failed to fetch successfully, such as 404 or non-module.
          // In these cases, just call cb function directly.
          else {
            cb()
          }
        }

      })(unLoadedUris[i])
    }

    function cb(module) {
      (module || {}).status < STATUS.READY && (module.status = STATUS.READY)
      --remain === 0 && callback()
    }
  }


  Module.prototype._compile = function() {
    var module = this
    if (module.status === STATUS.COMPILED) {
      return module.exports
    }

    // Just return null when:
    //  1. the module file is 404.
    //  2. the module file is not written with valid module format.
    //  3. other error cases.
    if (module.status < STATUS.SAVED && !hasModifiers(module)) {
      return null
    }

    module.status = STATUS.COMPILING


    function require(id) {
      var uri = resolve(id, module.uri)
      var child = cachedModules[uri]

      // Just return null when uri is invalid.
      if (!child) {
        return null
      }

      // Avoids circular calls.
      if (child.status === STATUS.COMPILING) {
        return child.exports
      }

      child.parent = module
      return child._compile()
    }

    require.async = function(ids, callback) {
      module._use(ids, callback)
    }

    require.resolve = function(id) {
      return resolve(id, module.uri)
    }

    require.cache = cachedModules


    module.require = require
    module.exports = {}
    var factory = module.factory

    if (util.isFunction(factory)) {
      compileStack.push(module)
      runInModuleContext(factory, module)
      compileStack.pop()
    }
    else if (factory !== undefined) {
      module.exports = factory
    }

    module.status = STATUS.COMPILED
    execModifiers(module)
    return module.exports
  }


  Module._define = function(id, deps, factory) {
    var argsLength = arguments.length

    // define(factory)
    if (argsLength === 1) {
      factory = id
      id = undefined
    }
    // define(id || deps, factory)
    else if (argsLength === 2) {
      factory = deps
      deps = undefined

      // define(deps, factory)
      if (util.isArray(id)) {
        deps = id
        id = undefined
      }
    }

    // Parses dependencies.
    if (!util.isArray(deps) && util.isFunction(factory)) {
      deps = util.parseDependencies(factory.toString())
    }

    var meta = { id: id, dependencies: deps, factory: factory }
    var derivedUri

    // Try to derive uri in IE6-9 for anonymous modules.
    if (document.attachEvent) {
      // Try to get the current script.
      var script = util.getCurrentScript()
      if (script) {
        derivedUri = util.unParseMap(util.getScriptAbsoluteSrc(script))
      }

      if (!derivedUri) {
        util.log('Failed to derive URI from interactive script for:',
            factory.toString(), 'warn')

        // NOTE: If the id-deriving methods above is failed, then falls back
        // to use onload event to get the uri.
      }
    }

    // Gets uri directly for specific module.
    var resolvedUri = id ? resolve(id) : derivedUri

    if (resolvedUri) {
      // For IE:
      // If the first module in a package is not the cachedModules[derivedUri]
      // self, it should assign to the correct module when found.
      if (resolvedUri === derivedUri) {
        var refModule = cachedModules[derivedUri]
        if (refModule && refModule.realUri &&
            refModule.status === STATUS.SAVED) {
          cachedModules[derivedUri] = null
        }
      }

      var module = Module._save(resolvedUri, meta)

      // For IE:
      // Assigns the first module in package to cachedModules[derivedUrl]
      if (derivedUri) {
        // cachedModules[derivedUri] may be undefined in combo case.
        if ((cachedModules[derivedUri] || {}).status === STATUS.FETCHING) {
          cachedModules[derivedUri] = module
          module.realUri = derivedUri
        }
      }
      else {
        firstModuleInPackage || (firstModuleInPackage = module)
      }
    }
    else {
      // Saves information for "memoizing" work in the onload event.
      anonymousModuleMeta = meta
    }

  }


  Module._getCompilingModule = function() {
    return compileStack[compileStack.length - 1]
  }


  Module._find = function(selector) {
    var matches = []

    util.forEach(util.keys(cachedModules), function(uri) {
      if (util.isString(selector) && uri.indexOf(selector) > -1 ||
          util.isRegExp(selector) && selector.test(uri)) {
        var module = cachedModules[uri]
        module.exports && matches.push(module.exports)
      }
    })

    return matches
  }


  Module._modify = function(id, modifier) {
    var uri = resolve(id)
    var module = cachedModules[uri]

    if (module && module.status === STATUS.COMPILED) {
      runInModuleContext(modifier, module)
    }
    else {
      cachedModifiers[uri] || (cachedModifiers[uri] = [])
      cachedModifiers[uri].push(modifier)
    }

    return seajs
  }


  // For plugin developers
  Module.STATUS = STATUS
  Module._resolve = util.id2Uri
  Module._fetch = util.fetch
  Module._save = save


  // Helpers
  // -------

  var fetchingList = {}
  var fetchedList = {}
  var callbackList = {}
  var anonymousModuleMeta = null
  var firstModuleInPackage = null
  var circularCheckStack = []

  function resolve(ids, refUri) {
    if (util.isString(ids)) {
      return Module._resolve(ids, refUri)
    }

    return util.map(ids, function(id) {
      return resolve(id, refUri)
    })
  }

  function fetch(uri, callback) {
    var requestUri = util.parseMap(uri)

    if (fetchedList[requestUri]) {
      // See test/issues/debug-using-map
      cachedModules[uri] = cachedModules[requestUri]
      callback()
      return
    }

    if (fetchingList[requestUri]) {
      callbackList[requestUri].push(callback)
      return
    }

    fetchingList[requestUri] = true
    callbackList[requestUri] = [callback]

    // Fetches it
    Module._fetch(
        requestUri,

        function() {
          fetchedList[requestUri] = true

          // Updates module status
          var module = cachedModules[uri]
          if (module.status === STATUS.FETCHING) {
            module.status = STATUS.FETCHED
          }

          // Saves anonymous module meta data
          if (anonymousModuleMeta) {
            Module._save(uri, anonymousModuleMeta)
            anonymousModuleMeta = null
          }

          // Assigns the first module in package to cachedModules[uri]
          // See: test/issues/un-correspondence
          if (firstModuleInPackage && module.status === STATUS.FETCHED) {
            cachedModules[uri] = firstModuleInPackage
            firstModuleInPackage.realUri = uri
          }
          firstModuleInPackage = null

          // Clears
          if (fetchingList[requestUri]) {
            delete fetchingList[requestUri]
          }

          // Calls callbackList
          var fns = callbackList[requestUri]
          if (fns) {
            delete callbackList[requestUri]
            util.forEach(fns, function(fn) {
              fn()
            })
          }

        },

        config.charset
    )
  }

  function save(uri, meta) {
    var module = cachedModules[uri] || (cachedModules[uri] = new Module(uri))

    // Don't override already saved module
    if (module.status < STATUS.SAVED) {
      // Lets anonymous module id equal to its uri
      module.id = meta.id || uri

      module.dependencies = resolve(
          util.filter(meta.dependencies || [], function(dep) {
            return !!dep
          }), uri)

      module.factory = meta.factory

      // Updates module status
      module.status = STATUS.SAVED
    }

    return module
  }

  function runInModuleContext(fn, module) {
    var ret = fn(module.require, module.exports, module)
    if (ret !== undefined) {
      module.exports = ret
    }
  }

  function hasModifiers(module) {
    return !!cachedModifiers[module.realUri || module.uri]
  }

  function execModifiers(module) {
    var uri = module.realUri || module.uri
    var modifiers = cachedModifiers[uri]

    if (modifiers) {
      util.forEach(modifiers, function(modifier) {
        runInModuleContext(modifier, module)
      })

      delete cachedModifiers[uri]
    }
  }

  function getPureDependencies(module) {
    var uri = module.uri

    return util.filter(module.dependencies, function(dep) {
      circularCheckStack = [uri]

      var isCircular = isCircularWaiting(cachedModules[dep])
      if (isCircular) {
        circularCheckStack.push(uri)
        printCircularLog(circularCheckStack)
      }

      return !isCircular
    })
  }

  function isCircularWaiting(module) {
    if (!module || module.status !== STATUS.SAVED) {
      return false
    }

    circularCheckStack.push(module.uri)
    var deps = module.dependencies

    if (deps.length) {
      if (isOverlap(deps, circularCheckStack)) {
        return true
      }

      for (var i = 0; i < deps.length; i++) {
        if (isCircularWaiting(cachedModules[deps[i]])) {
          return true
        }
      }
    }

    circularCheckStack.pop()
    return false
  }

  function printCircularLog(stack, type) {
    util.log('Found circular dependencies:', stack.join(' --> '), type)
  }

  function isOverlap(arrA, arrB) {
    var arrC = arrA.concat(arrB)
    return arrC.length > util.unique(arrC).length
  }

  function preload(callback) {
    var preloadMods = config.preload.slice()
    config.preload = []
    preloadMods.length ? globalModule._use(preloadMods, callback) : callback()
  }


  // Public API
  // ----------

  var globalModule = new Module(util.pageUri, STATUS.COMPILED)

  seajs.use = function(ids, callback) {
    // Loads preload modules before all other modules.
    preload(function() {
      globalModule._use(ids, callback)
    })

    // Chain
    return seajs
  }


  // For normal users
  seajs.define = Module._define
  seajs.cache = Module.cache = cachedModules
  seajs.find = Module._find
  seajs.modify = Module._modify


  // For plugin developers
  Module.fetchedList = fetchedList
  seajs.pluginSDK = {
    Module: Module,
    util: util,
    config: config
  }

})(seajs, seajs._util, seajs._config)

/**
 * The configuration
 */
;(function(seajs, util, config) {

  var noCachePrefix = 'seajs-ts='
  var noCacheTimeStamp = noCachePrefix + util.now()


  // Async inserted script
  var loaderScript = document.getElementById('seajsnode')

  // Static script
  if (!loaderScript) {
    var scripts = document.getElementsByTagName('script')
    loaderScript = scripts[scripts.length - 1]
  }

  var loaderSrc = (loaderScript && util.getScriptAbsoluteSrc(loaderScript)) ||
      util.pageUri // When sea.js is inline, set base to pageUri.

  var base = util.dirname(getLoaderActualSrc(loaderSrc))
  util.loaderDir = base

  // When src is "http://test.com/libs/seajs/1.0.0/sea.js", redirect base
  // to "http://test.com/libs/"
  var match = base.match(/^(.+\/)seajs\/[\.\d]+(?:-dev)?\/$/)
  if (match) base = match[1]

  config.base = base
  config.main = loaderScript && loaderScript.getAttribute('data-main')
  config.charset = 'utf-8'


  /**
   * The function to configure the framework
   * config({
   *   'base': 'path/to/base',
   *   'alias': {
   *     'app': 'biz/xx',
   *     'jquery': 'jquery-1.5.2',
   *     'cart': 'cart?t=20110419'
   *   },
   *   'map': [
   *     ['test.cdn.cn', 'localhost']
   *   ],
   *   preload: [],
   *   charset: 'utf-8',
   *   debug: false
   * })
   *
   */
  seajs.config = function(o) {
    for (var k in o) {
      if (!o.hasOwnProperty(k)) continue

      var previous = config[k]
      var current = o[k]

      if (previous && k === 'alias') {
        for (var p in current) {
          if (current.hasOwnProperty(p)) {

            var prevValue = previous[p]
            var currValue = current[p]

            // Converts {jquery: '1.7.2'} to {jquery: 'jquery/1.7.2/jquery'}
            if (/^\d+\.\d+\.\d+$/.test(currValue)) {
              currValue = p + '/' + currValue + '/' + p
            }

            checkAliasConflict(prevValue, currValue, p)
            previous[p] = currValue

          }
        }
      }
      else if (previous && (k === 'map' || k === 'preload')) {
        // for config({ preload: 'some-module' })
        if (util.isString(current)) {
          current = [current]
        }

        util.forEach(current, function(item) {
          if (item) {
            previous.push(item)
          }
        })
      }
      else {
        config[k] = current
      }
    }

    // Makes sure config.base is an absolute path.
    var base = config.base
    if (base && !util.isAbsolute(base)) {
      config.base = util.id2Uri((util.isRoot(base) ? '' : './') + base + '/')
    }

    // Uses map to implement nocache.
    if (config.debug === 2) {
      config.debug = 1
      seajs.config({
        map: [
          [/^.*$/, function(url) {
            if (url.indexOf(noCachePrefix) === -1) {
              url += (url.indexOf('?') === -1 ? '?' : '&') + noCacheTimeStamp
            }
            return url
          }]
        ]
      })
    }

    debugSync()

    return this
  }


  function debugSync() {
    if (config.debug) {
      // For convenient reference
      seajs.debug = !!config.debug
    }
  }

  debugSync()


  function getLoaderActualSrc(src) {
    if (src.indexOf('??') === -1) {
      return src
    }

    // Such as: http://cdn.com/??seajs/1.2.0/sea.js,jquery/1.7.2/jquery.js
    // Only support nginx combo style rule. If you use other combo rule, please
    // explicitly config the base path and the alias for plugins.
    var parts = src.split('??')
    var root = parts[0]
    var paths = util.filter(parts[1].split(','), function(str) {
      return str.indexOf('sea.js') !== -1
    })

    return root + paths[0]
  }

  function checkAliasConflict(previous, current, key) {
    if (previous && previous !== current) {
      util.log('The alias config is conflicted:',
          'key =', '"' + key + '"',
          'previous =', '"' + previous + '"',
          'current =', '"' + current + '"',
          'warn')
    }
  }

})(seajs, seajs._util, seajs._config)

/**
 * Prepare for bootstrapping
 */
;(function(seajs, util, global) {

  // The safe and convenient version of console.log
  seajs.log = util.log


  // Creates a stylesheet from a text blob of rules.
  seajs.importStyle = util.importStyle


  // Sets a alias to `sea.js` directory for loading plugins.
  seajs.config({
    alias: { seajs: util.loaderDir }
  })


  // Uses `seajs-xxx` flag to load plugin-xxx.
  util.forEach(getStartupPlugins(), function(name) {
    seajs.use('seajs/plugin-' + name)

    // Delays `seajs.use` calls to the onload of `mapfile` in debug mode.
    if (name === 'debug') {
      seajs._use = seajs.use
      seajs._useArgs = []
      seajs.use = function() { seajs._useArgs.push(arguments); return seajs }
    }
  })


  // Helpers
  // -------

  function getStartupPlugins() {
    var ret = []
    var str = global.location.search

    // Converts `seajs-xxx` to `seajs-xxx=1`
    str = str.replace(/(seajs-\w+)(&|$)/g, '$1=1$2')

    // Add cookie string
    str += ' ' + document.cookie

    // Excludes seajs-xxx=0
    str.replace(/seajs-(\w+)=[1-9]/g, function(m, name) {
      ret.push(name)
    })

    return util.unique(ret)
  }

})(seajs, seajs._util, this)

/**
 * The bootstrap and entrances
 */
;(function(seajs, config, global) {

  var _seajs = seajs._seajs

  // Avoids conflicting when sea.js is loaded multi times.
  if (_seajs && !_seajs['args']) {
    global.seajs = seajs._seajs
    return
  }


  // Assigns to global define.
  global.define = seajs.define


  // Loads the data-main module automatically.
  config.main && seajs.use(config.main)


    // Parses the pre-call of seajs.config/seajs.use/define.
  // Ref: test/bootstrap/async-3.html
  ;(function(args) {
    if (args) {
      var hash = {
        0: 'config',
        1: 'use',
        2: 'define'
      }
      for (var i = 0; i < args.length; i += 2) {
        seajs[hash[args[i]]].apply(seajs, args[i + 1])
      }
    }
  })((_seajs || 0)['args'])


  // Add define.amd property for clear indicator.
  global.define.cmd = {}


  // Keeps clean!
  delete seajs.define
  delete seajs._util
  delete seajs._config
  delete seajs._seajs

})(seajs, seajs._config, this)



var loaderPath = seajs.pluginSDK.util.loaderDir;
seajs.config({
  map : [
    ['.js', '-min.js']
  ],
  alias : {
    'bui' : loaderPath
  },
  charset: 'utf-8'
});

var BUI = BUI || {};

BUI.use = seajs.use;

BUI.config = seajs.config;

BUI.setDebug = function (debug) {
  BUI.debug = debug;
  if(debug){
    seajs.config({
      map : [
        ['-min.js', '.js']
      ]
    });
  }else{
    seajs.config({
      map : [
        ['.js', '-min.js']
      ]
    });
  }
}
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview Mask的入口文件
 * @ignore
 */

define('bui/mask',['bui/common','bui/mask/mask','bui/mask/loadmask'],function (require) {
  var BUI = require('bui/common'),
    Mask = require('bui/mask/mask');
  Mask.LoadMask = require('bui/mask/loadmask');
  return Mask;
});
/**
 * @fileOverview 加载数据时屏蔽层
 * @ignore
 */

define('bui/mask/loadmask',['bui/mask/mask'],function (require) {
  
  var Mask = require('bui/mask/mask');

   /**
     * 屏蔽指定元素，并显示加载信息
     * <pre></code>
     * BUI.use('bui/mask',function(Mask){
     *    var loadMask = new Mask.LoadMask({
     *        el : '#domId',
     *        msg : 'loading ....'
     *    });
     *
     *    $('#btn').on('click',function(){
     *        loadMask.show();
     *    });
     *
     *    $('#btn1').on('click',function(){
     *        loadMask.hide();
     *    });
     * });
     * </code></pre>
     * @class BUI.Mask.LoadMask
     * @extends BUI.Base
     */
    function LoadMask(config) {
        var _self = this;
        LoadMask.superclass.constructor.call(_self, config);
    }

    BUI.extend(LoadMask, BUI.Base);

    LoadMask.ATTRS = {
        /**
         * 屏蔽的元素
         * <pre></code>
         *    var loadMask = new Mask.LoadMask({
         *        el : '#domId'
         *    });
         * </code></pre>
         * @cfg {jQuery} el
         */
        el : {

        },
        /**
         * 加载时显示的加载信息
         * <pre></code>
         *    var loadMask = new Mask.LoadMask({
         *        el : '#domId',
         *        msg : '正在加载，请稍后。。。'
         *    });
         * </code></pre>
         * @cfg {String} msg [msg = 'Loading...']
         */
        msg:{
            value : 'Loading...'
        },
        /**
         * 加载时显示的加载信息的样式
         * <pre></code>
         *    var loadMask = new Mask.LoadMask({
         *        el : '#domId',
         *        msgCls : 'custom-cls'
         *    });
         * </code></pre>
         * @cfg {String} [msgCls = 'x-mask-loading']
         */
        msgCls:{
            value : 'x-mask-loading'
        },
        /**
         * 加载控件是否禁用
         * @type {Boolean}
         * @field
         * @default false
         * @ignore
         */
        disabled:{
           value : false
        }
    };

    //对象原型
    BUI.augment(LoadMask,
    /** 
    * @lends BUI.Mask.LoadMask.prototype 
    * @ignore
    */
    {
        
        /**
         * 设置控件不可用
         */
        disable:function () {
            this.set('disabled',true);
        },
        /**
         * @private 加载已经完毕，解除屏蔽
         */
        onLoad:function () {
            Mask.unmaskElement(this.get('el'));
        },
        /**
         * @private 开始加载，屏蔽当前元素
         */
        onBeforeLoad:function () {
            var _self = this;
            if (!_self.get('disabled')) {
                Mask.maskElement(_self.get('el'), _self.get('msg'), this.get('msgCls'));
            }
        },
        /**
         * 显示加载条，并遮盖元素
         */
        show:function () {
            this.onBeforeLoad();
        },

        /**
         * 隐藏加载条，并解除遮盖元素
         */
        hide:function () {
            this.onLoad();
        },

        /*
         * 清理资源
         */
        destroy:function () {
            this.hide();
            this.clearAttrVals();
            this.off();
        }
    });

    return LoadMask;
});
/**
 * @fileOverview Mask屏蔽层
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/mask/mask',['bui/common'],function (require) {

    var BUI = require('bui/common'),
      Mask = BUI.namespace('Mask'),
      UA = BUI.UA,
      CLS_MASK = BUI.prefix + 'ext-mask',
      CLS_MASK_MSG = CLS_MASK + '-msg';

    BUI.mix(Mask,
    /**
    * 屏蔽层
    * <pre><code>
    * BUI.use('bui/mask',function(Mask){
    *   Mask.maskElement('#domId'); //屏蔽dom
    *   Mask.unmaskElement('#domId'); //解除DOM屏蔽
    * });
    * </code></pre>
    * @class BUI.Mask
    * @singleton
    */
    {
        /**
         * @description 屏蔽指定元素
         * @param {String|HTMLElement} element 被屏蔽的元素
         * @param {String} [msg] 屏蔽元素时显示的文本
         * @param {String} [msgCls] 显示文本应用的样式
         * <pre><code>
         *   BUI.Mask.maskElement('#domId');
         *   
         * </code></pre>
         */
        maskElement:function (element, msg, msgCls) {
            var maskedEl = $(element),
                maskDiv = $('.' + CLS_MASK, maskedEl),
                tpl = null,
                msgDiv = null,
                top = null,
                left = null;
            if (!maskDiv.length) {
                maskDiv = $('<div class="' + CLS_MASK + '"></div>').appendTo(maskedEl);
                maskedEl.addClass('x-masked-relative x-masked');
                if (UA.ie === 6) {
                    maskDiv.height(maskedEl.height());
                }
                if (msg) {
                    tpl = ['<div class="' + CLS_MASK_MSG + '"><div>', msg, '</div></div>'].join('');
                    msgDiv = $(tpl).appendTo(maskedEl);
                    if (msgCls) {
                        msgDiv.addClass(msgCls);
                    }
                    try {
                        top = (maskedEl.height() - msgDiv.height()) / 2;
                        left = (maskedEl.width() - msgDiv.width()) / 2;

                        msgDiv.css({ left:left, top:top });
                    } catch (ex) {
                        BUI.log('mask error occurred');
                    }
                }
            }
            return maskDiv;
        },
        /**
         * @description 解除元素的屏蔽
         * @param {String|HTMLElement} 屏蔽的元素
         * <pre><code>
         * BUI.Mask.unmaskElement('#domId');
         * </code></pre>
         */
        unmaskElement:function (element) {
            var maskedEl = $(element),
                msgEl = maskedEl.children('.' + CLS_MASK_MSG),
                maskDiv = maskedEl.children('.' + CLS_MASK);
            if (msgEl) {
                msgEl.remove();
            }
            if (maskDiv) {
                maskDiv.remove();
            }
            maskedEl.removeClass('x-masked-relative x-masked');

        }
    });
    
    return Mask;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 菜单命名空间入口文件
 * @ignore
 */

define('bui/menu',['bui/common','bui/menu/menu','bui/menu/menuitem','bui/memu/contextmenu','bui/menu/popmenu','bui/menu/sidemenu'],function (require) {
  
  var BUI = require('bui/common'),
    Menu = BUI.namespace('Menu');
  BUI.mix(Menu,{
    Menu : require('bui/menu/menu'),
    MenuItem : require('bui/menu/menuitem'),
    ContextMenu : require('bui/memu/contextmenu'),
    PopMenu : require('bui/menu/popmenu'),
    SideMenu : require('bui/menu/sidemenu')
  });

  Menu.ContextMenuItem = Menu.ContextMenu.Item;
  return Menu;
});
/**
 * @fileOverview 弹出菜单，一般用于右键菜单
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/memu/contextmenu',['bui/common','bui/menu/menuitem','bui/menu/popmenu'],function (require) {

  var BUI = require('bui/common'),
    MenuItem = require('bui/menu/menuitem'),
    PopMenu = require('bui/menu/popmenu'),
    PREFIX = BUI.prefix,
    CLS_Link = PREFIX + 'menu-item-link',
    CLS_ITEM_ICON =  PREFIX + 'menu-item-icon',
    Component = BUI.Component,
    UIBase = Component.UIBase;

  /**
   * 上下文菜单项
   * xclass:'context-menu-item'
   * @class BUI.Menu.ContextMenuItem 
   * @extends BUI.Menu.MenuItem
   */
  var contextMenuItem = MenuItem.extend({
   
    bindUI:function(){
      var _self = this;

      _self.get('el').delegate('.' + CLS_Link,'click',function(ev){
        ev.preventDefault();
      });
    }, 
    //设置图标样式
    _uiSetIconCls : function (v,ev) {
      var _self = this,
        preCls = ev.prevVal,
        iconEl = _self.get('el').find('.'+CLS_ITEM_ICON);
      iconEl.removeClass(preCls);
      iconEl.addClass(v);
    }
  },{

    ATTRS:
    /**
     * @lends BUI.Menu.MenuItem#
     * @ignore
     */
    {
      /**
       * 显示的文本
       * @type {String}
       */
      text:{
        veiw:true,
        value:''
      },
      /**
       * 菜单项图标的样式
       * @type {String}
       */
      iconCls:{
        sync:false,
        value:''
      },
      tpl:{
        value:'<a class="' + CLS_Link + '" href="#">\
        <span class="' + CLS_ITEM_ICON + ' {iconCls}"></span><span class="' + PREFIX + 'menu-item-text">{text}</span></a>'
      }
    }
  },{
    xclass:'context-menu-item'
  });

  /**
   * 上下文菜单，一般用于弹出菜单
   * xclass:'context-menu'
   * @class BUI.Menu.ContextMenu
   * @extends BUI.Menu.PopMenu
   */
  var contextMenu = PopMenu.extend({

  },{
    ATTRS:{
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @override
       * @default 'menu-item'
       */
      defaultChildClass : {
        value : 'context-menu-item'
      },
      align : {
        value : null
      }
    }
  },{
    xclass:'context-menu'
  });

  contextMenu.Item = contextMenuItem;
  return contextMenu;
});

/**
 * @fileOverview 菜单基类
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/menu/menu',['bui/common'],function(require){

  var BUI = require('bui/common'),
    Component =  BUI.Component,
    UIBase = Component.UIBase;

  /**
   * 菜单
   * xclass:'menu'
   * <img src="../assets/img/class-menu.jpg"/>
   * @class BUI.Menu.Menu
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
  var Menu = Component.Controller.extend([UIBase.ChildList],{
	  /**
     * 绑定事件
     * @protected
     */
	  bindUI:function(){
      var _self = this;

      _self.on('click',function(e){
        var item = e.target,
          multipleSelect = _self.get('multipleSelect');
        if(_self != item){
          //单选情况下，允许自动隐藏，且没有子菜单的情况下，菜单隐藏
          if(!multipleSelect && _self.get('clickHide') && !item.get('subMenu')){
            _self.getTopAutoHideMenu().hide();
          }
        }
      });

      _self.on('afterOpenChange',function (ev) {
        var target = ev.target,
          opened = ev.newVal,
          children = _self.get('children');
        if(opened){
          BUI.each(children,function(item) {
            if(item !== target && item.get('open')){
              item.set('open',false);
            }
          });
        }
      });

      _self.on('afterVisibleChange',function (ev) {
        var visible = ev.newVal,
          parent = _self.get('parentMenu');
        _self._clearOpen();
      });
    },
   
    //点击自动隐藏时
    getTopAutoHideMenu : function() {
      var _self = this,
        parentMenu = _self.get('parentMenu'),
        topHideMenu;
      if(parentMenu && parentMenu.get('autoHide')){
        return parentMenu.getTopAutoHideMenu();
      }
      if(_self.get('autoHide')){
        return _self;
      }
      return null;
    },
    //清除菜单项的激活状态
    _clearOpen : function () {
      var _self = this,
        children = _self.get('children');
      BUI.each(children,function (item) {
        if(item.set){
          item.set('open',false);
        }
      });
    },
    /**
     * 根据ID查找菜单项
     * @param  {String} id 编号
     * @return {BUI.Menu.MenuItem} 菜单项
     */
    findItemById : function(id){ 

      return this.findItemByField('id',id);
    },
    _uiSetSelectedItem : function(item){
      if(item){
        _self.setSelected(item);
      }
    }
  },{
    ATTRS:
    /**
     * @lends BUI.Menu.Menu#
     * @ignore
     */
    {

      elTagName:{
        view : true,
        value : 'ul'
      },
		  idField:{
        value:'id'
      },
      /**
       * @protected
       * 是否根据DOM生成子控件
       * @type {Boolean}
       */
      isDecorateChild : {
        value : true
      },
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @default 'menu-item'
       */
      defaultChildClass : {
        value : 'menu-item'
      },
      /**
       * 选中的菜单项
       * @type {Object}
       */
      selectedItem : {

      },
      /**
       * 上一级菜单
       * @type {BUI.Menu.Menu}
       * @readOnly
       */
      parentMenu : {

      }
    }
    
  },{
    xclass : 'menu',
    priority : 0
  });

  return Menu;
});
/**
 * @fileOverview 菜单项
 * @ignore
 */
define('bui/menu/menuitem',['bui/common'],function(require){

  var BUI = require('bui/common'),
      Component =  BUI.Component,
      UIBase = Component.UIBase,
      PREFIX = BUI.prefix,
      CLS_OPEN = PREFIX + 'menu-item-open',
      CLS_CARET = 'x-caret',
      CLS_COLLAPSE = PREFIX + 'menu-item-collapsed',
      DATA_ID = 'data-id';

  /**
   * @private
   * @class BUI.Menu.MenuItemView
   * @mixins BUI.Component.UIBase.ListItemView
   * @mixins BUI.Component.UIBase.CollapseableView
   * 菜单项的视图类
   */
  var menuItemView = Component.View.extend([UIBase.ListItemView,UIBase.CollapseableView],{

    _uiSetOpen : function (v) {
      var _self = this,
        cls = _self.getStatusCls('open');
      if(v){
        _self.get('el').addClass(cls);
      }else{
        _self.get('el').removeClass(cls);
      }
    }
  },{
    ATTRS : {
    }
  },{
    xclass:'menu-item-view'
  });

  /**
   * 菜单项
   * @class BUI.Menu.MenuItem
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ListItem
   */
  var menuItem = Component.Controller.extend([UIBase.ListItem,UIBase.Collapseable],{
    /**
     * 渲染
     * @protected
     */
    renderUI : function(){
      var _self = this,
        el = _self.get('el'),
        id = _self.get('id'),
        temp = null;
      //未设置id时自动生成
      if(!id){
        id = BUI.guid('menu-item');
        _self.set('id',id);
      }
      el.attr(DATA_ID,id);   
    },
     /**
     * 处理鼠标移入
     * @protected
     */
    handleMouseEnter : function (ev) {
      var _self = this;
      if(this.get('subMenu')){
        this.set('open',true);
      }
      menuItem.superclass.handleMouseEnter.call(this,ev);
    },
    /**
     * 处理鼠标移出
     * @protected
     */
    handleMouseLeave :function (ev) {
      var _self = this,
        subMenu = _self.get('subMenu'),
        toElement = ev.toElement;
      if(toElement && subMenu && subMenu.containsElement(toElement)){
        _self.set('open',true);
      }else{
        _self.set('open',false);
      }
      menuItem.superclass.handleMouseLeave.call(this,ev);
    },
    /**
     * 自己和子菜单是否包含
     * @override
     */
    containsElement:function (elem) {
      var _self = this,
        subMenu,
        contains = menuItem.superclass.containsElement.call(_self,elem);
      if(!contains){
        subMenu = _self.get('subMenu');
        contains = subMenu && subMenu.containsElement(elem);
      }
      return contains;
    }, 
    //设置打开子菜单 
    _uiSetOpen : function (v) {
      var _self = this,
        subMenu = _self.get('subMenu'),
        subMenuAlign = _self.get('subMenuAlign');
      if(subMenu){
        if(v){
          subMenuAlign.node = _self.get('el');
          subMenu.set('align',subMenuAlign);
          subMenu.show();
        }else{
          var menuAlign = subMenu.get('align');
          //防止子菜单被公用时
          if(!menuAlign || menuAlign.node == _self.get('el')){
            subMenu.hide();
          }
          
        }
      }
    },
    //设置下级菜单
    _uiSetSubMenu : function (subMenu) {
      if(subMenu){
        var _self = this,
          el = _self.get('el'),
          parent = _self.get('parent');
        //设置菜单项所属的菜单为上一级菜单
        if(!subMenu.get('parentMenu')){
          subMenu.set('parentMenu',parent);
          if(parent.get('autoHide')){
            subMenu.set('autoHide',false);
          } 
        }
        $(_self.get('arrowTpl')).appendTo(el);
      }
    },
    /** 
     * 析构函数
     * @protected
     */
    destructor : function () {
      var _self = this,
        subMenu = _self.get('subMenu');
      if(subMenu){
        subMenu.destroy();
      }
    }

  },{
    ATTRS : 
    /**
     * @lends BUI.Menu.MenuItem#
     * @ignore
     */
    {
      /**
       * 默认的Html 标签
       * @type {String}
       */
      elTagName : {
          value: 'li'
      },
      xview : {
        value : menuItemView
      },
      /**
       * 菜单项是否展开，显示子菜单
       * @cfg {Boolean} [open=false]
       */
      /**
       * 菜单项是否展开，显示子菜单
       * @type {Boolean}
       * @default false
       */
      open :{
        view : true,
        value : false
      },
      /**
       * 下级菜单
       * @cfg {BUI.Menu.Menu} subMenu
       */
      /**
       * 下级菜单
       * @type {BUI.Menu.Menu}
       */
      subMenu : {
        view : true
      },
       /**
       * 下级菜单和菜单项的对齐方式
       * @type {Object}
       * @protected
       * @default 默认在下面显示
       */
      subMenuAlign : {
        valueFn : function (argument) {
          return {
             //node: this.get('el'), // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
             points: ['tr','tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
             offset: [-5, 0]      // 有效值为 [n, m]
          }
        }
      },
      /**
       * 当存在子菜单时的箭头模版
       * @protected
       * @type {String}
       */
      arrowTpl : {
        value : '<span class="' + CLS_CARET + ' ' + CLS_CARET + '-left"></span>'
      },
      events : {
        value : {
          'afterOpenChange' : true
        }
      }
    }
  },{
    xclass : 'menu-item',
    priority : 0
  });

  var separator = menuItem.extend({

  },{
    ATTRS : {
      focusable : {
        value : false
      },
      selectable:{
        value : false
      },
      handleMouseEvents:{
        value:false
      }
    }
  },{
    xclass:'menu-item-sparator'
  });

  menuItem.View = menuItemView;
  menuItem.Separator = separator;
  
  return menuItem;
});
/**
 * @fileOverview 下拉菜单，一般用于下拉显示菜单
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/menu/popmenu',['bui/common','bui/menu/menu'],function (require) {

  var BUI = require('bui/common'),
    UIBase = BUI.Component.UIBase,
    Menu = require('bui/menu/menu');

  var popMenuView =  BUI.Component.View.extend([UIBase.PositionView],{
    
  });

   /**
   * @class BUI.Menu.PopMenu
   * 上下文菜单，一般用于弹出菜单
   * xclass:'pop-menu'
   * @extends BUI.Menu.Menu
   * @mixins BUI.Component.UIBase.AutoShow
   * @mixins BUI.Component.UIBase.Position
   * @mixins BUI.Component.UIBase.Align
   * @mixins BUI.Component.UIBase.AutoHide
   */
  var popMenu =  Menu.extend([UIBase.Position,UIBase.Align,UIBase.AutoShow,,UIBase.AutoHide],{

  },{
    ATTRS:{
       /** 点击菜单项，如果菜单不是多选，菜单隐藏
       * @type {Boolean} 
       * @default true
       */
      clickHide : {
        value : true
      },
      align : {
        value : {
           points: ['bl','tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
           offset: [0, 0]      // 有效值为 [n, m]
        }
      },
      visibleMode : {
        value : 'visibility'
      },
      /**
       * 点击菜单外面，菜单隐藏
       * 点击菜单项，如果菜单不是多选，菜单隐藏
       * @type {Boolean} 
       * @default true
       */
      autoHide : {
        value : true
      },
      visible : {
        value : false
      },
      xview:{
        value : popMenuView
      }
    }
  },{
    xclass:'pop-menu'
  });
  
  return popMenu;

});
/**
 * @fileOverview 侧边栏菜单
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/menu/sidemenu',['bui/common','bui/menu/menu'],function(require){

  var BUI = require('bui/common'),
    Menu = require('bui/menu/menu'),
    Component =  BUI.Component,
    CLS_MENU_TITLE = BUI.prefix + 'menu-title',
    CLS_MENU_LEAF = 'menu-leaf';
    
  /**
   * 侧边栏菜单
   * xclass:'side-menu'
   * @class BUI.Menu.SideMenu
   * @extends BUI.Menu.Menu
   */
  var sideMenu = Menu.extend(
  /**
   * @lends BUI.Menu.SideMenu.prototype
   * @ignore
   */
  {
    //初始化配置项
    initializer : function(){
      var _self = this,
        items = _self.get('items'),
        children = _self.get('children');

      BUI.each(items,function(item){
        var menuCfg = _self._initMenuCfg(item);
        children.push(menuCfg);
      });
    },
    bindUI : function(){
      var _self = this,
        children = _self.get('children');
      BUI.each(children,function(item){
        var menu = item.get('children')[0];
        if(menu){
          menu.publish('click',{
            bubbles:1
          });
        }
      });
      //防止链接跳转
      _self.get('el').delegate('a','click',function(ev){
        ev.preventDefault();
      });
      //处理点击事件，展开、折叠、选中
      _self.on('itemclick',function(ev){
        var item = ev.item,
          titleEl = $(ev.domTarget).closest('.' + CLS_MENU_TITLE);
        if(titleEl.length){
          var collapsed = item.get('collapsed');
            item.set('collapsed',!collapsed);
        }else if(item.get('el').hasClass(CLS_MENU_LEAF)){
          _self.fire('menuclick',{item:item});
          _self.clearSelection();
          _self.setSelected(item);
        }
      });
    },
    /**
     * @protected
     * @ignore
     */
    getItems:function(){
      var _self = this,
        items = [],
        children = _self.get('children');
      BUI.each(children,function(item){
        var menu = item.get('children')[0];
        items = items.concat(menu.get('children'));
      }); 
      return items;
    },
    //初始化菜单配置项
    _initMenuCfg : function(item){
      var _self = this,
        items = item.items,
        subItems = [],
        cfg = {
          xclass : 'menu-item',
          elCls : 'menu-second',
          collapsed : item.collapsed,
          selectable: false,
          children : [{
            xclass : 'menu',
            children : subItems
          }],
          content: '<div class="'+CLS_MENU_TITLE+'"><s></s><span class="'+CLS_MENU_TITLE+'-text">'+item.text+'</span></div>'
        };
      BUI.each(items,function(subItem){
        var subItemCfg = _self._initSubMenuCfg(subItem);
        subItems.push(subItemCfg);
      });

      return cfg;

    },
    //初始化二级菜单
    _initSubMenuCfg : function(subItem){
      var _self = this,
        cfg = {
          xclass : 'menu-item',
          elCls : 'menu-leaf',
          tpl : '<a href="{href}"><em>{text}</em></a>'
        };
      return BUI.mix(cfg,subItem);
    }
  },{

    ATTRS : 
    /**
     * @lends BUI.Menu.SideMenu.prototype
     * @ignore
     */
    {
      
      /**
       * 配置的items 项是在初始化时作为children
       * @protected
       * @type {Boolean}
       */
      autoInitItems : {
          value : false
      },
      events : {
        value : {
          /**
           * 点击菜单项
		       * @name BUI.Menu.SideMenu#menuclick
           * @event 
           * @param {Object} e 事件对象
           * @param {Object} e.item 当前选中的项
           */
          'menuclick' : false
        }
      }
    }
  },{
    xclass :'side-menu'
  });

  return sideMenu;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview Overlay 模块的入口
 * @ignore
 */

define('bui/overlay',['bui/common','bui/overlay/overlay','bui/overlay/dialog','bui/overlay/message'],function (require) {
  var BUI = require('bui/common'),
    Overlay = BUI.namespace('Overlay');

  BUI.mix(Overlay,{
    Overlay : require('bui/overlay/overlay'),
    Dialog : require('bui/overlay/dialog'),
    Message : require('bui/overlay/message')
  });

  BUI.mix(Overlay,{
    OverlayView : Overlay.Overlay.View,
    DialogView : Overlay.Dialog.View
  });

  BUI.Message = BUI.Overlay.Message;
  return Overlay;

});
/**
 * @fileOverview 弹出框
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/overlay/dialog',['bui/overlay/overlay'],function (require) {
  var Overlay = require('bui/overlay/overlay'),
    UIBase = BUI.Component.UIBase,
  	CLS_TITLE = 'header-title',
  	PREFIX = BUI.prefix,
    HEIGHT_PADDING = 20;

  /**
   * dialog的视图类
   * @class BUI.Overlay.DialogView
   * @extends BUI.Overlay.OverlayView
   * @mixins BUI.Component.UIBase.StdModView
   * @mixins BUI.Component.UIBase.MaskView
   * @private
   */
  var dialogView = Overlay.View.extend([UIBase.StdModView,UIBase.MaskView],{

    _uiSetTitle:function(v){
      var _self = this,
        el = _self.get('el');

      el.find('.' + CLS_TITLE).html(v);

    },
    _uiSetContentId : function(v){
      var _self = this,
        body = _self.get('body'),
        children = $('#'+v).children();

      children.appendTo(body);
    },
    _uiSetHeight : function(v){
      var _self = this,
        bodyHeight = v,
        header = _self.get('header'),
        body = _self.get('body'),
        footer = _self.get('footer');

      bodyHeight -= header.outerHeight()+footer.outerHeight();
      bodyHeight -=HEIGHT_PADDING * 2;
      body.height(bodyHeight);
    },
    _removeContent : function(){
      var _self = this,
        body = _self.get('body'),
        contentId = _self.get('contentId');
      if(contentId){
        body.children().appendTo($('#'+contentId));
      }else {
        body.children().remove();
      }
    }

  },{
    xclass:'dialog-view'
  });

  /**
   * 弹出框 xclass:'dialog'
   * <p>
   * <img src="../assets/img/class-overlay.jpg"/>
   * </p>
   * ** 普通弹出框 **
   * <pre><code>
   *  BUI.use('bui/overlay',function(Overlay){
   *      var dialog = new Overlay.Dialog({
   *        title:'非模态窗口',
   *        width:500,
   *        height:300,
   *        mask:false,  //设置是否模态
   *        buttons:[],
   *        bodyContent:'<p>这是一个非模态窗口,并且不带按钮</p>'
   *      });
   *    dialog.show();
   *    $('#btnShow').on('click',function () {
   *      dialog.show();
   *    });
   *  });
   * </code></pre>
   *
   * ** 使用现有的html结构 **
   * <pre><code>
   *  BUI.use('bui/overlay',function(Overlay){
   *      var dialog = new Overlay.Dialog({
   *        title:'配置DOM',
   *        width:500,
   *        height:250,
   *        contentId:'content',//配置DOM容器的编号
   *        success:function () {
   *          alert('确认');
   *          this.hide();
   *        }
   *      });
   *    dialog.show();
   *    $('#btnShow').on('click',function () {
   *      dialog.show();
   *    });
   *  });
   * </code></pre>
   * @class BUI.Overlay.Dialog
   * @extends BUI.Overlay.Overlay
   * @mixins BUI.Component.UIBase.StdMod
   * @mixins BUI.Component.UIBase.Mask
   * @mixins BUI.Component.UIBase.Drag
   */
  var dialog = Overlay.extend([UIBase.StdMod,UIBase.Mask,UIBase.Drag],{
    
    show:function(){
      var _self = this;

      dialog.superclass.show.call(this);
      _self.center();
    },
    //绑定事件
    bindUI : function(){
      var _self = this;
      _self.on('closeclick',function(){
        return _self.onCancel();
      });
    },
    /**
     * @protected
     * 取消
     */
    onCancel : function(){
      var _self = this,
        cancel = _self.get('cancel');
      return cancel.call(this);
    },
    //设置按钮
    _uiSetButtons:function(buttons){
      var _self = this,
        footer = _self.get('footer');

      footer.children().remove();
      BUI.each(buttons,function(conf){
        _self._createButton(conf,footer);
      });

    },
    //创建按钮
    _createButton : function(conf,parent){
      var _self = this,
        temp = '<button class="'+conf.elCls+'">'+conf.text+'</button>',
        btn = $(temp).appendTo(parent);
      btn.on('click',function(){
        conf.handler.call(_self,_self,this);
      });
    },
    destructor : function(){
      var _self = this,
        contentId = _self.get('contentId'),
        body = _self.get('body'),
        closeAction = _self.get('closeAction');
      if(closeAction == 'destroy'){
        _self.hide();
        if(contentId){
          body.children().appendTo('#'+contentId);
        }
      }
    }
  },{

    ATTRS : 
  	/**
  	* @lends BUI.Overlay.Dialog#
    * @ignore 
  	*/
    {
      closeTpl:{
        view:true,
        value : '<a tabindex="0" href=javascript:void("关闭") role="button" class="' + PREFIX + 'ext-close" style=""><span class="' + PREFIX + 'ext-close-x x-icon x-icon-normal">×</span></a>'
      },
     /**
       * 弹出库的按钮，可以有多个,有3个参数
       * var dialog = new Overlay.Dialog({
       *     title:'自定义按钮',
       *     width:500,
       *     height:300,
       *     mask:false,
       *     buttons:[
       *       {
       *         text:'自定义',
       *         elCls : 'button button-primary',
       *         handler : function(){
       *           //do some thing
       *           this.hide();
       *         }
       *       },{
       *         text:'关闭',
       *         elCls : 'button',
       *         handler : function(){
       *           this.hide();
       *         }
       *       }
       *     ],
       *     
       *     bodyContent:'<p>这是一个自定义按钮窗口,可以配置事件和文本样式</p>'
       *   });
       *  dialog.show();
       * <ol>
       *   <li>text:按钮文本</li>
       *   <li>elCls:按钮样式</li>
       *   <li>handler:点击按钮的回调事件</li>
       * </ol>
       * @cfg {Array} buttons
       * @default '确定'、'取消'2个按钮
       * 
       */
      buttons:{
        value:[
          {
            text:'确定',
            elCls : 'button button-primary',
            handler : function(){
              var _self = this,
                success = _self.get('success');
              if(success){
                success.call(_self);
              }
            }
          },{
            text:'取消',
            elCls : 'button button-primary',
            handler : function(dialog,btn){
              if(this.onCancel() !== false){
                this.close();
              }
            }
          }
        ]
      },
      /**
       * 弹出框显示内容的DOM容器ID
       * @cfg {Object} contentId
       */
      contentId:{
        view:true
      },
  	  /**
      * 点击成功时的回调函数
      * @cfg {Function} success
      */
      success : {
        value : function(){
          this.close();
        }
      },
      /**
       * 用户取消时调用，如果return false则阻止窗口关闭
       * @cfg {Function} cancel
       */
      cancel : {
        value : function(){

        }
      },
      dragNode : {
        /**
         * @private
         */
        valueFn : function(){
          return this.get('header');
        }
      },

      /**
       * 默认的加载控件内容的配置,默认值：
       * <pre>
       *  {
       *    property : 'bodyContent',
       *    autoLoad : false,
       *    lazyLoad : {
       *      event : 'show'
       *    },
       *    loadMask : {
       *      el : _self.get('body')
       *    }
       *  }
       * </pre>
       * @type {Object}
       */
      defaultLoaderCfg  : {
        valueFn :function(){
          var _self = this;
          return {
            property : 'bodyContent',
            autoLoad : false,
            lazyLoad : {
              event : 'show'
            },
            loadMask : {
              el : _self.get('body')
            }
          }
        } 
      },
      /**
       * 弹出框标题
       * @cfg {String} title
       */
      /**
       * 弹出框标题
       * <pre><code>
       *  dialog.set('title','new title');
       * </code></pre>
       * @type {String}
       */
      title : {
        view:true,
        value : ''
      },
      mask : {
        value:true
      },
      maskShared:{
        value:false
      },
      headerContent:{
        value:'<div class="' + CLS_TITLE + '">标题</div>'
      },
      footerContent:{

      },
      closeable:{
        value : true
      },
      xview:{
        value:dialogView
      }
    }
  },{
    xclass : 'dialog'
  });
  
  dialog.View = dialogView;
  return dialog;
  
});
/**
 * @fileOverview 消息框，警告、确认
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/overlay/message',['bui/overlay/dialog'],function (require) {
  var Dialog = require('bui/overlay/dialog'),
	  PREFIX = BUI.prefix,
    iconText ={
        info : 'i',
        error : '×',
        success : '<i class="icon-ok icon-white"></i>',
        question : '?',
        warning: '!'
    };

  /**
   * 消息框类，一般不直接创建对象，而是调用其Alert和Confirm方法
   * <pre><code>
   ** BUI.use('bui/overlay',function(overlay){
   * 
   *    BUI.Message.Alert('这只是简单的提示信息','info');
   *    BUI.Message.Alert('这只是简单的成功信息','success');
   *    BUI.Message.Alert('这只是简单的警告信息','warning');
   *    BUI.Message.Alert('这只是简单的错误信息','error');
   *    BUI.Message.Alert('这只是简单的询问信息','question');
   *
   *    //回调函数
   *    BUI.Message.Alert('点击触发回调函数',function() {
   *         alert('执行回调');
   *       },'error');
   *       
   *    //复杂的提示信息
   *    var msg = '&lt;h2&gt;上传失败，请上传10M以内的文件&lt;/h2&gt;'+
   *       '&lt;p class="auxiliary-text"&gt;如连续上传失败，请及时联系客服热线：0511-23883767834&lt;/p&gt;'+
   *       '&lt;p&gt;&lt;a href="#"&gt;返回list页面&lt;/a&gt; &lt;a href="#"&gt;查看详情&lt;/a&gt;&lt;/p&gt;';
   *     BUI.Message.Alert(msg,'error');
   *    //确认信息
   *    BUI.Message.Confirm('确认要更改么？',function(){
   *       alert('确认');
   *     },'question');
   * });
   * </code></pre>
   * @class BUI.Overlay.Message
   * @private
   * @extends BUI.Overlay.Dialog
   */
  var message = Dialog.extend({

    /**
     * @protected
     * @ignore
     */
    renderUI : function(){
      this._setContent();
    },
    bindUI : function(){
      var _self = this,
        body = _self.get('body');
      _self.on('afterVisibleChange',function(ev){
        if(ev.newVal){
          if(BUI.UA.ie < 8){
           /**
           * fix ie6,7 bug
           * @ignore
           */
            var outerWidth = body.outerWidth();
            if(BUI.UA.ie == 6){
              outerWidth = outerWidth > 350 ? 350 : outerWidth;
            }
            _self.get('header').width(outerWidth - 20);
            _self.get('footer').width(outerWidth);
          }
        }
      });
    },
    //根据模版设置内容
    _setContent : function(){
      var _self = this,
        body = _self.get('body'),
        contentTpl = BUI.substitute(_self.get('contentTpl'),{
          msg : _self.get('msg'),
          iconTpl : _self.get('iconTpl')
        });
      body.empty();

      $(contentTpl).appendTo(body);
    },
    //设置类型
    _uiSetIcon : function(v){
       if (!this.get('rendered')) {
            return;
        }
        this._setContent();
    },
    //设置文本
    _uiSetMsg : function(v){
       if (!this.get('rendered')) {
            return;
        }
        this._setContent();
    }

  },{
    ATTRS : 
    {
      /**
       * 图标类型
       * <ol>
       * <li>提示信息，类型参数<code>info</code></li>
       * <li>成功信息，类型参数<code>success</code></li>
       * <li>警告信息，类型参数<code>warning</code></li>
       * <li>错误信息，类型参数<code>error</code></li>
       * <li>确认信息，类型参数<code>question</code></li>
       * </ol>
       * @type {String}
       */
      icon : {

      },
      /**
       * 提示消息，可以是文本或者html
       * @cfg {String} msg
       */
      /**
       * 提示消息，可以是文本或者html
       * @type {String}
       */
      msg : {

      },
      /**
       * @private
       */
      iconTpl : {
        /**
         * @private
         */
        getter:function(){
          var _self = this,
            type = _self.get('icon');
          return '<div class="x-icon x-icon-' + type + '">' + iconText[type] + '</div>';
        }
      },
      /**
       * 内容的模版
       * @type {String}
       * @protected
       */
      contentTpl : {
        value : '{iconTpl}<div class="' + PREFIX + 'message-content">{msg}</div>'
      }
    }
  },{
    xclass : 'message',
    priority : 0
  });
  
  var singlelon = new message({
      icon:'info',
      title:''
  });
      
  function messageFun(buttons,defaultIcon){
   
    return function (msg,callback,icon){

      if(BUI.isString(callback)){
        icon = callback;
        callback = null;
      }
      icon = icon || defaultIcon;
      callback = callback || hide;
      showMessage({
        'buttons': buttons,
        'icon':icon,
        'msg':msg,
        'success' : callback
      });
    };
  }

  function showMessage(config){
    singlelon.set(config);
      
    singlelon.show();
  }

  function success(){
   var _self = this,
      success = _self.get('success');
    if(success){
      success.call(_self);
      _self.hide();
    }
  }

  function hide(){
     this.hide();
  }

  
  var Alert = messageFun([{
          text:'确定',
          elCls : 'button button-primary',
          handler : success
        }
      ],'info'),
    Confirm = messageFun([{
          text:'确定',
          elCls : 'button button-primary',
          handler : success
        },{
            text:'取消',
            elCls : 'button button-primary',
            handler : hide
          }
      ],'question');

  /**
   * 提示框静态类
   * @class BUI.Message
   */

  /**
   * 显示提示信息框
   * @static
   * @method
   * @member BUI.Message
   * @param  {String}   msg      提示信息
   * @param  {Function} callback 确定的回调函数
   * @param  {String}   icon     图标，提供以下几种图标：info,error,success,question,warning
   */
  message.Alert = Alert;

  /**
   * 显示确认框
   * <pre><code>
   * BUI.Message.Confirm('确认要更改么？',function(){
   *       alert('确认');
   * },'question');
   * </code></pre>
   * @static
   * @method
   * @member BUI.Message
   * @param  {String}   msg      提示信息
   * @param  {Function} callback 确定的回调函数
   * @param  {String}   icon     图标，提供以下几种图标：info,error,success,question,warning
   */
  message.Confirm = Confirm;

  /**
   * 自定义消息框，传入配置信息 {@link BUI.Overlay.Dialog} 和 {@link BUI.Overlay.Message}
   * @static
   * @method
   * @member BUI.Message
   * @param  {Object}   config  配置信息
   */
  message.Show = showMessage;

  return message;
});
/**
 * @fileOverview 悬浮层
 * @ignore
 */

define('bui/overlay/overlay',['bui/common'],function (require) {
  var BUI = require('bui/common'),
    Component =  BUI.Component,
    CLS_ARROW = 'x-align-arrow',
    UIBase = Component.UIBase;

  /**
   * 悬浮层的视图类
   * @class BUI.Overlay.OverlayView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.PositionView
   * @mixins BUI.Component.UIBase.CloseView
   * @private
   */
  var overlayView = Component.View.extend([
      UIBase.PositionView,
      UIBase.CloseView
    ]);

  /**
   * 悬浮层，显示悬浮信息，Message、Dialog的基类
   * <p>
   * <img src="../assets/img/class-overlay.jpg"/>
   * </p>
   * xclass : 'overlay'
   * ** 一般来说，overlay的子类，Dialog 、Message、ToolTip已经能够满足日常应用，但是使用overay更适合一些更加灵活的地方 **
   * ## 简单overlay
   * <pre><code>
   *   BUI.use('bui/overlay',function(Overlay){
   *     //点击#btn，显示overlay
   *     var overlay = new Overlay.Overlay({
   *       trigger : '#btn',
   *       content : '这是内容',
   *       align : {
   *         points : ['bl','tl']
   *       }, //对齐方式
   *       elCls : 'custom-cls', //自定义样式
   *       autoHide : true //点击overlay外面，overlay 会自动隐藏
   *     });
   *
   *     overlay.render();
   *   });
   * </code></pre>
   *
   * 
   * @class BUI.Overlay.Overlay
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.Position
   * @mixins BUI.Component.UIBase.Align
   * @mixins BUI.Component.UIBase.Close
   * @mixins BUI.Component.UIBase.AutoShow
   * @mixins BUI.Component.UIBase.AutoHide
   */
  var overlay = Component.Controller.extend([UIBase.Position,UIBase.Align,UIBase.Close,UIBase.AutoShow,UIBase.AutoHide],{
    renderUI : function(){
      var _self = this,
        el = _self.get('el'),
        arrowContainer = _self.get('arrowContainer'),
        container = arrowContainer ? el.one(arrowContainer) : el;
      if(_self.get('showArrow')){
        $(_self.get('arrowTpl')).appendTo(container);
      }
    },
    show : function(){
      var _self = this,
        effectCfg = _self.get('effect'),
        el = _self.get('el'),
		    visibleMode = _self.get('visibleMode'),
        effect = effectCfg.effect,
        duration = effectCfg.duration;

  	  
      //如果还未渲染，则先渲染控件
      if(!_self.get('rendered')){
        _self.set('visible',true);
        _self.render();
        _self.set('visible',false);
        el = _self.get('el');
      }

      if(visibleMode === 'visibility'){
        _self.set('visible',true);
        el.css({display : 'none'});
      }
      
      switch(effect){
        case  'linear' :
          el.show(duration,callback);
          break;
        case  'fade' :
          el.fadeIn(duration,callback);
          break;
        case  'slide' :
          el.slideDown(duration,callback);
          break;
        default:
          callback();
        break;
      }

      function callback(){
        if(visibleMode === 'visibility'){
          el.css({display : 'block'});
        }else{
          _self.set('visible',true);
        }
        if(effectCfg.callback){
          effectCfg.callback.call(_self);
        }
      }

    },
    hide : function(){
      var _self = this,
        effectCfg = _self.get('effect'),
        el = _self.get('el'),
        effect = effectCfg.effect,
        duration = effectCfg.duration;
  	  
      switch(effect){
        case 'linear':
          el.hide(duration,callback);
          break;
        case  'fade' :
          el.fadeOut(duration,callback);
          break;
        case  'slide' :
          el.slideUp(duration,callback);
          break;
        default:
          callback();
        break;
      }
      function callback(){
        if(_self.get('visibleMode') === 'visibility'){
          el.css({display : 'block'});
        }
        _self.set('visible',false);
        if(effectCfg.callback){
          effectCfg.callback.call(_self);
        }
      }

    }
  },{
    ATTRS : 
	/**
	* @lends BUI.Overlay.Overlay#
  * @ignore 
	**/	
	{
      /**
       * {Object} - 可选, 显示或隐藏时的特效支持, 对象包含以下配置
       * <ol>
       * <li>effect:特效效果，'none(默认无特效)','linear(线性)',fade(渐变)','slide(滑动出现)'</li>
       * <li>duration:时间间隔 </li>
       * </ol>
       * @type {Object}
       */
      effect:{
        value : {
          effect : 'none',
          duration : 0,
          callback : null
        }
      },
      /**
       * whether this component can be closed.
       * @default false
       * @type {Boolean}
       * @protected
       */
      closeable:{
          value:false
      },
      /**
       * 是否显示指向箭头，跟align属性的points相关
       * @cfg {Boolean} [showArrow = false]
       */
      showArrow : {
        value : false
      },
      /**
       * 箭头放置在的位置，是一个选择器，例如 .arrow-wraper
       *     new Tip({ //可以设置整个控件的模板
       *       arrowContainer : '.arrow-wraper',
       *       tpl : '<div class="arrow-wraper"></div>'
       *     });
       *     
       * @cfg {String} arrowContainer
       */
      arrowContainer : {
        view : true
      },
      /**
       * 指向箭头的模板
       * @cfg {Object} arrowTpl
       */
      arrowTpl : {
        value : '<s class="' + CLS_ARROW + '"><s class="' + CLS_ARROW + '-inner"></s></s>'
      },
      visibleMode : {
        value : 'visibility'
      },
      visible :{
        value:false
      },
      xview : {
        value : overlayView
      }
    }
  },{
    xclass:'overlay'
  });

  overlay.View = overlayView;
  return overlay;

});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview Picker的入口
 * @author dxq613@gmail.com
 * @ignore
 */

define('bui/picker',['bui/common','bui/picker/picker','bui/picker/listpicker'],function (require) {
  var BUI = require('bui/common'),
    Picker = BUI.namespace('Picker');

  BUI.mix(Picker,{
    Picker : require('bui/picker/picker'),
    ListPicker : require('bui/picker/listpicker')
  });

  return Picker;
});
/**
 * @fileOverview 列表项的选择器
 * @ignore
 */

define('bui/picker/listpicker',['bui/picker/picker','bui/list'],function (require) {

  var List = require('bui/list'),
    Picker = require('bui/picker/picker'),
    /**
     * 列表选择器,xclass = 'list-picker'
     * <pre><code>
     * BUI.use(['bui/picker'],function(Picker){
     *
     * var items = [
     *       {text:'选项1',value:'a'},
     *       {text:'选项2',value:'b'},
     *      {text:'选项3',value:'c'}
     *     ],
     *   picker = new Picker.ListPicker({
     *     trigger : '#show',  
     *     valueField : '#hide', //如果需要列表返回的value，放在隐藏域，那么指定隐藏域
     *     width:100,  //指定宽度
     *     children : [{
     *        elCls:'bui-select-list',
     *        items : items
     *     }] //配置picker内的列表
     *   });
     * picker.render();
     * });
     * </code></pre>
     * @class BUI.Picker.ListPicker
     * @extends BUI.Picker.Picker
     */
    listPicker = Picker.extend({
      initializer : function(){
        var _self = this,
          children = _self.get('children'),
          list = _self.get('list');
        if(!list){
          children.push({

          });
        }
      },
      /**
       * 设置选中的值
       * @override
       * @param {String} val 设置值
       */
      setSelectedValue : function(val){
        val = val ? val.toString() : '';
        var _self = this,
          list = _self.get('list'),
          selectedValue = _self.getSelectedValue();
        if(val !== selectedValue && list.getCount()){
          if(list.get('multipleSelect')){
            list.clearSelection();
          }
          list.setSelectionByField(val.split(','));
        }   
      },
      /**
       * @protected
       * @ignore
       */
      onChange : function(selText,selValue,ev){
        var _self = this,
          curTrigger = _self.get('curTrigger');
        _self.fire('selectedchange',{value : selValue,text : selText,curTrigger : curTrigger,item : ev.item});
      },
      /**
       * 获取选中的值，多选状态下，值以','分割
       * @return {String} 选中的值
       */
      getSelectedValue : function(){
        return this.get('list').getSelectionValues().join(',');
      },
      /**
       * 获取选中项的文本，多选状态下，文本以','分割
       * @return {String} 选中的文本
       */
      getSelectedText : function(){
        return this.get('list').getSelectionText().join(',');
      }
    },{
      ATTRS : {
        /**
         * 默认子控件的样式,默认为'simple-list'
         * @type {String}
         * @override
         */
        defaultChildClass:{
          value : 'simple-list'
        },
        /**
         * 选择的列表
         * <pre><code>
         *  var list = picker.get('list');
         *  list.getSelected();
         * </code></pre>
         * @type {BUI.List.SimpleList}
         * @readOnly
         */
        list : {
          getter:function(){
            return this.get('children')[0];
          }
        }
        /**
         * @event selectedchange
         * 选择发生改变事件
         * @param {Object} e 事件对象
         * @param {String} e.text 选中的文本
         * @param {string} e.value 选中的值
         * @param {Object} e.item 发生改变的选项
         * @param {jQuery} e.curTrigger 当前触发picker的元素
         */
      }
    },{
      xclass : 'list-picker'
    });

  return listPicker;
});
/**
 * @fileOverview 选择器
 * @ignore
 */

define('bui/picker/picker',['bui/overlay'],function (require) {
  
  var Overlay = require('bui/overlay').Overlay;

  /**
   * 选择器控件的基类，弹出一个层来选择数据，不要使用此类创建控件，仅用于继承实现控件
   * xclass : 'picker'
   * <pre><code>
   * BUI.use(['bui/picker','bui/list'],function(Picker,List){
   *
   * var items = [
   *       {text:'选项1',value:'a'},
   *       {text:'选项2',value:'b'},
   *      {text:'选项3',value:'c'}
   *     ],
   *   list = new List.SimpleList({
   *     elCls:'bui-select-list',
   *     items : items
   *   }),
   *   picker = new Picker.ListPicker({
   *     trigger : '#show',  
   *     valueField : '#hide', //如果需要列表返回的value，放在隐藏域，那么指定隐藏域
   *     width:100,  //指定宽度
   *     children : [list] //配置picker内的列表
   *   });
   * picker.render();
   * });
   * </code></pre>
   * @abstract
   * @class BUI.Picker.Picker
   * @extends BUI.Overlay.Overlay
   */
  var picker = Overlay.extend({
    
      bindUI : function(){
        var _self = this,
          innerControl = _self.get('innerControl'),
          hideEvent = _self.get('hideEvent'),
          trigger = $(_self.get('trigger'));

        trigger.on(_self.get('triggerEvent'),function(e){
          if(_self.get('autoSetValue')){
            var valueField = _self.get('valueField') || _self.get('textField') || this,
              val = $(valueField).val();
            _self.setSelectedValue(val);
          }
        });

        innerControl.on(_self.get('changeEvent'),function(e){
          var curTrigger = _self.get('curTrigger'),
            textField = _self.get('textField') || curTrigger || trigger,
            valueField = _self.get('valueField'),
            selValue = _self.getSelectedValue(),
            isChange = false;

          if(textField){
            var selText = _self.getSelectedText(),
              preText = $(textField).val();
            if(selText != preText){
              $(textField).val(selText);
              isChange = true;
            }
          }
          
          if(valueField){
            var preValue = $(valueField).val();  
            if(valueField != preValue){
              $(valueField).val(selValue);
              isChange = true;
            }
          }
          if(isChange){
            _self.onChange(selText,selValue,e);
          }
        });
        if(hideEvent){
          innerControl.on(_self.get('hideEvent'),function(){
            var curTrigger = _self.get('curTrigger');
            try{ //隐藏时，在ie6,7下会报错
              if(curTrigger){
                curTrigger.focus();
              }
            }catch(e){
              BUI.log(e);
            }
            _self.hide();
          });
        }
      },
      /**
       * 设置选中的值
       * @template
       * @protected
       * @param {String} val 设置值
       */
      setSelectedValue : function(val){
        
      },
      /**
       * 获取选中的值，多选状态下，值以','分割
       * @template
       * @protected
       * @return {String} 选中的值
       */
      getSelectedValue : function(){
        
      },
      /**
       * 获取选中项的文本，多选状态下，文本以','分割
       * @template
       * @protected
       * @return {String} 选中的文本
       */
      getSelectedText : function(){

      },
      /**
       * @protected
       * 发生改变
       */
      onChange : function(selText,selValue,ev){
        var _self = this,
          curTrigger = _self.get('curTrigger');
        _self.fire('selectedchange',{value : selValue,text : selText,curTrigger : curTrigger});
      },
      _uiSetValueField : function(v){
        var _self = this;
        if(v){
          _self.setSelectedValue($(v).val());
        }
      },
      _getTextField : function(){
        var _self = this;
        return _self.get('textField') || _self.get('curTrigger');
      }
  },{
    ATTRS : {
      
      /**
       * 用于选择的控件，默认为第一个子元素,此控件实现 @see {BUI.Component.UIBase.Selection} 接口
       * @protected
       * @type {Object|BUI.Component.Controller}
       */
      innerControl : {
        getter:function(){
          return this.get('children')[0];
        }
      },
      /**
       * 显示选择器的事件
       * @cfg {String} [triggerEvent='click']
       */
      /**
       * 显示选择器的事件
       * @type {String}
       * @default 'click'
       */
      triggerEvent:{
        value:'click'
      },
      /**
       * 选择器选中的项，是否随着触发器改变
       * @cfg {Boolean} [autoSetValue=true]
       */
      /**
       * 选择器选中的项，是否随着触发器改变
       * @type {Boolean}
       */
      autoSetValue : {
        value : true
      },
      /**
       * 选择发生改变的事件
       * @cfg {String} [changeEvent='selectedchange']
       */
      /**
       * 选择发生改变的事件
       * @type {String}
       */
      changeEvent : {
        value:'selectedchange'
      },
      /**
       * 自动隐藏
       * @type {Boolean}
       * @override
       */
      autoHide:{
        value : true
      },
      /**
       * 隐藏选择器的事件
       * @protected
       * @type {String}
       */
      hideEvent:{
        value:'itemclick'
      },
      /**
       * 返回的文本放在的DOM，一般是input
       * @cfg {String|HTMLElement|jQuery} textField
       */
      /**
       * 返回的文本放在的DOM，一般是input
       * @type {String|HTMLElement|jQuery}
       */
      textField : {

      },
      align : {
        value : {
           points: ['bl','tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
           offset: [0, 0]      // 有效值为 [n, m]
        }
      },
      /**
       * 返回的值放置DOM ,一般是input
       * @cfg {String|HTMLElement|jQuery} valueField
       */
      /**
       * 返回的值放置DOM ,一般是input
       * @type {String|HTMLElement|jQuery}
       */
      valueField:{

      }
      /**
       * @event selectedchange
       * 选中值改变事件
       * @param {Object} e 事件对象
       * @param {String} text 选中的文本
       * @param {string} value 选中的值
       * @param {jQuery} curTrigger 当前触发picker的元素
       */
    }
  },{
    xclass:'picker'
  });

  return picker;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 进度条命名空间入口
 * @ignore
 */

define('bui/progressbar',['bui/common','bui/progressbar/base','bui/progressbar/load'],function (require) {
  var BUI = require('bui/common'),
    ProgressBar = BUI.namespace('ProgressBar');
  BUI.mix(ProgressBar,{
    Base : require('bui/progressbar/base'),
    Load : require('bui/progressbar/load')
  });

  return ProgressBar;
});
/**
 * @fileOverview 异步进度条
 * @author dengbin
 * @ignore
 */

define('bui/progressbar/load',['bui/progressbar/base'],function(require){

	var Base = require('bui/progressbar/base'),
	 	notStarted = 0,
		hasStarted = 1,
		hasEnded = 2;
	/**
	 * 异步加载进度条
	 *<pre><code>
	 *  BUI.use('bui/progressbar',function(ProgressBar){
   *   
   *    var Progressbar = ProgressBar.Load;
   *    var num = 10,
   *      ajaxCfg = {     
   *        url : 'data/progress-bar-data.php',
   *        dataType : 'json',
   *        data : {
   *          id :num
   *        }
   *      };
   *    var progressbar = new Progressbar({
   *      render : '#progressbar',
   *      tpl : '<div class="bar"></div>',
   *      elCls:'progress progress-striped active',
   *      ajaxCfg : ajaxCfg,
   *      interval : 1000
   *    });
   *
   *    progressbar.render();
	 *		$('.button-primary').click(function(){
   *      num = 10;
   *      ajaxCfg.data.id = num;
   *      progressbar.start();
   *    });
 
   *    $('.button-danger').click(function(){
   *      progressbar.cancel();
   *    });
   *      
   *  });
   * </code></pre>
	 * @extends BUI.ProgressBar.Base
	 * @class  BUI.ProgressBar.Load
	 */
	var loadProgressBar = Base.extend({
		/**
	     * @protected
	     * @ignore
	     */
		bindUI : function () {
			var _self = this;

			_self.on('afterPercentChange',function (ev) {
				if(_self.isLoading()){
					var percent = _self.get('percent');
					if(percent == 100 ){
						_self.onCompleted();
					}
					_self.onChange();
				}
			});

		},
		/**
		 * 开始
		 * <pre><code>
		 *   progressbar.start();
		 * </code></pre>
		 */
		start : function  () {
			var _self = this;
			if(!_self.isLoading()){
				_self.onstart();
			}
		},
		/**
		 * 完成
		 * <pre><code>
		 *   progressbar.complete();
		 * </code></pre>
		 */
		complete : function(){
			var _self = this;
			clearTimeout(_self.get('t'));
			_self.set('percent',100);
			
		},
		/**
		 * 取消
		 * <pre><code>
		 *   progressbar.cancel();
		 * </code></pre>
		 */
		cancel : function(){
			var _self = this;
			clearTimeout(_self.get('t'));
			if(_self.get('percent')){
				_self.set('percent',0);
			}
			_self.set('status',notStarted);
		},
		/**
		 * 开始
		 * @protected
		 */
		onstart : function(){
			var _self = this,
				cfg = _self.get('cfg');

			_self.set('percent',0);
			_self.set('status',hasStarted);
			
			_self.fire('start',cfg);
			_self._startLoad();
		},
		/**
		 * 加载变化
		 * @protected
		 */
		onChange : function(){
			var _self = this;
			_self.fire('loadchange');
		},

		/**
		 * 完成
		 * @protected
		 */
		onCompleted : function(){
			var _self = this;
			_self.set('status',hasEnded);
			_self.fire('completed');
			
		},
		/**
		 * 是否正在加载
		 * @return {Boolean} 是否正在加载
		 */
		isLoading : function  () {
			return this.get('status') === hasStarted;
		},
		/**
		 * 是否已经加载完毕
		 * @return {Boolean} 是否加载完毕
		 */
		isCompleted : function () {
			return this.get('status') === hasEnded;
		},
		_startLoad : function () {
			var _self = this,
				ajaxCfg = _self.get('ajaxCfg'),
				interval = _self.get('interval'),
				t;
			ajaxCfg.success = function(data){
				var percent = data.percent;
				_self.set('percent',percent);
				if(percent < 100 && _self.isLoading()){
					t = setTimeout(function(){
						$.ajax(ajaxCfg);
					},interval);
					_self.set('t',t);
				}
			};
			$.ajax(ajaxCfg);
			
		}
	},{
		ATTRS : {
			/**
			 * 进度条状态
			 * 0： 未开始
			 * 1 ： 已开始
			 * 2 ： 以结束
			 * @type {Number}
			 */
			status : {
				value : 0
			},
			/**
			 * ajax配置项
			 * @type {Object}
			 */
			ajaxCfg : {

			},
			/**
			 * 发送请求时间间隔
			 * @type {number}
			 */
			interval : {
				value : 500
			},
			/**  
	        * 当数据加载完成后
	        * @name BUI.ProgressBar.Load  
	        * @event  
	        * @param {jQuery.Event} e  事件对象，包含加载数据时的参数
	        */
			events : {
				value : [
					'start',
					'loadchange',
					'completed'
				]
			}
		}
	},{
		xclass : 'progress-bar-load'
	});

	return loadProgressBar;
});

/**
 * @fileOverview 进度条
 * @author dengbin
 * @ignore
 */

define('bui/progressbar/base',['bui/common'],function(require){

	var BUI = require('bui/common');

	var progressBarView = BUI.Component.View.extend({
		_uiSetPercent : function (v) {

			var _self = this,
				innerEl = _self.get('el').children();
			if(!BUI.isArray(v)){
				v = [v];
			}
			BUI.each(innerEl,function (item,index) {
				$(item).width(v[index] + '%');
			});

		}
	},{
		ATTRS:{
			percent:{}
		}
	});
	/**
 	* 基础进度条，用于显示进度
 	* xclass:'progress-bar'
 	* <pre><code>
 	*  BUI.use('bui/progressbar',function(ProgressBar){
  *   
  *     var Progressbar = ProgressBar.Base,
  *       progressbar = new Progressbar({
  *         elCls : 'progress progress-striped active',
  *         render : '#progressbar',
  *         tpl : '<div class="bar"></div>',
  *         percent:10
  *       });
  *     progressbar.render();
  *  });
  * </code></pre>
 	* @class BUI.ProgressBar.Base
	* @extends BUI.Component.Controller
	*/
	var progressBar = BUI.Component.Controller.extend({

	},{
		ATTRS : {
			/**
	        * 进度百分比
	        * @type {number}
	        */
			percent : {
				view:true,
				value: 0
			},
			tpl : {
				value : '<div class="progress-bar-inner"></div>'
			},
			xview : {
				value : progressBarView
			}
		}

	},{
		xclass:'progress-bar'
	});

	return progressBar;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 切换标签入口
 * @ignore
 */

define('bui/tab',['bui/common','bui/tab/tab','bui/tab/tabitem','bui/tab/navtabitem','bui/tab/navtab','bui/tab/tabpanel','bui/tab/tabpanelitem'],function (require) {
  var BUI = require('bui/common'),
    Tab = BUI.namespace('Tab');

  BUI.mix(Tab,{
    Tab : require('bui/tab/tab'),
    TabItem : require('bui/tab/tabitem'),
    NavTabItem : require('bui/tab/navtabitem'),
    NavTab : require('bui/tab/navtab'),
    TabPanel : require('bui/tab/tabpanel'),
    TabPanelItem : require('bui/tab/tabpanelitem')
  });

  return Tab;
});
/**
 * @fileOverview 导航标签
 * @author dxq613@gmail.com
 * @ignore              
 */
define('bui/tab/navtab',['bui/common','bui/menu'],function(require){

  var BUI = require('bui/common'),
    Menu = require('bui/menu'),
    Component =  BUI.Component,
    CLS_NAV_LIST = 'tab-nav-list',
    CLS_ARROW_LEFT = 'arrow-left',
    CLS_ARROW_RIGHT = 'arrow-right',
    CLS_FORCE_FIT = BUI.prefix + 'tab-force',
    ID_CLOSE = 'm_close',
    ITEM_WIDTH = 140;

  /**
   * 导航标签的视图类
   * @class BUI.Tab.NavTabView
   * @extends BUI.Component.View
   * @private
   */
  var navTabView = Component.View.extend({
    renderUI : function(){
      var _self = this,
        el = _self.get('el'),
        listEl = null;

      listEl = el.find('.' + CLS_NAV_LIST);
      _self.setInternal('listEl',listEl);
    },
    getContentElement : function(){
      
      return this.get('listEl');
    },
    getTabContentContainer : function(){
      return this.get('el').find('.tab-content-container');
    },
    _uiSetHeight : function(v){
      var _self = this,
        el = _self.get('el'),
        barEl = el.find('.tab-nav-bar'),
        containerEl = _self.getTabContentContainer();
      if(v){
        containerEl.height(v - barEl.height());
      }
      el.height(v);
    },
    //设置自动适应宽度
    _uiSetForceFit : function(v){
      var _self = this,
        el = _self.get('el');
      if(v){
        el.addClass(CLS_FORCE_FIT);
      }else{
        el.removeClass(CLS_FORCE_FIT);
      }
    }
  },{
    ATTRS : {
      forceFit : {}
    }
  },{
    xclass : 'nav-tab-view',
    priority:0
  });
  /**
   * 导航标签
   * @class BUI.Tab.NavTab
   * @extends BUI.Component.Controller
   */
  var navTab = Component.Controller.extend(
    /**
     * @lends BUI.Tab.NavTab.prototype
     * @ignore
     */
    {
      /**
       * 添加标签项
       * @param {Object} config 菜单项的配置项
       * @param {Boolean} reload 如果标签页已存在，则重新加载
       */
      addTab:function(config,reload){
        var _self = this,
          id = config.id || BUI.guid('tab-item'),
          forceFit = _self.get('forceFit'),
          item = _self.getItemById(id);

        if(item){
          var hrefChage = false;
          if(config.href && item.get('href') != config.href){
            item.set('href',config.href);
            hrefChage = true;
          }
          _self._setItemActived(item);
          if(reload && !hrefChage){
            item.reload();
          }
        }else{

          config = BUI.mix({
            id : id,
            visible : false,
            actived : true,
            xclass : 'nav-tab-item'
          },config);

          item = _self.addChild(config);
          if(forceFit){
            _self.forceFit();
          }
          item.show();
          _self._resetItemList();
        }
        return item;
      },
      /**
       * 获取导航标签，存放内容的节点
       * @return {jQuery} 导航内容的容器
       */
      getTabContentContainer : function(){
        return this.get('view').getTabContentContainer();
      },
      //绑定事件
      bindUI: function(){
        var _self = this,
          forceFit = _self.get('forceFit');
        if(!forceFit){
          _self._bindScrollEvent();
          _self.on('afterVisibleChange',function(ev){
            var item = ev.target;
            if(item.get('actived')){
              _self._scrollToItem(item);
            }
          });
        }

        //监听点击标签
        _self.on('click',function(ev){
          var item = ev.target;
          if(item != _self){
            _self._setItemActived(item);
            _self.fire('itemclick',{item:item});
          }
        });

        //关闭标签
        _self.on('closed',function(ev){
          var item = ev.target;
          _self._closeItem(item);
        });

        _self.on('showmenu',function(ev){
          _self._showMenu(ev.target,ev.position);
        });

        
      },
      //绑定滚动事件
      _bindScrollEvent : function(){
        var _self = this,
          el = _self.get('el');

        el.find('.arrow-left').on('click',function(){
          if(el.hasClass(CLS_ARROW_LEFT + '-active')){
            _self._scrollLeft();
          }
        });

        el.find('.arrow-right').on('click',function(){
          if(el.hasClass(CLS_ARROW_RIGHT + '-active')){
            _self._scrllRight();
          }
        });
      },
      _showMenu : function(item,position){
        var _self = this,
            menu = _self._getMenu(),
            closeable = item.get('closeable'),
            closeItem;

        _self.set('showMenuItem',item);

        menu.set('xy',[position.x,position.y]);
        menu.show();
        closeItem = menu.getItem(ID_CLOSE);
        if(closeItem){
          closeItem.set('disabled',!closeable);
        }
      },
      /**
       * 通过id,设置选中的标签项
       * @param {String} id 标签编号
       */
      setActived : function(id){
        var _self = this,
          item = _self.getItemById(id);
        _self._setItemActived(item);
      },
      /**
       * 获取当前选中的标签项
       * @return {BUI.Tab.NavTabItem} 选中的标签对象
       */
      getActivedItem : function(){
        var _self = this,
          children = _self.get('children'),
          result = null;
        BUI.each(children,function(item){
          if(item.get('actived')){
            result = item;
            return false;
          }
        });
        return result;
      },
      /**
       * 通过编号获取标签项
       * @param  {String} id 标签项的编号
       * @return {BUI.Tab.NavTabItem} 标签项对象
       */
      getItemById : function(id){
        var _self = this,
          children = _self.get('children'),
          result = null;
        BUI.each(children,function(item){
          if(item.get('id') === id){
            result = item;
            return false;
          }
        });
        return result;
      },
      _getMenu : function(){
        var _self = this;

        return _self.get('menu') || _self._initMenu();
      },
      _initMenu : function(){
        var _self = this,
          menu = new Menu.ContextMenu({
              children : [
              {

                xclass : 'context-menu-item',
                iconCls:'icon icon-refresh',
                text : '刷新',
                listeners:{
                  'click':function(){
                    var item = _self.get('showMenuItem');
                    if(item){
                      item.reload();
                    }
                  }
                }
              },
              {
                id : ID_CLOSE,
                xclass : 'context-menu-item',
                iconCls:'icon icon-remove',
                text: '关闭',
                listeners:{
                  'click':function(){
                    var item = _self.get('showMenuItem');
                    if(item){
                      item.close();
                    }
                  }
                }
              },
              {
                xclass : 'context-menu-item',
                iconCls:'icon icon-remove-sign',
                text : '关闭其他',
                listeners:{
                  'click':function(){
                    var item = _self.get('showMenuItem');
                    if(item){
                      _self.closeOther(item);
                    }
                  }
                }
              },
              {
                xclass : 'context-menu-item',
                iconCls:'icon icon-remove-sign',
                text : '关闭所有',
                listeners:{
                  'click':function(){
                    _self.closeAll();
                  }
                }
              }

            ]
          });
          
        _self.set('menu',menu);
        return menu;
      },
      //关闭标签项
      _closeItem : function(item){
        var _self = this,
          index = _self._getIndex(item),
          activedItem = _self.getActivedItem(),
          preItem = _self.get('preItem') || _self._getItemByIndex(index -1),
          nextItem = _self._getItemByIndex(index + 1);

        item.hide(function(){
          _self.removeChild(item,true);
          _self._resetItemList();
          if(activedItem === item){
            if(preItem){
              _self._setItemActived(preItem);
            }else{
              _self._setItemActived(nextItem);
            }
          }else{//删除标签项时，可能会引起滚动按钮状态的改变
            _self._scrollToItem(activedItem);;
          }
          _self.forceFit();
        });
        
      },
      closeAll:function(){
        var _self = this,
          children = _self.get('children');
        BUI.each(children,function(item){
          item.close();
        });
      },
      closeOther : function(curItem){
        var _self = this,
          children = _self.get('children');
        BUI.each(children,function(item){
          if(curItem !==item){
            item.close();
          }
          
        });
      },
      //通过位置查找标签项
      _getItemByIndex : function(index){
        var _self = this,
          children = _self.get('children');  
        return children[index];
      },
      //获取标签项的位置
      _getIndex : function(item){
        var _self = this,
          children = _self.get('children');    
        return BUI.Array.indexOf(item,children);
      },
      //重新计算标签项容器的宽度位置
      _resetItemList : function(){
        if(this.get('forceFit')){
          return;
        }
        var _self = this,
          container = _self.getContentElement();

        container.width(_self._getTotalWidth());

      },
      //获取选项的总宽度，以默认宽度为基数
      _getTotalWidth : function(){
        var _self = this,
          children = _self.get('children');

        return children.length * _self.get('itemWidth');
      },
      _getForceItemWidth : function(){
        var _self = this,
          width =  _self.getContentElement().width(),
          children = _self.get('children'),
          totalWidth = _self._getTotalWidth(),
          itemWidth = _self.get(itemWidth);
        if(totalWidth > width){
          itemWidth = width/children.length;
        }
        return itemWidth;
      },
      forceFit : function(){
        var _self = this;
        _self._forceItemWidth(_self._getForceItemWidth());
      },
      //设置平均宽度
      _forceItemWidth : function(width){
        width = width || this.get('itemWidth');
        var _self = this,
          children = _self.get('children');
        BUI.each(children,function(item){
          item.set('width',width);
        });
      },
      //使指定标签项在用户可视区域内
      _scrollToItem : function(item){
        if(this.get('forceFit')){ //自适应后，不进行滚动
          return;
        }
        var _self = this,
          container = _self.getContentElement(),
          containerPosition = container.position(),
          disWidth = _self._getDistanceToEnd(item,container,containerPosition),
          disBegin = _self._getDistanceToBegin(item,containerPosition); //当前活动的项距离最右端的距离

        //如果标签项列表小于整个标签容器的大小，则左对齐
        if(container.width() < container.parent().width()){
          _self._scrollTo(container,0);  
        }else if(disBegin < 0){//如果左边被遮挡，向右移动

          _self._scrollTo(container,containerPosition.left - (disBegin));

        }else if(disWidth > 0){//如果当前节点被右端遮挡，则向左滚动到显示位置
        
          _self._scrollTo(container,containerPosition.left + (disWidth) * -1);

        }else if(containerPosition.left < 0){//将左边移动，使最后一个标签项离右边最近
          var lastDistance = _self._getLastDistance(container,containerPosition),
            toLeft = 0;
          if(lastDistance < 0){
            toLeft = containerPosition.left - lastDistance;
            toLeft = toLeft < 0 ? toLeft : 0;
            _self._scrollTo(container,toLeft);  
          }
        }
      },
      //获取标签到最左端的距离
      _getDistanceToBegin : function(item,containerPosition){
        var position = item.get('el').position();

        return position.left + containerPosition.left;
      },
      /**
       * 获取标签到最右端的距离
       * @return  {Number} 像素
       * @private
       */
      _getDistanceToEnd : function(item,container,containerPosition){
        var _self = this,
          container = container || _self.getContentElement(),
          wraperWidth = container.parent().width(),
          containerPosition = containerPosition || container.position(),
          offsetLeft = _self._getDistanceToBegin(item,containerPosition),
          disWidth = offsetLeft + _self.get('itemWidth') - wraperWidth; 
        return disWidth;
      },
      //获取最后一个标签项离右边的间距
      _getLastDistance : function(container,containerPosition){
        var _self = this,
          children = _self.get('children'),
          lastItem = children[children.length - 1];
        if(lastItem)
        {
          return _self._getDistanceToEnd(lastItem,container,containerPosition);
        }
        return 0;
      },
      _scrollTo : function(el,left,callback){
        var _self = this;
        el.animate({left:left},500,function(){
           _self._setArrowStatus(el);
        });
      },
      _scrollLeft : function(){
        var _self = this,
          container = _self.getContentElement(),
          position = container.position(),
          disWidth = _self._getLastDistance(container,position),
          toLeft;
        if(disWidth > 0 ){
          toLeft = disWidth > _self.get('itemWidth') ? _self.get('itemWidth') : disWidth;
          _self._scrollTo(container,position.left - toLeft);
        }

      },
      //向右滚动
      _scrllRight : function(){
        var _self = this,
          container = _self.getContentElement(),
          position = container.position(),
          toRight;
        if(position.left < 0){
          toRight = position.left + _self.get('itemWidth');
          toRight = toRight < 0 ? toRight : 0;
          _self._scrollTo(container,toRight);
        }
      },
      //设置向左，向右的箭头是否可用
      _setArrowStatus : function(container,containerPosition){

        container = container || this.getContentElement();
        var _self = this,
          wapperEl = _self.get('el'),
          position = containerPosition || container.position(),
          disWidth = _self._getLastDistance(container,containerPosition);

        //可以向左边滚动
        if(position.left < 0){
          wapperEl.addClass(CLS_ARROW_RIGHT+'-active');
        }else{
          wapperEl.removeClass(CLS_ARROW_RIGHT+'-active');
        }

        if(disWidth > 0){
          wapperEl.addClass(CLS_ARROW_LEFT+'-active');
        }else{
          wapperEl.removeClass(CLS_ARROW_LEFT+'-active');
        }
      },
      //设置当前选中的标签
      _setItemActived:function(item){
        var _self = this,
          preActivedItem = _self.getActivedItem();
        if(item === preActivedItem){
          return;
        }

        if(preActivedItem){
          preActivedItem.set('actived',false);
        }
        _self.set('preItem',preActivedItem);
        if(item){
          if(!item.get('actived')){
            item.set('actived',true);
          }
          //当标签项可见时，否则无法计算位置信息
          if(item.get('visible')){
            _self._scrollToItem(item);
          }
          
          _self.fire('activeChange',{item:item});
        }
      }

    },
    
    {
      ATTRS : 
    /**
      * @lends BUI.Tab.NavTab.prototype
      * @ignore
      */    
    {
        defaultChildClass:{
          value : 'nav-tab-item'
        },
        /**
         * @private
         * 右键菜单
         * @type {Object}
         */
        menu : {

        },
        /**
         * 设置此参数时，标签选项的宽度会进行自适应
         * @cfg {Boolean} forceFit
         */
        forceFit : {
          view : true,
          value : false
        },
        /**
         * 标签的默认宽度,140px，设置forceFit:true后，此宽度为最宽宽度
         * @type {Number}
         */
        itemWidth : {
          value : ITEM_WIDTH
        },
        /**
         * 渲染标签的模版
         * @type {String}
         */
        tpl : {
          view : true,
          value : '<div class="tab-nav-bar">'+
            '<s class="tab-nav-arrow arrow-left"></s><div class="tab-nav-wrapper"><div class="tab-nav-inner"><ul class="'+CLS_NAV_LIST+'"></ul></div></div><s class="tab-nav-arrow arrow-right"></s>'+
            '</div>'+
            '<div class="tab-content-container"></div>'
        },
        xview : {
          value : navTabView
        },
        events : {
                
          value : {
            /**
             * 点击标签项
             * @event
             * @param {Object} e 事件对象
             * @param {BUI.Tab.NavTabItem} e.item 标签项
             */
            'itemclick' : false
          }
        }
      }
    },
    {
      xclass:'nav-tab',
      priority : 0

    }
  );

  return navTab;
});
/**
 * @fileOverview 导航项
 * @author dxq613@gmail.com
 * @ignore
 */
define('bui/tab/navtabitem',['bui/common'],function(requrie){

  var BUI = requrie('bui/common'),
    Component =  BUI.Component,
    CLS_ITEM_TITLE = 'tab-item-title',
    CLS_ITEM_CLOSE = 'tab-item-close',
    CLS_ITEM_INNER = 'tab-item-inner',
    CLS_NAV_ACTIVED = 'tab-nav-actived',
    CLS_CONTENT = 'tab-content';

  /**
   * 导航标签项的视图类
   * @class BUI.Tab.NavTabItemView
   * @extends BUI.Component.View
   * @private
   */
  var navTabItemView =  Component.View.extend({
    renderUI : function(){
      var _self = this,
        contentContainer = _self.get('tabContentContainer'),
        contentTpl = _self.get('tabContentTpl');
      if(contentContainer){
        var tabContentEl = $(contentTpl).appendTo(contentContainer);
        _self.set('tabContentEl',tabContentEl);
      }
    },
    //设置链接地址
    _uiSetHref : function(v){
      this._setHref(v);
    },
    _setHref : function(href){
      var _self = this,
        tabContentEl = _self.get('tabContentEl');
      href = href || _self.get('href');
      if(tabContentEl){
        $('iframe',tabContentEl).attr('src',href);
      }
    },
    resetHref : function(){
      this._setHref();
    },
    //设置标题
    _uiSetTitle : function(v){
      var _self = this,
        el = _self.get('el');
      el.attr('title',v);
      $('.' + CLS_ITEM_TITLE,el).text(v);
    },
    _uiSetActived : function(v){
      var _self = this,
        el = _self.get('el');

      _self.setTabContentVisible(v);
      if(v){
        el.addClass(CLS_NAV_ACTIVED);
      }else{
        el.removeClass(CLS_NAV_ACTIVED);
      }

    },
    //析构函数
    destructor : function(){
      var _self = this,
        tabContentEl = _self.get('tabContentEl');
      if(tabContentEl){
        tabContentEl.remove();
      }
    },
    //设置标签内容是否可见
    setTabContentVisible : function(v){
      var _self = this,
        tabContentEl = _self.get('tabContentEl');

      if(tabContentEl){
        if(v){
          tabContentEl.show();
        }else{
          tabContentEl.hide();
        }
      }
    }

  },{

    ATTRS : {

      tabContentContainer:{

      },
      tabContentEl: {

      },
      title:{

      },
      href:{

      }
    }
  });

  /**
   * 导航标签项
   * xclass : 'nav-tab-item'
   * @class BUI.Tab.NavTabItem
   * @extends BUI.Component.Controller
   */
  var navTabItem = Component.Controller.extend(
  /**
   * @lends BUI.Tab.NavTabItem.prototype
   * @ignore
   */
  {
    /**
     * 创建DOM
     * @protected
     */
    createDom : function(){
      var _self = this,
          parent = _self.get('parent');
      if(parent){
        _self.set('tabContentContainer',parent.getTabContentContainer());
      }
    },
    /**
     * 绑定事件
     * @protected
     */
    bindUI : function(){
      var _self = this,
        el = _self.get('el'),
        events = _self.get('events');

      el.on('click',function(ev){
        var sender = $(ev.target);
       if(sender.hasClass(CLS_ITEM_CLOSE)){
          if(_self.fire('closing')!== false){
            _self.close();
          }
        }
      });
    },
    /**
     * 处理双击
     * @protected
     */
    handleDblClick:function(ev){
      var _self = this;

      if(_self.fire('closing')!== false){
        _self.close();
      }
      _self.fire('dblclick',{domTarget : ev.target,domEvent : ev});
    },
    /**
     * 处理右键
     * @protected
     */
    handleContextMenu:function(ev){
      ev.preventDefault();
      this.fire('showmenu',{position:{x:ev.pageX,y:ev.pageY}});
    },
    /**
     * 设置标题
     * @param {String} title 标题
     */
    setTitle : function(title){
      this.set('title',title);
    },
    /**
    * 关闭
    */
    close:function(){
      this.fire('closed');
    },
    /**
     * 重新加载页面
     */
    reload : function(){
      this.get('view').resetHref();
    },
    /**
     * @protected
     * @ignore
     */
    show : function(){
      var _self = this;
        _self.get('el').show(500,function(){
          _self.set('visible',true);
        });
    },
    /**
     * @protected
     * @ignore
     */
    hide : function(callback){
      var _self = this;
      this.get('el').hide(500,function(){
        _self.set('visible',false);
        callback && callback();
      });
    },

    _uiSetActived : function(v){
      var _self = this,
        parent = _self.get('parent');
      if(parent && v){
        parent._setItemActived(_self);
      }
    },
    _uiSetCloseable : function(v){
      var _self = this,
        el = _self.get('el'),
        closeEl = el.find('.' + CLS_ITEM_CLOSE);
      if(v){
        closeEl.show();
      }else{
        closeEl.hide();
      }
    }
  },{
    ATTRS : 
    /**
     * @lends BUI.Tab.NavTabItem#
     * @ignore
     */
    {
      elTagName : {
        value: 'li'
      },
      /**
       * 标签是否选中
       * @type {Boolean}
       */
      actived : {
        view:true,
        value : false
      }, 
      /**
       * 是否可关闭
       * @type {Boolean}
       */
      closeable : {
        value : true
      },
      allowTextSelection:{
        view:false,
        value:false
      },
      events:{
        value : {
          /**
           * 点击菜单项
           * @name BUI.Tab.NavTabItem#click
           * @event 
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 正在点击的标签
           */
          'click' : true,
          /**
           * 正在关闭，返回false可以阻止关闭事件发生
           * @name BUI.Tab.NavTabItem#closing
           * @event 
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 正在关闭的标签
           */
          'closing' : true,
          /**
           * 关闭事件
           * @name BUI.Tab.NavTabItem#closed
           * @event 
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 关闭的标签
           */
          'closed' : true,
          /**
           * @name BUI.Tab.NavTabItem#showmenu
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 显示菜单的标签
           */
          'showmenu' : true,
          'afterVisibleChange' : true
        }
      },
      /**
       * @private
       * @type {Object}
       */
      tabContentContainer:{
        view : true
      },
      /**
       * @private
       * @type {Object}
       */
      tabContentTpl : {
        view : true,
        value : '<div class="' + CLS_CONTENT + '" style="display:none;"><iframe src="" width="100%" height="100%" frameborder="0"></iframe></div>'
      },
      /**
       * 标签页指定的URL
       * @cfg {String} href
       */
      /**
       * 标签页指定的URL
       * @type {String}
       */
      href : {
        view : true,
        value:''
      },
      visible:{
        view:true,
        value:true
      },
      /**
       * 标签文本
       * @cfg {String} title
       */
      /**
       * 标签文本
       * tab.getItem('id').set('title','new title');
       * @type {String}
       * @default ''
       */
      title : {
        view:true,
        value : ''
      },
      tpl : {
        view:true,
        value :'<s class="l"></s><div class="' + CLS_ITEM_INNER + '">{icon}<span class="' + CLS_ITEM_TITLE + '"></span><s class="' + CLS_ITEM_CLOSE + '"></s></div><s class="r"></s>'
      },
      xview:{
        value : navTabItemView
      }
    }
  },{
    xclass : 'nav-tab-item',
    priority : 0
  });

  navTabItem.View = navTabItemView;
  return navTabItem;
});
/**
 * @fileOverview 切换标签
 * @ignore
 */

define('bui/tab/tab',['bui/common'],function (require) {
  

  var BUI = require('bui/common'),
    Component = BUI.Component,
    UIBase = Component.UIBase;

  /**
   * 列表
   * xclass:'tab'
   * <pre><code>
   * BUI.use('bui/tab',function(Tab){
   *   
   *     var tab = new Tab.Tab({
   *         render : '#tab',
   *         elCls : 'nav-tabs',
   *         autoRender: true,
   *         children:[
   *           {text:'标签一',value:'1'},
   *           {text:'标签二',value:'2'},
   *           {text:'标签三',value:'3'}
   *         ]
   *       });
   *     tab.on('selectedchange',function (ev) {
   *       var item = ev.item;
   *       $('#log').text(item.get('text') + ' ' + item.get('value'));
   *     });
   *     tab.setSelected(tab.getItemAt(0)); //设置选中第一个
   *   
   *   });
   *  </code></pre>
   * @class BUI.Tab.Tab
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
  var tab = Component.Controller.extend([UIBase.ChildList],{

  },{
    ATTRS : {
      elTagName:{
        view:true,
        value:'ul'
      },
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @override
       * @default 'tab-item'
       */
      defaultChildClass : {
        value : 'tab-item'
      }
    }
  },{
    xclass : 'tab'
  });

  return tab;

});
/**
 * @fileOverview 
 * @ignore
 */

define('bui/tab/tabitem',['bui/common'],function (require) {
  

  var BUI = require('bui/common'),
    Component = BUI.Component,
    UIBase = Component.UIBase;

  /**
   * @private
   * @class BUI.Tab.TabItemView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.ListItemView
   * 标签项的视图层对象
   */
  var itemView = Component.View.extend([UIBase.ListItemView],{
  },{
    xclass:'tab-item-view'
  });


  /**
   * 标签项
   * @class BUI.Tab.TabItem
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ListItem
   */
  var item = Component.Controller.extend([UIBase.ListItem],{

  },{
    ATTRS : 
    {
     
      elTagName:{
        view:true,
        value:'li'
      },
      xview:{
        value:itemView
      },
      tpl:{
        view:true,
        value:'<span class="bui-tab-item-text">{text}</span>'
      }
    }
  },{
    xclass:'tab-item'
  });

  
  item.View = itemView;
  return item;
});
/**
 * @fileOverview 每个标签对应一个面板
 * @ignore
 */

define('bui/tab/tabpanel',['bui/common','bui/tab/tab'],function (require) {
  
  var BUI = require('bui/common'),
    Tab = require('bui/tab/tab');

  /**
   * 带有面板的切换标签
   * <pre><code>
   * BUI.use('bui/tab',function(Tab){
   *   
   *     var tab = new Tab.TabPanel({
   *       render : '#tab',
   *       elCls : 'nav-tabs',
   *       panelContainer : '#panel',
   *       autoRender: true,
   *       children:[
   *         {text:'源代码',value:'1'},
   *         {text:'HTML',value:'2'},
   *         {text:'JS',value:'3'}
   *       ]
   *     });
   *     tab.setSelected(tab.getItemAt(0));
   *   });
   * </code></pre>
   * @class BUI.Tab.TabPanel
   * @extends BUI.Tab.Tab
   */
  var tabPanel = Tab.extend({
    initializer : function(){
      var _self = this,
        children = _self.get('children'),
        panelContainer = $(_self.get('panelContainer')),
        panelCls = _self.get('panelCls'),
        panels = panelCls ? panelContainer.find('.' + panels) : panelContainer.children();

      BUI.each(children,function(item,index){
        if(item.set){
          item.set('panel',panels[index]);
        }else{
          item.panel = panels[index];
        }
      });
    }
  },{
    ATTRS : {

      /**
       * 默认子控件的xclass
       * @type {String}
       */
      defaultChildClass:{
        value : 'tab-panel-item'
      },
      /**
       * 面板的容器
       * @type {String|HTMLElement|jQuery}
       */
      panelContainer : {
        
      },
      /**
       * panel 面板使用的样式，如果初始化时，容器内已经存在有该样式的DOM，则作为面板使用
       * 对应同一个位置的标签项,如果为空，默认取面板容器的子元素
       * @type {String}
       */
      panelCls : {

      }
    }
  },{
    xclass : 'tab-panel'
  });

  return tabPanel;
});
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
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview A collection of commonly used function buttons or controls represented in compact visual form.
 * @author dxq613@gmail.com, yiminghe@gmail.com
 * @ignore
 */
define('bui/toolbar/bar',function(){

	var Component = BUI.Component,
    UIBase = Component.UIBase;
		
	/**
	 * bar的视图类
	 * @class BUI.Toolbar.BarView
	 * @extends BUI.Component.View
	 * @private
	 */
	var barView = Component.View.extend({

		renderUI:function() {
        var el = this.get('el');
        el.attr('role', 'toolbar');
           
        if (!el.attr('id')) {
            el.attr('id', BUI.guid('bar'));
        }
    }
	});

	/**
	 * 工具栏
   * 可以放置按钮、文本、链接等，是分页栏的基类
   * xclass : 'bar'
   * <p>
   * <img src="../assets/img/class-toolbar.jpg"/>
   * </p>
   * ## 按钮组
   * <pre><code>
   *   BUI.use('bui/toolbar',function(Toolbar){
   *     var buttonGroup = new Toolbar.Bar({
   *       elCls : 'button-group',
   *       defaultChildCfg : {
   *         elCls : 'button button-small'
   *       },
   *       children : [{content : '增加'},{content : '修改'},{content : '删除'}],
   *       
   *       render : '#b1'
   *     });
   *
   *     buttonGroup.render();
   *   });
   * </code></pre>
   * @class BUI.Toolbar.Bar
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
	var Bar = Component.Controller.extend([UIBase.ChildList],
	 /**
	 * @lends BUI.Toolbar.Bar.prototype
   * @ignore 
	 */	
	{
		/**
		* 通过id 获取项
		* @param {String|Number} id the id of item 
		* @return {BUI.Toolbar.BarItem}
		*/
		getItem : function(id){
			return this.getChild(id);
		}
	},{
		ATTRS:
    /** 
    * @lends BUI.Toolbar.Bar.prototype
    * @ignore
    */
		{
      elTagName :{
          view : true,
          value : 'ul'
      },
      /**
       * 默认子项的样式
       * @type {String}
       * @override
       */
      defaultChildClass: {
        value : 'bar-item'
      },
			/**
			* 获取焦点
      * @protected
      * @ignore
			*/
			focusable : {
				value : false
			},
			/**
			* @private
      * @ignore
			*/
			xview : {
				value : barView	
			}
		}
	},{
		xclass : 'bar',
		priority : 1	
	});

	return Bar;
});
/**
 * @fileOverview buttons or controls of toolbar
 * @author dxq613@gmail.com, yiminghe@gmail.com
 * @ignore
 */
define('bui/toolbar/baritem',function(){

  /**
   * @name BUI.Toolbar
   * @namespace 工具栏命名空间
   * @ignore
   */
  var PREFIX = BUI.prefix,
    Component = BUI.Component,
    UIBase = Component.UIBase;
    
  /**
   * barItem的视图类
   * @class BUI.Toolbar.BarItemView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.ListItemView
   * @private
   */
  var BarItemView = Component.View.extend([UIBase.ListItemView]);
  /**
     * 工具栏的子项，包括按钮、文本、链接和分隔符等
     * @class BUI.Toolbar.BarItem
     * @extends BUI.Component.Controller
     */
  var BarItem = Component.Controller.extend([UIBase.ListItem],{
    
    /**
    * render baritem 's dom
    * @protected
    */
    renderUI:function() {
        var el = this.get('el');
        el.addClass(PREFIX + 'inline-block');
        if (!el.attr('id')) {
            el.attr('id', this.get('id'));
        }
    }
  },{
    ATTRS:
    /**
     * @lends BUI.Toolbar.BarItem.prototype
     * @ignore
     */
    {
      elTagName :{
          view : true,
          value : 'li'
      },
      /**
       * 是否可选择
       * <pre><code>
       * 
       * </code></pre>
       * @cfg {Object} [selectable = false]
       */
      selectable : {
        value : false
      },
      /**
      * 是否获取焦点
      * @default {boolean} false
      */
      focusable : {
        value : false
      },
      xview: {
        value : BarItemView
      }
    }
  },{
    xclass : 'bar-item',
    priority : 1  
  });

  /**
     * 工具栏的子项，添加按钮
     * xclass : 'bar-item-button'
     * @extends  BUI.Toolbar.BarItem
     * @class BUI.Toolbar.BarItem.Button
     */
  var ButtonBarItem = BarItem.extend({
    
    _uiSetDisabled : function(value){
      var _self = this,
        el = _self.get('el'),
        method = value ? 'addClass' : 'removeClass';
      
      el.find('button').attr('disabled',value)[method](PREFIX + 'button-disabled');
    },
    _uiSetChecked: function(value){
      var _self = this,
        el = _self.get('el'),
        method = value ? 'addClass' : 'removeClass';

        el.find('button')[method](PREFIX + 'button-checked');
    },
    _uiSetText : function(v){
      var _self = this,
        el = _self.get('el');
      el.find('button').text(v);
    },
    _uiSetbtnCls : function(v){
      var _self = this,
        el = _self.get('el');
      el.find('button').addClass(v);
    }
    
  },{
    ATTRS:
    /**
     * @lends BUI.Toolbar.BarItem.Button.prototype
     * @ignore
     */
    {
      /**
       * 是否选中
       * @type {Boolean}
       */
      checked : {
        value :false
      },
      /**
       * 模板
       * @type {String}
       */
      tpl : {
        view : true,
        value : '<button type="button" class="{btnCls}">{text}</button>'
      },
      /**
       * 按钮的样式
       * @cfg {String} btnCls
       */
      /**
       * 按钮的样式
       * @type {String}
       */
      btnCls:{
        sync:false
      },
      /**
      * The text to be used as innerHTML (html tags are accepted).
      * @cfg {String} text
      */
      /**
      * The text to be used as innerHTML (html tags are accepted).
      * @type {String} 
      */
      text : {
        sync:false,
        value : ''
      }
    }
  },{
    xclass : 'bar-item-button',
    priority : 2  
  });
  
  /**
     * 工具栏项之间的分隔符
     * xclass:'bar-item-separator'
     * @extends  BUI.Toolbar.BarItem
     * @class BUI.Toolbar.BarItem.Separator
     */
  var SeparatorBarItem = BarItem.extend({
    /* render separator's dom
    * @protected
        *
    */
    renderUI:function() {
            var el = this.get('el');
            el .attr('role', 'separator');
        }
  },
  {
    xclass : 'bar-item-separator',
    priority : 2  
  });

  
  /**
     * 工具栏项之间的空白
     * xclass:'bar-item-spacer'
     * @extends  BUI.Toolbar.BarItem
     * @class BUI.Toolbar.BarItem.Spacer
     */
  var SpacerBarItem = BarItem.extend({
    
  },{
    ATTRS:
    /** 
    * @lends BUI.Toolbar.BarItem.Spacer.prototype
    * @ignore
    */
    {
      /**
      * 空白宽度
      * @type {Number}
      */
      width : {
        view:true,
        value : 2
      }
    }
  },{
    xclass : 'bar-item-spacer',
    priority : 2  
  });
  

  /**
     * 显示文本的工具栏项
     * xclass:'bar-item-text'
     * @extends  BUI.Toolbar.BarItem
     * @class BUI.Toolbar.BarItem.Text
     */
  var TextBarItem = BarItem.extend({
    _uiSetText : function(text){
      var _self = this,
        el = _self.get('el');
      el.html(text);
    }
  },{
    ATTRS:
    /**
     * @lends BUI.Toolbar.BarItem.Text.prototype
     * @ignore
     */
    {
      
      /**
      * 文本用作 innerHTML (html tags are accepted).
      * @cfg {String} text
      */
      /**
      * 文本用作 innerHTML (html tags are accepted).
      * @default {String} ""
      */
      text : {
        value : ''
      }
    }
  },{
    xclass : 'bar-item-text',
    priority : 2  
  });
  

  BarItem.types = {
    'button' : ButtonBarItem,
    'separator' : SeparatorBarItem,
    'spacer' : SpacerBarItem,
    'text'  : TextBarItem
  };
  

  return BarItem;
});
/**
 * @fileOverview 工具栏命名空间入口
 * @ignore
 */

define('bui/toolbar',['bui/common','bui/toolbar/baritem','bui/toolbar/bar','bui/toolbar/pagingbar','bui/toolbar/numberpagingbar'],function (require) {
  var BUI = require('bui/common'),
    Toolbar = BUI.namespace('Toolbar');

  BUI.mix(Toolbar,{
    BarItem : require('bui/toolbar/baritem'),
    Bar : require('bui/toolbar/bar'),
    PagingBar : require('bui/toolbar/pagingbar'),
    NumberPagingBar : require('bui/toolbar/numberpagingbar')
  });
  return Toolbar;
});
/**
 * @fileOverview  a specialized toolbar that is bound to a Grid.Store and provides automatic paging control.
 * @author 
 * @ignore
 */
define('bui/toolbar/numberpagingbar',['bui/toolbar/pagingbar'],function(require) {

    var Component = BUI.Component,
        PBar = require('bui/toolbar/pagingbar');

    var PREFIX = BUI.prefix,
        NUMBER_CONTAINER = 'numberContainer',
        CLS_NUMBER_BUTTON = PREFIX + 'button-number';

    /**
     * 数字分页栏
     * xclass:'pagingbar-number'
     * @extends BUI.Toolbar.PagingBar
     * @class BUI.Toolbar.NumberPagingBar
     */
    var NumberPagingBar = PBar.extend(
        /** 
        * @lends BUI.Toolbar.NumberPagingBar.prototype
        * @ignore
        */
        {
        /**
        * get the initial items of paging bar
        * @protected
        *
        */
        _getItems : function(){
            var _self = this,
                items = _self.get('items');

            if(items){
                return items;
            }
            //default items
            items = [];
            //previous item
            items.push(_self._getButtonItem(PBar.ID_PREV));
            //next item
            items.push(_self._getButtonItem(PBar.ID_NEXT));
            return items;
        },
        _getButtonItem : function(id){
          var _self = this;

          return {
              id:id,
              content:'<a href="javascript:;">'+_self.get(id + 'Text')+'</a>',
              disabled:true
          };
        },
        /**
        * bind buttons event
        * @protected
        *
        */
        _bindButtonEvent : function(){
            var _self = this,
                cls = _self.get('numberButtonCls');
            _self.constructor.superclass._bindButtonEvent.call(this);
            _self.get('el').delegate('a','click',function(ev){
              ev.preventDefault();
            });
            _self.on('click',function(ev){
              var item = ev.target;
              if(item && item.get('el').hasClass(cls)){
                var page = item.get('id');
                _self.jumpToPage(page);
              }
            });
        },
        //设置页码信息，设置 页数 按钮
        _setNumberPages : function(){
            var _self = this;

            _self._setNumberButtons();
        },
        //设置 页数 按钮
        _setNumberButtons : function(){
            var _self = this,
                curPage = _self.get('curPage'),
                totalPage = _self.get('totalPage'),
                numberItems = _self._getNumberItems(curPage,totalPage),
                curItem;

            _self._clearNumberButtons();

            BUI.each(numberItems,function(item){
                _self._appendNumberButton(item);
            });
            curItem = _self.getItem(curPage);
            if(curItem){
                curItem.set('selected',true);
            }
               
        },
        _appendNumberButton : function(cfg){
          var _self = this,
            count = _self.getItemCount();
          var item = _self.addItemAt(cfg,count - 1);
        },
        _clearNumberButtons : function(){
          var _self = this,
            items = _self.getItems(),
            count = _self.getItemCount();

          while(count > 2){
            _self.removeItemAt(count-2);  
            count = _self.getItemCount();          
          }
        },
        //获取所有页码按钮的配置项
        _getNumberItems : function(curPage, totalPage){
            var _self = this,
                result = [],
                maxLimitCount = _self.get('maxLimitCount'),
                showRangeCount = _self.get('showRangeCount'),
                maxPage;

            function addNumberItem(from,to){
                for(var i = from ;i<=to;i++){
                    result.push(_self._getNumberItem(i));
                }
            }

            function addEllipsis(){
                result.push(_self._getEllipsisItem());
            }

            if(totalPage < maxLimitCount){
                maxPage = totalPage;
                addNumberItem(1,totalPage);
            }else{
                var startNum = (curPage <= maxLimitCount) ? 1 : (curPage - showRangeCount),
                    lastLimit = curPage + showRangeCount,
                    endNum = lastLimit < totalPage ? (lastLimit > maxLimitCount ? lastLimit : maxLimitCount) : totalPage;
                if (startNum > 1) {
                    addNumberItem(1, 1);
                    if(startNum > 2){
                        addEllipsis();
                    }
                }
                maxPage = endNum;
                addNumberItem(startNum, endNum);
            }

            if (maxPage < totalPage) {
                if(maxPage < totalPage -1){
                    addEllipsis();
                }
                addNumberItem(totalPage, totalPage);
            }

            return result;
        },
        //获取省略号
        _getEllipsisItem : function(){
            var _self = this;
            return {
                disabled: true,           
                content : _self.get('ellipsisTpl')
            };
        },
        //生成页面按钮配置项
        _getNumberItem : function(page){
            var _self = this;
            return {
                id : page,
                elCls : _self.get('numberButtonCls')
            };
        }
        
    },{
        ATTRS:{
            itemStatusCls : {
              value : {
                selected : 'active',
                disabled : 'disabled'
              }
            },
            itemTpl : {
              value : '<a href="">{id}</a>'
            },
            prevText : {
              value : '<<'
            },
            nextText : {
              value : '>>'
            },
            /**
            * 当页码超过该设置页码时候显示省略号
            * @default {Number} 4
            */
            maxLimitCount : {
                value : 4
            },
            showRangeCount : {
                value : 1   
            },
            /**
            * the css used on number button
            */
            numberButtonCls:{
                value : CLS_NUMBER_BUTTON
            },
            /**
            * the template of ellipsis which represent the omitted pages number
            */
            ellipsisTpl : {
                value : '<a href="#">...</a>'
            }
        }
    },{
        xclass : 'pagingbar-number',
        priority : 3    
    });

    return NumberPagingBar;

});
/**
 * @fileOverview  a specialized toolbar that is bound to a Grid.Store and provides automatic paging control.
 * @author dxq613@gmail.com, yiminghe@gmail.com
 * @ignore
 */
define('bui/toolbar/pagingbar',['bui/toolbar/bar'],function(require) {

    var Bar = require('bui/toolbar/bar'),
        Component = BUI.Component,
        Bindable = Component.UIBase.Bindable;

    var PREFIX = BUI.prefix,
		ID_FIRST = 'first',
        ID_PREV = 'prev',
        ID_NEXT = 'next',
        ID_LAST = 'last',
        ID_SKIP = 'skip',
        ID_TOTAL_PAGE = 'totalPage',
        ID_CURRENT_PAGE = 'curPage',
        ID_TOTAL_COUNT = 'totalCount';

    /**
     * 分页栏
     * xclass:'pagingbar'
     * @extends BUI.Toolbar.Bar
     * @mixins BUI.Component.UIBase.Bindable
     * @class BUI.Toolbar.PagingBar
     */
    var PagingBar = Bar.extend([Bindable],
        /** 
        * @lends BUI.Toolbar.PagingBar.prototype
        * @ignore
        */
        {
            /**
             * From Bar, Initialize this paging bar items.
             *
             * @protected
             */
            initializer:function () {
                var _self = this,
                    children = _self.get('children'),
                    items = _self.get('items'),
                    store = _self.get('store');
                if(!items || items.length){
                    items = _self._getItems();
                    BUI.each(items, function (item) {
                        children.push(item);//item
                    });
                }
                
                if (store && store.get('pageSize')) {
                    _self.set('pageSize', store.get('pageSize'));
                }
            },
            /**
             * bind page change and store events
             *
             * @protected
             */
            bindUI:function () {
                var _self = this;
                _self._bindButtonEvent();
                //_self._bindStoreEvents();

            },
            /**
             * skip to page
             * this method can fire "beforepagechange" event,
             * if you return false in the handler the action will be canceled
             * @param {Number} page target page
             */
            jumpToPage:function (page) {
                if (page <= 0 || page > this.get('totalPage')) {
                    return;
                }
                var _self = this,
                    store = _self.get('store'),
                    pageSize = _self.get('pageSize'),
                    index = page - 1,
                    start = index * pageSize;
                var result = _self.fire('beforepagechange', {from:_self.get('curPage'), to:page});
                if (store && result !== false) {
                    store.load({ start:start, limit:pageSize, pageIndex:index });
                }
            },
            //after store loaded data,reset the information of paging bar and buttons state
            _afterStoreLoad:function (store, params) {
                var _self = this,
                    pageSize = _self.get('pageSize'),
                    start = 0, //页面的起始记录
                    end, //页面的结束记录
                    totalCount, //记录的总数
                    curPage, //当前页
                    totalPage;//总页数;

                start = store.get('start');
                
                //设置加载数据后翻页栏的状态
                totalCount = store.getTotalCount();
                end = totalCount - start > pageSize ? start + store.getCount() : totalCount;
                totalPage = parseInt((totalCount + pageSize - 1) / pageSize, 10);
                totalPage = totalPage > 0 ? totalPage : 1;
                curPage = parseInt(start / pageSize, 10) + 1;

                _self.set('start', start);
                _self.set('end', end);
                _self.set('totalCount', totalCount);
                _self.set('curPage', curPage);
                _self.set('totalPage', totalPage);

                //设置按钮状态
                _self._setAllButtonsState();
                _self._setNumberPages();
            },

            //bind page change events
            _bindButtonEvent:function () {
                var _self = this;

                //first page handler
                _self._bindButtonItemEvent(ID_FIRST, function () {
                    _self.jumpToPage(1);
                });

                //previous page handler
                _self._bindButtonItemEvent(ID_PREV, function () {
                    _self.jumpToPage(_self.get('curPage') - 1);
                });

                //previous page next
                _self._bindButtonItemEvent(ID_NEXT, function () {
                    _self.jumpToPage(_self.get('curPage') + 1);
                });

                //previous page next
                _self._bindButtonItemEvent(ID_LAST, function () {
                    _self.jumpToPage(_self.get('totalPage'));
                });
                //skip to one page
                _self._bindButtonItemEvent(ID_SKIP, function () {
                    handleSkip();
                });
                //input page number and press key "enter"
                var curPage = _self.getItem(ID_CURRENT_PAGE);
                if(curPage){
                    curPage.get('el').on('keyup', function (event) {
                        event.stopPropagation();
                        if (event.keyCode === 13) {
                            handleSkip();
                        }
                    });
                }
                
                //when click skip button or press key "enter",cause an action of skipping page
                /**
                 * @private
                 * @ignore
                 */
                function handleSkip() {
                    var value = parseInt(_self._getCurrentPageValue(), 10);
                    if (_self._isPageAllowRedirect(value)) {
                        _self.jumpToPage(value);
                    } else {
                        _self._setCurrentPageValue(_self.get('curPage'));
                    }
                }
            },
            // bind button item event
            _bindButtonItemEvent:function (id, func) {
                var _self = this,
                    item = _self.getItem(id);
                if (item) {
                    item.on('click', func);
                }
            },
            onLoad:function (params) {
                var _self = this,
                    store = _self.get('store');
                _self._afterStoreLoad(store, params);
            },
            //get the items of paging bar
            _getItems:function () {
                var _self = this,
                    items = _self.get('items');
                if (items && items.length) {
                    return items;
                }
                //default items
                items = [];
                //first item
                items.push(_self._getButtonItem(ID_FIRST));
                //previous item
                items.push(_self._getButtonItem(ID_PREV));
                //separator item
                items.push(_self._getSeparator());
                //total page of store
                items.push(_self._getTextItem(ID_TOTAL_PAGE));
                //current page of store
                items.push(_self._getTextItem(ID_CURRENT_PAGE));
                //button for skip to
                items.push(_self._getButtonItem(ID_SKIP));
                //separator item
                items.push(_self._getSeparator());
                //next item
                items.push(_self._getButtonItem(ID_NEXT));
                //last item
                items.push(_self._getButtonItem(ID_LAST));
                //separator item
                items.push(_self._getSeparator());
                //current page of store
                items.push(_self._getTextItem(ID_TOTAL_COUNT));
                return items;
            },
            //get item which the xclass is button
            _getButtonItem:function (id) {
                var _self = this;
                return {
                    id:id,
                    xclass:'bar-item-button',
                    text:_self.get(id + 'Text'),
                    disabled:true,
                    elCls:_self.get(id + 'Cls')
                };
            },
            //get separator item
            _getSeparator:function () {
                return {xclass:'bar-item-separator'};
            },
            //get text item
            _getTextItem:function (id) {
                var _self = this;
                return {
                    id:id,
                    xclass:'bar-item-text',
                    text:_self._getTextItemTpl(id)
                };
            },
            //get text item's template
            _getTextItemTpl:function (id) {
                var _self = this,
                    obj = {};
                obj[id] = _self.get(id);
                return BUI.substitute(this.get(id + 'Tpl'), obj);
            },
            //Whether to allow jump, if it had been in the current page or not within the scope of effective page, not allowed to jump
            _isPageAllowRedirect:function (value) {
                var _self = this;
                return value && value > 0 && value <= _self.get('totalPage') && value !== _self.get('curPage');
            },
            //when page changed, reset all buttons state
            _setAllButtonsState:function () {
                var _self = this,
                    store = _self.get('store');
                if (store) {
                    _self._setButtonsState([ID_PREV, ID_NEXT, ID_FIRST, ID_LAST, ID_SKIP], true);
                }

                if (_self.get('curPage') === 1) {
                    _self._setButtonsState([ID_PREV, ID_FIRST], false);
                }
                if (_self.get('curPage') === _self.get('totalPage')) {
                    _self._setButtonsState([ID_NEXT, ID_LAST], false);
                }
            },
            //if button id in the param buttons,set the button state
            _setButtonsState:function (buttons, enable) {
                var _self = this,
                    children = _self.get('children');
                BUI.each(children, function (child) {
                    if (BUI.Array.indexOf(child.get('id'), buttons) !== -1) {
                        child.set('disabled', !enable);
                    }
                });
            },
            //show the information of current page , total count of pages and total count of records
            _setNumberPages:function () {
                var _self = this,
                    totalPageItem = _self.getItem(ID_TOTAL_PAGE),
                    totalCountItem = _self.getItem(ID_TOTAL_COUNT);
                if (totalPageItem) {
                    totalPageItem.set('content', _self._getTextItemTpl(ID_TOTAL_PAGE));
                }
                _self._setCurrentPageValue(_self.get(ID_CURRENT_PAGE));
                if (totalCountItem) {
                    totalCountItem.set('content', _self._getTextItemTpl(ID_TOTAL_COUNT));
                }
            },
            _getCurrentPageValue:function (curItem) {
                var _self = this;
                curItem = curItem || _self.getItem(ID_CURRENT_PAGE);
                var textEl = curItem.get('el').find('input');
                return textEl.val();
            },
            //show current page in textbox
            _setCurrentPageValue:function (value, curItem) {
                var _self = this;
                curItem = curItem || _self.getItem(ID_CURRENT_PAGE);
                var textEl = curItem.get('el').find('input');
                textEl.val(value);
            }
        }, {
            ATTRS:
            /** 
            * @lends BUI.Toolbar.PagingBar.prototype
            * @ignore
            */
            {
               
                /**
                 * the text of button for first page
                 * @default {String} "首 页"
                 */
                firstText:{
                    value:'首 页'
                },
                /**
                 * the cls of button for first page
                 * @default {String} "bui-pb-first"
                 */
                firstCls:{
                    value:PREFIX + 'pb-first'
                },
                /**
                 * the text for previous page button
                 * @default {String} "前一页"
                 */
                prevText:{
                    value:'上一页'
                },
                /**
                 * the cls for previous page button
                 * @default {String} "bui-pb-prev"
                 */
                prevCls:{
                    value: PREFIX + 'pb-prev'
                },
                /**
                 * the text for next page button
                 * @default {String} "下一页"
                 */
                nextText:{
                    value:'下一页'
                },
                /**
                 * the cls for next page button
                 * @default {String} "bui-pb-next"
                 */
                nextCls:{
                    value: PREFIX + 'pb-next'
                },
                /**
                 * the text for last page button
                 * @default {String} "末 页"
                 */
                lastText:{
                    value:'末 页'
                },
                /**
                 * the cls for last page button
                 * @default {String} "bui-pb-last"
                 */
                lastCls:{
                    value:PREFIX + 'pb-last'
                },
                /**
                 * the text for skip page button
                 * @default {String} "跳 转"
                 */
                skipText:{
                    value:'确定'
                },
                /**
                 * the cls for skip page button
                 * @default {String} "bui-pb-last"
                 */
                skipCls:{
                    value:PREFIX + 'pb-skip'
                },
                /**
                 * the template of total page info
                 * @default {String} '共 {totalPage} 页'
                 */
                totalPageTpl:{
                    value:'共 {totalPage} 页'
                },
                /**
                 * the template of current page info
                 * @default {String} '第 &lt;input type="text" autocomplete="off" class="bui-pb-page" size="20" name="inputItem"&gt; 页'
                 */
                curPageTpl:{
                    value:'第 <input type="text" '+
                        'autocomplete="off" class="'+PREFIX+'pb-page" size="20" name="inputItem"> 页'
                },
                /**
                 * the template of total count info
                 * @default {String} '第 &lt;input type="text" autocomplete="off" class="bui-pb-page" size="20" name="inputItem"&gt; 页'
                 */
                totalCountTpl:{
                    value:'共{totalCount}条记录'
                },
                /**
                 * current page of the paging bar
                 * @private
                 * @default {Number} 0
                 */
                curPage:{
                    value:0
                },
                /**
                 * total page of the paging bar
                 * @private
                 * @default {Number} 0
                 */
                totalPage:{
                    value:0
                },
                /**
                 * total count of the store that the paging bar bind to
                 * @private
                 * @default {Number} 0
                 */
                totalCount:{
                    value:0
                },
                /**
                 * The number of records considered to form a 'page'.
                 * if store set the property ,override this value by store's pageSize
                 * @private
                 */
                pageSize:{
                    value:30
                },
                /**
                 * The {@link BUI.Data.Store} the paging toolbar should use as its data source.
                 * @protected
                 */
                store:{

                }
            },
            ID_FIRST:ID_FIRST,
            ID_PREV:ID_PREV,
            ID_NEXT:ID_NEXT,
            ID_LAST:ID_LAST,
            ID_SKIP:ID_SKIP,
            ID_TOTAL_PAGE:ID_TOTAL_PAGE,
            ID_CURRENT_PAGE:ID_CURRENT_PAGE,
            ID_TOTAL_COUNT:ID_TOTAL_COUNT
        }, {
            xclass:'pagingbar',
            priority:2
        });

    return PagingBar;

});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 提示的入口文件
 * @ignore
 */

define('bui/tooltip',['bui/common','bui/tooltip/tip','bui/tooltip/tips'],function (require) {
  var BUI = require('bui/common'),
    Tooltip = BUI.namespace('Tooltip'),
    Tip = require('bui/tooltip/tip'),
    Tips = require('bui/tooltip/tips');

  BUI.mix(Tooltip,{
    Tip : Tip,
    Tips : Tips
  });
  return Tooltip;
});
/**
 * @fileOverview 简单易用的提示信息
 * @ignore
 */

define('bui/tooltip/tip',['bui/common','bui/overlay'],function (require) {
  var BUI = require('bui/common'),
    Overlay = require('bui/overlay'),
    CLS_ALIGN_PREFIX = 'x-align-',
    MAP_TYPES = {
      left : ['cl','cr'], //居左
      right : ['cr','cl'], //居右
      top : ['tc','bc'], //居上
      bottom : ['bc','tc'], //居下
      'top-left' : ['tl','bl'],
      'top-right' : ['tr','br'],
      'bottom-left' : ['bl','tl'],
      'bottom-right' : ['br','tr']
    };
  //获取距离
  function getOffset(type,offset){
    if(type === 'left'){
      return [-1 * offset,-4];
    }
    if(type === 'right'){
      return [offset,-4];
    }
    if(type.indexOf('top')){
      return [0,offset];
    }

    if(type.indexOf('bottom')){
      return [0,-1 * offset];
    }
  }

  var TipView = Overlay.OverlayView.extend({
    renderUI : function(){

    },
    //获取显示文本的容器
    _getTitleContainer : function(){
      return  this.get('el');
    },
    //设置文本
    _uiSetTitle : function(title){
      var _self = this,
        titleTpl = _self.get('titleTpl'),
        container = _self._getTitleContainer(),
        titleEl = _self.get('titleEl'),
        tem;
      if(titleEl){
        titleEl.remove();
      }
      title = title || '';
      if(BUI.isString(title)){
        title = {title : title};
      }
      tem = BUI.substitute(titleTpl,title);
      titleEl = $(tem).appendTo(container);
      _self.set('titleEl',titleEl);
    },
    //设置对齐样式
    _uiSetAlignType : function(type,ev){
      var _self = this;
      if(ev && ev.prevVal){
        _self.get('el').removeClass(CLS_ALIGN_PREFIX + ev.prevVal);
      }
      if(type){
        _self.get('el').addClass(CLS_ALIGN_PREFIX + type);
      }
    }
  },{
    ATTRS : {
      title : {},
      titleEl : {},
      alignType : {}
    }
  },{
    xclass : 'tooltip-view'
  });
  
  /**
   * @class BUI.Tooltip.Tip
   * @extends BUI.Overlay.Overlay
   * 简易的提示信息
   * 
   * ** 你可以简单的使用单个tip **
   * <pre><code>
   * BUI.use('bui/tooltip',function (Tooltip) {
   *  //不使用模板的，左侧显示
   *   var t1 = new Tooltip.Tip({
   *     trigger : '#t1',
   *     alignType : 'left', //方向
   *     showArrow : false, //不显示箭头
   *     offset : 5, //距离左边的距离
   *     title : '无任何样式，<br>左边的提示信息'
   *   });
   *   t1.render();
   *  });
   * </code></pre>
   *
   * ** 也可以配置模板 **
   * <pre><code>
   * BUI.use('bui/tooltip',function (Tooltip) {
   *  //使用模板的，左侧显示
   *   var t1 = new Tooltip.Tip({
   *     trigger : '#t1',
   *     alignType : 'left', //方向
   *     titleTpl : '&lt;span class="x-icon x-icon-small x-icon-success"&gt;&lt;i class="icon icon-white icon-question"&gt;&lt;/i&gt;&lt;/span&gt;\
   *     &lt;div class="tips-content"&gt;{title}&lt;/div&gt;',
   *     offset : 5, //距离左边的距离
   *     title : '无任何样式，&lt;br&gt;左边的提示信息'
   *   });
   *   t1.render();
   *  });
   * </code></pre>
   */
  var Tip = Overlay.Overlay.extend({
    //设置对齐方式
    _uiSetAlignType : function(type){
      var _self = this,
        offset = _self.get('offset'),
        align = _self.get('align') || {},
        points = MAP_TYPES[type];
      if(points){
        align.points = points;
        if(offset){
          align.offset = getOffset(type,offset);
        }
        _self.set('align',align);
      }
    }
  },{
    ATTRS : {
      //使用委托的方式显示提示信息
      delegateTigger : {
        value : true
      },
      /**
       * 对齐类型，包括： top,left,right,bottom四种常用方式，其他对齐方式，可以使用@see{BUI.Tooltip.Tip#property-align}属性
       * 
       * @type {String}
       */
      alignType : {
        view : true
      },
      /**
       * 显示的内容，文本或者键值对
       * <pre><code>
       *     var tip =  new Tip({
       *        title : {a : 'text a',b:'text b'}, //属性是对象
       *        titleTpl : '<p>this is {a},because {b}</p>' // <p>this is text a,because text b</p>
       *      });
       * </code></pre>
       * @cfg {String|Object} title
       */
      /**
       * 显示的内容
       * <pre><code>
       *  //设置文本
       *  tip.set('title','new title');
       *
       *  //设置对象
       *  tip.set('title',{a : 'a',b : 'b'})
       * </code></pre>
       * @type {Object}
       */
      title : {
        view : true
      },
      /**
       * 显示对齐箭头
       * @override
       * @default true
       * @cfg {Boolean} [showArrow = true]
       */
      showArrow : {
        value : true
      },
      /**
       * 箭头放置在的位置，是一个选择器，例如 .arrow-wraper
       * <pre><code>
       *     new Tip({ //可以设置整个控件的模板
       *       arrowContainer : '.arrow-wraper',
       *       tpl : '<div class="arrow-wraper"></div>'
       *     });
       *     
       *     new Tip({ //也可以设置title的模板
       *       arrowContainer : '.arrow-wraper',
       *       titleTpl : '<div class="arrow-wraper">{title}</div>'
       *     });
       * </code></pre>   
       * @cfg {String} arrowContainer
       */
      arrowContainer : {
        view : true
      },
      //自动显示
      autoHide : {
        value : true
      },
      //覆盖自动隐藏类型
      autoHideType : {
        value : 'leave'
      },
      /**
      * 显示的tip 距离触发器Dom的距离
      * <pre><code>
      *  var tip =  new Tip({
      *    title : {a : 'text a',b:'text b'}, //属性是对象
      *    offset : 10, //距离
      *    titleTpl : '<p>this is {a},because {b}</p>' // <p>this is text a,because text b</p>
      *  });
      * </code></pre>
      * @cfg {Number} offset
      */
      offset : {
        value : 0
      },
      /**
       * 触发显示tip的事件名称，默认为mouseover
       * @type {String}
       * @protected
       */
      triggerEvent : {
        value : 'mouseover'
      },
      /**
       * 显示文本的模板
       * <pre><code>
       *  var tip =  new Tip({
       *    title : {a : 'text a',b:'text b'}, //属性是对象
       *    offset : 10, //距离
       *    titleTpl : '<p>this is {a},because {b}</p>' // <p>this is text a,because text b</p>
       *  });
       * </code></pre>
       * @type {String}
       */
      titleTpl : {
        view : true,
        value : '<span>{title}</span>'
      },
      xview : {
        value : TipView
      }
    }
  },{
    xclass : 'tooltip'
  });

  Tip.View = TipView;

  return Tip;
});
/**
 * @fileOverview 批量显示提示信息
 * @ignore
 */

define('bui/tooltip/tips',['bui/common','bui/tooltip/tip'],function(require) {

  //是否json对象构成的字符串
  function isObjectString(str){
    return /^{.*}$/.test(str);
  }

  var BUI = require('bui/common'),
    Tip = require('bui/tooltip/tip'),
    /**
     * @class BUI.Tooltip.Tips
     * 批量显示提示信息
     *  <pre><code>
     * BUI.use('bui/tooltip',function(){
     *   var tips = new Tooltip.Tips({
     *     tip : {
     *       trigger : '#t1 a', //出现此样式的元素显示tip
     *       alignType : 'top', //默认方向
     *       elCls : 'tips tips-no-icon tip1',
     *       titleTpl : '&lt;span class="x-icon x-icon-small x-icon-success"&gt;&lt;i class="icon icon-white icon-question"&gt;&lt;/i&gt;&lt;/span&gt;\
   *           &lt;div class="tips-content"&gt;{title}&lt;/div&gt;',
     *       offset : 10 //距离左边的距离
     *     }
     *   });
     *   tips.render();
     * })
     * 
     * </code></pre>
     */
    Tips = function(config){
      Tips.superclass.constructor.call(this,config);
    };

  Tips.ATTRS = {

    /**
     * 使用的提示控件或者配置信息 @see {BUI.Tooltip.Tip}
     * <pre><code>
     *    //不使用模板的，左侧显示
     * var tips = new Tooltip.Tips({
     *   tip : {
     *     trigger : '#t1 a', //出现此样式的元素显示tip
     *     alignType : 'top', //默认方向
     *     elCls : 'tips tips-no-icon tip1',
     *     offset : 10 //距离左边的距离
     *   }
     * });
     * tips.render();
     * </code></pre>
     * @cfg {BUI.Tooltip.Tip|Object} tip
     */
    /**
     * 使用的提示控件 @see {BUI.Tooltip.Tip}
     * <pre><code>
     *    var tip = tips.get('tip');
     * </code></pre>
     * @type {BUI.Tooltip.Tip}
     * @readOnly
     */
    tip : {

    },
    /**
     * 默认的对齐方式,如果不指定tip的对齐方式，那么使用此属性
     * <pre><code>
     * //不使用模板的，左侧显示
     * var tips = new Tooltip.Tips({
     *   tip : {
     *     trigger : '#t1 a', //出现此样式的元素显示tip
     *     defaultAlignType : 'top', //默认方向
     *     elCls : 'tips tips-no-icon tip1',
     *     offset : 10 //距离左边的距离
     *   }
     * });
     * tips.render();
     * </code></pre>
     * @cfg {Object} defaultAlignType
     */
    defaultAlignType : {

    }
  };

  BUI.extend(Tips,BUI.Base);

  BUI.augment(Tips,{
    //初始化
    _init : function(){
      this._initDom();
      this._initEvent();
    },
    //初始化DOM
    _initDom : function(){
      var _self = this,
        tip = _self.get('tip'),
        defaultAlignType;
      if(tip && !tip.isController){
        defaultAlignType = tip.alignType; //设置默认的对齐方式
        tip = new Tip(tip);
        tip.render();
        _self.set('tip',tip);
        if(defaultAlignType){
          _self.set('defaultAlignType',defaultAlignType);
        }
      }
    },
    //初始化事件
    _initEvent : function(){
      var _self = this,
        tip = _self.get('tip');
      tip.on('triggerchange',function(ev){
        var curTrigger = ev.curTrigger;
        _self._replaceTitle(curTrigger);
        _self._setTitle(curTrigger,tip);
      });
    },
    //替换掉title
    _replaceTitle : function(triggerEl){
      var title = triggerEl.attr('title');
      if(title){
        triggerEl.attr('data-title',title);
        triggerEl[0].removeAttribute('title');
      }
    },
    //设置title
    _setTitle : function(triggerEl,tip){
      var _self = this,
        title = triggerEl.attr('data-title'),
        alignType = triggerEl.attr('data-align') || _self.get('defaultAlignType');

      if(isObjectString(title)){
        title = BUI.JSON.looseParse(title);
      }
      tip.set('title',title);
      if(alignType){
        tip.set('alignType',alignType);
      }
    },
    /**
     * 渲染提示信息
     * @chainable
     */
    render : function(){
      this._init();
      return this;
    }
  });

  return Tips;
});
/*!
* Suanzi v1.0.0 by @spricity and @cicisoso
* Copyright 2013 算子科技, Inc.
* Licensed under http://www.apache.org/licenses/LICENSE-2.0
*
* Designed and built with all the love in the world by @mdo and @fat.
*/
/**
 * @fileOverview 选择框命名空间入口文件
 * @ignore
 */

define('bui/tree',['bui/common','bui/tree/treemixin','bui/tree/treelist'],function (require) {
  var BUI = require('bui/common'),
    Tree = BUI.namespace('Tree');

  BUI.mix(Tree,{
    TreeList : require('bui/tree/treelist'),
    Mixin : require('bui/tree/treemixin')
  });
  return Tree;
});
/**
 * @fileOverview 树形列表
 * @ignore
 */

define('bui/tree/treelist',['bui/common','bui/list','bui/tree/treemixin'],function (require) {
  var BUI = require('bui/common'),
    List = require('bui/list'),
    Mixin = require('bui/tree/treemixin');

  /**
   * @class BUI.Tree.TreeList
   * 树形列表控件
   * ** 你可以简单的使用配置数据 **
   * <pre><code>
   *  BUI.use('bui/tree',function(Tree){
   *    var tree = new Tree.TreeList({
   *      render : '#t1',
   *      nodes : [
   *        {id : '1',text : '1',children : [{id : '11',text : '11'}]},
   *        {id : '2',text : '2'}
   *      ]
   *    });
   *    tree.render();
   *  });
   * </code></pre>
   * ** 你也可以显示根节点 ** 
   * <pre><code>
   *  BUI.use('bui/tree',function(Tree){
   *    var tree = new Tree.TreeList({
   *      render : '#t1',
   *      root :{
   *        id : '0',
   *        text : '0',
   *        children : [
   *          {id : '1',text : '1',children : [{id : '11',text : '11'}]},
   *          {id : '2',text : '2'}
   *        ]
   *      },
   *      showRoot : true
   *    });
   *    tree.render();
   *  });
   * </code></pre>
   *
   * ** 你也可以异步加载数据 ** 
   * <pre><code>
   *  BUI.use(['bui/tree','bui/data'],function(Tree,Data){
   *    var store = new Data.TreeStore({
   *        root :{
   *          id : '0',
   *          text : '0'
   *        },
   *        url : 'data/nodes.php'
   *      }),
   *      tree = new Tree.TreeList({
   *        render : '#t1',
   *        store : store,
   *        showRoot : true //可以不配置，则不显示根节点
   *      });
   *    tree.render();
   *    store.load({id : '0'});//加载根节点，也可以让用户点击加载
   *  });
   * </code></pre>
   *
   * ** 你还可以替换icon ** 
   * <pre><code>
   *  BUI.use('bui/tree',function(Tree){
   *    var tree = new Tree.TreeList({
   *      render : '#t1',
   *      dirCls : 'folder', //替换树节点的样式
   *      leafCls : 'file', //叶子节点的样式
   *      nodes : [ //数据中存在cls 会替换节点的图标样式
   *        {id : '1',text : '1'cls:'task-folder',children : [{id : '11',text : '11',cls:'task'}]},
   *        {id : '2',text : '2'}
   *      ]
   *    });
   *    tree.render();
   *  });
   * @mixin BUI.Tree.Mixin
   * @extends BUI.List.SimpleList
   */
  var TreeList = List.SimpleList.extend([Mixin],{
    
  },{
    ATTRS : {
      itemCls : {
        value : BUI.prefix + 'tree-item'
      },
      itemTpl : {
        value : '<li class="{cls}">{text}</li>'
      },
      idField : {
        value : 'id'
      }
    }
  },{
    xclass : 'tree-list'
  });

  return TreeList;
});


/**
 * @fileOverview 树形菜单
 * @ignore
 */

define('bui/tree/treemenu',['bui/common','bui/list','bui/tree/treemixin'],function (require) {
  var BUI = require('bui/common'),
    List = require('bui/list'),
    Mixin = require('bui/tree/treemixin');

  var TreeMenuView = List.SimpleList.View.extend({
    //覆写获取模板方法
    getItemTpl : function  (item,index) {
      var _self = this,
        render = _self.get('itemTplRender'),
        itemTpl = item.leaf ? _self.get('leafTpl') : _self.get('dirTpl');  
      if(render){
        return render(item,index);
      }
      
      return BUI.substitute(itemTpl,item);
    }
  },{
    xclass : 'tree-menu-view'
  });

  /**
   * @class BUI.Tree.Menu
   * 树形列表控件
   * ** 你可以简单的使用配置数据 **
   * <pre><code>
   *  BUI.use('bui/tree',function(Tree){
   *    var tree = new Tree.Menu({
   *      render : '#t1',
   *      nodes : [
   *        {id : '1',text : '1',children : [{id : '11',text : '11'}]},
   *        {id : '2',text : '2'}
   *      ]
   *    });
   *    tree.render();
   *  });
   * </code></pre>
   *
   * ** 你还可以替换icon ** 
   * <pre><code>
   *  BUI.use('bui/tree',function(Tree){
   *    var tree = new Tree.Menu({
   *      render : '#t1',
   *      dirCls : 'folder', //替换树节点的样式
   *      leafCls : 'file', //叶子节点的样式
   *      nodes : [ //数据中存在cls 会替换节点的图标样式
   *        {id : '1',text : '1'cls:'task-folder',children : [{id : '11',text : '11',cls:'task'}]},
   *        {id : '2',text : '2'}
   *      ]
   *    });
   *    tree.render();
   *  });
   * @mixin BUI.Tree.Mixin
   * @extends BUI.List.SimpleList
   */
  var TreeMenu = List.SimpleList.extend([Mixin],{
    
  },{
    ATTRS : {
      itemCls : {
        value : BUI.prefix + 'tree-item'
      },
      /**
       * 文件夹是否可选，用于选择节点时，避免选中非叶子节点
       * @cfg {Boolean} [dirSelectable = false]
       */
      dirSelectable  : {
        value : false
      },
      /**
       * 节点展开的事件
       * @type {String}
       */
      expandEvent : {
        value : 'itemclick'
      },

      itemStatusFields  : {
        value : {
          selected : 'selected'
        }
      },
      /**
       * 节点折叠的事件
       * @type {String}
       */
      collapseEvent : {
        value : 'itemclick'
      },
      /**/xview : {
        value : TreeMenuView
      },
      /**
       * 非叶子节点的模板
       * @type {String}
       */
      dirTpl : {
        view : true,
        value : '<li class="{cls}"><a href="#">{text}</a></li>'
      },
      /**
       * 叶子节点的模板
       * @type {String}
       */
      leafTpl : {
        view : true,
        value : '<li class="{cls}"><a href="{href}">{text}</a></li>'
      },
      idField : {
        value : 'id'
      }
    }
  },{
    xclass : 'tree-menu'
  });

  TreeMenu.View = TreeMenuView;
  return TreeMenu;
});
/**
 * @fileOverview 树形扩展，基于list扩展，可以组合出tree list,tree grid ,tree menu
 * @ignore
 */

define('bui/tree/treemixin',['bui/common','bui/data'],function (require) {

  //将id 转换成node
  function makeSureNode(self,node){
    if(BUI.isString(node)){
      node = self.findNode(node);
    }
    return node;
  }
  //动画执行
  function animateFn(fn,timeout,count){
    setTimeout(function(){
      fn();
    }, timeout/count);
  }

  var BUI = require('bui/common'),
    Data = require('bui/data'),
    EXPAND = 'expanded',
    LOADING = 'loading',
    CHECKED = 'checked',
    PARTIAL_CHECKED = 'partial-checked',
    MAP_TYPES = {
      NONE : 'none',
      ALL : 'all',
      CUSTOM : 'custom',
      ONLY_LEAF : 'onlyLeaf'
    },
    CLS_ICON = 'x-tree-icon',
    CLS_ELBOW = 'x-tree-elbow',
    CLS_SHOW_LINE = 'x-tree-show-line',
    CLS_ICON_PREFIX = CLS_ELBOW + '-',
    CLS_ICON_WRAPER = CLS_ICON + '-wraper',
    CLS_LINE = CLS_ICON_PREFIX + 'line',
    CLS_END = CLS_ICON_PREFIX + 'end',
    CLS_EMPTY = CLS_ICON_PREFIX + 'empty',
    CLS_EXPANDER = CLS_ICON_PREFIX + 'expander',
    CLS_CHECKBOX = CLS_ICON + '-checkbox',
    CLS_EXPANDER_END = CLS_EXPANDER + '-end',
    Mixin = function(){

    };

  /**
   * @class BUI.Tree.Mixin
   * 树控件的扩展，可以应用于List,Grid等控件
   */
  Mixin.ATTRS = {


    /**
     * 树的数据缓冲类对象,用于操作数据的加载、增删改
     * <pre><code>
     * //数据缓冲类
     * var store = new Data.TreeStore({
     *     root : {
     *       id : '0',
     *      text : '0'
     *     },
     *     url : 'data/nodes.php'
     *   });
     *   
     * var tree = new Tree.TreeList({
     *   render : '#t1',
     *   showLine : true,
     *   height:300,
     *   store : store,
     *   showRoot : true
     * });
     * tree.render();
     * 
     * </code></pre>
     * @cfg {BUI.Data.TreeStore} store
     */
    /**
     * 树的数据缓冲类对象,默认都会生成对应的缓冲对象
     * <pre><code>
     * var store = tree.get('store');
     * </code></pre>
     * @type {BUI.Data.TreeStore}
     */
    store : {
      getter : function(v){
        if(!v){
          var _self = this,
            store = new Data.TreeStore({
            root : _self.get('root'),
            data : _self.get('nodes')
          });
          _self.setInternal('store',store);
          return store;
        }
        return v;
      }
    },
    /**
     * 树的根节点
     * <pre><code>
     *   //如果数据存在根节点，则配置根节点，以便于显示
     *   var tree = new TreeList({
     *     root : {id: '0',text : '0',children:[{},{}]},
     *     showRoot : true
     *   });
     *   //如果配置store，则不需要配置此属性
     *   var store = new Data.TreeStore({
     *     root : {id: '0',text : '0',children:[{},{}]}
     *   });
     *   
     *   var tree = new TreeList({
     *     store : store,
     *     showRoot : true
     *   });
     * </code></pre>
     * @cfg {Object} root
     */
    root : {

    },
    /**
     * 子节点集合
     * <pre><code>
     *   //如果不显示根节点，并且数据源中不存在根节点，可以仅配置此属性
     *   var tree = new TreeList({
     *     nodes:[{},{}]
     *   });
     * </code></pre>
     * @cfg {Array} nodes
     */
    nodes : {
      sync : false
    },
    /**
     * 放置节点Icon的容器,为空时，放置在节点的最前面
     * @protected
     * @type {String}
     */
    iconContainer : {

    },
    /**
     * 放置icon外层的模板，空白icon、叶子节点的icon、非叶子节点的Icon
     * @protected
     * @type {String}
     */
    iconWraperTpl : {
      value : '<span class="' + CLS_ICON_WRAPER + '">{icons}</span>'
    },
    /**
     * 是否显示连接线
     * <pre><code>
     *  var tree = new TreeList({
     *    nodes : [],
     *    showLine : true
     *  });
     * </code></pre>
     * @cfg {Boolean} showLine
     */
    /**
     * 是否显示连接线
     * @type {Boolean} showLine
     */
    showLine : {
      value : false
    },
    /**
     * 是否显示图标，包括节点展开折叠的图标，标示层级关系的空白图标
     * @type {Boolean}
     */
    showIcons : {
      value : true
    },
    /**
     * 图标所使用的模板
     * @protected
     * @type {Object}
     */
    iconTpl : {
      value : '<span class="x-tree-icon {cls}"></span>'
    },
    /**
     * 叶子节点应用的样式
     * <pre><code>
     *  var tree = new TreeList({
     *    nodes : [{},{}],
     *    leafCls : 'file',
     *    dirCls : 'folder' 
     *  });
     * </code></pre>
     * @cfg {String} [leafCls = 'x-tree-elbow-leaf']
     */
    leafCls : {
      value : CLS_ICON_PREFIX + 'leaf'
    },

    /**
     * 非叶子节点应用的样式
     * @cfg {String} [dirCls = 'x-tree-elbow-dir']
     */
    dirCls : {
      value : CLS_ICON_PREFIX + 'dir'
    },
    /**
     * 勾选类型，目前提供一下几种勾选方式:
     * <ol>
     *  <li>all : 全部节点可以勾选</li>
     *  <li>onlyLeaf : 只有子节点可以勾选</li>
     *  <li>custom : 自定义勾选，只有节点数据上有checked字段才允许勾选</li>
     *  <li>none : 全部节点不可勾选</li>
     * </ol>
     * @cfg {Object} [checkType = 'custom']
     */
    checkType : {
      value : 'custom'
    },
    /**
     * 是否只允许一个节点展开
     * @type {Boolean}
     */
    accordion : {
      value : false
    },
    /**
     * @private
     * 勾选字段
     * @type {String}
     */
    checkedField : {
      valueFn : function(){
        return this.getStatusField('checked');
      }
    },
    /**
     * 选项对象中属性会直接影响相应的状态,默认：
     * <pre><code>
     * //默认值
     * {
     *   expanded : 'expanded',
     *   disabled : 'disabled',
     *   checked : 'checked'
     * }
     * //对象
     * var node = {id : '1',text : '1',checked : true,expanded : true};
     * 
     * //如果你的数据源中的字段名跟这些状态名不一致，你可以自己修改
     * var tree = new TreeList({
     *   nodes : [],
     *   itemStatusFields : {
     *     disabled : 'hasDisabled', 
     *     custom : 'custom'  //添加自定义属性，此时节点生成后会自动添加对应的样式 bui + xclass + 'custom'
     *   }
     * });
     * </code></pre>
     * @override
     * @cfg {Object} itemStatusFields
     */
    itemStatusFields  : {
      value : {
        expanded : 'expanded',
        disabled : 'disabled',
        checked : 'checked'
      }  
    },
    /**
     * 文件夹是否可选，用于选择节点时，避免选中非叶子节点
     * @cfg {Boolean} [dirSelectable = true]
     */
    dirSelectable : {
      value : true
    },
    /**
     * 是否显示根节点
     * <pre><code>
     *
     *  var tree = new TreeList({
     *    root : {id : '0',text : '0',childrent : []},
     *    showRoot : true
     *  });
     *   
     * </code></pre>
     * @type {Boolean}
     */
    showRoot : {
      value : false
    },
    events : {
      value : {
        /**
         * @event
         * 展开节点
         * @param {Object} e 事件对象
         * @param {Object} e.Node 节点
         * @param {HTMLElement} e.element 节点的DOM
         */
        expanded : false,
        /**
         * @event
         * 折叠节点
         * @param {Object} e 事件对象
         * @param {Object} e.Node 节点
         * @param {HTMLElement} e.element 节点的DOM
         */
        collapsed : false,
        /**
         * @event
         * 勾选改变事件
         * @param {Object} e 事件对象
         * @param {Object} e.Node 节点
         * @param {Boolean} e.checked 选中状态
         * @param {HTMLElement} e.element 节点的DOM
         */
        checkedchange : false
      }
    },
    /**
     * 节点展开的事件
     * @type {String}
     */
    expandEvent : {
      value : 'itemdblclick'
    },
    /**
     * 展开收缩时是否使用动画
     * @type {Boolean}
     */
    expandAnimate : {
      value : false 
    },
    /**
     * 节点收缩的事件
     * @type {String}
     */
    collapseEvent : {
      value : 'itemdblclick'
    },
    /**
     * 开始的层级，如果显示根节点，从0开始，不显示根节点从1开始
     * @private
     * @readOnly
     * @type {Number}
     */
    startLevel : {
      value : 1
    }
  };

  BUI.augment(Mixin,{
    /**
     * 折叠所有
     * <pre><code>
     *  tree.collapseAll();
     * </code></pre>
     */
    collapseAll: function(){
      var _self = this,
        elements = _self.get('view').getAllElements();

      BUI.each(elements,function(element){
        var item = _self.getItemByElement(element);
        if(item){
          _self._collapseNode(item,element,true);
        }
      });
    },
    /**
     * 折叠节点
     * <pre><code>
     *  //获取节点后，折叠
     *  var node = tree.findNode('id');
     *  tree.collapseNode(node);
     *  //直接通过id 折叠
     *  tree.collapseNode('id');
     * </code></pre>
     * @param {String|Object|BUI.Data.Node} node 节点
     */
    collapseNode : function(node){
      var _self = this,
        element;
      if(BUI.isString(node)){
        node = _self.findNode(node);
      }
      element = _self.findElement(node);
      
      _self._collapseNode(node,element);
    },   
    /*
     * 展开所有
     * <pre><code>
     *  tree.expandAll();
     * </code></pre>
     */
    expandAll : function(){
      var _self = this,
        elements = _self.get('view').getAllElements();

      BUI.each(elements,function(element){
        var item = _self.getItemByElement(element);
        _self._expandNode(item,element,true);
      });
    },
    /**
     * 展开节点
     * <pre><code>
     *  //获取节点后展开
     *  var node = tree.findNode('id');
     *  tree.expandNode(node);
     *  //使用store时，获取节点，然后展开
     *  var node = store.findNode('id');
     *  tree.expandNode(node);
     *  //直接使用id 展开
     *  tree.expandNode('id');
     * </code></pre>
     * ** Notes **
     * 由于树控件其实是一个列表，所以未展开节点的子节点其实不在列表中，所以这些节点通过tree.getItem('id'),此时查找不到对应的节点
     * @param  {String|Object|BUI.Data.Node} node 节点或者 节点id
     */
    expandNode : function(node,deep){
      var _self = this,
        element;
      if(BUI.isString(node)){
        node = _self.findNode(node);
      }

      if(node.parent && !_self.isExpanded(node.parent)){
        _self.expandNode(node.parent);
      }

      element = _self.findElement(node);
      _self._expandNode(node,element,deep);
    },
    /**
     * 沿着path(id的连接串) 展开
     * <pre>
     *  <code>
     *    var path = "0,1,12,121"; //沿着根节点0，树节点 1,12直到121的路径展开
     *    tree.expandPath(path); //如果中间有节点不存在，终止展开
     *  </code>
     * </pre>
     * @param  {String} path 节点的path，从根节点，到当前节点的id组合
     */
    expandPath : function(path,async,startIndex){
      if(!path){
        return;
      }
      startIndex = startIndex || 0;
      var _self = this,
        store = _self.get('store'),
        preNode,
        node,
        i,
        id,
        arr = path.split(',');

      preNode = _self.findNode(arr[startIndex]);
      for(i = startIndex + 1; i < arr.length ; i++){
        id = arr[i];
        node = _self.findNode(id,preNode);
        if(preNode && node){ //父元素，子元素同时存在
          _self.expandNode(preNode);
          preNode = node;
        }else if(preNode && async){
          store.load({id : preNode.id},function(){ //加载完成后
            node = _self.findNode(id,preNode);
            if(node){
              _self.expandPath(path,async,i);
            }
          });
          break;
        } 
      }
    },
    /**
     * 查找节点
     * <pre><code>
     *  var node = tree.findNode('1');//从根节点开始查找节点
     *  
     *  var subNode = tree.findNode('123',node); //从指定节点开始查找
     * </code></pre>
     * @param  {String} id 节点Id
     * @param  {BUI.Data.Node} [parent] 父节点
     * @return {BUI.Data.Node} 节点
     */
    findNode : function(id,parent){
      return this.get('store').findNode(id,parent);
    },  
    /**
     * 获取所有勾选的子节点
     * <pre><code>
     *  //获取所有选中的叶子节点
     *  var nodes = tree.getCheckedLeaf();
     *  
     *  //获取指定节点选中的叶子节点
     *  var node = tree.findNode('1'),
     *    nodes = tree.getCheckedLeaf(node);
     *  
     * </code></pre>
     * @param {BUI.Data.Node} [parent] 父节点
     * @return {Array} 节点列表
     */
    getCheckedLeaf : function(parent){
      var _self = this,
        store = _self.get('store');

      return store.findNodesBy(function(node){
        return node.leaf && _self.isChecked(node);
      },parent);
    },
    /**
     * 获取勾选中的节点列表
     * <pre><code>
     *  //获取所有选中节点
     *  var nodes = tree.getCheckedNodes();
     *  
     *  //获取指定节点选中的节点
     *  var node = tree.findNode('1'),
     *    nodes = tree.getCheckedNodes(node);
     *  
     * </code></pre>
     * @param {BUI.Data.Node} [parent] 父节点
     * @return {Array} 节点列表
     */
    getCheckedNodes : function(parent){
      var _self = this,
        store = _self.get('store');

      return store.findNodesBy(function(node){
        return _self.isChecked(node);
      },parent);
    },
    //节点是否可以被选中
    isItemSelectable : function(item){
      var _self = this,
        dirSelectable = _self.get('dirSelectable'),
        node = item;
      if(node && !dirSelectable && !node.leaf){ //如果阻止非叶子节点选中
        return false;
      }
      return true;
    },
    /**
     * 节点是否展开,如果节点是叶子节点，则始终是false
     * <pre><code>
     *  tree.isExpanded(node);
     * </code></pre>
     * @return {Boolean} 是否展开
     */
    isExpanded : function(node){
      if(!node || node.leaf){
        return false;
      }
      var _self = this,
        element;
      if(_self._isRoot(node) && !_self.get('showRoot')){ //根节点，切不显示根节点时，认为根节点时展开的
        return true;
      }
      if(BUI.isString(node)){
        item = _self.getItem(node);
      }
      element = _self.findElement(node);
      return this._isExpanded(node,element);
    },
    /**
     * 节点是否勾选
     * <pre><code>
     *  tree.isChecked(node);
     * </code></pre>
     * @return {Boolean} 节点是否勾选
     */
    isChecked : function(node){
      if(!node){
        return false;
      }
      return  node[this.get('checkedField')];//this.getStatusValue(node,'checked');
    },
    /**
     * 切换显示隐藏
     * <pre><code>
     *  var node = tree.getItem('id');
     *  tree.collapseNode(node); //节点收缩
     *  tree.toggleExpand(node); //节点展开
     *  tree.toggleExpand(node); //节点收缩
     * </code></pre>
     * @param  {String|Object|BUI.Data.Node} node 节点
     */
    toggleExpand : function(node){
      var _self = this,
        element;
      if(BUI.isString(node)){
        item = _self.getItem(node);
      }
      element = _self.findElement(node);
      _self._toggleExpand(node,element);
    },
    /**
     * 设置节点勾选状态
     * <pre><code>
     *  var node = tree.findNode('1');
     *  tree.setNodeChecked(node,true); //勾选
     *  tree.setNodeChecked(node,false); //取消勾选
     * </code></pre>
     * @param {String|Object|BUI.Data.Node} node 节点或者节点id
     * @param {Boolean} checked 是否勾选
     */
    setNodeChecked : function(node,checked,deep){
      deep = deep == null ? true : deep;
      if(!node){
        return;
      }
      var _self = this,
        parent,
        element;
      node = makeSureNode(this,node);
      if(!node){
        return;
      }
      parent = node.parent;
      if(!_self.isCheckable(node)){
        return;
      }

      if(_self.isChecked(node) !== checked || _self.hasStatus(node,'checked') !== checked){

        element =  _self.findElement(node);
        if(element){
          _self.setItemStatus(node,CHECKED,checked,element); //设置选中状态
          _self._resetPatialChecked(node,checked,checked,element); //设置部分勾选状态
        }else if(!_self.isItemDisabled(node)){
          _self.setStatusValue(node,'checked',checked);
        }
        if(parent){ //设置父元素选中
          if(_self.isChecked(parent) != checked){
            _self._resetParentChecked(parent);
          }else{
            _self._resetPatialChecked(parent,null,null,null,true);
          }
        }
        _self.fire('checkedchange',{node : node,element: element,checked : checked});
        
      }
      if(!node.leaf && deep){ //树节点，勾选所有子节点
        BUI.each(node.children,function(subNode){
          _self.setNodeChecked(subNode,checked,deep);
        });
      }
    },

    /**
     * 设置节点勾选状态
     * @param {String|Object|BUI.Data.Node} node 节点或者节点id
     */
    setChecked : function(node){
      this.setNodeChecked(node,true);
    },
    /**
     * 清除所有的勾选
     */
    clearAllChecked : function(){
      var _self = this,
        nodes = _self.getCheckedNodes();
      BUI.each(nodes,function(node){
        _self.setNodeChecked(node,false);
      });
    },
    //初始化根节点
    _initRoot : function(){
      var _self = this,
        store = _self.get('store'),
        root,
        showRoot = _self.get('showRoot'),
        nodes;
      if(store){
        root = store.get('root');
        _self.setInternal('root',root);
        if(showRoot){
          nodes = [root];
        }else{
          nodes = root.children;
        }
        
        BUI.each(nodes,function(subNode){
          _self._initChecked(subNode,true);
        });
        _self.clearItems();
        _self.addItems(nodes);
        //_self.set('nodes',nodes);
      }

    },
    //初始化节点的勾选
    _initChecked : function(node,deep){
      var _self = this,
        checkType = _self.get('checkType'),
        checkedField = _self.get('checkedField'),
        parent; 
      if(checkType === MAP_TYPES.NONE){ //不允许选中
        delete node[checkedField];
        return;
      }

      if(checkType === MAP_TYPES.ONLY_LEAF){ //仅叶子节点可选
        if(node.leaf){
          node[checkedField] = node[checkedField] || false;
        }else{
          delete node[checkedField];
          if(deep){
            BUI.each(node.children,function(subNode){
              _self._initChecked(subNode,deep);
            });
          }
        }
        return;
      }

      if(checkType === MAP_TYPES.ALL){ //所有允许选中
        node[checkedField] = node[checkedField] || false;
      }

      if(!node || !_self.isCheckable(node)){ //如果不可选，则不处理勾选
        return;
      }
      parent = node.parent;
      if(!_self.isChecked(node)){ //节点未被选择，根据父、子节点处理勾选
        if(parent && _self.isChecked(parent)){ //如果父节点选中，当前节点必须勾选
          _self.setStatusValue(node,'checked',true);
        }
        if(_self._isAllChildrenChecked(node)){
          _self.setStatusValue(node,'checked',true);
        }
      }
      if(deep){
        BUI.each(node.children,function(subNode){
          _self._initChecked(subNode,deep);
        });
      }
      
    },
    //设置部分选中效果
    _resetPatialChecked : function(node,checked,hasChecked,element,upper){
      if(!node || node.leaf){
        return true;
      }
      var _self = this,
        hasChecked;
      checked = checked == null ? _self.isChecked(node) : checked;
      if(checked){
        _self.setItemStatus(node,PARTIAL_CHECKED,false,element);
        return;
      }
      hasChecked = hasChecked == null ? _self._hasChildChecked(node) : hasChecked;

      _self.setItemStatus(node,PARTIAL_CHECKED,hasChecked,element);
      if(upper && node.parent){
        _self._resetPatialChecked(node.parent,false,hasChecked ? hasChecked : null,null,upper)
      }
      
    },
    //子节点变化，重置父节点勾选
    _resetParentChecked : function(parentNode){
      if(!this.isCheckable(parentNode)){
        return;
      }
      var _self = this,
        allChecked = _self._isAllChildrenChecked(parentNode);
      _self.setStatusValue(parentNode,'checked',allChecked);
      _self.setNodeChecked(parentNode,allChecked,false);
      _self._resetPatialChecked(parentNode,allChecked,null,null);
    },
    //绑定事件
    __bindUI : function(){
      var _self = this,
        el = _self.get('el');

      //点击选项
      _self.on('itemclick',function(ev){
        var sender = $(ev.domTarget),
          element = ev.element,
          node = ev.item;
        if(sender.hasClass(CLS_EXPANDER)){
          _self._toggleExpand(node,element); //点击展开收缩节点，不触发选中事件
          return false;
        }else if(sender.hasClass(CLS_CHECKBOX)){
          var checked = _self.isChecked(node);
          _self.setNodeChecked(node,!checked);
        }
        
      });
      
      /*_self.on('beforeselectedchange',function(ev){
        
      });
      */
      _self.on('itemrendered',function(ev){
        var node = ev.item,
          element = ev.domTarget;
        _self._resetIcons(node,element);
        if(_self.isCheckable(node)){
          _self._resetPatialChecked(node,null,null,element);
        }
        if(_self._isExpanded(node,element)){
          _self._showChildren(node);
        }
        
      });
      _self._initExpandEvent();
    },
    //初始化展开收缩事件
    _initExpandEvent : function(){
      var _self = this,
        el = _self.get('el'),
        expandEvent = _self.get('expandEvent'),
        collapseEvent = _self.get('collapseEvent');

      function createCallback(methodName){
        return function(ev){
          var sender = $(ev.domTarget),
            element = ev.element,
            node = ev.item;
          if(!sender.hasClass(CLS_EXPANDER)){
            _self[methodName](node,element);
          }
        }
      }
      if(expandEvent == collapseEvent){
        _self.on(expandEvent,createCallback('_toggleExpand'));
      }else{
        if(expandEvent){
          _self.on(expandEvent,createCallback('_expandNode'));
        }
        if(collapseEvent){
          _self.on(collapseEvent,createCallback('_collapseNode'));
        }
      }
      
    },
    //是否所有子节点被选中
    _isAllChildrenChecked : function(node){
      if(!node || node.leaf){
        return false;
      }
      var _self = this,
        children = node.children,
        rst = true;
      BUI.each(children,function(subNode){
        rst = rst && _self.isChecked(subNode);
        if(!rst){ //存在未选中的，返回
          return false;
        }
      });
      return rst;
    },
    //是否有子节点选中
    _hasChildChecked : function(node){
      if(!node || node.leaf){
        return false;
      }
      var _self = this;

      return _self.getCheckedNodes(node).length != 0;
    },
    //是否是根节点
    _isRoot : function(node){
      var _self = this,
        store = _self.get('store');
      if(store && store.get('root') == node){
        return true;
      }
      return false;
    },
    //设置加载状态
    _setLoadStatus : function(node,element,loading){
      var _self = this;
      _self.setItemStatus(node,LOADING,loading,element);
    },  
    //加载节点前
    _beforeLoadNode : function(node){
      var _self = this,
        element;
      if(BUI.isString(node)){
        node = _self.findNode(node);
      }
      element = _self.findElement(node)
      if(element){
        _self._setLoadStatus(node,element,true);
      }
      if(node){
        BUI.each(node.children,function(subNode){
          _self._removeNode(subNode);
        });
        
      }
      
    },
    /**
     * @override
     * @protected
     * 加载节点前触发
     */
    onBeforeLoad : function(e){
      var _self = this,
        params = e.params,
        id = params.id,
        node = _self.findNode(id) || _self.get('root');
      _self._beforeLoadNode(node);
    },
    //添加节点
    _addNode : function(node,index){
      var _self = this,
        parent = node.parent,
        scount,//兄弟节点的数量
        prevNode, //前一个节点
        nextNode, //后一个节点，用于计算本节点放置的位置,不一定是同级节点
        cIndex;//节点插入的位置
      _self._initChecked(node,true);
      if(parent){
        if(_self.isExpanded(parent)){ //展开的节点
          scount = parent.children.length;

          cIndex = _self._getInsetIndex(node);//下一个节点的位置
          _self.addItemAt(node,cIndex);
          if(index == scount -1 && index > 0){ //作为最后一个节点，更新前一个兄弟节点的图标
            prevNode = parent.children[index - 1];
            _self._updateIcons(prevNode);
          }
        }
        _self._updateIcons(parent); //更新父节点的icon
      }else{ //没有父节点，则添加到跟节点下
        cIndex = _self._getInsetIndex(node);
        _self.addItemAt(node,cIndex);
        prevNode = _self.get('nodes')[index - 1];
        _self._updateIcons(prevNode);
      }
    },
    //获取节点的插入位置
    _getInsetIndex : function(node){
      var _self = this,
        nextNode,
        rst = null;
      nextNode = _self._getNextItem(node);
      if(nextNode){
        return _self.indexOfItem(nextNode);
      }
      return _self.getItemCount();
    },
    //获取显示在列表上的下一项，不仅仅是同级节点
    _getNextItem : function(item){
      var _self = this,
        parent = item.parent,
        slibings,
        cIndex,
        rst = null;
      if(!parent){
        return null;
      }
      slibings = parent.children;
      cIndex = BUI.Array.indexOf(item,slibings)
      rst = slibings[cIndex + 1];

      return rst || _self._getNextItem(parent);
    },
    /**
     * @override 
     * @protected
     * 重写添加节点方法
     */
    onAdd : function(e){
      var _self = this,
        node = e.node,
        index = e.index;
      _self._addNode(node,index);
    },
    //更新节点
    _updateNode : function(node){
      var _self = this;
      _self.updateItem(node);
      _self._updateIcons(node);
    },
    /**
     * @override 
     * @protected
     * 重写更新节点方法
     */
    onUpdate : function(e){
      var _self = this,
        node = e.node;
      _self._updateNode(node);
    },
    //删除节点
    _removeNode : function(node,index){
      var _self = this,
        parent = node.parent,
        scount,
        prevNode;
      _self.collapseNode(node); //收缩节点，以便于同时删除子节点
      if(!parent){
        return;
      }
      _self.removeItem(node);
      if(_self.isExpanded(parent)){ //如果父节点展开
        
        scount = parent.children.length;
        if(scount == index && index !== 0){ //如果删除的是最后一个，更新前一个节点图标
          prevNode = parent.children[index - 1];
          _self._updateIcons(prevNode);
        }
      }
      _self._updateIcons(parent);
      _self._resetParentChecked(parent);
    },
    /**
     * @override 
     * @protected
     * 重写删除节点方法
     */
    onRemove : function(e){
      var _self = this,
        node = e.node,
        index = e.index;
      _self._removeNode(node,index);
    },
    //加载完节点
    _loadNode : function(node){
      var _self = this;
      _self.expandNode(node);
      _self._updateIcons(node);
      _self.setItemStatus(node,LOADING,false);
    },
    __syncUI : function(){
      var _self = this,
        store = _self.get('store'),
        showRoot = _self.get('showRoot');
      if(showRoot && !store.hasData()){ //树节点没有数据，但是需要显示根节点时
        _self._initRoot();
      }
    },
     /**
     * @override 
     * @protected
     * 加载节点
     */
    onLoad : function(e){
      var _self = this,
        store = _self.get('store'),
        root = store.get('root'),
        node;

      if(!e || e.node == root){ //初始化加载时,或者加载根节点
        _self._initRoot();
      }
      if(e && e.node){
        _self._loadNode(e.node);
      } 
    },
    _isExpanded : function(node,element){
      return this.hasStatus(node,EXPAND,element);
    },
    //获取Icon的模板
    _getIconsTpl : function(node){
      var _self = this,
        level = node.level,
        start = _self.get('startLevel'),
        iconWraperTpl = _self.get('iconWraperTpl'),
        icons = [],
        i;
      for(i = start ; i < level ; i = i + 1){
        icons.push(_self._getLevelIcon(node,i));
      }
      icons.push(_self._getExpandIcon(node));
      icons.push(_self._getCheckedIcon(node));
      icons.push(_self._getNodeTypeIcon(node));
      return BUI.substitute(iconWraperTpl,{icons : icons.join('')});
    },
    //获取勾选icon
    _getCheckedIcon : function(node){
      var _self = this,
        checkable = _self.isCheckable(node);
      if(checkable){
        return _self._getIcon(CLS_CHECKBOX);
      }
      return '';
    },
    /**
     * 是否可以勾选
     * @protected
     * @param  {Object | BUI.Data.Node} node 节点
     * @return {Boolean}  是否可以勾选
     */
    isCheckable : function(node){
      return node[this.get('checkedField')] != null;
    },
    //获取展开折叠的icon
    _getExpandIcon : function(node){
      var _self = this,
        cls = CLS_EXPANDER; 
      if(node.leaf){
        return _self._getLevelIcon(node);
      }
      if(_self._isLastNode(node)){
        cls = cls + ' ' + CLS_EXPANDER_END;
      }
      return _self._getIcon(cls);
    },
    //叶子节点和树节点有不同的icon
    _getNodeTypeIcon : function(node){
      var _self = this,
        cls = node.cls ? node.cls :(node.leaf ? _self.get('leafCls') : _self.get('dirCls'));
      return _self._getIcon(cls);
    },
    //获取对应Level的icon
    _getLevelIcon : function(node,level){
      var _self = this,
        showLine = _self.get('showLine'),
        cls = CLS_EMPTY,
        levelNode;
      if(showLine){ //如果显示连接线
        if(node.level === level || level == null){ //当前的连接线
          cls = _self._isLastNode(node) ? CLS_END : CLS_ELBOW;
        }else{ //上一级的连接线
          levelNode = _self._getParentNode(node,level);
          cls = _self._isLastNode(levelNode) ? CLS_EMPTY : CLS_LINE;
        }
      }
      return _self._getIcon(cls);
    },
    //获取对应level的父节点
    _getParentNode : function(node,level){
      var nodeLevel = node.level,
        parent = node.parent,
        i = nodeLevel - 1;
      if(nodeLevel <= level){
        return null;
      }
      while(i > level){
        parent = parent.parent;
        i = i - 1;
      }
      return parent;
    },
    //获取icon
    _getIcon : function(cls){
       var _self = this,
        iconTpl = _self.get('iconTpl');
      return BUI.substitute(iconTpl,{cls : cls});
    },
    //是否是父节点的最后一个节点
    _isLastNode : function(node){

      if(!node){
        return false;
      }
      if(node == this.get('root')){
        return true;
      }

      var _self = this,
        parent = node.parent,
        siblings = parent ? parent.children : _self.get('nodes'),
        count;

      count = siblings.length;
      return siblings[count - 1] === node;
    },
    //初始化所有节点，设置level 和 leaf
    _initNodes : function(nodes,level,parent){
      var _self = this;
      BUI.each(nodes,function(node){
        node.level = level;
        if(node.leaf == null){
          node.leaf = node.children ? false : true;
        }
        if(parent && !node.parent){
          node.parent = parent;
        }
        _self._initChecked(node);
        if(node.children){
          _self._initNodes(node.children,level + 1,node);
        }
        
      });
    },
    //折叠节点
    _collapseNode : function(node,element,deep){
      var _self = this;
      if(node.leaf){
        return;
      }
      if(_self.hasStatus(node,EXPAND,element)){
        _self.setItemStatus(node,EXPAND,false,element);
        if(deep){
          _self._collapseChildren(node,deep);
          _self.removeItems(node.children);
        }else{
          _self._hideChildrenNodes(node);
        }
        _self.fire('collapsed',{node : node ,element : element});
      }
    },
    //隐藏子节点
    _hideChildrenNodes : function(node){
      var _self = this,
        children = node.children,
        elements = [];
      BUI.each(children,function(subNode){
        //_self.removeItem(subNode);
        var element = _self.findElement(subNode);
        if(element){
          elements.push(element);
          _self._hideChildrenNodes(subNode);
        }
      });
      if(_self.get('expandAnimate')){
        elements = $(elements);
        elements.animate({height : 0},function(){
          _self.removeItems(children);
        });
      }else{
        _self.removeItems(children);
      }
      
    }/*,
    _slideUpNodes : function(elements,callback){
      var wrapEl = $('<div></div>').insertBefore(elements[0]);
      $(elements).appendTo(wrapEl);
      wrapEl.slideUp(function(){
        callback();
        wrapEl.remove();
      });
    }*/,
    _collapseChildren : function(parentNode,deep){
      var _self = this,
        children = parentNode.children;
      
      BUI.each(children,function(node){
        _self.collapseNode(node,deep);
      });
    },
    //展开选项
    _expandNode : function(node,element,deep){
      var _self = this,
        accordion = _self.get('accordion'),
        store = _self.get('store');
      if(node.leaf){ //子节点不展开
        return;
      }
      if(!_self.hasStatus(node,EXPAND,element)){
        if(accordion && node.parent){
          var slibings = node.parent.children;
          BUI.each(slibings,function(sNode){
            if(sNode != node){
              _self.collapseNode(sNode);
            }
          });
        }
        if(store && !store.isLoaded(node)){ //节点未加载，则加载节点
          if(!_self._isLoading(node,element)){
            store.loadNode(node);
          }
        }else if(element){
          _self.setItemStatus(node,EXPAND,true,element);
          _self._showChildren(node);
          _self.fire('expanded',{node : node ,element : element});
        }

      }
      BUI.each(node.children,function(subNode){
        if(deep || _self.isExpanded(subNode)){
          _self.expandNode(subNode,deep);
        }
      });
      
    },
    //显示子节点
    _showChildren : function(node){
      if(!node || !node.children){
        return;
      }
      var _self = this,
        index = _self.indexOfItem(node),
        length = node.children.length,
        subNode,
        i = length - 1,
        elements = [];
      for (i = length - 1; i >= 0; i--) {
        subNode = node.children[i];
        if(!_self.getItem(subNode)){
          if(_self.get('expandAnimate')){
            el = _self._addNodeAt(subNode,index + 1);
            el.hide();
            el.slideDown();
          }else{
            _self.addItemAt(subNode,index + 1);
          } 
        }
      };
    },
    _addNodeAt : function(item,index){
       var _self = this,
        items = _self.get('items');
      if(index === undefined) {
          index = items.length;
      }
      items.splice(index, 0, item);
      return _self.addItemToView(item,index);
    },
    //_showNode
    _isLoading : function(node,element){
      var _self = this;
      return _self.hasStatus(node,LOADING,element);
    },
    //重置选项的图标
    _resetIcons :function(node,element){
      if(!this.get('showIcons')){ //如果不显示图标，则不重置
        return;
      }
      var _self = this,
        iconContainer = _self.get('iconContainer'),
        containerEl,
        iconsTpl = _self._getIconsTpl(node);
      $(element).find('.' + CLS_ICON_WRAPER).remove(); //移除掉以前的图标
      containerEl = $(element).find(iconContainer).first();
      if(iconContainer && containerEl.length){
        $(iconsTpl).prependTo(containerEl);
      }else{
        $(element).prepend($(iconsTpl));
      }
    },
    //切换显示隐藏
    _toggleExpand : function(node,element){
      var _self = this;
      if(_self._isExpanded(node,element)){
        _self._collapseNode(node,element);
      }else{
        _self._expandNode(node,element);
      }
    }, 
    //更新节点图标 
    _updateIcons : function(node){
      var _self = this,
        element = _self.findElement(node);
      if(element){
        _self._resetIcons(node,element);
        if(_self._isExpanded(node,element) && !node.leaf){ //如果节点展开，那么更新子节点的图标样式
          BUI.each(node.children,function(subNode){
            _self._updateIcons(subNode);
          });
        }
      }
    },
    //设置显示根节点
    _uiSetShowRoot : function(v){
      var _self = this,
        start = this.get('showRoot') ? 0 : 1;
      _self.set('startLevel',start);
    },
    _uiSetNodes : function(v){
      var _self = this,
        store = _self.get('store');
      store.setResult(v);
    },
    _uiSetShowLine : function(v){
      var _self = this,
        el = _self.get('el');
      if(v){
        el.addClass(CLS_SHOW_LINE);
      }else{
        el.removeClass(CLS_SHOW_LINE);
      }
    }
  });

  return Mixin;
})
BUI.use(['bui/common','bui/data','bui/list','bui/picker',
  'bui/menu','bui/toolbar','bui/progressbar','bui/cookie',
  'bui/form','bui/mask','bui/select','bui/tab',
  'bui/calendar','bui/overlay','bui/editor','bui/grid','bui/tree','bui/tooltip'
]);
