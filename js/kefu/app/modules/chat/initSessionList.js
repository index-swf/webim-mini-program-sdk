var _const = require("../../../common/const");
var eventListener = require("../tools/eventListener");
var createMessageView = require("../uikit/createMessageView");

module.exports = function(){

	eventListener.add(_const.SYSTEM_EVENT.NEW_OFFICIAL_ACCOUNT_FOUND, _newOfficialAccountFound);
};

function _newOfficialAccountFound(officialAccount){
	officialAccount.messageView = createMessageView({
		officialAccount: officialAccount,
	});
}
