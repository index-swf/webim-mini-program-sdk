var Dict = require("./Dict");

var callbackList = new Dict();
var TIMEOUT_INTERVAL = 5000;

module.exports = {
  add: add,
  remove: remove,
}

function add(id, callbacks, timeout){
  callbackList.set(id, callbacks);
  setTimeout(function(){
    var callback = callbackList.get(id);

    callback
      && typeof callback.failure === "function"
      && callback.failure(new Error("ack timeout."))

    callbackList.remove(id);
  }, timeout || TIMEOUT_INTERVAL);
}

function remove(id){
  var callback = callbackList.get(id);

  callback
    && typeof callback.success === "function"
    && callback.success(id)

  callbackList.remove(id);
}
