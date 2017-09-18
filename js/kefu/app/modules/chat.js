var _const = require("../../common/const");
var sdkConst = require("./sdkConst");
var apiHelper = require("./apiHelper");
var eventListener = require("./tools/eventListener");
var channel = require("./channel");
var profile = require("./tools/profile");
var _ = require("../lib/underscore");

var initAgentStatusPoller = require("./chat/initAgentStatusPoller");
var initSessionList = require("./chat/initSessionList");
var initGetGreetings = require("./chat/initGetGreetings");
var initAgentNicknameUpdate = require("./chat/initAgentNicknameUpdate");

var config;

var _reCreateImUser = _.once(function(){
	console.warn("user not found in current appKey, attempt to recreate user.");
	apiHelper.createVisitor().then(function(entity){

		config.user.username = entity.userId;
		config.user.password = entity.userPassword;

		_initSession();
	});
});

module.exports = {
	init: _init,
};

function _initSystemEventListener(){
	// report visitor info
	eventListener.add(_const.SYSTEM_EVENT.SESSION_OPENED, _reportVisitorInfo);
	eventListener.add(_const.SYSTEM_EVENT.SESSION_RESTORED, _reportVisitorInfo);
}

function _reportVisitorInfo(officialAccount){
	if(officialAccount.hasReportedAttributes) return;

	var sessionId = officialAccount.sessionId;
	var isSessionOpen = officialAccount.isSessionOpen;

	if(isSessionOpen && sessionId){
		officialAccount.hasReportedAttributes = true;
		apiHelper.reportVisitorAttributes(sessionId);
	}
}

function _initOfficialAccount(){
	return new Promise(function(resolve, reject){
		apiHelper.getOfficalAccounts().then(function(officialAccountList){
			_.each(officialAccountList, channel.attemptToAppendOfficialAccount);

			if(!profile.ctaEnable){
				profile.currentOfficialAccount = profile.systemOfficialAccount;
				profile.systemOfficialAccount.messageView.show();
			}

			eventListener.excuteCallbacks(_const.SYSTEM_EVENT.OFFICIAL_ACCOUNT_LIST_GOT, []);

			resolve();
		}, function(err){
			// 未创建会话时初始化默认服务号
			if(err === _const.ERROR_MSG.VISITOR_DOES_NOT_EXIST){
				// init default system message view
				channel.attemptToAppendOfficialAccount({
					type: "SYSTEM",
					official_account_id: "default",
					img: null
				});

				profile.systemOfficialAccount.noMoreHistoryMessage = true;
				profile.currentOfficialAccount = profile.systemOfficialAccount;

				eventListener.excuteCallbacks(_const.SYSTEM_EVENT.SESSION_NOT_CREATED, [profile.systemOfficialAccount]);

				resolve();
			}
			else{
				reject(err);
			}
		});
	});
}

function _onReady(){
	if(profile.isMessageChannelReady) return;

	profile.isMessageChannelReady = true;

	// 发送扩展消息
	while(!_.isEmpty(profile.commandMessageToBeSendList.length)){
		channel.sendText("", profile.commandMessageToBeSendList.pop());
	}

	if(config.extMsg){
		channel.sendText("", { ext: config.extMsg });
	}

	while(!_.isEmpty(profile.cachedUnsentMessage)){
		channel.sendMessage.apply(channel, profile.cachedUnsentMessage.pop());
	}
}

function _initSDK(){
	return new Promise(function(resolve, reject){
		channel.initConnection(function(info){
			// todo: discard this
			if(info){
				config.user.token = config.user.token || info.accessToken;
			}

			resolve();
		});
	});
}

function _init(){
	config = profile.config;

	channel.init();

	initSessionList();

	_initSession();
}

function _initSession(){
	Promise.all([
		apiHelper.getDutyStatus(),
		apiHelper.getGrayList(),
		apiHelper.getToken()
	]).then(function(result){
		var dutyStatus = result[0];
		var grayList = result[1];

		// 灰度列表
		profile.grayList = grayList;

		// 当配置为下班进会话时执行与上班相同的逻辑
		profile.isInOfficeHours = dutyStatus || config.offDutyType === "chat";

		if(profile.isInOfficeHours){
			Promise.all([
				_initOfficialAccount(),
				_initSDK()
			]).then(_onReady);

			// 获取在线坐席数
			apiHelper.getExSession().then(function(data){
				profile.hasHumanAgentOnline = data.onlineHumanAgentCount > 0;
				profile.hasRobotAgentOnline = data.onlineRobotAgentCount > 0;
			});

			profile.isAgentNicknameEnable = true;

			_initSystemEventListener();
			initAgentStatusPoller();
			initAgentNicknameUpdate();
			initGetGreetings();

			// 第二通道收消息初始化
			channel.initSecondChannle();
		}
		else{
			// 设置下班时间展示的页面
			// _setOffline();
		}
	}, function(err){
		if(
			err.error_description === "user not found"
			&& config.isUsernameFromCookie
		){
			_reCreateImUser();
		}
		else{
			throw err;
		}
	});
}
