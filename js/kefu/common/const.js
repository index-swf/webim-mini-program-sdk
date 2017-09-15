module.exports = {

	SYSTEM_EVENT: {
		SESSION_CREATED: "ServiceSessionCreatedEvent",
		SESSION_OPENED: "ServiceSessionOpenedEvent",
		SESSION_CLOSED: "ServiceSessionClosedEvent",
		SESSION_TRANSFERED: "ServiceSessionTransferedEvent",
		SESSION_TRANSFERING: "ServiceSessionTransferedToAgentQueueEvent",

		SESSION_RESTORED: "session.restored",
		SESSION_NOT_CREATED: "session.not.created",

		AGENT_INFO_UPDATE: "agent.info.update",
		OFFICIAL_ACCOUNT_SWITCHED: "official.account.switched",
		NEW_OFFICIAL_ACCOUNT_FOUND: "new.official.account.found",
		SYSTEM_OFFICIAL_ACCOUNT_UPDATED: "system.official.account.updated",
		OFFICIAL_ACCOUNT_LIST_GOT: "official.account.list.got",

		MARKETING_MESSAGE_RECEIVED: "marketing.message.received",
		SATISFACTION_EVALUATION_MESSAGE_RECEIVED: "satisfaction.evaluation.message.received",
		MESSAGE_PROMPT: "message.prompt",

		CHAT_WINDOW_OPENED: "chat.window.opened",
		CHAT_WINDOW_CLOSED: "chat.window.closed",

		IM_CONNECTION_OPENED: "im.connection.opened",

		OFFLINE: "offline",

		MESSAGE_SENT: "message.sent",
		MESSAGE_APPENDED: "message.appended",
	},

	IM: {
		WEBIM_CONNCTION_OPEN_ERROR: 1,
		WEBIM_CONNCTION_AUTH_ERROR: 2,
		WEBIM_CONNCTION_AJAX_ERROR: 17,
		WEBIM_CONNCTION_CALLBACK_INNER_ERROR: 31
	},

	ERROR_MSG: {
		VISITOR_DOES_NOT_EXIST: "visitor does not exist.",
		SESSION_DOES_NOT_EXIST: "session does not exist.",
	},

	SESSION_STATE: {
		WAIT: "Wait",
		PROCESSING: "Processing",
		TERMINAL: "Terminal",
		ABORT: "Abort",
		RESOLVED: "Resolved",
		PREPARE: "Prepare"
	},

	AGENT_ROLE: {
		AGENT: 1,
		ROBOT: 6
	},

	// 上传文件大小限制
	UPLOAD_FILESIZE_LIMIT: 1024 * 1024 * 10,

	// 超时未收到 kefu-ack 启用第二通道发消息
	FIRST_CHANNEL_MESSAGE_TIMEOUT: 10000,

	// 发送图片时 超时未收到 kefu-ack 启用第二通道发消息
	FIRST_CHANNEL_IMG_MESSAGE_TIMEOUT: 15000,

	// 发送消息第二通道失败后，最多再试1次
	SECOND_MESSAGE_CHANNEL_MAX_RETRY_COUNT: 1,

	// 如果im连接超时后启用第二通道
	FIRST_CHANNEL_CONNECTION_TIMEOUT: 20000,

	// IM心跳时间间隔
	HEART_BEAT_INTERVAL: 60000,

	// 第二通道收消息轮询时间间隔
	SECOND_CHANNEL_MESSAGE_RECEIVE_INTERVAL: 60000,

	// 消息预知功能截断长度
	MESSAGE_PREDICT_MAX_LENGTH: 100,

	// 最大文本消息长度
	MAX_TEXT_MESSAGE_LENGTH: 1500,

	// 每次拉取历史消息条数
	GET_HISTORY_MESSAGE_COUNT_EACH_TIME: 10,

	// 轮询坐席输入状态间隔
	AGENT_INPUT_STATE_INTERVAL: 1000,

	// 消息时间戳最小间隔
	MESSAGE_TIME_SPAN_INTERVAL: 60000,

	for_block_only: null
};

