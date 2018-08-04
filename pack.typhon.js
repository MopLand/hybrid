/*
*	(C)2018 VeryIDE
*	typhon.js
*	author: Lay veryide@qq.com
*	desc: App JavaScript Bridge
*	date: 2018/08/04
*/
;(function( win, doc ){

	var $ = R;

	////////////////////

	//开发模式
	if( /Dev/.test( navigator.userAgent ) ){

		window.App = {
		
			/*
				activity 控制方法
			*/ 
			activity : function( attrs ){
			
				var attrs = JSON.parse( attrs );
	
				//关闭当前 activity
				if( typeof attrs.turnoff != 'undefined' ){
					alert('turnoff');
				}
	
				//打开指定 activity
				if( attrs.activity ){
					alert('activity ' + attrs.extra);
				}
	
			},
	
			/*
				toast 调用方法
			*/
			toast : function( attrs ){
			
				var attrs = JSON.parse( attrs );
	
				alert('toast ' + attrs.message);
	
			},
	
			/*
				confirm 调用方法
			*/
			confirm : function( attrs ){
			
				var attrs = JSON.parse( attrs );
	
				alert('confirm ' + attrs.message);
	
			},
	
			/*
				confirm 调用方法
			*/
			prompt : function( attrs ){
			
				var attrs = JSON.parse( attrs );
	
				alert('prompt ' + attrs.message);
	
			},
	
			/*
				storage 调用方法
			*/
			storage : function( attrs ){
			
				var attrs = JSON.parse( attrs );
	
				alert('storage ' + attrs.index);
	
			},
	
			/*
				链接处理方法
			*/
			link : function( attrs ){
	
				alert('link ' + attrs);
	
			},
	
			/*
				图片处理方法
			*/
			picture : function( attrs ){
	
				alert('link ' + attrs);
	
			}
	
		};

	}

	////////////////////
	
	//混合模式
	if( /Typhon/.test( navigator.userAgent ) ){

		//处理请求
		$( document ).live( 'click', '*[data-typhon]', function( idx, e ){

			$.Event( e ).stop();

			var act = this.getAttribute('data-typhon');

			if( typeof App != 'undefined' && typeof App[act] != 'undefined' ){

				//收集参数
				var attrs = {};
				for( var i = 0; i < this.attributes.length; i ++ ){

					var key = this.attributes[i].name;
					var pos = key.indexOf('data-typhon-');

					if( pos > -1 ){
						var idx = key.substr( 12 );
						attrs[ idx ] = this.attributes[i].value;
					}				
				}

				/////////////////////////////

				//链接属性
				if( this.hasAttribute('href') ){
					attrs['href'] = this.href;
				}

				//图片方法
				if( act == 'picture' ){

					attrs['pics'] = [];

					var pics = document.querySelectorAll('[data-typhon=picture]');				

					for( var i = 0; i < pics.length; i++ ){
						attrs['pics'].push( pics[i].href );
					}

				}

				/////////////////////////////

				//调用方法
				var result = App[act]( JSON.stringify( attrs ) );

				//调试日志
				console.log( 'App.' + act, attrs );
				
				//返回结果			
				if( result ){
					console.log( 'Result', result );			
				}

			}else{
				console.error( 'App.' + act + ' is not defined' );
			}

		});
	
	}

})( window, document, undefined );
