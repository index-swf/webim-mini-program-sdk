var KefuWebIM = require('../../js/kefu/app/modules/sdk-api.js');

var textMessage;
var menuId;
var scoreMessage;
var contentMessage;

var sessionHandler;

Page({
  data: {
    show:false,
    text:"去评价"
  },
  bindInputTextMessage: function (e) {
    textMessage = e.detail.value;
  },
  bindInputMenuId: function (e) {
    menuId = e.detail.value;
  },
  onLoad: function () {
    console.log("demo page loaded.");
  },
  initSdk: function () {
    console.log("init sdk.");

    if (sessionHandler) {
      throw new Error("kefu-webim-sdk has been already initialized.");
    }

    sessionHandler = KefuWebIM.init({
      // 初始化配置
      tenantId: "22961",
      // imUsername: "webim-visitor-X27E2MY3B3XG3YKBXG3W",
      // imPassword: "B9HE7CJFH8",
    }, {
        // 指定callback
        onMessageReceived: function (message) {
          var type = message.type;
          var content = message.content;

          switch (type) {
            case KefuWebIM.sdkConst.MESSAGE_TYPE.TEXT:
              // 文本消息
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.EMOJI:
              // 带表情的文本消息
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.IMAGE:
              // 图片消息
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.FILE:
              // 文件消息
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.MENU:
              // 菜单消息
              console.log(content.menuList.map(function (item) {
                return "menuId: " + item.id;
              }).join("\n"));
              // 用户点击菜单后需要调用 sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.CALL_ROBOT_MENU, menuItemId) 来提调用菜单
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.ARTICLE:
              // 图文消息
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.WAIT_TIMEOUT:
              // 待接入超时提醒消息，未设置的没有此种类型
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.EVALUATE_REQUEST:
              // 收到评价客服坐席邀请
              // 需要在用户评价完成后调用 sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.EVALUATE_AGENT, option) 来提交评价数据
              console.log("inviteId: ", content.inviteId, "sessionId: ", content.sessionId);
              // 这个代码仅作演示，实际使用时需要收集完用户评价后再调用
              sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.EVALUATE_AGENT, {
                inviteId: content.inviteId,
                sessionId: content.sessionId,
                content: "非常满意",
                // 五星好评
                level: 5,
              }).then(function () {
                console.log("success")
              }, function (error) {
                console.log("fail", error)
              });
              break;
            case KefuWebIM.sdkConst.MESSAGE_TYPE.TEXT_EXT:
              // 带扩展的文本消息，这个类型仅在发送时处理，接收时当作普通文本消息处理即可
              break;
            default:
              throw new Error("unknown message type");
          }
          console.log("message received: ", message);
        },
        onCommandReceived: function (command, data) {
          switch (command) {
            case KefuWebIM.sdkConst.COMMAND_MESSAGE.SESSION_CREATED:
              // 会话创建
              break;
            case KefuWebIM.sdkConst.COMMAND_MESSAGE.SESSION_OPENED:
              // 会话接起
              break;
            case KefuWebIM.sdkConst.COMMAND_MESSAGE.SESSION_TRANSFERED:
              // 会话已转接
              break;
            case KefuWebIM.sdkConst.COMMAND_MESSAGE.SESSION_TRANSFERING:
              // 会话转接中
              break;
            case KefuWebIM.sdkConst.COMMAND_MESSAGE.SESSION_CLOSED:
              // 会话已结束
              break;
            case KefuWebIM.sdkConst.COMMAND_MESSAGE.MESSAGE_RECALLED:
              // 消息撤回，需要把这条消息从UI上移除
              console.log("recalledMessageId: ", data.messageId);
              break;
            default:
              throw new Error("unknown command message.");
          }

          console.log("command received: ", command, data);
        },
        onError: function(){
          console.error("failed to init sdk.", err);
        },
        onReady: function(info){
          console.log("sdk initialized.");
          console.log("im username: ", info.visitorImUsername);
        },
      });
  },
  createTicket: function () {
    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    }

    sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.CREATE_TICKET, {
      name: "张三",
      mail: "zhangsan@easemob.com",
      phone: "18612345678",
      content: "我的订单号 12345678 需要退款。",
    }).then(function () {
      console.log("the ticket was created successfully.");
    }, function () {
      console.error("the ticket failed to submit.");
    });
  },
  transferToManual: function () {
    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    }

    sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.TRANSFER_TO_MANUAL);
  },
  sendImage: function() {
    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    }

    sessionHandler.sendMessage({ type: KefuWebIM.sdkConst.MESSAGE_TYPE.IMAGE }).then(function (fileInfo) {
      console.log("the image message was sent successfully.", fileInfo);
    }, function (error) {
      console.error("the message failed to send.", error);
    });
  },
  sendTextMessage: function () {
    var message;

    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    }

    message = {
      type: KefuWebIM.sdkConst.MESSAGE_TYPE.TEXT,
      content: textMessage,
    };

    sessionHandler.sendMessage(message).then(function (messageId) {
      console.log("the text message was sent successfully.", messageId);
    }, function (error) {
      console.error("the message failed to send.", error);
    });
  },
  callMenu: function () {
    if (!menuId) {
      throw new Error("invalid menuId: ", menuId);
    }

    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    }
    sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.CALL_ROBOT_MENU, menuId);
  },
  getHistoryMessage: function(){
    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    }

    sessionHandler.getHistoryMessage(10).then(function(messageList){
      console.log(messageList);
    }, function(error){
      console.log("no more history message.");
    });
  },
  callEvaluate: function () {
    this.setData({
      show: !this.data.show
    })
    if (this.data.show){
      this.setData({
        text: "收起"
      })
    }else{
      this.setData({
        text: "去评价"
      })
    }
  },
  bindInputScoreMessage: function (e) {
    scoreMessage = e.detail.value;
  },
  bindInputContentMessage: function (e) {
    contentMessage = e.detail.value;
  },
  doEvaluate: function () {
    if (!sessionHandler) {
      throw new Error("kefu-webim-sdk must be initialized first.");
    };
    sessionHandler.callFeature(KefuWebIM.sdkConst.FEATURE.EVALUATE_AGENT, {
      level: scoreMessage,				// 评分
      content: contentMessage,		// 评论内容
      // inviteId: "828b25f4-56eb-4d31-a222-535f8ec2c3c5",	// 可选
      // sessionId: "0833a909-d1fe-4d0e-b5fe-d743a402be3d",	// 可选
    }).then(function (res) {
      console.log("the evaluate was created successfully.",res)
    }, function (error) {
      console.log("the evaluate was failed to send.",error)
    });
  }
});
