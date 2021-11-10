/*!
 * @name Hybrid
 * @class 整合文件上传，表单提交，Ajax 处理，模板引擎
 * @date: 2021/06/07
 * @see http://www.veryide.com/projects/hybrid/
 * @author Lay
 * @copyright VeryIDE
 * @constructor
 */
var Hybrid = {

	/**
	* @desc  运行片段
	*/
	clips : [],

	/**
	* @desc  默认配置
	*/
	config : {

		//调试模式
		debug : false,
	
		//签名参数
		token : '',
		
		//版本编号
		build : '',

		//百度统计ID
		baidu : '',

		//阿里妈妈PID
		mapid : '',

		//谷歌统计ID
		google : '',
		
		//公共代理服务
		proxy : '/proxy/',

		//附件目录
		attach : '/attach/',
		
		//公共文件目录
		public : '/public/',
		
		//文件上传接口
		upload : '/upload/native',
		
		//文件删除接口
		remove : '/upload/remove',
		
		//返回顶部元素
		scroll : '.gotop',

		//Vue 可选数据
		option : {},

		//Vue 扩展对象
		extend : {},
		
		//Vue 绑定元素
		element : '#app',

		//标题规则
		docname : {},

		//模块配置
		modules : {},

		//页面水印特征
		imprint : '',
		
		//短网址生成接口	
		shorten : '/fx/tinyurl',
		
		//错误消息收集接口
		jserror : '/fx/jserror'
		
	},

	/**
	* @desc  合并数组，相同的键为替换，不同的键为新增
	* @param {Object} array1 数组1
	* @param {Object} array2 数组2
	* @param {Object} arrayN 数组N
	* @return {Object} 合并后的数组
	* @example
	* Hybrid.merge( { quality : 80, output : 'png' }, { unit : '%', output : 'jpg' } );
	*/
	merge : function() {
		var obj = {}, i = 0, il = arguments.length, key;
		for (; i < il; i++) {
			for (key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					obj[key] = arguments[i][key];
				}
			}
		}
		return obj;
	},

	/**
	* @desc  替换字符串指定位置内容
	* @param {String}  str	   输入字符串
	* @param {String}  replace      替换字符串
	* @param {String}  start       参考 PHP 同名函数
	* @param {Number}    length      参考 PHP 同名函数
	* @return {String} 新字符串
	*/
	substr_replace : function (str, replace, start, length) {
		if (start < 0) {
			start = start + str.length;
		}
		length = length !== undefined ? length : str.length;
		if (length < 0) {
			length = length + str.length - start;
		}
		return str.slice(0, start) + replace.substr(0, length) + replace.slice(length) + str.slice(start + length);
	},

	/**
	* @desc  将字符串填充至指定长度
	* @param {Number}  width	   目标长度
	* @param {String}  string      字符串
	* @param {String}  padding     填充内容
	* @return {String} 新字符串
	*/
	strpad : function (width, string, padding) {
		return (width <= string.length) ? string : Hybrid.strpad(width, padding + string, padding);
	},

	/**
	* @desc  获取毫秒时间戳
	* @param {Boolean}  get_as_float	是否返回浮点数
	* @return {String} 新字符串
	*/
	microtime : function (get_as_float) {
		// http://jsphp.co/jsphp/fn/view/microtime
		// +   original by: Paulo Freitas
		// *     example 1: timeStamp = microtime(true);
		// *     results 1: timeStamp > 1000000000 && timeStamp < 2000000000
		var now = new Date().getTime() / 1000;
		var s = parseInt(now, 10);
	
		return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
	},

	/**
	* @desc  生成 URL-encode 之后的请求字符串
	* @param {Object}  data	   可以是数组或包含属性的对象
	* @return {String} URL 编码后的字符串
	*/
	http_build_query : function(data) {
		return Object.keys(data).map(function(key) {
			return [key, data[key]].map(encodeURIComponent).join('=');
		}).join("&");
	},

	////////////////////

	/**
	* @desc  执行对象子方法函数
	* @param {String}  function	   函数名称
	* @param {Object}  context     上下文
	* @param {Object}  arguments   其他参数
	* @return {Mixed} 
	*/
	execute : function( func, context /*, args */) {
		if( !context ) return;
		var args = [].slice.call(arguments).splice(2);
		var namespaces = func.split('.');
		var func = namespaces.pop();
		for(var i = 0; i < namespaces.length; i++) {
			context = context[namespaces[i]];
		}
		if( typeof context[func] != 'function' ){
			console.error( func + ' is not function' );
		}else{
			return context[func].apply(context, args);
		}
	},

	/**
	* @desc  读写对象子属性
	* @param {String}  property	   属性名称
	* @param {Object}  context     上下文
	* @param {Object}  value	   设置的值
	* @param {Boolean}  push	   是否入栈
	* @return {Mixed} 
	*/
	variate : function( prop, context, value, push ) {		
		if( !context ) return;
		var namespaces = prop.split('.');
		var prop = namespaces.pop();
		for(var i = 0; i < namespaces.length; i++) {
			context = context[namespaces[i]];
		}
		var raw = context[prop];
		if( typeof value != 'undefined' ){
			if( push && raw ){
				value = raw.concat( value );
			}
			Vue.set( context, prop, value);
		}else{
			return raw;
		}	
	},

	////////////////////

	/*
	* @desc	根据当前文件得到缩略图地址
	* @param {String} file	源文件
	* @param {String|Array} size	尺寸
	* @return {String} 图片地址
	*/
	thumb : function ( file, size ){

		if( !file ){
			return '';
		}

		//适配 alicdn
		var mark = /(alicdn.com|tbcdn.cn|\!\!)/.test( file );

		if( mark && !isNaN( size ) ){
			size = [ size, size ];
		}
	
		if( size instanceof Array ){
			size = size.join('x');
		}else{
			size = size ? size : 'thumb';
		}
	
		if( mark ){
			file = file.replace(/_(\d+?)x(\d+?)\.(jpg|png|webp)/, '');
			return file + '_' + size + '.jpg';
		}else{
			return Hybrid.substr_replace( file, '!'+ size +'.', file.lastIndexOf('.'), 1 );
		}
	
	},
	
	/*
	* @desc	返回图片的代理地址
	* @return {String} 图片地址
	*/
	proxy : function( file ){	
		if( /(imgextra|qpic|cnblogs)/.test( file ) && Hybrid.config.proxy ){
			return file.replace( /^(http:|https:)?\/\//ig, Hybrid.config.proxy );
		}else{
			return file;
		}	
	},

	/*
	* @desc	根据用户ID得到头像地址
	* @param {Number} uid	用户ID
	* @param {String|Array} size	尺寸
	* @return {String} 图片地址
	*/
	avatar : function( uid, size ){
		var uid = parseInt(uid);     //UID取整数		
		if( !uid ) return;
		uid = Math.abs( uid );        //绝对值
		uid = Hybrid.strpad(9, uid, '0');
		var dir1 = uid.substr(0, 3);             //取左边3位，即 000
		var dir2 = uid.substr(3, 2);             //取4-5位，即00
		var dir3 = uid.substr(5, 2);             //取6-7位，即00
		var file = Hybrid.config.attach + 'avatar/'+dir1+'/'+dir2+'/'+dir3+'/'+ uid.substr(-2)+'.jpg';
		return size ? Hybrid.thumb( file, size ) : file;
	},

	////////////////////

	/**
	* @desc  浏览状态管理
	*/
	State : {

		/*
		* @desc 根据规则更新页面标题
		* @param {String} flag		模板标识
		* @param {Object} result	数据（JSON 格式）
		*/
		title : function( flag, result ){
			if( k = Hybrid.config.docname[flag] ){
				if( name = result[k] ){
					document.title = name;
				}
			}
		},

		/*
		* @desc	检测浏览器是否支持 state
		* @return {Boolean}
		*/
		detect : function(){
			return 'pushState' in history;
		},

		/*
		* @desc	追加一条状态
		* @param {Object} state	状态信息（JSON 格式）
		* @param {String} title	标题
		* @param {String} URL
		*/
		push : function( state, title, url ){
			window.history.pushState( state, title, url );
		},

		/*
		* @desc	替换一条状态
		* @param {Object} state	状态信息（JSON 格式）
		* @param {String} title	标题
		* @param {String} URL
		*/
		replace : function( state, title, url ){
			window.history.replaceState( state, title, url );
		},

		/*
		* @desc	history实体被改变时，popstate事件将会发生
		* @param {Function} func	处理函数
		*/
		popstate : function( func ){
			window.addEventListener( 'popstate', function() {
				var state = history.state;
				func && func( state );
			});
		},		
		
		/*
		* @desc	返回document的可见性
		*/
		visibility : function(){		 
			 if( "visibilityState" in document ){
				return document.visibilityState;
			 }else{
				return null;
			 }
		}
		
	},
	

	/**
	* @desc  处理文件上传
	*/
	QRCode : function( el, opts ){

		var fn = function(){
			new QRCode( el, opts );
		};

		if( typeof QRCode != 'undefined' ){
			fn();
		}else{
			R.script( Hybrid.config.public + 'js/pack.qrcode.js?v=' + Hybrid.config.build, fn);
		}

	},

	////////////////////

	/**
	* @desc  原生文件上传
	*/
	Upload : function(){

		var qs = 'input[model=native]';
	
		typeof Hybrid.config.upload != 'undefined' && R(qs).size() && R.script( Hybrid.config.public + 'js/pack.upload.js?v=' + Hybrid.config.build, function(){
		
			Upload.init( qs, {
				'upload': Hybrid.config.upload,
				'delete': Hybrid.config.remove,
				'class' : 'upload',
				'formdata' : {
					'model' : 'native',
					'token' : Hybrid.config.token
				}
			}, {

				//出错时回调
				error : function( name, code, msg ){
					R.toast( 'success', msg, {'time': 4, 'unique': 'invalid'});
				},

				//通过时回调
				valid : function( name, file, size, image ){
					R.toast( 'success', '文件上传完成', {'time': 2, 'unique': 'toast'});
				},

				//完成时回调
				complete : function( name, node, result ){
					Hybrid.Request.done( result, node );
				}

			});
		
		} );

	},

	/**
	* @desc  高级图片上传
	*/
	Magick : function(){

		//文件选择后，上传处理
		var fn = function( idx, e ){

			var node = this;
			
			//存储元素、预览图片
			var stg = this.getAttribute('storage'), prv = this.getAttribute('preview'), conf = this.getAttribute('config');

			//配置信息
			var set = conf ? JSON.parse( conf ) : {};

			//对图片进行预处理
			Magick.parser( e, set, {

				//文件类型出错时回调
				error : function( type, msg ){
					R.toast( 'invalid', '错误类型：'+ type +'，错误信息：'+ msg, {'time': 4, 'unique': 'toast'});
				},

				//文件校验通过时回调
				valid : function( data, image, filename ){

					//执行图片上传操作
					Magick.upload( data, Hybrid.config.upload, { inputname : 'file', filename : filename, formdata : { 'model' : 'magick', 'token' : Hybrid.config.token, 'config' : conf } }, {

						//上传完成回调
						success : function( response ){

							var data = JSON.parse( response );
							var status = typeof data['status'] != 'undefined' ? data['status'] : data['return'];
							
							if( status == 0 ){

								stg && R( stg ).value( data.file );
								prv && R( prv ).attr( 'src', data.file );

								//R.toast( 'success', '上传完成：'+ data.file, {'time': 1, 'unique': 'toast'});

							}else{
								R.toast( 'invalid', '上传失败：'+ status, {'time': 3, 'unique': 'toast'});
							}
							
							//处理数据
							Hybrid.Request.done( data, node );
						},

						//上传失败回调
						failure : function( response ){
							R.toast( 'invalid', '上传失败：'+ response, {'time': 3, 'unique': 'toast'});
						},

						//上传过程回调
						progress : function( percentage ){
							R.toast( 'success', '上传进度：'+ percentage + '%', {'time': 1, 'unique': 'toast'});
						}

					} );
				}

			});

		};
		
		//选择器
		var qs = 'input[model=magick]';
		
		R(document).live( 'change', qs, function( idx, e ){

			var self = this;
			var func = function(){
				fn.call( self, idx, e );
			};

			//动态加载 pack.magick.js
			if( typeof Hybrid.config.upload != 'undefined' ){
				R.script( Hybrid.config.public + 'js/pack.magick.js?v=' + Hybrid.config.build, func );
			}else{
				func();
			}

		} );
	
	},

	/////////////////////

	/*
	* @desc	页面滚动时的返回按钮
	*/
	Scroll : function(){
		var btn = document.querySelector( Hybrid.config.scroll );

		btn && R( window ).bind( 'scroll', function () {
			var scrollTop = window.pageYOffset|| document.documentElement.scrollTop || document.body.scrollTop;
			if (scrollTop > 200) {
				btn.style.display = 'block';
			} else {
				btn.style.display = 'none';
			}
		} );

		btn && R( btn ).bind( 'click', function(){
			window.scrollTo(0,0);
		} );
	},
	
	/*
	* @desc	表单元素初始化
	*/
	Initial : function( once ){
	
		//自动填充标题，为数组面包屑时有效
		var dc = Hybrid.config.docname;
		if( once && R.Validate.Array( dc ) && dc.length ){
			document.title = dc.reverse().join(' / ');
		}

		////////////////////////
	
		//表单元素初始化
		if( typeof URLSearchParams == 'function' ){
		
			var fn = new Function(
				'var usp = new URLSearchParams( location.search );'+
				'for(var k of usp.entries()) {'+
				'	R(\'*[name="\'+ k[0] +\'"]:not([readonly])\').value( k[1] );'+
				'};'
			);
			fn();
			
		}

		////////////////////////

		//根据自定义字段排序
		R(".table thead th").each(function(){

			//排序参数的前辍
			var prefix = 'extra';

			//当前的排序方式
			var based = location.href;
			var param = { 'field' : R.String(based).get( prefix + '[field]' ), 'order' : R.String(based).get( prefix + '[order]' ) };

			//选中的排序方式
			var local = {
				'field' : this.getAttribute("data-sort-field"),
				'default' : this.getAttribute("data-sort-default"),
				'orderby' : this.getAttribute("data-sort-orderby"),
				'screen' : this.getAttribute("data-sort-screen"),
				'query' : this.getAttribute("data-sort-query"),
				'label' : (this.textContent||this.innerText)
			};

			if( !local['field'] ) return;

			//默认的排序方式
			if( !param['field'] && !param['order'] && local['default'] && local['orderby'] ){
				var param = { 'field' : local['field'], 'order' : local['orderby'], 'filling' : true };
			}

			///////////////////////////////////

			local['order'] = ( param['order'] == "desc" ? "asc" : "desc" );

			var redir = based;
			if( param['field'] && param['order'] && !param['filling'] ){

				redir = redir.replace( prefix + '[field]='+ param['field'], prefix + '[field]='+ local['field'] );
				if( local['field'] == param['field'] ){
					redir = redir.replace( prefix + '[order]='+ param['order'], prefix + '[order]='+ local['order'] );
				}
			}else{
				redir = ( redir.indexOf('?') > -1 ? redir + '&' : redir + '?' ) + prefix + '[field]='+ local['field'] + '&' + prefix + '[order]='+ local['order'];
			}

			///////////////////////////////////

			$( this ).bind( 'click', function(){ location.href = redir; } ).attr({ 'class' : ( local['field'] == param['field'] ? 'sort ' + param['order'] : 'sort' ) });

			///////////////////////////////////

			if( local['screen'] ){

				var screen = eval('('+ local['screen'] +');');
				var wrap = $( this ).create( 'ul', { 'class' : 'select' }, true ).hide();

				/////////////////

				//处理参数
				var param = local['query'].replace(/\$field/, local['field']).replace(/\$value/, '');

				$( wrap.item(0) ).create( 'li', { 'innerHTML' : '<a href="'+ param +'" data-sort-all="true">全部</a>' } );

				/////////////////

				var selected = null;

				for( var k in screen ){

					//处理参数
					var param = local['query'].replace(/\$field/, local['field']).replace(/\$value/, k);

					//定位索引
					if( based.indexOf( param ) > -1 && this.firstChild.data ){
						var label = selected = this.firstChild.data = $.String( screen[k] ).stripTags();
					}else{
						var label = null;
					}

					$( wrap.item(0) ).create( 'li', { 'innerHTML' : '<a href="'+ param +'" class="'+ ( label ? 'active' : '' ) +'">'+ screen[k] +'</a>' } );
				}

				/////////////////

				if( !selected ){
					$( 'ul li a[data-sort-all=true]', this ).attr({'class':'active'});
				}

				/////////////////

				$( this ).bind('mouseover', function(){
					wrap.show();
				}).bind('mouseout', function(){
					wrap.hide();
				});

			}

		});
	
	},
	
	/*
	* @desc	剪贴板初始化
	*/
	Clipboard : function(){

		var qs = '[clipboard]';
	
		R(qs).size() && R.script( Hybrid.config.public + 'js/pack.clipboard.js?v=' + Hybrid.config.build, function(){

			var clipboard = new Clipboard( qs );
			
			clipboard.on('success', function (e) {
				console.info('Action:', e.action);
				console.info('Text:', e.text);
				console.info('Trigger:', e.trigger);
				e.clearSelection();
				R.toast( 'success', ( e.trigger.getAttribute('data-clipboard-tips') || '成功复制到剪贴板' ), {'time': 3, 'unique': 'toast'});
			});

			clipboard.on('error', function (e) {
				console.error('Action:', e.action);
				console.error('Trigger:', e.trigger);
			});

		} );
	
	},

	/*
	* @desc	编辑器初始化
	*/
	RichEditor: function(){

		var qs = 'textarea[editor]';
		var raw = {
			resizeType: 1,
			cssPath: Hybrid.config.public + 'bootstrap/css/bootstrap.min.css',
			items: ['source', '|', 'undo', 'redo', '|', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold', 'italic', 'underline', 'removeformat', '|', 'justifyleft', 'justifycenter', 'justifyright', 'table', 'hr', 'insertorderedlist', 'insertunorderedlist', '|', 'emoticons', 'image','multiimage', 'insertfile', 'link', 'unlink', '|', 'fullscreen'],
			uploadJson: Hybrid.config.upload,
			extraFileUploadParams: { 'model' : 'editor', 'token': Hybrid.config.token },
			filePostName: 'image',
			formatUploadUrl: false
		};

		R(qs).size() && R.script( Hybrid.config.public + 'editor/kindeditor.js?v=' + Hybrid.config.build, function(){

			R.script( Hybrid.config.public + 'editor/lang/zh_CN.js', function(){

				//KindEditor.ready(function(K) {

					R( qs ).each( function(){
						
						var opt = raw;
						if( set = this.getAttribute('editor') ){
							opt = Hybrid.merge( opt, JSON.parse( set ) );
						}

						Hybrid.config.debug && console.log( opt );
						Hybrid.Editor = KindEditor.create( this, opt );

					} );

				//});

			});

		});

	},

	/////////////////////

	/*
	* @desc URL 生成
	* @param array  路径参数
	* @param array  GET 参数
	* @param string  锚点名称
	* @return string
	*/
	createUrl : function( $parts, $param, $anchor ) {
	
		$urls = '';
		
		var $module = Hybrid.config.modules;
	
		//处理路径
		if( $parts ){
	
			if( typeof $parts == 'string' ){
				$parts = $parts.replace( /^\//, '' );
				$parts = $parts.split( /\/+/ );
			}
	
			//默认协议
			$scheme = '/';
	
			//协议是否变更
			$change = false;
	
			for( var $idx = 0; $idx < $parts.length; $idx ++ ){
	
				var $part = $parts[ $idx ];
				
				//跳过非文本内容
				if( typeof $part != 'string' ){
					continue;
				}
			
				//处理指定的协议头
				if( $matche = $part.match( /^(http|https):/ ) ){
					$scheme = $change = $matche[0] + '//';
					$parts.splice( $idx, 1 );
					$idx--;
					continue;
				}
				
				//处理自适应协议头
				if( $matche = $part.match( /^auto:/ ) ){   
					$scheme = $change = location.protocol + '//';
					$parts.splice( $idx, 1 );
					$idx--;
					continue;
				}
	
				//转换模块名称为对应路径
				if( $matche = $part.match( /^:(\w+)/ ) ){
					
					//[$tag, $mod] = $matche;
					var $tag = $matche[0];
					var $mod = $matche[1];
	
					if( $module[ $mod ] ){
						$parts[ $idx ] = $module[ $mod ];
						if( !$change ){
							$scheme = $change = '//';
						}
					}else{
						$parts[ $idx ] = $mod;
					}
	
				}		
			
			}
			
			$urls = $scheme + $parts.join('/');
	
		}
	
		//处理参数
		if( $param ){
			if( typeof $param == 'object' ){
				$param = Hybrid.http_build_query( $param );
			}
			$urls += '?' + $param;
		}
	
		//处理锚点
		if( $anchor ){
			$urls += '#' + $anchor;
		}
	
		return $urls;
	},
	
	/*
	* @desc	简化链接参数
	* @param {String} url 原始链接
	* @return {String} 新链接
	*/
	MakeUrl : function( url ){
	
		if( !url ) return url;
		
		var smt = 'shop.m.taobao.com/shop/coupon.htm';
		var dtc = 'detail.tmall.com/item.htm';
			url = url.replace('taoquan.taobao.com/coupon/unify_apply_result_tmall.htm', smt);
			url = url.replace('taoquan.taobao.com/coupon/unify_apply_result.htm', smt);
			url = url.replace('taoquan.taobao.com/coupon/unify_apply.htm', smt);
			url = url.replace('market.m.taobao.com/apps/aliyx/coupon/detail.html', smt);			
			url = url.replace('detail.liangxinyao.com/item.htm', dtc);
			url = url.replace('detail.yao.95095.com/item.htm', dtc);
			url = url.replace('detail.tmall.hk/hk/item.htm', dtc);

		//移除锚点链接
	    index = url.indexOf('#');
		if (index > 0) {
		 	url = url.substring(0, index);
		}

		//移除无用的参数
		var arr = url.split(/(&|\?)/);
		var ret = arr.filter(function( val, idx ){
			if( idx == 0 || /^(id|seller_id|sellerId|activity_id|activityId)=/.test(val) ){
				return true;
			}
		});

		/////////////////

		//重新构造链接
		var url = '';
		for( var k in ret ){
			if( k == 0 ){
				url += ret[k];
			}else if( k == 1 ){
				url += '?' + ret[k];
			}else{
				url += '&' + ret[k];
			}
		}

		return url;
	},

	/*
	* @desc	短网址生成
	* @param {String} url 原始链接
	* @param {Element} obj 元素对象
	*/
	TinyUrl : function( url, obj ){
		if( url && !/(dwz|url|t).cn/ig.test( url ) ){
			R.jsonp( Hybrid.config.shorten + '?url=' + encodeURIComponent(url) + '&ajax=?', function(data){
				obj.value = data.short;
			});
		}
	},

	/*
	* @desc	Ajax URL 生成
	* @param {String} url 原始链接
	* @param {String} suffix Ajax 参数
	* @return {String} 新链接
	*/
	AjaxUrl : function( url, suffix ){
		if( !url ) return '';
		if( pos = url.indexOf('#'), pos > -1 ){
			url = url.substr( 0, pos );
		}
		suffix = ( suffix || '?' );
		return url + ( url.indexOf('?') > -1 ? '&' : '?' ) + 'token='+ Hybrid.config.token + '&ajax=' + suffix;
	},

	/*
	* @desc	分解 URL 参数
	* @param {String} url 原始链接
	* @return {Object} 数据
	*/
	ReadUrl : function( url ) {
		// This function is anonymous, is executed immediately and 
		// the return value is assigned to QueryString!
		var qs = {};
		if( query = ( url || location.search.substring(1) ) ){
			var vars = query.split("&");
			for ( var i=0; i<vars.length; i++ ) {
				var pair = vars[i].split("=");
				var keys = decodeURIComponent( pair[0] );
					keys = keys.replace(/(\[\]|\])/g,'').replace(/\[/g,'.');
					// If first entry with this name
				if (typeof qs[keys] === "undefined") {
					qs[keys] = decodeURIComponent(pair[1]);
					// If second entry with this name
				} else if (typeof qs[keys] === "string") {
					var arr = [ qs[keys],decodeURIComponent(pair[1]) ];
					qs[keys] = arr;
					// If third or later entry with this name
				} else {
					qs[keys].push(decodeURIComponent(pair[1]));
				}
			}
		}
		return qs;
	},
	
	/*
	* @desc	合并 URL 参数
	* @param {Object} param 附加参数
	* @param {Object} ignore 忽略参数
	* @param {Object} option 可选择项
	* @return {String} URL
	*/
	CombUrl : function( param, ignore, option ){
	
		var option = option || {};
		
		//基准 URL
		var source = option.source || location.href;
		
		//编码方式
		var encode = option.encode || encodeURIComponent;
		
		//移除锚点
		if( index = source.indexOf('#'), index > 0 ){
		 	source = source.substring(0, index);
		}
		
		if( ignore ){
			for( var k in ignore ) source = source.replace( new RegExp( '&?' + ignore[k] + '=' + '([^&;]+?)(&|#|;|$)' ), '' );
		}
		
		if( param ){
			for( var k in param ) source = source.replace( new RegExp( '&?' + k + '=' + '([^&;]+?)(&|#|;|$)' ), '' );
			for( var k in param ){			
				if( /\?$/.test( source ) ){
					source = source + k + '=' + encode( param[k] );
				}else{
					source = source + ( source.indexOf('?') > -1 ? '&' : '?' ) + k + '=' + encode( param[k] );
				}
			}
		}

		return source;
	},

	////////////////////

	/*
	* @desc 表单和Ajax请求处理
	*/
	Request : {

		/*
		* @desc	事件完成时的回调
		* @param {Object} data	数据
		* @param {Element} node	元素
		*/
		done : function( data, node ){

			//默认消息时长
			var time = 3;
		
			//对象是元素时执行
			if( node && R.Validate.Element( node ) ){

				//使用特定的回调方法
				if( fn = node.getAttribute('data-callback') ){
					Hybrid.execute( fn, window, data, node );
				}

				/////////////////

				//需要更新的变量名称
				var va = node.getAttribute('data-variable');

				//是否将新数据入栈
				var pd = node.getAttribute('data-padding');

				//使用指定的方式更新变量
				if( va && ( 'variable' in data ) ){
					Hybrid.variate( va, Hybrid.App, data['variable'], pd );
				}

				/////////////////

				//提交成功时重置表单
				if( data['reset'] && node.tagName == 'FORM' ){
					node.reset();
				}

				/////////////////

				//使用自定义消息时长
				if( du = node.getAttribute('data-duration') ){
					time = du;
				}
			
			}

			//消息提示
			if( data['status'] < 0 ){

				var msg = Hybrid.config.debug ? data['status'] + ' : ' + data['result'] : data['result'];

				R.toast( 'invalid', msg, {'time':time, 'unique':'toast'} );

			}else if( typeof data['result'] == 'string' ){

				R.toast( 'success', data['result'], {'time':time, 'unique':'toast'} );

			}

			//重新载入
			if( data['reload'] ){
				window.setTimeout( function(){ location.reload(); }, time * 1000 );
			}

			//替换链接
			if( data['replace'] ){
				window.setTimeout( function(){ location.replace( data['replace'] ); }, time * 1000 );
			}

			//跳转链接
			if( data['target'] ){
				window.setTimeout( function(){ location.href = data['target']; }, time * 1000 );
			}

			//返回上一页
			if( data['backing'] ){
				window.setTimeout( function(){ history.back(); }, time * 1000 );
			}

			//刷新验证码
			if( data['captcha'] ){
				R('img[rel=captcha]').event('click');
			}

		},

		/*
		* @desc	处理表单提交后的数据填充
		* @param {Object} data	数据
		* @param {Element} form	表单
		*/
		fill : function( data, form ){

			if( form.getAttribute('config') && data['status'] > 0 ){

				var conf = JSON.parse( form.getAttribute('config') );
				var mode = conf.mode ? conf.mode : 'afterbegin';
				var wrap = R(conf.wrap);
				var tpl = R(conf.tpl).html().replace(/raw/ig,'src');
				var url = conf.url;

				//填充至容器首				
				R.jsonp( Hybrid.AjaxUrl( url.replace('?', data['status'] ) ), function( data ){
					wrap.adjacent( mode, R.template( tpl, { 'prev': null, 'item' : data['result'] }) );
				});

				//清空文本框
				R('*[contenteditable]', form).html('');
				R('input,textarea', form).value('');

			}
		},

		/*
		* @desc	处理 Ajax 返回的数据
		* @param {Element} node	元素
		* @param {Integer} indx	索引
		*/
		ajax : function( node, indx ){

			//预验证
			var ret = Hybrid.Request.check( node );
			var url = ( node.getAttribute('data-href') || node.getAttribute('href') );

			//构造URL
			if( /(input|textarea)/i.test( node.tagName ) ){
				url += encodeURIComponent( node.value );
			}

			//是否缓存
			if( node.getAttribute('data-caching') == 'true' ){
				opt = { autocall : 'cache' + indx + 'fn' };
			}else{
				opt = {};
			}

			ret && R.jsonp( Hybrid.AjaxUrl( url ), opt, function( data ){
				Hybrid.Request.done( data, node );
			} );

		},
		
		/*
		* @desc	处理消息验证
		* @param {Element} elem	元素
		* @return boolean
		*/
		check : function( elem ){

			//消息时长
			var time = ( elem.getAttribute('data-duration') || 3 );

			if( elem.getAttribute('data-confirm') && !confirm( elem.getAttribute('data-confirm') )){
				return false;
			}

			if( elem.getAttribute('data-message') ){
				R.toast( 'default', elem.getAttribute('data-message'), {'time':time, 'unique':'toast'} );
				return false;
			}

			//表单验证
			if( elem.tagName == 'FORM' ){

				//验证表单有效
				var data = R.Form( elem, true ).Validate( function( msg ){				
					R.toast( 'invalid', msg, { 'time':time, 'unique':'toast' } );
				});

				elem.setAttribute('submit','submit');

				return data;

			}

			return true;
		
		},

		/*
		* @desc	处理表单 POST 提交
		* @param {Element} form	表单
		*/
		submit : function( form ){

			//预验证
			var ret = Hybrid.Request.check( form );

			var func = function( form ){

				//忽略非 Ajax
				if( form.getAttribute('target') != 'ajax' ){
					form.submit();
					return;
				}

				//禁用提交按钮
				R('button[type=submit]',form).disabled();

				var url = ( form.getAttribute('action') || location.href );
				var data = {};
				var ajax = new R.Ajax( Hybrid.AjaxUrl( url, 'ajax' ) );
					ajax.method = 'POST';

				//序列化表单值
				var data = R.Form( form, true ).Serialize( true, '&' );

				ajax.setVar(data);
				ajax.onCompletion = function(){

					//格式化返回的数据
					var xmls = ajax.responseXML.documentElement;
					var data = JSON.parse( xmls.textContent || xmls.text );

					//处理回调
					Hybrid.Request.done( data, form );
					Hybrid.Request.fill( data, form );

					//启用按钮
					R('button[type=submit]',form).enabled();

				};
				
				ajax.onError = function(){
					//启用按钮
					R('button[type=submit]',form).enabled();				
				};
				
				ajax.send();

			};

			/////////////////

			ret && func( form );

		}

	},

	////////////////////

	/**
	* @desc  处理 JS 模板数据
	*/
	Template : function(){

		R("script[type='text/template']").each(function( idx ){

			//数据来源
			var source	= this.getAttribute('source');
			
			//填充方式
			var method	= this.getAttribute('method') || 'afterend';
			
			var self	= this;
			var wrap	= R(self);

			if( !source || !method ) return;

			R.jsonp( Hybrid.AjaxUrl( source ), { autocall : 'cache' + idx }, function( data ){

				if( R.Validate.Array( data['result'] ) ){
					for(var i = 0; i<data['result'].length; i++){
						wrap.adjacent( method, R.template( self, { 'item' : data['result'][i] }) );
					}
				}else{
					wrap.adjacent( method, R.template( self, { 'data' : data['result'] }) );
				}

			});

		});

	},

	/**
	* @desc  处理 Vue 模板数据
	*/
	Fragment : function(){

		var qs = 'fragment[type=template]';
		var fn = function(){

			//开启调试
			if( Hybrid.config.debug ) Vue.config.devtools = true;

			var App = Hybrid.App = new Vue({

				//绑定元素
				el: Hybrid.config.element,

				//混合对象
				mixins: [ Hybrid.config.extend ],

				//数据对象
				data: {
					//当前页码
					_current: 1,
					
					//分页数量
					_pagenum: 1,
					
					//是否加载完成
					_loading: false,
					
					//分页页码数据
					_numbers: [],
					
					//变量数据
					//object: {},
					
					//可选参数
					//option: Hybrid.config.option,
					
					//URL参数
					//params: Hybrid.ReadUrl()
				},

				//注意：Vue 2.x 中，过滤器只能在 {{mustache}} 绑定和 v-bind 表达式（从 2.1.0 开始支持）中使用
				filters: {
					
				},

				//方法
				methods: {

					/*
					* @desc	将换行符替换成 <br />
					* @param {String} 字符串
					* @return {String}
					*/
					nl2br : function ( value ) {
						return value ? value.replace(/^(\r\n|\r|\n)/gm,'<br/>') : value;
					},
				
					/*
					* @desc	日期和时间格式化
					* @param {String} value 原始时间戳
					* @param {String} format 格式
					* @return {String}
					*/
					format : function ( value, format ) {
						return value ? R.Datetime(value).format( format || 'y-m-d' ) : '无';
					},

					/*
					 * Vue filter to truncate a string to the specified length.
					 * @param {String} value The value string.
					*/
					truncate : function( value, length ) {
						if(value.length < length) {
							return value;
						}
						length = length - 3;
						return value.substring(0, length) + '...';
					},

					/*
					* @desc	货币金额格式化
					* @param {String} value 货币金额
					* @return {String}
					*/
					currency : function ( value ) {
						return value ? value.replace('00000','0万').replace('0000','万').replace('000','千') : '无';
					},

					/*
					* @desc	大数字格式化
					* @param {String} value 数值
					* @return {String}
					*/
					numerical : function( value ){
						return value >= 10000 ? ( value / 10000 ).toFixed(1).replace('.0','') + '万' : value;
					},

					/*
					* @desc	调整图片尺寸
					* @param {String} field 图片地址
					* @param {Number} sized 尺寸
					* @return {String} 新地址
					*/
					resized: function( field, sized ){
						return Hybrid.thumb( field, sized );
					},
					
					/*
					* @desc	返回图片代理地址
					* @param {String} field 图片地址
					* @return {String} 新地址
					*/
					proxy: function( field ){
						return Hybrid.proxy( field );
					},

					/*
					* @desc	商品详情链接
					* @param {String} detail 商品详情
					* @return {String} 新内容
					*/
					convert: function( detail ) {
						var urls, ret;
						if( detail, urls = detail.match( /href="(.+?)id=(\d+)(\w+?)"/ig ) ){
							for( var k in urls ){
								if( ret = /id=(\d+)/.exec( urls[k] ) ){
									detail = detail.replace( urls[k], urls[k] + ' biz-itemid="'+ ret[1] +'" isconvert="1"' );
								}						
							}
						}
						return detail;
					},
					
					/*
					* @desc	商品详情链接
					* @param {String} detail 商品详情
					* @return {String} 新内容
					*/
					paging: function( num ){
						this._current = num;
					},

					/*
					* @desc	检测是否为微信浏览器
					* @return {Boolean}
					*/
					wechat: function(){
						if( ret = /MicroMessenger\/([\d\.]+)/ig.exec( window.navigator.userAgent ) ){
							return ret[1];
						}else{
							return false;
						}
					},

					/*
					* @desc	检测是否为特定浏览器
					* @return {Boolean}
					*/
					typhon: function(){
						if( ret = /Typhon\/([\d\.]+)/ig.exec( window.navigator.userAgent ) ){
							return ret[1];
						}else{
							return false;
						}
					},

					/*
					* @desc	检测网络类型（微信环境）
					* @return {Boolean}
					*/
					nettype: function(){
						if( ret = /NetType\/(\S+)/ig.exec( window.navigator.userAgent ) ){
							return ret[1];
						}else{
							return null;
						}
					},

					/*
					* @desc	检测是否为手机浏览器
					* @return {Boolean}
					*/
					mobile: function(){
						if( ret = /(iPhone|iPod|Android|iOS|SymbianOS|Windows Phone)/ig.exec( window.navigator.userAgent ) ){
							return ret[0];
						}else{
							return false;
						}					
					},
					
					/*
					* @desc	生成二维码 URL 地址
					* @param {String} data 数据
					* @return {String} 新内容
					*/
					qrcode: function( data ){
						if( data ){
							return 'https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent( data );
						}						
					},
					
					/*
					* @desc	将 JSON 对象字符串化
					* @param {Object} data 数据
					* @return {String} 新内容
					*/
					encode: function( data ){
						if( data ){
							return JSON.stringify( data );
						}
					},

					/*
					* @desc	将字符串化转为 JSON 对象
					* @param {String} data 数据
					* @return {Object} 新内容
					*/
					decode: function( data ){
						if( data ){
							return JSON.parse( data );
						}
					},
					
					/*
					* @desc URL 生成
					* @param array  路径参数
					* @param array  GET 参数
					* @param string  锚点名称
					* @return string
					*/
					createUrl: function( parts, param, anchor ){
						return Hybrid.createUrl( parts, param, anchor );
					}

				},

				//组件
				components:{

					//分页组件
					'paging': {
					
						// 声明 props
						props: ['prev','next','nums','numbers','current','pagenum'],
						
						// 页码按钮
						template: '<div><a class="prev" v-if="prev" v-on:click="paging(-1)" v-bind:disabled="this._current == 1">上一页</a><a class="nums" v-for="n in numbers" v-if="nums" v-on:click="paging(n, true)" v-bind:class="{ active : current == n }">{{n}}</a><a class="next" v-if="next" v-on:click="paging(1)" v-bind:disabled="this._current == this._pagenum">下一页</a></div>',
						
						// 定义方法
						methods: {
							paging: function ( num, set ) {
								if( set ){
									this._current = num;
								}else{
									this._current += num;
								}
								if( this._current <= 0 ) this._current = 1;
								if( this._current >= this._pagenum ) this._current = this._pagenum;
								this.$emit('paging', this._current);
							}
						}
					}
				},

				//装载事件
				mounted : function(){

					//表单填充
					Hybrid.Initial();
				}

			});

			////////////////////

			R(qs).each(function( idx ){

				//当前容器
				var self	= this;

				//数据标识
				var flag	= this.getAttribute('flag');

				//是否缓存
				var cache	= this.getAttribute('cache') == 'true';

				//延迟处理
				var lazy	= parseInt( this.getAttribute('lazy') ) || 0;

				//自动刷新
				var reload	= parseInt( this.getAttribute('reload') ) || 0;

				//数据来源
				var source	= this.getAttribute('source') || location.href;

				//////////////////

				//监听对象
				var listen	= this.getAttribute('listen');
					listen	= ( listen == 'window' ? window : listen );
					listen	= ( listen == 'document' ? document : listen );

				//事件行为
				var event	= this.getAttribute('event') || 'click';

				//是否有分页，会处理页码
				var paging	= this.getAttribute('paging') == 'true';

				//是否初始化，针对事件触发有效
				var initial	= this.getAttribute('initial') == 'true';

				//是否启用历史记录，会更新 URL
				var history	= this.getAttribute('history') == 'true';

				//是否启用数据填充
				var padding	= this.getAttribute('padding') == 'true';

				//是否使用原始数据
				var rawdata	= this.getAttribute('rawdata') == 'true';

				//////////////////

				//数据请求函数
				var fn = function( i, e ){

					//取消跳转，更新 URL
					paging && R.Event( e ).stop();

					//缓存当前请求，自动刷新时无效
					if( cache && !reload && !padding ){
						opt = { autocall : 'cache' + idx };
					}else{
						opt = {};
					}
					
					//当前分页禁用，仅对DOM元素有效
					if( e && e.target.tagName && e.target.hasAttribute('disabled') ){
						return;
					}

					//当前页面处于不可见状态
					if( 'visibilityState' in document && document.visibilityState == 'hidden' ){
						return;
					}

					//自动填充数据
					if( e && padding ) {

						//已经到最后一页，或还在加载中
						if( App._current == App._pagenum || App._loading ){
							return;
						}

						//窗口滚动到底部
						var top = document.documentElement.scrollTop || document.body.scrollTop;
						if( (top + document.documentElement.clientHeight + 10) >= document.documentElement.scrollHeight ){
							App._current += 1;
						}else{
							return;
						}
					}

					//事件触发时，更新 URL
					if( e ){
						var suffix = 'page=' + App.current;
						source = source.replace( /page=(\d*)/ig, suffix );
						if( source.indexOf( suffix ) == -1 ){
							source += ( source.indexOf('?') == -1 ? '?' : '&' ) + suffix;
						}					
						App._loading = true;
					}

					//生成 JSONP 请求
					R.jsonp( Hybrid.AjaxUrl( source ), opt, function( data ){

						App._loading = false;
						
						//使用原始数据
						if( rawdata ){
						
							Hybrid.variate( flag, App, data, padding );

						}else{

							//数据格式兼容
							if( typeof data['status'] == 'undefined' ){
								data['status'] = data['return'];
							}
						
							//处理通用数据
							Hybrid.Request.done( data, self );

							//处理特殊数据
							if( data['status'] >= 0 && data['result'] ){

								//更新数据
								Hybrid.variate( flag, App, data['result'], padding );

								//更新标题
								Hybrid.State.title( flag, data['result'] );

								//滚动视图，更新下一页链接
								if( paging && listen && Object.keys( data['result'] ).length ){

									//滚动视图，非填充时有效
									e && !padding && self.scrollIntoView( true );

									//页码数据
									App._current = data['paging'];
									App._numbers = pg( data );

									//记录到历史
									history && e && Hybrid.State.push({ 'reload' : true }, document.title + ' 第'+ App._current +'页', source);

								}
								
								//触发事件
								window.setTimeout( function(){
									R( window ).event('scroll');
								}, 50 );
								
							}

						}						

					});
				};

				//分页生成函数
				var pg = function( data ){

					//总页数
					var count = Math.ceil( data['total'] / data['limit'] );

					//每几组
					var group = Math.floor( (data['paging'] - 1 ) / 10 );

					var sized = 10;

					App._pagenum = count;

					//console.log( 'count', count, 'sized', sized, 'group', group );

					//开始和结束
					var start = group * sized + 1;
					if( data['total'] == 0 ){
						start = 0;
					}

					var end = (group +1) * sized;
					if( end > count ){
						end = count ;
					}

					var tmp = [];
					for( var i = start; i<= end; i++ ){
						tmp.push(i);
					}

					return tmp;
				};

				//////////////////

				//无监听时，自动加载
				if( !listen || paging || initial ){

					//延时加载
					window.setTimeout( fn, lazy * 1000 );

					//从延时之后开始
					reload && window.setTimeout( function(){
						window.setInterval( fn, reload * 1000 );
					}, lazy * 1000 );
					
				}

				//事件触发请求
				if( listen && event ){
					if( typeof listen == 'string' ){
						R( document ).live( event, listen, fn );
					}else{
						R( listen ).bind( event, fn );
					}
				}

			});

			////////////////////

			//处理历史请求
			Hybrid.State.popstate(function( state ){
				console.log( state );
				//e.state && e.state.reload && location.reload();
			});
		
		};
		
		if( typeof Vue == 'undefined' ){
			R.script( Hybrid.config.public + 'vue/vue.js?v=' + Hybrid.config.build, fn );
		}else{
			fn();
		}
		
	},

	/**
	* @desc 清空或暂存上下文数据
	* @param string		名称
	* @param mixed		数据
	* @return void
	*/
	Context : function( name, data ){

		if( name ){

			args = arguments;
			size = args.length;

			for( var i = 0; i < size; i+=2 ){
				Hybrid.clips.push( { 'time' : Hybrid.microtime(), 'name' : args[ i ], 'data' : args[ i + 1 ] } );
			}
			
		}else{
			Hybrid.clips = [];
		}	

	},
	
	/**
	* @desc  JS 日志上报程序
	*/
	Report : function( message, source, lineno, colno, error ){
	
		//忽略部分错误，增加 crossorigin 可解决
		if( message == 'Script error.' ){
			return;
		}

		if( !Hybrid.config.jserror ){
			console.log('Hybrid.config.jserror is invalid');
			return;
		}
		
		var src = ( source || lineno || colno ) ? 'error' : 'report';
		var msg = {};

		//详细错误信息
		msg.detail = message;
		source ? msg.source = source : '';
		lineno ? msg.lineno = lineno : '';
		colno ? msg.colno = colno : '';
		error ? msg.error = error : '';
		msg.domain = location.host;

		var arg = Hybrid.http_build_query( { 'sourced' : src, 'message' : JSON.stringify( msg ), 'context' : JSON.stringify( Hybrid.clips ) } );

		//发送错误信息
		new Image().src = Hybrid.config.jserror + '?' + arg;

		//清空上下文
		Hybrid.Context();
	
	},

	////////////////////

	/**
	* @desc  初始化
	* @param {Object} option	配置
	*/
	Start : function( option ){

		//全局对象
		var win = window, doc = document;
		
		//合并参数
		if( option ) Hybrid.config = Hybrid.merge( Hybrid.config, option );

		//////////////////

		//错误上报
		win.onerror = Hybrid.Report;

		//表单填充
		Hybrid.Initial( doc );

		//Ajax上传，仅上传图片
		Hybrid.Magick();

		//原生上传，支持任意文件
		Hybrid.Upload();

		//返回顶部
		Hybrid.Scroll();

		//复制功能
		Hybrid.Clipboard();
		
		//初始化编辑器
		Hybrid.RichEditor();

		//JS 模板引擎
		Hybrid.Template();

		//Vue 模板引擎
		Hybrid.Fragment();

		/////////////////////

		//绑定点击事件
		R( doc ).live( 'click', '*[data-type="ajax"]', function( idx, e ){

			if( !/(input|textarea)/i.test( this.tagName ) ){

				//停止默认行为
				R.Event( e ).stop();

				//绑定 Ajax 提交
				Hybrid.Request.ajax( this, idx );
				
			}

		});

		//绑定改变事件
		R( doc ).live( 'change', '*[data-type="ajax"]', function( idx, e ){

			if( /(input|textarea)/i.test( this.tagName ) ){

				//停止默认行为
				R.Event( e ).stop();

				//绑定 Ajax 提交
				Hybrid.Request.ajax( this, idx );

			}

		});

		//绑定表单事件
		R( doc ).live( 'submit', 'form[method=post]', function( idx, e ){

			//停止默认行为
			R.Event( e ).stop();

			//绑定表单提交
			Hybrid.Request.submit( this );

		});

		/////////////////////

		//自动执行事件
		R('[data-execute]').each( function( idx, e ){
			R(this).event( this.getAttribute('data-execute') );
		});

		//绑定锚点事件
		R( doc ).live( 'click', 'a[href|="#"]', function( idx, e ){
			history.replaceState({}, doc.title, this.getAttribute('href'));
		});

		/////////////////////
		
		//简化 URL 地址
		R('input[data-url-simplify]').bind( 'change', function(){
			this.value = Hybrid.MakeUrl( this.value );
		}).bind('propertychange',function(){
			this.value = Hybrid.MakeUrl( this.value );
		}).event('change');
		
		//缩短 URL 地址
		R('input[data-url-tinyurl]').bind( 'change', function(){
			Hybrid.TinyUrl( this.value, this );
		}).bind('propertychange',function(){
			Hybrid.TinyUrl( this.value, this );
		});

		/////////////////////

		//Debug
		if( Hybrid.config.debug ){
			R.assets( '//cdn.staticfile.org/vConsole/3.2.0/vconsole.min.js', function(){
				var vc = new VConsole();
			} );
		}
		
		//页面水印
		if( bg = Hybrid.config.imprint ){
			doc.body.setAttribute('style', 'background-image: url(\''+ bg +'\');');
		}

		//阿里妈妈，淘点金PID
		if( mm = Hybrid.config.mapid ){
			var s = doc.createElement('script'), h = doc.getElementsByTagName('head')[0];
				s.charset = 'gbk';
				s.async = true;
				s.src = 'http://a.alimama.cn/tkapi.js';
				h.insertBefore(s, h.firstChild);

			win.alimamatk_onload = [ {  pid: mm,  appkey: '',  unid: '',  type: 'click' } ];
		}

		//百度统计，站点ID
		if( bd = Hybrid.config.baidu ){
			var s = doc.createElement('script'), h = doc.getElementsByTagName('head')[0];
				s.async = true;
				s.src = 'https://hm.baidu.com/hm.js?' + bd;
			h.insertBefore(s, h.firstChild);
		}

		//谷歌统计，站点ID
		if( ga = Hybrid.config.google ){
			var _gaq = _gaq || [];
			_gaq.push(['_setAccount', ga]);
			_gaq.push(['_trackPageview']);

			var ga = document.createElement('script');
				ga.type = 'text/javascript';
				ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			
			var s = document.getElementsByTagName('script')[0];
				s.parentNode.insertBefore(ga, s);
		}

		/////////////////////

		//自动点击锚点
		if( hash = location.hash ){
			R.reader( function(){ R('a[href="'+ hash +'"]').event('click'); } );
		}

		//图片延迟加载
		//R.reader( R.lazy );
		R.lazy();

	}

};
