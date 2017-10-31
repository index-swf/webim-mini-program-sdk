'use strict';

import Strophe from 'strophe.js'
import websdk from 'sdk/index'
import xmldom from 'xmldom/dom-parser'
import config from 'kefu/app/sdk/webim.config'
// import config from 'WebIMConfig'

console.group = console.group || {}
console.groupEnd = console.groupEnd || {}

var window = {}
let WebIM = window.WebIM = websdk;
window.WebIM.config = config;
var DOMParser = window.DOMParser = xmldom.DOMParser;
let document = window.document = new DOMParser().parseFromString("<?xml version='1.0'?>\n", 'text/xml');

if (WebIM.config.isDebug) {

    function ts() {
        var d = new Date();
        var Hours = d.getHours(); //获取当前小时数(0-23)
        var Minutes = d.getMinutes(); //获取当前分钟数(0-59)
        var Seconds = d.getSeconds(); //获取当前秒数(0-59)
        return (Hours < 10 ? "0" + Hours : Hours) + ':' + (Minutes < 10 ? "0" + Minutes : Minutes) + ':' + (Seconds < 10 ? "0" + Seconds : Seconds) + ' ';
    }

    Strophe.Strophe.log = function (level, msg) {
        // console.log(ts(), level, msg);
    };

    Strophe.Strophe.Connection.prototype.rawOutput = function (data) {
        try {
            console.group('%csend # ' + ts(), 'color: blue; font-size: large')
            console.log('%c' + data, 'color: blue');
            console.groupEnd();
        } catch (e) {
            console.log(e)
        }
    };
}

/**
 * Set autoSignIn as true (autoSignInName and autoSignInPwd are configured below),
 * You can auto signed in each time when you refresh the page in dev model.
 */
WebIM.config.autoSignIn = false;
if (WebIM.config.autoSignIn) {
    WebIM.config.autoSignInName = 'lwz2';
    WebIM.config.autoSignInPwd = '1';
}


// var stropheConn = new window.Strophe.Connection("ws://im-api.easemob.com/ws/", {
//                 inactivity: 30,
//                 maxRetries: 5,
//                 pollingTime: 4500
//             });
//
// stropheConn.connect(
//   '$t$' + 'YWMtmbQEBKKIEeaGmMtXyg5n1wAAAVlkQvGO2WOJGlMCEJKM4VV9GCMnb_XLCXU',
//   function() {
//     console.log(arguments, 'ggogogo');
//   }, stropheConn.wait, stropheConn.hold);
WebIM.parseEmoji = function (msg) {
    if (typeof WebIM.Emoji === 'undefined' || typeof WebIM.Emoji.map === 'undefined') {
        return msg;
    } else {
        var emoji = WebIM.Emoji,
            reg = null;
        var msgList = [];
        var objList = [];
        for (var face in emoji.map) {
            if (emoji.map.hasOwnProperty(face)) {
                while (msg.indexOf(face) > -1) {
                    msg = msg.replace(face, "^" + emoji.map[face] + "^");
                }
            }
        }
        var ary = msg.split('^')
        var reg = /^e.*g$/
        for (var i = 0; i < ary.length; i++) {
            if (ary[i] != '') {
                msgList.push(ary[i])
            }
        }
        for (var i = 0; i < msgList.length; i++) {
            if (reg.test(msgList[i])) {
                var obj = {}
                obj['data'] = msgList[i]
                obj['type'] = 'emoji'
                objList.push(obj)
            } else {
                var obj = {}
                obj['data'] = msgList[i]
                obj['type'] = 'txt'
                objList.push(obj)
            }
        }
        console.log(objList)
        return objList;
    }
}

WebIM.time = function () {
    var date = new Date()
    var Hours = date.getHours();
    var Minutes = date.getMinutes();
    var Seconds = date.getSeconds();
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' '
        + (Hours < 10 ? "0" + Hours : Hours) + ':' + (Minutes < 10 ? "0" + Minutes : Minutes) + ':' + (Seconds < 10 ? "0" + Seconds : Seconds)
    return time
}

// wx.connectSocket({url: WebIM.config.xmppURL, method: "GET"})

WebIM.conn = new WebIM.connection({
    isMultiLoginSessions: WebIM.config.isMultiLoginSessions,
    https: typeof WebIM.config.https === 'boolean' ? WebIM.config.https : location.protocol === 'https:',
    url: WebIM.config.xmppURL,
    apiUrl: WebIM.config.apiURL,
    isAutoLogin: false,
    heartBeatWait: WebIM.config.heartBeatWait,
    autoReconnectNumMax: WebIM.config.autoReconnectNumMax,
    autoReconnectInterval: WebIM.config.autoReconnectInterval
});


// async response
// WebIM.conn.listen({
//   onOpened: () => dispatch({type: Types.ON_OPEND})
// })

// export default WebIM;
module.exports = {
    'default': WebIM
}
