var WebIM = require("../../../WebIM").default;
var utils = require("../../common/utils");
var _const = require("../../common/const");
var Dict = require("./tools/Dict");
var List = require("./tools/List");
var profile = require("./tools/profile");
var tools = require("./tools/tools");
var callbackManager = require("./tools/callbackManager");

var eventListener = require("./tools/eventListener");
var apiHelper = require("./apiHelper");
var moment = require("../lib/moment");
var sdkConst = require("./sdkConst");
var _ = require("../lib/underscore");

var receiveMsgTimer;
// todo: use profile.token instead
var token;
var config;
var conn;


// 监听ack的timer, 每条消息启动一个
var ackTimerDict = new Dict();

// 发消息队列
var sendMsgDict = new Dict();

// 收消息队列
var receiveMsgDict = new Dict();

var _open = tools.retryThrottle(function(){
	var op = {
		user: config.user.username,
		appKey: config.appKey,
		apiUrl: "https" + "//" + config.restServer
	};

	if(config.user.token){
		op.accessToken = config.user.token;
	}
	else{
		op.pwd = config.user.password;
	}

	conn.open(op);

	eventListener.excuteCallbacks(_const.SYSTEM_EVENT.IM_CONNECTION_OPENED, [conn]);
}, {
	resetTime: 10 * 60 * 1000,
	waitTime: 2000,
	retryLimit: 3
});


module.exports = {
	// todo: discard this
	init: function(){
		config = profile.config;

		_addSessionEventListener();
	},
	initConnection: _initConnection,
	reSend: _reSend,
	sendTransferToKf: _sendTransferToKf,
	sendText: _sendText,
	sendImg: _sendImg,
	sendFile: _sendFile,
	attemptToAppendOfficialAccount: _attemptToAppendOfficialAccount,

	// todo: move this to message view
	handleHistoryMsg: function(element){
		_handleMessage(_transformMessageFormat(element), null, true);
	},
	initSecondChannle: function(){
		receiveMsgTimer = clearInterval(receiveMsgTimer);
		receiveMsgTimer = setInterval(function(){
			apiHelper.receiveMsgChannel().then(function(msgList){
				_.each(msgList, function(elem){
					_handleMessage(_transformMessageFormat({ body: elem }), null, false);
				});
			});
		}, _const.SECOND_CHANNEL_MESSAGE_RECEIVE_INTERVAL);
	},
	handleMessage: _handleMessage,
	sendMessage: _sendMessage,
  sendImageWechat: sendImageWechat,
};

function _addSessionEventListener(){
	eventListener.add(_const.SYSTEM_EVENT.SESSION_CREATED, _trigger);
	eventListener.add(_const.SYSTEM_EVENT.SESSION_OPENED, _trigger);
	eventListener.add(_const.SYSTEM_EVENT.SESSION_TRANSFERED, _trigger);
	eventListener.add(_const.SYSTEM_EVENT.SESSION_CLOSED, _trigger);
	eventListener.add(_const.SYSTEM_EVENT.SESSION_TRANSFERING, _trigger);

	function _trigger(officialAccount, event){
		var sdkEvent;

		if(officialAccount !== profile.currentOfficialAccount) return;

		switch(event){
		case _const.SYSTEM_EVENT.SESSION_TRANSFERED:
			sdkEvent = sdkConst.COMMAND_MESSAGE.SESSION_TRANSFERED;
			break;
		case _const.SYSTEM_EVENT.SESSION_TRANSFERING:
			sdkEvent = sdkConst.COMMAND_MESSAGE.SESSION_TRANSFERING;
			break;
		case _const.SYSTEM_EVENT.SESSION_CLOSED:
			sdkEvent = sdkConst.COMMAND_MESSAGE.SESSION_CLOSED;
			break;
		case _const.SYSTEM_EVENT.SESSION_OPENED:
			sdkEvent = sdkConst.COMMAND_MESSAGE.SESSION_OPENED;
			break;
		case _const.SYSTEM_EVENT.SESSION_CREATED:
			sdkEvent = sdkConst.COMMAND_MESSAGE.SESSION_CREATED;
			break;
		default:
			// todo: fix eventListener bug
			console.error("unexpected event message type.");
			return;
		}

		profile.sdkCallbacks.onCommandReceived(sdkEvent, officialAccount);
	}
}

function _sendMessage(type, content, callbacks){
	if(!profile.isMessageChannelReady){
		profile.cachedUnsentMessages.push([type, content, callbacks]);
		return;
	}

	switch(type){
	case sdkConst.MESSAGE_TYPE.TEXT:
		// null 用作占位参数，踢掉 ext
		_sendText(content, null, callbacks);
		break;
	case sdkConst.MESSAGE_TYPE.TEXT_EXT:
		_sendText(content.txt, content.ext, callbacks);
		break;
	case sdkConst.MESSAGE_TYPE.FILE:
		_sendFile(_createFileObject(content), callbacks);
		break;
	case sdkConst.MESSAGE_TYPE.IMAGE:
      _sendImageFileWechat().then(callbacks.success, callbacks.failure);
		break;
	default:
		throw new Error("unexpected message type: " + type);
	}

	function _createFileObject(file){
		var filename = file.name || "";
		var index = filename.lastIndexOf(".");
		var filetype = index !== -1 ? filename.substring(index + 1).toLowerCase() : "";

		return {
			url: window.URL.createObjectURL(file),
			filename: filename,
			filetype: filetype,
			data: file || "",
		};
	}
}

function _initConnection(onReadyCallback){
	// xmpp连接超时则改为可发送消息状态
	// todo: 自动切换通道状态
	var firstTS = setTimeout(function(){
		onReadyCallback();
	}, _const.FIRST_CHANNEL_CONNECTION_TIMEOUT);

	// init connection
	conn = new WebIM.connection({
		url: config.xmppServer,
		retry: true,
		isMultiLoginSessions: config.resources,
		heartBeatWait: _const.HEART_BEAT_INTERVAL
	});

	conn.listen({
		onOpened: function(info){
			// 连接未超时，清除timer，暂不开启api通道发送消息
			clearTimeout(firstTS);

			token = info.accessToken;
			conn.setPresence();

			onReadyCallback(info);
		},
		onTextMessage: function(message){
			_handleMessage(message, "txt");
		},
		onEmojiMessage: function(message){
			_handleMessage(message, "emoji");
		},
		onPictureMessage: function(message){
			_handleMessage(message, "img");
		},
		onFileMessage: function(message){
			_handleMessage(message, "file");
		},
		onCmdMessage: function(message){
			_handleMessage(message, "cmd");
		},
    onReceivedMessage: function(messageElement){
      // 垃圾 im-sdk，消息ID还要自己解析
      var received = messageElement.getElementsByTagName("received");
      var messageId = utils.getDataByPath(received, "0.childNodes.0.nodeValue")
        || utils.getDataByPath(received, "0.innerHTML")
        || utils.getDataByPath(received, "0.innerText")
        || null;

      callbackManager.remove(messageId)
    },
		onOnline: function(){
			utils.isMobile && _open();
		},
		onOffline: function(){
			utils.isMobile && conn.close();

			eventListener.excuteCallbacks(_const.SYSTEM_EVENT.OFFLINE, []);
		},
		onError: function(e){
			if(e.reconnect){
				_open();
			}
			else if(e.type === _const.IM.WEBIM_CONNCTION_AUTH_ERROR){
				_open();
			}
			// im sdk 会捕获回调中的异常，需要把出错信息打出来
			else if(e.type === _const.IM.WEBIM_CONNCTION_CALLBACK_INNER_ERROR){
				console.error(e.data);
			}
			else{
				console.error(e);
			}
		}
	});

	// open connection
	_open();
}

function _reSend(type, id){
	if(!id) return;

	switch(type){
	case "txt":
		// 重试只发一次
		_sendMsgChannle(id, 0);
		break;
	default:
		// todo: 解决图片文件无法重发问题
		conn.send(id);
		break;
	}
}

function _sendText(message, ext, callbacks){
	var id = utils.uuid();
	var msg = new WebIM.message.txt(id);
	msg.set({
		msg: message,
		to: config.toUser,
		// 此回调用于确认im server收到消息, 有别于kefu ack
    // 垃圾im-sdk 这个回调是坏的
		success: callbacks.success,
		fail: callbacks.failure,
	});

  callbackManager.add(id, callbacks);

	if(ext){
		_.extend(msg.body, ext);
	}
	_setExt(msg);
	_appendAck(msg, id);
	conn.send(msg.body);
	sendMsgDict.set(id, msg);
	_detectSendTextMsgByApi(id);

	// 空文本消息不上屏
	if(!message) return;
	_appendMsg({
		id: id,
		type: "txt",
		data: message
	}, {
		isReceived: false,
		isHistory: false
	});

	eventListener.excuteCallbacks(_const.SYSTEM_EVENT.MESSAGE_SENT, []);
}

function _sendTransferToKf(tid, sessionId){
	var id = utils.uuid();
	var msg = new WebIM.message.cmd(id);
	msg.set({
		to: config.toUser,
		action: "TransferToKf",
		ext: {
			weichat: {
				ctrlArgs: {
					id: tid,
					serviceSessionId: sessionId
				}
			}
		}
	});
	_appendAck(msg, id);
	conn.send(msg.body);
	sendMsgDict.set(id, msg);
	_detectSendTextMsgByApi(id);

	eventListener.excuteCallbacks(_const.SYSTEM_EVENT.MESSAGE_SENT, []);
}

function _sendImg(fileMsg, callbacks){
	var id = utils.uuid();
	var msg = new WebIM.message.img(id);

	msg.set({
		apiUrl: "https" + "//" + config.restServer,
		file: fileMsg,
		accessToken: token,
		to: config.toUser,
		success: callbacks.success,
		onFileUploadError: callbacks.failure,
		onFileUploadComplete: function(){},
		fail: callbacks.failure,
	});
  callbackManager.add(id, callbacks);
	_setExt(msg);
	_appendAck(msg, id);
	_appendMsg({
		id: id,
		type: "img",
		url: fileMsg.url
	}, {
		isReceived: false,
		isHistory: false,
	});
	conn.send(msg.body);
	sendMsgDict.set(id, msg);
	_detectUploadImgMsgByApi(id, fileMsg.data);

	// 自己发出去的图片要缓存File对象，用于全屏显示图片
	profile.imgFileList.set(fileMsg.url, fileMsg.data);
	eventListener.excuteCallbacks(_const.SYSTEM_EVENT.MESSAGE_SENT, []);
}

function _sendFile(fileMsg, callbacks){
	var id = utils.uuid();
	var msg = new WebIM.message.file(id);

	msg.set({
		apiUrl: "https" + "//" + config.restServer,
		file: fileMsg,
		to: config.toUser,
		success: callbacks.success,
		fail: callbacks.failure,
	});
  callbackManager.add(id, callbacks);
	_setExt(msg);
	_appendMsg({
		id: id,
		type: "file",
		url: fileMsg.url,
		filename: fileMsg.filename,
		fileLength: fileMsg.data.size,
	}, {
		isReceived: false,
		isHistory: false,
	});
	conn.send(msg.body);
	eventListener.excuteCallbacks(_const.SYSTEM_EVENT.MESSAGE_SENT, []);
}

function _handleMessage(msg, msgType, isHistory){
	var message;
	var type = msgType || (msg && msg.type);
	var eventName = utils.getDataByPath(msg, "ext.weichat.event.eventName");
	var eventObj = utils.getDataByPath(msg, "ext.weichat.event.eventObj");
	var msgId = utils.getDataByPath(msg, "ext.weichat.msgId");

	// from 不存在默认认为是收到的消息
	var isReceived = !msg.from || (msg.from.toLowerCase() !== config.user.username.toLowerCase());
	var officialAccount = utils.getDataByPath(msg, "ext.weichat.official_account");
	var marketingTaskId = utils.getDataByPath(msg, "ext.weichat.marketing.marketing_task_id");
	var officialAccountId = officialAccount && officialAccount.official_account_id;
	var targetOfficialAccount;

	if(receiveMsgDict.get(msgId)){
		// 重复消息不处理
		return;
	}
	else if(msgId){
		// 消息加入去重列表
		receiveMsgDict.set(msgId, msg);
	}
	else{
		// 没有msgId忽略，继续处理（KEFU-ACK消息没有msgId）
	}

	// 绑定访客的情况有可能会收到多关联的消息，不是自己的不收
	if(!isHistory && msg.from && msg.from.toLowerCase() != config.toUser.toLowerCase() && !msg.noprompt){
		return;
	}

	// 撤回的消息不处理
	if(utils.getDataByPath(msg, "ext.weichat.recall_flag") === 1) return;

	officialAccount && _attemptToAppendOfficialAccount(officialAccount);
	targetOfficialAccount = _getOfficialAccountById(officialAccountId);

	// 满意度评价
	if(utils.getDataByPath(msg, "ext.weichat.ctrlType") === "inviteEnquiry"){
		type = "satisfactionEvaluation";
	}
	// 机器人自定义菜单，仅收到的此类消息显示为菜单，（发出的渲染为文本消息）
	else if(
		isReceived
		&& utils.getDataByPath(msg, "ext.msgtype.choice.title")
		&& utils.getDataByPath(msg, "ext.msgtype.choice.items")
	){
		type = "robotList";
	}
	// 待接入超时转留言
	else if(
		eventName === "ServiceSessionWillScheduleTimeoutEvent"
		&& eventObj
		&& eventObj.ticketEnable === "true"
	){
		type = "transferToTicket";
	}
	else if(utils.getDataByPath(msg, "ext.msgtype.articles")){
		type = "article";
	}
	else{}

	switch(type){
	case "txt":
	case "emoji":
	case "img":
	case "file":
	case "satisfactionEvaluation":
	case "article": // todo: support article
	case "robotList":
	case "skillgroupMenu":
	case "robotTransfer":
	case "transferToTicket":
		// sdk收到实时消息
		profile.sdkCallbacks.onMessageReceived(_toSdkFormat(msg, type));
		break;
	case "cmd":
		var action = msg.action;
		if(action === "KF-ACK"){
			// 清除ack对应的site item
			_clearTS(msg.ext.weichat.ack_for_msg_id);
			// todo
			return;
		}
		else if(action === "KEFU_MESSAGE_RECALL"){
			// 撤回消息命令
			var recallMsgId = msg.ext.weichat.recall_msg_id;
			// todo
			profile.sdkCallbacks.onCommandReceived(
				sdkConst.COMMAND_MESSAGE.MESSAGE_RECALLED,
				{ messageId: recallMsgId }
			);
		}
		break;
	default:
		console.error("unexpected msg type");
		break;
	}

	if(!isHistory){
		// 实时消息需要处理系统事件

		marketingTaskId
			&& type === "txt"
			&& eventListener.excuteCallbacks(
			_const.SYSTEM_EVENT.MARKETING_MESSAGE_RECEIVED,
			[
				targetOfficialAccount,
				marketingTaskId,
				msg
			]
		);

		if(eventName){
			_handleSystemEvent(eventName, eventObj, msg);
		}
		else{
			var agentInfo = utils.getDataByPath(msg, "ext.weichat.agent");
			if(agentInfo){
				targetOfficialAccount.agentNickname = agentInfo.userNickname;
				targetOfficialAccount.agentAvatar = agentInfo.avatar;

				eventListener.excuteCallbacks(_const.SYSTEM_EVENT.AGENT_INFO_UPDATE, [targetOfficialAccount]);
			}
		}
	}

	// 空文本消息不显示
	if(!message || (type === "txt" && !message.data) || (type === "article" && _.isEmpty(utils.getDataByPath(msg, "ext.msgtype.articles")))) return;

	// 给收到的消息加id，用于撤回消息
	message.id = msgId;

	// 消息上屏
	_appendMsg(message, {
		isReceived: isReceived,
		isHistory: isHistory,
		officialAccount: targetOfficialAccount,
		timestamp: msg.timestamp
	});
}

function _toSdkFormat(msg, type){
	var message = {};
	var robotTransferMenuItem;
	var ctrlArgsId;

	switch(type){
	case "txt":
		message.content = msg.data;
		message.type = sdkConst.MESSAGE_TYPE.TEXT;
		break;
	case "emoji":
		message.content = msg.data;
		message.type = sdkConst.MESSAGE_TYPE.EMOJI;
		break;
	case "img":
		message.content = {
			url: msg.url,
		};
		message.type = sdkConst.MESSAGE_TYPE.IMAGE;
		break;
	case "file":
		message.content = {
			url: msg.url,
			filename: msg.filename,
			filesize: msg.fileLength,
		};
		message.type = sdkConst.MESSAGE_TYPE.FILE;
		break;
	case "satisfactionEvaluation":
		message.content = {
			inviteId: msg.ext.weichat.ctrlArgs.inviteId,
			sessionId: msg.ext.weichat.ctrlArgs.serviceSessionId,
		};
		message.type = sdkConst.MESSAGE_TYPE.EVALUATE_REQUEST;
		break;
	case "article":
		message.content = {
			articleList: utils.getDataByPath(msg, "ext.msgtype.articles"),
			// [
			//  {
			//      title: string,
			//      thumbUrl: string,
			//      description: string,
			//      url: string,
			//      createTime: number,
			//  },
			//  ...,
			// ]
		};
		message.type = sdkConst.MESSAGE_TYPE.ARTICLE;
		break;
	case "robotList":
		message.content = {
			title: msg.ext.msgtype.choice.title,
			menuList: _.map(msg.ext.msgtype.choice.items, function(item){
				var id = item.id;
				var text = item.name;
				var obj;

				if(id === "TransferToKf"){
					// 转人工菜单 id === "TransferToKf" , 此时为了避免问题应该重新生成 id
					id = utils.uuid();
				}

				// 注册菜单
				profile.menuList.set(id, obj = {
					id: id,
					text: text,
					type: type,
				});

				return obj;
			}) || [],
		};
		message.type = sdkConst.MESSAGE_TYPE.MENU;
		break;
	case "skillgroupMenu":
		message.content = {
			titie: msg.data.menuName,
			menuList: _.map(msg.data.children, function(item){
				var queueName = item.queueName;
				var text = item.menuName;
				var id = utils.uuid();
				var obj;

				// 注册菜单
				profile.menuList.set(id, obj = {
					id: id,
					text: text,
					queueName: queueName,
					type: type,
				});

				return obj;
			}) || [],
		};
		message.type = sdkConst.MESSAGE_TYPE.MENU;
		break;
	case "robotTransfer":
		ctrlArgsId = utils.getDataByPath(msg, "ext.weichat.ctrlArgs.id");
		robotTransferMenuItem = {
			sessionId: utils.getDataByPath(msg, "ext.weichat.ctrlArgs.sessionId"),
			id: ctrlArgsId,
			text: utils.getDataByPath(msg, "ext.weichat.ctrlArgs.label"),
			type: type,
		};
		// 注册菜单
		profile.menuList.set(ctrlArgsId, robotTransferMenuItem);
		message.content = {
			titie: message.data || utils.getDataByPath(msg, "ext.weichat.ctrlArgs.label"),
			menuList: [robotTransferMenuItem],
		};
		message.type = sdkConst.MESSAGE_TYPE.MENU;
		break;
	case "transferToTicket":
		message.content = {};
		message.type = sdkConst.MESSAGE_TYPE.WAIT_TIMEOUT;
		break;
	default:
		throw new Error("unexpected message type.");
	}

	message.ext = msg.ext || {};
	message.timestamp = msg.timestamp || _.now();
	message.isReceived = !msg.from || (msg.from.toLowerCase() !== config.user.username.toLowerCase());
	message.id = utils.getDataByPath(msg, "ext.weichat.msgId") || null;

	return message;
}

function _transformMessageFormat(element){
	var msgBody = element.body || {};
	var msg = utils.getDataByPath(msgBody, "bodies.0") || {};
	var url = msg.url;
	var timestamp = moment(element.created_at, "YYYY-MM-DDTHH:mm:ss.SSSZZ").valueOf();
	var fileLength;
	// 只有坐席发出的消息里边的file_length是准确的
	if(msgBody.from !== config.user.username){
		fileLength = msg.file_length;
	}

	// 给图片消息或附件消息的url拼上hostname
	if(url && !/^https?/.test(url)){
		url = "https" + config.domain + url;
	}

	return {
		data: msg.msg,
		url: url,
		filename: msg.filename,
		action: msg.action,
		type: msg.type,
		msgId: element.msg_id,
		fromUser: element.from_user,
		timestamp: timestamp,
		fileLength: fileLength,
		ext: msgBody.ext,
		to: msgBody.to,
		from: msgBody.from
	};
}

// todo: merge setExt & appendAck
function _appendAck(msg, id){
	msg.body.ext.weichat.msg_id_for_ack = id;
}

function _setExt(msg){
	var officialAccount = profile.currentOfficialAccount || profile.systemOfficialAccount;
	var officialAccountId = officialAccount.official_account_id;
	var bindAgentUsername = officialAccount.bindAgentUsername;
	var bindSkillGroupName = officialAccount.bindSkillGroupName;
	var language = config.language;

	msg.body.ext = msg.body.ext || {};
	msg.body.ext.weichat = msg.body.ext.weichat || {};

	msg.body.ext.weichat.language = language;

	// bind skill group
	if(bindSkillGroupName){
		msg.body.ext.weichat.queueName = bindSkillGroupName;
	}
	else if(config.emgroup){
		msg.body.ext.weichat.queueName = msg.body.ext.weichat.queueName || config.emgroup;
	}

	// bind visitor
	if(!_.isEmpty(config.visitor)){
		msg.body.ext.weichat.visitor = config.visitor;
	}

	// bind agent username
	if(bindAgentUsername){
		msg.body.ext.weichat.agentUsername = bindAgentUsername;
	}
	else if(config.agentName){
		msg.body.ext.weichat.agentUsername = config.agentName;
	}

	// set growingio id
	if(config.grUserId){
		msg.body.ext.weichat.visitor = msg.body.ext.weichat.visitor || {};
		msg.body.ext.weichat.visitor.gr_user_id = config.grUserId;
	}

	// 初始化时系统服务号的ID为defaut，此时不用传
	if(officialAccountId !== "default"){
		msg.body.ext.weichat.official_account = {
			official_account_id: officialAccountId
		};
	}
}

function _handleSystemEvent(event, eventObj, msg){
	var officialAccountId = utils.getDataByPath(msg, "ext.weichat.official_account.official_account_id");
	var officialAccount = _getOfficialAccountById(officialAccountId);

	switch(event){
	case _const.SYSTEM_EVENT.SESSION_TRANSFERED:
		officialAccount.agentId = eventObj.userId;
		officialAccount.agentType = eventObj.agentType;
		officialAccount.agentAvatar = eventObj.avatar;
		officialAccount.agentNickname = eventObj.agentUserNiceName;
		officialAccount.sessionState = _const.SESSION_STATE.PROCESSING;
		officialAccount.isSessionOpen = true;
		break;
	case _const.SYSTEM_EVENT.SESSION_TRANSFERING:
		officialAccount.sessionState = _const.SESSION_STATE.WAIT;
		officialAccount.isSessionOpen = true;
		officialAccount.skillGroupId = null;
		break;
	case _const.SYSTEM_EVENT.SESSION_CLOSED:
		officialAccount.sessionState = _const.SESSION_STATE.ABORT;
		officialAccount.agentId = null;
		// 发起满意度评价需要回传sessionId，所以不能清空
		// officialAccount.sessionId = null;
		officialAccount.skillGroupId = null;
		officialAccount.isSessionOpen = false;
		officialAccount.hasReportedAttributes = false;

		break;
	case _const.SYSTEM_EVENT.SESSION_OPENED:
		officialAccount.sessionState = _const.SESSION_STATE.PROCESSING;
		officialAccount.agentType = eventObj.agentType;
		officialAccount.agentId = eventObj.userId;
		officialAccount.sessionId = eventObj.sessionId;
		officialAccount.agentAvatar = eventObj.avatar;
		officialAccount.agentNickname = eventObj.agentUserNiceName;
		officialAccount.isSessionOpen = true;
		break;
	case _const.SYSTEM_EVENT.SESSION_CREATED:
		officialAccount.sessionState = _const.SESSION_STATE.WAIT;
		officialAccount.sessionId = eventObj.sessionId;
		officialAccount.isSessionOpen = true;
		break;
	default:
		break;
	}

	eventListener.excuteCallbacks(event, [officialAccount, event]);
}

function _getOfficialAccountById(id){
	// 默认返回系统服务号
	if(!id) return profile.systemOfficialAccount;

	return _.findWhere(profile.officialAccountList, { official_account_id: id });
}

function _appendMsg(msg, options){
	var opt = options || {};
	var isReceived = opt.isReceived;
	var isHistory = opt.isHistory;
	var officialAccount = opt.officialAccount || profile.currentOfficialAccount || profile.systemOfficialAccount;

	// todo: ...

	if(isReceived && !isHistory && !msg.noprompt){
		eventListener.excuteCallbacks(
			_const.SYSTEM_EVENT.MESSAGE_APPENDED,
			[officialAccount, msg]
		);
	}
}

function _attemptToAppendOfficialAccount(officialAccountInfo){
	var id = officialAccountInfo.official_account_id;
	var targetOfficialAccount = _.findWhere(profile.officialAccountList, { official_account_id: id });

	// 如果相应messageView已存在，则不处理
	if(targetOfficialAccount) return;

	var type = officialAccountInfo.type;
	var img = officialAccountInfo.img;
	var name = officialAccountInfo.name;
	// copy object
	var officialAccount = {
		official_account_id: id,
		type: type,
		img: img,
		name: name
	};

	if(type === "SYSTEM"){
		if(_.isEmpty(profile.systemOfficialAccount)){
			profile.systemOfficialAccount = officialAccount;
			profile.officialAccountList.push(officialAccount);
			officialAccount.unopenedMarketingTaskIdList = new List();
			officialAccount.unrepliedMarketingTaskIdList = new List();
			officialAccount.unreadMessageIdList = new List();
			eventListener.excuteCallbacks(
				_const.SYSTEM_EVENT.NEW_OFFICIAL_ACCOUNT_FOUND,
				[officialAccount]
			);
		}
		else if(profile.systemOfficialAccount.official_account_id !== id){
			// 如果id不为null则更新 systemOfficialAccount
			profile.systemOfficialAccount.official_account_id = id;
			profile.systemOfficialAccount.img = img;
			profile.systemOfficialAccount.name = name;
			eventListener.excuteCallbacks(_const.SYSTEM_EVENT.SYSTEM_OFFICIAL_ACCOUNT_UPDATED, []);
		}
	}
	else if(type === "CUSTOM"){
		profile.ctaEnable = true;
		profile.officialAccountList.push(officialAccount);
		officialAccount.unopenedMarketingTaskIdList = new List();
		officialAccount.unrepliedMarketingTaskIdList = new List();
		officialAccount.unreadMessageIdList = new List();
		eventListener.excuteCallbacks(
			_const.SYSTEM_EVENT.NEW_OFFICIAL_ACCOUNT_FOUND,
			[officialAccount]
		);
	}
	else{
		throw "unexpected official_account type.";
	}
}

// 第二通道发消息
function _sendMsgChannle(id, retryCount){
	var msg = sendMsgDict.get(id);
	var body = utils.getDataByPath(msg, "body.body");
	var ext = utils.getDataByPath(msg, "body.ext");
	var count = typeof retryCount === "number"
		? retryCount
		: _const.SECOND_MESSAGE_CHANNEL_MAX_RETRY_COUNT;

	apiHelper.sendMsgChannel(body, ext).then(function(){
		// 发送成功清除
		_clearTS(id);
	}, function(){
		// 失败继续重试
		if(count > 0){
			_sendMsgChannle(id, --count);
		}
		else{
			// _showFailed(id);
		}
	});
}

// 第二通道上传图片消息
function _uploadImgMsgChannle(id, file, retryCount){
	var msg = sendMsgDict.get(id);
	var count = typeof retryCount === "number"
		? retryCount
		: _const.SECOND_MESSAGE_CHANNEL_MAX_RETRY_COUNT;


	apiHelper.uploadImgMsgChannel(file).then(function(resp){
		msg.body.body = {
			filename: resp.fileName,
			type: "img",
			url: resp.url
		};
		_sendMsgChannle(id, 0);
	}, function(){
		if(count > 0){
			_uploadImgMsgChannle(msg, file, --count);
		}
		else{
			// _showFailed(id);
		}
	});
}

// 消息发送成功，清除timer
function _clearTS(id){
	clearTimeout(ackTimerDict.get(id));
	ackTimerDict.remove(id);

	sendMsgDict.remove(id);
}

// 监听ack，超时则开启api通道, 发文本消息时调用
function _detectSendTextMsgByApi(id){
	ackTimerDict.set(
		id,
		setTimeout(function(){
			_sendMsgChannle(id);
		}, _const.FIRST_CHANNEL_MESSAGE_TIMEOUT)
	);
}

// 监听ack，超时则开启api通道, 上传图片消息时调用
function _detectUploadImgMsgByApi(id, file){
	ackTimerDict.set(
		id,
		setTimeout(function(){
			// _uploadImgMsgChannle(id, file);
		}, _const.FIRST_CHANNEL_IMG_MESSAGE_TIMEOUT)
	);
}

function _chooseImageWechat() {
  return new Promise(function (resolve, reject) {
    wx.chooseImage({
      count: 1,
      success: function _chooseImageSuccessCallback(res) {
        var filePath = res.tempFilePaths[0];

        resolve(filePath);
      },
      fail: reject,
    });
  });
}

function _getImageInfoWechat(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getImageInfo({
      src: filePath,
      success: function (res) {
        var width = res.width;
        var height = res.height;
        var path = res.path;
        var lastIndexOfDot = res.path.lastIndexOf(".");
        var fileType = lastIndexOfDot !== -1 ? path.slice(lastIndexOfDot + 1) : null;
        var fileInfo = {
          width: width,
          height: height,
          fileType: fileType,
          path: path,
        };

        resolve(fileInfo);
      },
      fail: reject,
    });
  });
}

function _uploadFileWechat(fileInfo) {
  return new Promise(function (resolve, reject) {
    var filePath = fileInfo.path;
    var orgName = "easemob-131268";
    var appName = "testappid123457890";

    wx.uploadFile({
      url: "https://a1.easemob.com/" + orgName + "/" + appName + "/chatfiles",
      filePath: filePath,
      name: "file",
      header: {
        "Content-Type": "multipart/form-data"
      },
      success: function (res) {
        var parsedData = JSON.parse(res.data);
        var uuid = parsedData.entities[0].uuid;
        var url = parsedData.uri + "/" + uuid;
        var dataObj = {
          size: {
            width: fileInfo.width,
            height: fileInfo.height,
          },
          url: url,
          filePath: fileInfo.path,
          fileType: fileInfo.fileType,
        };

        resolve(dataObj);
      },
      fail: reject,
    });
  });
}

function _sendFile(dataObj) {
  return new Promise(function (resolve, reject) {
    var id = utils.uuid();
    var msg = new WebIM.message.img(id);

    msg.set({
      apiUrl: WebIM.config.apiURL,
      body: {
        type: "img",
        size: dataObj.size,
        url: dataObj.url,
        filetype: dataObj.filetype,
        filename: dataObj.filePath
      },
      to: config.toUser,
      // 垃圾 im-sdk，回调是坏的
      success: resolve,
      fail: reject,
    });

    // 图片超时为 10s
    callbackManager.add(id, { success: resolve, failure: reject }, 10000)
    conn.send(msg.body);
  });
}

function sendImageWechat(resolve, reject){
  var cachedFileInfo;

  _chooseImageWechat()
    .then(function (filePath) {
      return _getImageInfoWechat(filePath);
    })
    .then(function (fileInfo) {
      cachedFileInfo = fileInfo;
      return _uploadFileWechat(fileInfo);
    })
    .then(function (dataObj) {
      return _sendFile(dataObj);
    })
    .then(function (id) {
      cachedFileInfo.id = id;
      resolve(cachedFileInfo);
    })
  ["catch"](function (err) {
    reject(err);
  });
}

