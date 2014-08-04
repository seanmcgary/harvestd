

(function(window){
	var $;
	var jqCdn = '//code.jquery.com/jquery-1.11.0.min.js';
	var COOKIE_NAME = 'harvestd';

	// TODO - replace this with dynamic domain name
	var DOMAIN = 'localhost:9000';


	var initJqCookie = function($, jQuery){
		var jaaulde=window.jaaulde||{};jaaulde.utils=jaaulde.utils||{};jaaulde.utils.cookies=(function(){var resolveOptions,assembleOptionsString,parseCookies,constructor,defaultOptions={expiresAt:null,path:'/',domain:null,secure:false};resolveOptions=function(options){var returnValue,expireDate;if(typeof options!=='object'||options===null){returnValue=defaultOptions;}else
		{returnValue={expiresAt:defaultOptions.expiresAt,path:defaultOptions.path,domain:defaultOptions.domain,secure:defaultOptions.secure};if(typeof options.expiresAt==='object'&&options.expiresAt instanceof Date){returnValue.expiresAt=options.expiresAt;}else if(typeof options.hoursToLive==='number'&&options.hoursToLive!==0){expireDate=new Date();expireDate.setTime(expireDate.getTime()+(options.hoursToLive*60*60*1000));returnValue.expiresAt=expireDate;}if(typeof options.path==='string'&&options.path!==''){returnValue.path=options.path;}if(typeof options.domain==='string'&&options.domain!==''){returnValue.domain=options.domain;}if(options.secure===true){returnValue.secure=options.secure;}}return returnValue;};assembleOptionsString=function(options){options=resolveOptions(options);return((typeof options.expiresAt==='object'&&options.expiresAt instanceof Date?'; expires='+options.expiresAt.toGMTString():'')+'; path='+options.path+(typeof options.domain==='string'?'; domain='+options.domain:'')+(options.secure===true?'; secure':''));};parseCookies=function(){var cookies={},i,pair,name,value,separated=document.cookie.split(';'),unparsedValue;for(i=0;i<separated.length;i=i+1){pair=separated[i].split('=');name=pair[0].replace(/^\s*/,'').replace(/\s*$/,'');try
		{value=decodeURIComponent(pair[1]);}catch(e1){value=pair[1];}if(typeof JSON==='object'&&JSON!==null&&typeof JSON.parse==='function'){try
		{unparsedValue=value;value=JSON.parse(value);}catch(e2){value=unparsedValue;}}cookies[name]=value;}return cookies;};constructor=function(){};constructor.prototype.get=function(cookieName){var returnValue,item,cookies=parseCookies();if(typeof cookieName==='string'){returnValue=(typeof cookies[cookieName]!=='undefined')?cookies[cookieName]:null;}else if(typeof cookieName==='object'&&cookieName!==null){returnValue={};for(item in cookieName){if(typeof cookies[cookieName[item]]!=='undefined'){returnValue[cookieName[item]]=cookies[cookieName[item]];}else
		{returnValue[cookieName[item]]=null;}}}else
		{returnValue=cookies;}return returnValue;};constructor.prototype.filter=function(cookieNameRegExp){var cookieName,returnValue={},cookies=parseCookies();if(typeof cookieNameRegExp==='string'){cookieNameRegExp=new RegExp(cookieNameRegExp);}for(cookieName in cookies){if(cookieName.match(cookieNameRegExp)){returnValue[cookieName]=cookies[cookieName];}}return returnValue;};constructor.prototype.set=function(cookieName,value,options){if(typeof options!=='object'||options===null){options={};}if(typeof value==='undefined'||value===null){value='';options.hoursToLive=-8760;}else if(typeof value!=='string'){if(typeof JSON==='object'&&JSON!==null&&typeof JSON.stringify==='function'){value=JSON.stringify(value);}else
		{throw new Error('cookies.set() received non-string value and could not serialize.');}}var optionsString=assembleOptionsString(options);document.cookie=cookieName+'='+encodeURIComponent(value)+optionsString;};constructor.prototype.del=function(cookieName,options){var allCookies={},name;if(typeof options!=='object'||options===null){options={};}if(typeof cookieName==='boolean'&&cookieName===true){allCookies=this.get();}else if(typeof cookieName==='string'){allCookies[cookieName]=true;}for(name in allCookies){if(typeof name==='string'&&name!==''){this.set(name,null,options);}}};constructor.prototype.test=function(){var returnValue=false,testName='cT',testValue='data';this.set(testName,testValue);if(this.get(testName)===testValue){this.del(testName);returnValue=true;}return returnValue;};constructor.prototype.setOptions=function(options){if(typeof options!=='object'){options=null;}defaultOptions=resolveOptions(options);};return new constructor();})();(function(){if(window.jQuery){(function($){$.cookies=jaaulde.utils.cookies;var extensions={cookify:function(options){return this.each(function(){var i,nameAttrs=['name','id'],name,$this=$(this),value;for(i in nameAttrs){if(!isNaN(i)){name=$this.attr(nameAttrs[i]);if(typeof name==='string'&&name!==''){if($this.is(':checkbox, :radio')){if($this.attr('checked')){value=$this.val();}}else if($this.is(':input')){value=$this.val();}else
		{value=$this.html();}if(typeof value!=='string'||value===''){value=null;}$.cookies.set(name,value,options);break;}}}});},cookieFill:function(){return this.each(function(){var n,getN,nameAttrs=['name','id'],name,$this=$(this),value;getN=function(){n=nameAttrs.pop();return!!n;};while(getN()){name=$this.attr(n);if(typeof name==='string'&&name!==''){value=$.cookies.get(name);if(value!==null){if($this.is(':checkbox, :radio')){if($this.val()===value){$this.attr('checked','checked');}else
		{$this.removeAttr('checked');}}else if($this.is(':input')){$this.val(value);}else
		{$this.html(value);}}break;}}});},cookieBind:function(options){return this.each(function(){var $this=$(this);$this.cookieFill().change(function(){$this.cookify(options);});});}};$.each(extensions,function(i){$.fn[i]=this;});})(window.jQuery);}})();
	};

	var generateUuid = function() {
	    var S4 = function() {
	       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    };
	    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	};


	var noop = function(){};
	var isReady = false;

	var loadJquery = function(cb){
		if(window.jQuery){
			$ = window.jQuery;
			isReady = true;
			return cb();
		}

		var jqLoader = document.createElement('script');
		jqLoader.setAttribute('src', jqCdn);

		jqLoader.onload = function(){
			jQuery.noConflict();
			$ = jQuery;
			isReady = true;
			cb && cb();
		};
		var head = document.getElementsByTagName('head')[0];
		head.appendChild(jqLoader);
	};
	loadJquery(function(){
		initJqCookie(jQuery, jQuery);
	});

	var generateCookieData = function(){
		var cookie = {
			$uuid: generateUuid(),
			lastSeen: Date.now()
		};
		return cookie;
	};

	var getCookie = function(){
		var cookie = jQuery.cookies.get(COOKIE_NAME);

		if(!cookie){
			cookie = generateCookieData();
			setCookie(cookie);
		}
		return cookie;
	};

	var setCookie = function(cookie){
		if(!cookie){
			cookie = getCookie();
		}

		cookie.lastSeen = Date.now();
		
		jQuery.cookies.set(COOKIE_NAME, cookie, { expire: 365 });
	};


	// pretrack is a function that will get called before each track.
	// gives you the opportunity to set things on each event

	var preTrack = function(event, data, cb){ 
		cb(event, data); 
	};

	var sendTrack = function(data){
		return jQuery.ajax({
			url: '//localhost:9000/track',
			type: 'post',
			dataType: 'json',
			data: data
		});
	};

	function Harvest(token){
		this.token = token;

		getCookie();
	};

	Harvest.prototype.preTrack = function(handler){
		if(typeof handler === 'function'){
			preTrack = handler;
		}
	}

	Harvest.prototype.track = function(event, data, cb){
		var self = this;
		data = data || {};
		cb = (typeof cb === 'function' ? cb : noop);

		if(!event || !event.length){
			return cb(true, { event: 'event name is required' });
		}

		preTrack(event, data, function(event, data){
			var cookie = getCookie();
			data.$uuid = cookie.$uuid;
			data = {
				event: event,
				token: self.token,
				data: data
			};

			sendTrack(data);
			setCookie();
		});
	};

	Harvest.prototype.identify = function(){

	};

	window.Harvest = Harvest;

})(window);

