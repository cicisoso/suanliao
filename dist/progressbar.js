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
