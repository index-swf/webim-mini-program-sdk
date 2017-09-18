

var EMPTYFN = function(){};
var DEFAULT_HEADER = {
  "Content-Type": "application/json",
};

module.exports = function(options){
	var dataType = options.dataType || "text";
	var success = options.success || EMPTYFN;
	var fail = options.error || EMPTYFN;
	var type = options.type || "GET";
	var data = options.data || {};
	var tempData = "";
  var header = options.headers || DEFAULT_HEADER;
	var isFileUpload = options.isFileUpload;
  var url = options.url;

  if(!~url.indexOf("https://")){
    url = "https://kefucross.easemob.com" + url;
  }

  if(type === "GET"){
    for (var o in data) {
      if (data.hasOwnProperty(o)) {
        tempData += o + "=" + data[o] + "&";
      }
    }
    // todo: use Array.prototype.join
    tempData = tempData ? tempData.slice(0, -1) : tempData;
    url += (url.indexOf("?") > 0 ? "&" : "?")
      + (tempData ? tempData + "&" : tempData)
      + "_v=" + new Date().getTime();
  }
	else if(isFileUpload){
    // todo: wx.fileUpload
		var fileForm = new FormData();
		fileForm.append("file", data.file);

		xhr.setRequestHeader("Authorization", data.auth);
	}
	else{
		data = JSON.stringify(data);
	}

  wx.request({
    url: url,
    header: header,
    data: data,
    method: type,
    success: success,
    fail: fail,
  });
};
