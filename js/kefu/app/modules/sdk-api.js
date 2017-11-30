var initSDK = require("./init");
var channel = require("./channel");
var sdkConst = require("./sdkConst");
var apiHelper = require("./apiHelper");
var profile = require("./tools/profile");
var _const = require("../../common/const");
var utils = require("../../common/utils");

var KefuWebIM = {
	init: init,
	sdkConst: sdkConst,
	version: "0.1.0",
};

var sessionHandler = {
	sendMessage: sendMessage,
	callFeature: callFeature,
	getHistoryMessage: getHistoryMessage,
};

function getHistoryMessage(count){
	var size = count || _const.GET_HISTORY_MESSAGE_COUNT_EACH_TIME;
	return new Promise(function(resolve, reject){
		var officialAccountId = profile.systemOfficialAccount.official_account_id;
		var noMoreHistoryMessage = profile.systemOfficialAccount.noMoreHistoryMessage || false;
		var currHistoryMsgSeqId = profile.systemOfficialAccount.currHistoryMsgSeqId || 0;

		if(!officialAccountId){
			throw new Error("no session initialized.");
		}

		if(noMoreHistoryMessage){
			throw new Error("no more history message");
		}

		apiHelper.getOfficalAccountMessage(
			officialAccountId,
			currHistoryMsgSeqId,
			size
		).then(function(msgList){
			var length = msgList.length;
			var earliestMsg = msgList[length - 1] || {};
			var nextMsgSeq = earliestMsg.id;

			profile.systemOfficialAccount.currHistoryMsgSeqId = nextMsgSeq;
			profile.systemOfficialAccount.noMoreHistoryMessage = length < size || nextMsgSeq <= 0;
			resolve(msgList);
		}, function(err){
			reject(err);
		});
	});
}

function init(option, callbacks){
	initSDK(option, callbacks || {});
	return sessionHandler;
}

function sendMessage(message){
	return new Promise(function(resolve, reject){
		var type = message.type;
		var content = message.content;
		var fileSize;
		var callbacks = {
			success: resolve,
			failure: reject,
		};

		switch(type){
		case sdkConst.MESSAGE_TYPE.TEXT:
			if(typeof content !== "string"){
				throw new Error("content must be a string.");
			}

			if(content.length > _const.MAX_TEXT_MESSAGE_LENGTH){
				throw new Error("The text message exceeds the maximum length.");
			}
			break;
		case sdkConst.MESSAGE_TYPE.TEXT_EXT:
			if(typeof content !== "object"){
				throw new Error("content must be an object.");
			}

			if(typeof content.txt !== "string"){
				throw new Error("content.txt must be a string.");
			}

			if(content.txt.length > _const.MAX_TEXT_MESSAGE_LENGTH){
				throw new Error("The text message exceeds the maximum length.");
			}
			break;
		case sdkConst.MESSAGE_TYPE.FILE:
      // todo: file
      break;
		case sdkConst.MESSAGE_TYPE.IMAGE:
      channel.sendImageWechat(resolve, reject);
      return;
		default:
			throw new Error("unexpected message type: " + type);
		}

		channel.sendMessage(type, content, callbacks);
	});
}

function callFeature(featureName, params){
	switch(featureName){
	case sdkConst.FEATURE.CREATE_TICKET:
		return _createTicket(params);
	case sdkConst.FEATURE.EVALUATE_AGENT:
		return _evaluateAgent(params);
	case sdkConst.FEATURE.CALL_ROBOT_MENU:
		return _callRobotMenu(params);
	case sdkConst.FEATURE.TRANSFER_TO_MANUAL:
		return _transferToManual(params);
	case sdkConst.FEATURE.CLOSE_SESSION:
		return _closeSession();
	default:
		return Promise.reject(new Error("unexpected feature name: " + featureName));
	}
}

function _createTicket(params){
	var option = params || {};
	var name = option.name || "";
	var mail = option.mail || "";
	var phone = option.phone || "";
	var content = option.content || "";

	return new Promise(function(resolve, reject){
		Promise.all([
			apiHelper.getToken(),
			apiHelper.getProjectId()
		]).then(function(result){
			var token = result[0];
			var projectId = result[1];

			apiHelper.createTicket({
				token: token,
				projectId: projectId,
				name: name,
				phone: phone,
				mail: mail,
				content: content,
			}).then(function(){
				resolve();
			}, function(err){
				reject(err);
			});
		})
		["catch"](function(err){
			reject(err);
		});
	});
}

function _evaluateAgent(params){
	var option = params || {};
	// 后端类型要求，inviteId必须传数字
	var inviteId = option.inviteId || 0;
	var sessionId = option.sessionId || profile.currentOfficialAccount.sessionId || "";
	var content = option.content;
	var level = option.level;

	return new Promise(function(resolve, reject){
		var callbacks = {
			success: resolve,
			failure: reject,
		};

		channel.sendMessage(sdkConst.MESSAGE_TYPE.TEXT_EXT, {
			txt: "",
			ext: {
				weichat: {
					ctrlType: "enquiry",
					ctrlArgs: {
						// 后端类型要求，inviteId必须传数字
						inviteId: inviteId,
						serviceSessionId: sessionId,
						detail: content,
						summary: level,
					}
				}
			},
		}, callbacks);
	});
}

function _callRobotMenu(menuId){
	var menuItem = profile.menuList.get(menuId);
	var text;
	var type;
	var sessionId;
	var queueName;
	var callbacks = {
		success: function(){},
		failure: function(){},
	};

	if(!menuItem){
		throw new Error("invalid menuId: " + menuId);
	}

	text = menuItem.text;
	type = menuItem.type;

	switch(type){
	case "robotList":
		channel.sendText(text, {
			ext: {
				msgtype: {
					choice: {
						menuid: menuId,
					}
				}
			}
		}, callbacks);
		break;
	case "skillgroupMenu":
		queueName = menuItem.queueName;
		channel.sendText(text, {
			ext: {
				weichat: {
					queueName: queueName,
				}
			}
		}, callbacks);
		break;
	case "robotTransfer":
		sessionId = menuItem.sessionId;
		channel.sendTransferToKf(menuId, sessionId);
		break;
	default:
		throw new Error("unexpected message type.");
	}

	return Promise.resolve();
}

function _transferToManual(params){
	var option = params || {};
	var sessionId = option.sessionId || "";
	var tid = option.tid;

	channel.sendTransferToKf(tid, sessionId);
	return Promise.resolve();
}

function _closeSession(){
	var officialAccount = profile.currentOfficialAccount;
	var isSessionOpen = officialAccount.isSessionOpen;
	var sessionId = officialAccount.sessionId;

	if(isSessionOpen && sessionId){
		return apiHelper.closeServiceSession(sessionId);
	}

	return Promise.reject(new Error("session is not opened."));
}


module.exports = KefuWebIM;
