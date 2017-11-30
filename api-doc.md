# easemob-kefu-webim sdk API 说明

## 初始化

```js
/**
 * sdk 初始化
 * @param {Object} 必填 option - 初始化选项
 * @param {String} 必填 option.tenantId - 租户 ID
 * @param {String} 可选 option.channel - 关联信息 "orgName#appName_imServiceName"，默认获取关联列表中的第一项
 * @param {String} 可选 option.apiServer - apiServer 地址。默认值 "kefu.easemob.com"。
 * @param {String} 可选 option.restServer - restServer 地址。默认自动获取。
 * @param {String} 可选 option.xmppServer - xmppServer 地址。默认自动获取。
 * @param {String} 可选 option.agentUsername - 指定接待客服名称，默认自动调度。
 * @param {String} 可选 option.skillGroup - 指定接待技能组名称，默认自动调度。
 * @param {String} 可选 option.visitorImUsername - 访客 IM 账号，默认自动创建新访客。
 * @retrun {kefuWebImHandler}
 */

KefuWebIM.init = function(option){};

/**
 * @typedef {Object} kefuWebImHandler
 * @property {function} onReady - 设置 onReady 回调
 * @property {function} onMessageReceived - 设置收消息回调
 * @property {function} onMessageReceived - 设置收到消息回调
 * @property {function} onCommandReceived - 设置收到命令回调
 * @property {function} onAgentUserChange - 设置坐席改变回调
 * @property {function} onAgentStatusChange - 设置坐席状态改变回调
 * @property {function} onError - 设置出错回调
 */
```

## 设置 onReady 回调

```js
/**
 * 设置 onReady 回调
 * @param {onReadCallback} onReadCallback - 回调函数
 * @retrun {kefuWebImHandler}
 */

kefuWebImHandler.onReady = function(onReadyCallback){};

/**
 * onReady 回调
 * @callback onReadCallback
 * @param {object} info - 当前连接
 * @param {string} info.visitorImUsername - 访客IM账号
 */
```

## 设置 onMessageReceived 回调

```js
/**
 * 设置 onMessageReceived 回调
 * @param {onMessageReceivedCallback} onMessageReceived - 回调函数
 * @retrun {kefuWebImHandler}
 */

kefuWebImHandler.onMessageReceived = function(onMessageReceivedCallback){};

/**
 * 收到消息回调
 * @callback onMessageReceivedCallback
 * @param {object} message - 收到的消息
 * @param {string} message.type - 消息类型
 * @param {string} message.id - 消息ID
 * @param {number} message.timestamp - 消息发送时间，与 Date.prototype.getTime() 的返回值定义相同
 * @param {boolean} message.isReceived - 消息收发方向，true 表示是坐席发送给访客的消息，false 表示是访客发给坐席的消息
 * @param {Object} message.ext - 消息扩展
 * @param {string|Object|Array} message.content - 消息内容
 */
```

## 设置 onCommandReceived 回调

```js
/**
 * 设置 onCommandReceived 回调
 * @param {onCommandReceivedCallback} onCommandReceived - 回调函数
 * @retrun {kefuWebImHandler}
 */

kefuWebImHandler.onCommandReceived = function(onCommandReceivedCallback){};

/**
 * 收到命令回调
 * @callback onCommandReceivedCallback
 * @param {Object} command - 收到的命令
 * @param {string} command.type - 坐席昵称
 * @param {Object} command.data - 坐席头像地址
 */
```

## 设置 onAgentUserChange 回调

```js
/**
 * 设置 onAgentUserChange 回调
 * @param {onAgentUserChangeCallback} onAgentUserChange - 回调函数
 * @retrun {kefuWebImHandler}
 */

kefuWebImHandler.onAgentUserChange = function(onAgentUserChangeCallback){};

/**
 * 坐席改变回调
 * @callback onAgentUserChangeCallback
 * @param {Object} agentInfo - 坐席信息
 * @param {string} agentInfo.nickname - 坐席昵称
 * @param {string} agentInfo.avatar - 坐席头像地址
 */
```

## 设置 onAgentStatusChange 回调

```js
/**
 * 设置 onAgentStatusChange 回调
 * @param {onAgentStatusChangeCallback} onAgentStatusChange - 回调函数
 * @retrun {kefuWebImHandler}
 */

kefuWebImHandler.onAgentStatusChange = function(onAgentStatusChangeCallback){};

/**
 * 坐席状态改变回调
 * @callback onAgentStatusChangeCallback
 * @param {string} status - 当前坐席状态信息
 */
```

## 设置 onError 回调

```js
/**
 * 设置 onError 回调
 * @param {onErrorCallback} onError - 回调函数
 * @retrun {kefuWebImHandler}
 */

kefuWebImHandler.onError = function(onErrorCallback){};

/**
 * 出错回调
 * @callback onErrorCallback
 * @param {Object} error - 出错信息，用于调试和排错
 */
```

## 完成初始化，获取 sessionHandler

```js
/**
 * 完成初始化，获取 sessionHandler
 * @retrun {sessionHandler}
 */

kefuWebImHandler.finish = function(){};

/**
 * @typedef {Object} sessionHandler
 * @property {function} sendMessage - 发送消息
 * @property {function} getHistoryMessage - 获取历史消息
 */
```

## 获取历史消息

```js
/**
 * 获取历史消息
 * @description  本接口可以多次调用获取，无需指定获取的位置，会自动从上次获取的前一条开始获取
 * @param {nubmer} [count=10] - 指定拉取历史消息的条数，最大20条，由于会过滤命令消息，所以实际取到的消息可能会少
 * @retrun {getHistoryMessagePromise} Promise 对象
 */

sessionHandler.getHistoryMessage = function(count){};

/**
 * @typedef {Promise} getHistoryMessagePromise
 * @property {onGetHistoryMessageComplete} then - 指定回调函数
 */

/**
 * onGetHistoryMessageComplete
 * @params {onGetHistoryMessageSuccessCallback} success - 获取历史消息成功回调
 * @params {onGetHistoryMessageFailCallback} [fail] - 获取历史消息失败回调
 */

/**
 * @callback onGetHistoryMessageSuccessCallback
 * @params {Object[]} MessageList - 按照消息时间的降序排列
 * @params {boolean} hasMoreMessage - 是否还有未获取的历史消息
 */
```

## 发送消息

```js
/**
 * 发送消息
 * @description 初始化就绪后消息才会发出，在此之前消息会被缓存并延后发送
 * @param {object} message - 要发送的消息
 * @param {string} message.type - 消息类型
 * @param {Object|Array|string} message.content - 消息内容
 * @retrun {sendMessagePromise} Promise 对象
 */

sessionHandler.sendMessage = function(message){};

/**
 * @typedef {Promise} sendMessagePromise
 * @property {onSendMessageComplete} then - 指定回调函数
 */

/**
 * onSendMessageComplete
 * @params {onSendMessageSuccessCallback} success - 获取历史消息成功回调
 * @params {onSendMessageFailCallback} [fail] - 获取历史消息失败回调
 */

/**
 * @callback onSendMessageSuccessCallback
 * @params {string} messageId - 消息ID
 */

/**
 * @callback onSendMessageFailCallback
 * @params {string} messageId - 消息ID
 */
```

## 功能调用

```js
/**
 * 功能调用
 * @param {string} featureName - 要调用的功能
 * @param {null|ticketData|EvaluateAgentData} [data] - 附加数据
 * @retrun {callFeaturePromise} Promise 对象
 */

sessionHandler.callFeature = function(featureName, data){};

/**
 * @typedef {Promise} callFeaturePromise
 * @property {onCallFeatureComplete} then - 指定回调函数
 */

/**
 * onCallFeatureComplete
 * @params {onCallFeatureSuccessCallback} success - 成功回调
 * @params {onCallFeatureFailCallback} [fail] - 失败回调
 */

/**
 * 留言（工单）数据
 * @typedef {Object} ticketData
 * @property {string} name - 用户名
 * @property {string} phone - 电话
 * @property {string} email - email
 * @property {string} content - 留言内容
 */

/**
 * 评价客服数据
 * @typedef {Object} EvaluateAgentData
 * @property {string} socre - 评分
 * @property {string} content - 评价内容
 * @property {string} [inviteId] - 坐席发送的邀请ID
 * @property {string} [sessionId] - 会话ID
 */
```


<br>

# 调用示例

```js
// sdk 初始化
var sessionHandler = KefuWebIM.init({
	tenantId: "11885",
	channel: "sipsoft#sandbox_112294",
	apiServer: "kefu.easemob.com",
	restServer: "a1.easemob.com",
	xmppServer: "im-api.easemob.com",
	agentUsername: "admin@easemob.com"
	skillGroup: "售前组",
	visitorImUsername: "webim-visitor-Q7K4WCYB64C72KGVJKP6",
})
// 设置事件监听
.onReady(function(info){
	// info.visitorImUsername: string 访客IM账号
	// info.enterpriseWelcome: string 企业欢迎语
	// info.skillGroupWelcome: string 技能组欢迎语
	// info.robotWelcome: string | object 机器人欢迎语
	// 机器人欢迎语有可能是文本或者菜单类型，后续可能还会扩展其他类型
})
.onMessageReceived(function(message){
	// string 消息类型
	var messageType = message.type;
	// number 消息发送时间，格式与 Date.prototype.getTime() 的返回值定义一致
	var messageTimestamp = message.timestamp;
	// boolean 消息收发方向，true 表示是坐席发送给访客的消息，false 表示是访客发给坐席的消息
	var isReceived = message.isReceived;
	// string 消息ID
	var messageId = message.id;
	// object 消息扩展字段
	var messageExt = message.ext;
	// object | string | Array 消息内容
	var messageContent = message.content;

	switch(messageType){
	case KefuWebIM.messageTypes.TEXT:
		// messageContent: string 文本消息内容
		break;
	case KefuWebIM.messageTypes.EMOJI:
		// 带有表情的文本消息
		// messageContent: Array<object: {
		// 	type: "text" | "emoji",
		// 	data: string
		// }>
		break;
	case KefuWebIM.messageTypes.IMAGE:
		// messageContent: {
		// 	url: string 图片地址
		// }
		break;
	case KefuWebIM.messageTypes.FILE:
		// messageContent: {
		// 	url: string 文件地址
		// 	filename: string 文件名
		// 	filesize: number 文件大小（字节）
		// }
		break;
	case KefuWebIM.messageTypes.ROBOT_MENU:
		// messageContent: {
		// 	title: string 菜单标题
		// 	itemList: Array<object: {
		// 		id: string ID
		// 		text: string 菜单项内容
		// 		type: "normal" | "transfer_to_manual"
		// 	}>
		// }
		break;
	case KefuWebIM.messageTypes.EVALUATE_AGENT_REQUEST:
		// messageContent: {
		// 	inviteId: string
		// 	sessionId: string
		// }
		break;
	default:
		throw new Error("unexpected message type.");
	}
})
.onCommandReceived(function(command){
	// command.type: 命令类型
	// command.data: 附加数据
})
.onAgentUserChange(function(agentInfo){
	// agentInfo.nickname: 坐席昵称
	// agentInfo.avatar: 坐席头像
})
.onAgentStatusChange(function(status){
	// status:
	// KefuWebIM.agentStatus.ONLINE: 在线
	// KefuWebIM.agentStatus.OFFLINE: 离线
	// KefuWebIM.agentStatus.BUSY: 忙碌
	// KefuWebIM.agentStatus.HIDDEN: 隐身
})
.onError(function(error){
	// 输出错误信息，方便调试和排错
	console.log(error);
})
// 结束初始化，返回sessionHandler
.finish();


// 获取历史消息
sessionHandler.getHistoryMessage(10)
.then(function (messageList, hasMoreMessage){
	var i;
	var l = message.length;
	for(i = 0; i < l; ++i){
		handleMessage(message[i]);
	}
}, function failCallback(error){
	// handle error
});


// 发送消息
sessionHandler.sendMessage({
	type: KefuWebIM.messageTypes.TEXT,
	content: "测试文本消息发送",
}, function successCallback(messageId){
	// 客服系统已收到该消息
}, function failCallback(messageId){
	// 消息发送失败
});

// 调用机器人菜单项
sessionHandler.callFeatures(KefuWebIM.features.CALL_ROBOT_MENU, {
	text: "如何退换货？",
	id: "cccc3722-0893-4ef9-9b36-d6c883f6afe2",
});

// 转人工
sessionHandler.callFeatures(KefuWebIM.features.TRANSFER_TO_MANUAL);

// 关闭当前会话
sessionHandler.callFeatures(KefuWebIM.features.CLOSE_CURRENT_SESSION);

// 创建留言
sessionHandler.callFeatures(KefuWebIM.features.CREATE_TICKET, {
	name: "张三",
	phone: "18600000000"
	email: "zhangsan@somedomain.com",
	content: "我的账户余额有异常，请帮忙查询。谢谢！",
}).then(function(){
	// success callback
}, function(){
	// fail callback
});

// 满意度评价
sessionHandler.callFeatures(KefuWebIM.features.EVALUATE_AGENT, {
	score: 5,				// 评分
	content: "还可以吧",		// 评论内容
	inviteId: "828b25f4-56eb-4d31-a222-535f8ec2c3c5",	// 可选
	serviceSessionId: "0833a909-d1fe-4d0e-b5fe-d743a402be3d",	// 可选
}).then(function(){
	// success callback
}, function(){
	// fail callback
});
```



