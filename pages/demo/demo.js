var strophe = require('../../utils/strophe.js');
var WebIM = require('../../utils/WebIM.js');
var WebIM = WebIM.default;

var textMessage;
var menuId;

Page({
    data: {},
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
    },
    createTicket: function () {
      console.log("create ticket.");
    },
    transferToManual: function () {
      console.log("transfer to manual.");
    },
    sendTextMessage: function () {
      console.log("send text message: ", textMessage);
    },
    callMenu: function () {
      console.log("call menu: ", menuId);
    },
});
