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
 

