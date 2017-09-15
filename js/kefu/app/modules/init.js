require("../lib/es6-promise").polyfill();
require("../../common/polyfill");
require("../lib/modernizr");
require("../sdk/webim.config");
require("underscore");

var utils = require("../../common/utils");
var apiHelper = require("./apiHelper");
var chat = require("./chat");
var profile = require("./tools/profile");

var config;
var hasChatEntryInitialized;

function _init(option, callbacks){
	var OPTION_KEY_ARRAY = "tenantId|configId|appKey|to|apiServer|restServer|xmppServer|agentUsername|skillGroup|imUsername|imPassword|language".split("|");
	var CALLBACK_KEY_ARRAY = "onReady|onMessageReceived|onCommandReceived|onAgentStatusChange|onError".split("|");
	// check option keys
	var unknownOptionKeys = _.chain(option)
	.map(function(value, key){
		return !!~OPTION_KEY_ARRAY.indexOf(key) ? "" : key;
	})
	.compact()
	.value();
	var unknownCallbackKeys = _.chain(callbacks)
	.map(function(value, key){
		return !!~CALLBACK_KEY_ARRAY.indexOf(key) ? "" : key;
	})
	.compact()
	.value();

	if(!_.isEmpty(unknownOptionKeys)){
		throw new Error("unknown option key(s): " + unknownOptionKeys.join(", "));
	}

	if(!_.isEmpty(unknownCallbackKeys)){
		throw new Error("unknown callback key(s): " + unknownOptionKeys.join(", "));
	}

	if(!option.tenantId && !option.tenantId){
		throw new Error("the tenantId or configId is not specified.");
	}

	config = profile.config = {
		tenantId: option.tenantId || "",
		configId: option.configId || "",
		appKey: option.appKey || "",
		to: option.to || "",
		domain: option.apiServer || "kefu.easemob.com",
		restServer: option.restServer || "",
		xmppServer: option.xmppServer || "",
		agentName: option.agentUsername || "",
		emgroup: option.skillGroup || "",
		language: option.language || "zh-CN",
		user: {
			username: option.imUsername || "",
			password: option.imPassword || "",
		},
	};

	_.each(CALLBACK_KEY_ARRAY, function(callbackKey){
		var cb = callbacks[callbackKey];

		if(!cb){
			// do nothing
		}
		else if(typeof cb === "function"){
			profile.sdkCallbacks[callbackKey] = cb;
		}
		else{
			throw new Error("callback must be a function.");
		}
	});


	initCrossOriginIframe();
}

function initCrossOriginIframe(){
	var iframe = document.createElement("iframe");
	iframe.id = "cross-origin-iframe";
	iframe.style.display = "none";
	document.body.appendChild(iframe);

	iframe.src = location.protocol + "//" + config.domain + "/webim/transfer.html?v=kefu-webim-sdk";
	utils.on(iframe, "load", function(){
		apiHelper.initApiTransfer();
		handleMsgData();
	});
}

function handleMsgData(){
	var defaultStaticPath = "static";
	// default value
	config.staticPath = config.staticPath || defaultStaticPath;
	config.offDutyWord = config.offDutyWord || "";
	config.emgroup = config.emgroup || "";

	// fake patch: 老版本配置的字符串需要decode
	if(config.offDutyWord){
		try{
			config.offDutyWord = decodeURIComponent(config.offDutyWord);
		}
		catch(e){}
	}

	if(config.emgroup){
		try{
			config.emgroup = decodeURIComponent(config.emgroup);
		}
		catch(e){}
	}

	config.user = config.user || {};
	config.visitor = config.visitor || {};

	config.channel = {};
	config.ui = {
		H5Title: {}
	};
	config.toolbar = {};
	config.chat = {};

	profile.defaultAvatar = config.staticPath + "/img/default_avatar.png";

	// 用于预览模式
	if(config.previewObj){
		handleConfig(config.previewObj);
		initChat();
	}
	else if(config.configId){
		apiHelper.getConfig(config.configId).then(function(entity){
			config.tenantId = entity.tenantId;
			handleConfig(entity.configJson);
			initChat();
		});
	}
	else{
		initChat();
	}
}

function initChat(){
	apiHelper.init(config);

	// 获取关联，创建访客，调用聊天窗口
	initChatEntry();
}

function handleConfig(configJson){
	// todo: 把配置转换为新的
	// 用于config标记是否是来自于坐席端网页配置
	config.isWebChannelConfig = true;

	config.channel = configJson.channel;
	config.ui = configJson.ui;
	config.toolbar = configJson.toolbar;
	config.chat = configJson.chat;

	config.appKey = configJson.channel.appKey;
	config.to = configJson.channel.to;
	// config.agentName = configJson.channel.agentName;
	config.emgroup = configJson.channel.emgroup;

	// config.buttonText = configJson.ui.buttonText;
	// config.dialogHeight = configJson.ui.dialogHeight;
	// config.dialogWidth = configJson.ui.dialogWidth;
	// config.dialogPosition = configJson.ui.dialogPosition;
	config.dragenable = configJson.ui.dragenable;
	config.hide = configJson.ui.hide;
	config.logo = configJson.ui.logo;
	config.notice = configJson.ui.notice;
	config.themeName = configJson.ui.themeName;

	config.autoConnect = configJson.toolbar.autoConnect;
	// config.hideKeyboard = configJson.toolbar.hideKeyboard;
	config.minimum = configJson.toolbar.minimum;
	config.offDutyWord = configJson.toolbar.offDutyWord;
	config.offDutyType = configJson.toolbar.offDutyType;
	config.popupOnInitialized = configJson.toolbar.popupOnInitialized;
	config.satisfaction = configJson.toolbar.satisfaction;
	config.soundReminder = configJson.toolbar.soundReminder;
	config.ticket = configJson.toolbar.ticket;

	config.resources = configJson.chat.resources;
	config.hideStatus = configJson.chat.hideStatus;
}

function initChatEntry(){
	if(hasChatEntryInitialized) return;
	hasChatEntryInitialized = true;
	// 获取关联信息
	apiHelper.getRelevanceList().then(function(relevanceList){
		var targetItem;
		var appKey = config.appKey;
		var splited = appKey.split("#");
		var orgName = splited[0];
		var appName = splited[1];
		var toUser = config.toUser || config.to;

		// toUser 转为字符串， todo: move it to handle config
		typeof toUser === "number" && (toUser = toUser.toString(10));

		if(appKey && toUser){
			// appKey，imServiceNumber 都指定了
			targetItem = _.where(relevanceList, {
				orgName: orgName,
				appName: appName,
				imServiceNumber: toUser
			})[0];
		}

		// 未指定appKey, toUser时，或未找到符合条件的关联时，默认使用关联列表中的第一项
		if(!targetItem){
			targetItem = targetItem || relevanceList[0];
			console.log("mismatched channel, use default.");
		}

		// 获取企业头像和名称
		// todo: rename to tenantName
		profile.tenantAvatar = utils.getAvatarsFullPath(targetItem.tenantAvatar, config.domain);
		profile.defaultAgentName = targetItem.tenantName;
		config.logo = config.logo || { enabled: !!targetItem.tenantLogo, url: targetItem.tenantLogo };
		config.toUser = targetItem.imServiceNumber;
		config.orgName = targetItem.orgName;
		config.appName = targetItem.appName;
		config.channelId = targetItem.channelId;

		config.appKey = config.orgName + "#" + config.appName;
		config.restServer = config.restServer || targetItem.restDomain;
		config.xmppServer = config.xmppServer || targetItem.xmppServer;

		if(config.user.username && (config.user.password || config.user.token)){
			chat.init();
		}
		else if(config.user.username){
			apiHelper.getPassword().then(function(password){
				config.user.password = password;
				chat.init();
			}, function(){
				_downgrade();
			});
		}
		else{
			_downgrade();
		}
	}, function(err){
		throw err;
	});
}

function _downgrade(){
	apiHelper.createVisitor().then(function(entity){
		config.user.username = entity.userId;
		config.user.password = entity.userPassword;

		chat.init();
	});
}

module.exports = _init;
