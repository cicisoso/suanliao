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