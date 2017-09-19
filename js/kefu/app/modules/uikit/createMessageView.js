var _const = require("../../../common/const");
var eventListener = require("../tools/eventListener");
var apiHelper = require("../apiHelper");
var channel = require("../channel");

module.exports = function(opt){
	var officialAccount = opt.officialAccount;

	var currHistoryMsgSeqId = 0;
	var noMoreHistoryMessage;

	eventListener.add(_const.SYSTEM_EVENT.OFFICIAL_ACCOUNT_LIST_GOT, function(){
		var id = officialAccount.official_account_id;

		apiHelper.getLastSession(id).then(function(entity){
			officialAccount.agentId = entity.agent_id;
			officialAccount.sessionId = entity.session_id;
			officialAccount.sessionState = entity.state;
			officialAccount.agentType = entity.agent_type;
			officialAccount.skillGroupId = entity.skill_group_id;
			officialAccount.isSessionOpen = (
				entity.state === _const.SESSION_STATE.PROCESSING
				|| entity.state === _const.SESSION_STATE.WAIT
			);

			eventListener.excuteCallbacks(_const.SYSTEM_EVENT.SESSION_RESTORED, [officialAccount]);
		}, function(err){
			if(err === _const.ERROR_MSG.SESSION_DOES_NOT_EXIST){
				eventListener.excuteCallbacks(_const.SYSTEM_EVENT.SESSION_NOT_CREATED, [officialAccount]);
			}
			else{
				throw err;
			}
		});
	});

	return {
		getHistory: _getHistory,
	};

	function _getHistory(callback){
		if(noMoreHistoryMessage) return;
		apiHelper.getOfficalAccountMessage(
			officialAccount.official_account_id,
			currHistoryMsgSeqId
		).then(function(msgList){
			var length = msgList.length;
			var earliestMsg = msgList[length - 1] || {};
			var nextMsgSeq = earliestMsg.id;

			currHistoryMsgSeqId = nextMsgSeq;
			noMoreHistoryMessage = length < _const.GET_HISTORY_MESSAGE_COUNT_EACH_TIME || nextMsgSeq <= 0;
			_.each(msgList, channel.handleHistoryMsg);
			typeof callback === "function" && callback();
		});
	}


};
