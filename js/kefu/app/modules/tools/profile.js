var Dict = require("./Dict");

var EMPTY_FUNCTION = function(){};

var profile = {
	config: {},
	ctaEnable: false,
	systemAgentAvatar: null,
	isChatWindowOpen: null,
	isAgentNicknameEnable: null,
	isMessageChannelReady: false,
	currentBrowsingURL: null,
	isInOfficeHours: false,
	// 用来缓存图片的file对象，用于全屏查看图片
	imgFileList: new Dict(),
	hasHumanAgentOnline: false,
	hasRobotAgentOnline: false,
	officialAccountList: [],
	commandMessageToBeSendList: [],
	tenantAvatar: null,
	defaultAvatar: null,
	currentOfficialAccount: {},
	systemOfficialAccount: {},
	sdkCallbacks: {
		onReady: EMPTY_FUNCTION,
		onMessageReceived: EMPTY_FUNCTION,
		onCommandReceived: EMPTY_FUNCTION,
		onAgentStatusChange: EMPTY_FUNCTION,
		onError: EMPTY_FUNCTION,
	},
	cachedUnsentMessage: [],
	menuList: new Dict(),
};

module.exports = profile;
