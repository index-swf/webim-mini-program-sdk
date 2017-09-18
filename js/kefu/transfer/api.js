var emajax = require("../common/ajax");

function emitAjax(options){
  var msg = options.msg;
	var headers = null;
  var data = options.excludeData ? null : msg.params;
  var success = msg.success;
  var error = msg.error;
  var url = options.url;

	if(data && data.headers){
		headers = data.headers;
		delete data.headers;
	}

	emajax({
		url: url,
		headers: headers,
		data: data,
		"type": options.type,
		isFileUpload: options.isFileUpload,
		success: success,
		error: error,
	});
}

function api(apiName, data, success, error){
	var params = data || {};
	var tenantId = params.tenantId;
	var techChannelInfo = params.orgName
		+ "%23" + params.appName
		+ "%23" + params.imServiceNumber;
	var url;
  var msg = {
    params: params,
    success: success,
    error: error,
  };

	switch(apiName){
	case "getRelevanceList":
		emitAjax({
			url: "/v1/webimplugin/targetChannels",
			type: "GET",
			msg: msg
		});
		break;
	case "getWechatVisitor":
		emitAjax({
			url: "/v1/webimplugin/visitors/wechat/" + params.openid
				+ "?tenantId=" + tenantId,
			msg: msg,
			type: "POST"
		});
		break;
	case "createVisitor":
		emitAjax({
			url: "/v1/webimplugin/visitors?tenantId=" + tenantId,
			msg: msg,
			type: "POST"
		});
		break;
	case "getPassword":
		emitAjax({
			url: "/v1/webimplugin/visitors/password",
			type: "GET",
			msg: msg
		});
		break;
	case "getSlogan":
		emitAjax({
			url: "/v1/webimplugin/notice/options",
			type: "GET",
			msg: msg
		});
		break;
	case "getTheme":
		emitAjax({
			url: "/v1/webimplugin/theme/options",
			type: "GET",
			msg: msg
		});
		break;
	case "getSystemGreeting":
		emitAjax({
			url: "/v1/webimplugin/welcome",
			type: "GET",
			msg: msg
		});
		break;
	case "getProject":
		emitAjax({
			url: "/tenants/" + tenantId + "/projects",
			type: "GET",
			msg: msg
		});
		break;
	case "createTicket":
		emitAjax({
			url: "/tenants/" + tenantId
				+ "/projects/" + params.projectId
				+ "/tickets?tenantId=" + tenantId
				+ "&easemob-target-username=" + params["easemob-target-username"]
				+ "&easemob-appkey=" + params["easemob-appkey"]
				+ "&easemob-username=" + params["easemob-username"],
			msg: msg,
			type: "POST"
		});
		break;
	case "getNoteCategories":
		emitAjax({
			url: "/tenants/" + tenantId
				+ "/projects/" + params.projectId
				+ "/categories?tenantId=" + tenantId
				+ "&easemob-target-username=" + params["easemob-target-username"]
				+ "&easemob-appkey=" + params["easemob-appkey"]
				+ "&easemob-username=" + params["easemob-username"],
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "receiveMsgChannel":
		emitAjax({
			url: "/v1/imgateway/messages",
			type: "GET",
			msg: msg
		});
		break;
	case "sendMsgChannel":
		emitAjax({
			url: "/v1/imgateway/messages?tenantId=" + tenantId,
			msg: msg,
			type: "POST"
		});
		break;
	case "getAgentStatus":
		// 没有token时不发送请求
		if(!params.token){
			console.error("token does not exist.");
			return;
		}
		emitAjax({
			url: "/v1/tenants/" + tenantId
				+ "/agents/" + params.agentUserId + "/agentstate",
			type: "GET",
			msg: msg
		});
		break;
	case "getNickNameOption":
		emitAjax({
			url: "/v1/webimplugin/agentnicename/options?tenantId=" + tenantId,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
		// 此接口使用的是单独的微服务，无需限流
	case "reportEvent":
		emitAjax({
			url: "/v1/event_collector/events",
			msg: msg,
			type: "POST"
		});
		break;
	case "deleteEvent":
		emitAjax({
			url: "/v1/event_collector/event/" + encodeURIComponent(params.userId),
			msg: msg,
			type: "DELETE",
			excludeData: true
		});
		break;
	case "mediaStreamUpdateStatus":
		url = "/v1/rtcmedia/media_streams/" + params.streamId;
		delete params.streamId;

		emitAjax({
			url: url,
			msg: msg,
			type: "PUT"
		});
		break;
	case "getCurrentServiceSession":
		emitAjax({
			url: "/v1/webimplugin/tenant/"
				+ tenantId
				+ "/visitors/"
				+ params.id
				+ "/CurrentServiceSession?techChannelInfo=" + techChannelInfo
				+ "&tenantId="
				+ tenantId,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getWaitListNumber":
		emitAjax({
			url: "/v1/visitors/waitings/data",
			msg: msg,
			type: "GET"
		});
		break;
	case "getDutyStatus_2":
		emitAjax({
			url: "/v1/webimplugin/tenants/show-message",
			type: "GET",
			msg: msg
		});
		break;
	case "getRobertGreeting_2":
		emitAjax({
			url: "/v1/webimplugin/tenants/robots/welcome",
			type: "GET",
			msg: msg
		});
		break;
	case "getSkillgroupMenu":
		emitAjax({
			url: "/v1/webimplugin/tenants/" + tenantId + "/skillgroup-menu",
			type: "GET",
			msg: msg,
			excludeData: true
		});
		break;
	case "getAgentInputState":
		emitAjax({
			url: "/v1/webimplugin/sessions/" + params.serviceSessionId
			+ "/agent-input-state?tenantId=" + tenantId
			+ "&orgName=" + params.orgName + "&appName=" + params.appName
			+ "&userName=" + params.username + "&token=" + params.token,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "closeServiceSession":
		url = "/webimplugin/tenants/" + tenantId
			+ "/visitors/" + params.userName
			+ "/servicesessions/" + params.serviceSessionId
			+ "/stop?tenantId=" + tenantId;
		delete params.serviceSessionId;
		emitAjax({
			url: url,
			msg: msg,
			type: "POST"
		});
		break;
	case "uploadImgMsgChannel":
		emitAjax({
			url: "/v1/Tenant/" + tenantId
				+ "/" + params.orgName + "/" + params.appName
				+ "/" + params.userName + "/MediaFiles",
			msg: msg,
			isFileUpload: true,
			type: "POST"
		});
		break;
	case "getVisitorInfo":
		emitAjax({
			url: "/v1/webimplugin/tenants/" + tenantId
				+ "/visitors?orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token
				+ "&techChannelInfo=" + techChannelInfo,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getOfficalAccounts":
		emitAjax({
			url: "/v1/webimplugin/tenants/" + tenantId
				+ "/visitors/" + params.visitorId
				+ "/official-accounts?page=0&size=100"
				+ "&orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getOfficalAccountMessage":
		emitAjax({
			url: "/v1/webimplugin/tenants/" + tenantId
				+ "/visitors/" + params.visitorId
				+ "/official-accounts/" + params.officialAccountId
				+ "/messages"
				+ "?size=" + params.size
				// 当startId为空时不传
				+ (params.startId ? "&startId=" + params.startId : "")
				+ "&direction=" + params.direction
				+ "&orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getConfig":
		emitAjax({
			url: "/v1/webimplugin/settings/visitors/configs/" + params.configId,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	// 会话创建前 获取该会话  是否将于机器人进行
	case "getRobertIsOpen":
		emitAjax({
			url: "/v1/webimplugin/tenants/robot-ready",
			type: "GET",
			msg: msg
		});
		break;
	case "getExSession_2":
		emitAjax({
			url: "/v1/webimplugin/visitors/" + params.username
				+ "/schedule-data-ex2"
				+ "?techChannelInfo=" + techChannelInfo
				+ "&channelType=" + params.channelType
				+ "&originType=" + params.originType
				+ "&channelId=" + params.channelId
				+ "&queueName=" + params.queueName
				+ "&agentUsername=" + params.agentUsername
				+ "&tenantId=" + tenantId,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getLastSession":
		emitAjax({
			url: "/v1/webimplugin/tenants/" + tenantId
				+ "/visitors/" + params.visitorId
				+ "/official-accounts/" + params.officialAccountId
				+ "/latest-session"
				+ "?orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token
				+ "&techChannelInfo=" + techChannelInfo,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "reportVisitorAttributes":
		url = "/v1/webimplugin/tenants/" + tenantId
			+ "/sessions/" + params.sessionId
			+ "/attributes"
			+ "?orgName=" + params.orgName
			+ "&appName=" + params.appName
			+ "&userName=" + params.userName
			+ "&token=" + params.token
			+ "&techChannelInfo=" + techChannelInfo;

		delete params.tenantId;
		delete params.sessionId;

		delete params.orgName;
		delete params.appName;
		delete params.userName;
		delete params.token;
		delete params.imServiceNumber;

		emitAjax({
			url: url,
			msg: msg,
			type: "POST"
		});
		break;
	case "messagePredict_2":
		url = "/v1/webimplugin/servicesessions/" + params.sessionId
			+ "/messagePredict"
			+ "?orgName=" + params.orgName
			+ "&appName=" + params.appName
			+ "&userName=" + params.userName
			+ "&token=" + params.token
			+ "&techChannelInfo=" + techChannelInfo;

		delete params.sessionId;

		delete params.orgName;
		delete params.appName;
		delete params.userName;
		delete params.token;
		delete params.imServiceNumber;

		emitAjax({
			url: url,
			msg: msg,
			type: "POST"
		});
		break;
	case "reportMarketingTaskDelivered":
		url = "/v1/webimplugin/tenants/" + tenantId
			+ "/marketing-tasks/" + params.marketingTaskId
			+ "/delivered"
			+ "?orgName=" + params.orgName
			+ "&appName=" + params.appName
			+ "&userName=" + params.userName
			+ "&token=" + params.token;

		delete params.tenantId;
		delete params.marketingTaskId;

		delete params.orgName;
		delete params.appName;
		delete params.userName;
		delete params.token;

		emitAjax({
			url: url,
			msg: msg,
			type: "PUT"
		});
		break;
	case "reportMarketingTaskOpened":
		url = "/v1/webimplugin/tenants/" + tenantId
			+ "/marketing-tasks/" + params.marketingTaskId
			+ "/opened"
			+ "?orgName=" + params.orgName
			+ "&appName=" + params.appName
			+ "&userName=" + params.userName
			+ "&token=" + params.token;

		delete params.tenantId;
		delete params.marketingTaskId;

		delete params.orgName;
		delete params.appName;
		delete params.userName;
		delete params.token;

		emitAjax({
			url: url,
			msg: msg,
			type: "PUT"
		});
		break;
	case "reportMarketingTaskReplied":
		url = "/v1/webimplugin/tenants/" + tenantId
			+ "/marketing-tasks/" + params.marketingTaskId
			+ "/replied"
			+ "?orgName=" + params.orgName
			+ "&appName=" + params.appName
			+ "&userName=" + params.userName
			+ "&token=" + params.token;

		delete params.tenantId;
		delete params.marketingTaskId;

		delete params.orgName;
		delete params.appName;
		delete params.userName;
		delete params.token;

		emitAjax({
			url: url,
			msg: msg,
			type: "PUT"
		});
		break;
	case "getLatestMarketingTask":
		emitAjax({
			url: "/v1/webimplugin/tenants/" + tenantId
				+ "/official-accounts/" + params.officialAccountId
				+ "/marketing-tasks"
				+ "?orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getEvaluationDegrees":
		emitAjax({
			url: "/v1/webimplugin/tenants/"
				+ tenantId
				+ "/evaluationdegrees"
				+ "?orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "getAppraiseTags":
		emitAjax({
			url: "/v1/webimplugin/tenants/"
				+ tenantId
				+ "/evaluationdegrees/"
				+ params.evaluateId
				+ "/appraisetags"
				+ "?orgName=" + params.orgName
				+ "&appName=" + params.appName
				+ "&userName=" + params.userName
				+ "&token=" + params.token,
			msg: msg,
			type: "GET",
			excludeData: true
		});
		break;
	case "grayScale":
		emitAjax({
			url: "/v1/grayscale/tenants/" + tenantId,
			msg: msg,
			type: "GET",
			excludeData: true,
		});
		break;
	default:
		console.error("unexpect api name: " + apiName);
		break;
	}
}

module.exports = api;
