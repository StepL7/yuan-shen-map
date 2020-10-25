//@ts-check
/**
 * @typedef {Array} user_fileNames 用户存档名的列表,喜欢啥填啥，如['uid1','小号','各种号']
 * @typedef {Array} user_fileContents 存档对应的标记值，如[['1_1','26_1'],['1_2','26_2'],['27_1','27_12','27_13']]
 * @typedef {Array} user_fileIds 暂时不知道这是啥
 */

/** @type {Array.<string>} */
var user_fileNames = [];
/** @type {Array.<string>} */
var user_fileContents = [];
/** @type {Array.<string>} */
var user_fileIds = [];

/** @type {Array.<object>} */
var user_files = [];

/** @type {string} 用户 token 参数*/
var tokenPara;

/**跳转到登录 */
function jumpLogin() {
  window.open("/database/auth/auth/");
}
/**
 * 获取 token
 *
 * true : 写入 tokenPara
 *
 * false: 跳转登录 / 使用本地离线
 *
 * @returns {true | false}
 */
function getToken() {
  if (getCookie("gitee_Token") != "notfound") {
    tokenPara = getCookie("gitee_Token");
    getGistList();
    return true;
  } else {
    return false;
  }
}

/**
 * 根据地址 token 判定登录跳转
 *
 * true : 写入 cookie 并跳转
 *
 */
function Login() {
  if (window.location.search !== undefined && window.location.search !== "") {
    let tempTokenPara = GetQueryString("access_token");
    setCookie("gitee_Token", tempTokenPara, 1);
    //return window.location.href = "https://yuanshen.site";
  }
}
/**
 * tokenPara 正确 调用上传存档
 *
 * 不正确 跳转登录 / 本地存档
 * 
 * @param  {function} localSave
 */
function upLoadSaveData(localSave) {
  if (tokenPara !== undefined && tokenPara !== "") {
    var fileName = window.prompt("请输入存档名");
    if (fileName) {
      console.log(fileName);
      checkFile(fileName);
    }
  } else {
    if (window.confirm("使用云存档必须登录, 要立刻登录吗?")) {
      jumpLogin();
    } else {
      //调用本地存档
      localSave();
    }
  }
}

/**
 * 内部函数 禁止外调
 */
function GetQueryString(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");

  var r = window.location.search.substr(1).match(reg);

  if (r != null) return unescape(r[2]);
  return null;
}

//本地数据检测
// function getLocalStorageKey() {
//   if (localStorage.key(1) != null) {
//     var uid = window.prompt("检测到本地数据,请绑定原神UID");
//     if (uid != null && uid != "") {
// 	  user_fileNames.push(uid);
// 	  addNewFile();
//     } else {
//       var confirmDelete = window.confirm("绑定取消，删除本地数据？");
//       if (confirmDelete == true) {
//         var reConfirmDelete = window.confirm("真的要删除本地数据吗？");
//         if (reConfirmDelete == true) {
//           localStorage.clear();
//         }
//       } else {
//         console.log("用户取消删除操作");
//       }
//     }
//   } else {
//     alert("没有本地数据");
//   }
// }

/**
 * 云端获取文件列表
 *
 */
function getFileList() {
  var url = "/database/file/getFileList";
  //var url = "/giteegist/";
  var access_token = "";

  if (tokenPara !== null) {
    access_token = tokenPara;
  }
  var data = {
    access_token: access_token,
  };
  var success = function (res) {
    if (res.data === "login") {
      alert("未登录gitee账号或者登录已过期！");
    } else {
      console.log(res);
      user_fileNames = res.data.fileNames;
      user_fileContents = res.data.fileContents;
      user_fileIds = res.data.fileIds;
      alert("同步完成");
      console.log(user_fileNames);
      console.log(user_fileContents);
      console.log(user_fileIds);
    }
  };
  let err = function (msg) {
    alert(msg);
  };
  $.ajax({
    async: true,
    type: "POST",
    url: url,
    data: JSON.stringify(data),
    contentType: "application/json",
    success: success,
  });
}

/**
 * 日期转化
 *
 */
function formatDate(date) {
  var y = date.getFullYear()
  var m = date.getMonth() + 1
  m = m < 10 ? '0' + m : m
  var d = date.getDate()
  d = d < 10 ? '0' + d : d
  var h = date.getHours()
  h = h < 10 ? '0' + h : h
  var minute = date.getMinutes()
  minute = minute < 10 ? '0' + minute : minute
  var second = date.getSeconds()
  second = second < 10 ? '0' + second : second
  return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second
}

/**
 * giteeGist获取文件列表
 *
 */
function getGistList() {
  var access_token = "";
  if (tokenPara !== null) {
    access_token = tokenPara;
  }
  var url = "/giteegist/?access_token=" + access_token;
  var success = function (res) {
    user_files = [];
    console.log(res);
    for (let obj of res) {
      let currentKey = Object.keys(obj.files)[0];
      if (currentKey == "Data_KYJG") {
        var currentData = obj.files[Object.keys(obj.files)[0]].content;
        //console.log(currentData);
        var lastUpdateTime = formatDate(new Date(obj.updated_at));
        //console.log(formatDate(lastUpdateTime));
        var description = obj.description;
        //console.log(description);
        var id = obj.id;
        //console.log(id);
        var tempFile = {
          id: id,
          description: description,
          lastUpdateTime: lastUpdateTime,
          data: currentData
        }
        user_files.push(tempFile);
      }
    }
    console.log(user_files);
    window.frames[0].postMessage({
      message: "refreshGistList",
      files: user_files,
      userName: res[0].owner.name
    }, '*')
  };
  $.ajax({
    async: true,
    type: "GET",
    url: url,
    contentType: "application/json",
    success: success,
  });
}

/**
 *修改存档后同步保存本地设置 by giteeGist
 *
 *@param fileID {string} 当前需要上传的存档ID
 *
 * tips: 上传完成会调用 getGistList() 同步数据
 */
function updateLocalData(fileID) {
  var url = "/giteegist/" + fileID + "?access_token=" + tokenPara;
  var success = function (res) {
    console.log(res);
    var lastUpdateTime = formatDate(new Date(res.updated_at));
    localStorage.setItem("lastUpdateTime", lastUpdateTime);
    localStorage.setItem("lastUpdateID", fileID);
    alert("保存成功！");
    getGistList();
  };
  $.ajax({
    async: false,
    type: "GET",
    url: url,
    contentType: "application/json",
    success: success,
  });
}

/**
 *修改存档 by giteeGist
 *
 *@param fileID {string} 当前需要上传的存档ID
 *
 * tips: 上传完成会调用 getGistList() 同步数据
 */
function updateGistFile(fileID) {
  var markersData = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i); //获取本地存储的Key
    // @ts-ignore
    if (localStorage.getItem(key) == 1) markersData.push(key); //所有value
  }
  var success = function (res) {
    updateLocalData(fileID);
  };
  let err = function (msg) {
    console.log(msg);
  };
  var markersJsonData = {
    content: JSON.stringify(markersData)
  };
  console.log(JSON.stringify(markersJsonData));
  var url = "/giteegist/" + fileID;
  var fileName = "Data_KYJG";
  var data = '{"access_token": "' + tokenPara + '","files": {"' + fileName + '": ' + JSON.stringify(markersJsonData) + '}}';
  $.ajax({
    async: false,
    type: "PATCH",
    url: url,
    data: JSON.stringify(JSON.parse(data)),
    contentType: "application/json",
    success: success,
    error: err,
  });
}

/**
 *新建存档 by giteeGist
 *
 *@param sync {string} 当前上传的存档是否需要直接传入本地存档
 * 
 * tips: 新建完成会调用 getGistList() 同步数据
 */
function addGistFile(sync) {
  var markersData = [];
  if (sync == "false") {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i); //获取本地存储的Key
      // @ts-ignore
      if (localStorage.getItem(key) == 1) markersData.push(key); //所有value
    }
  }
  var markersJsonData = {
    content: JSON.stringify(markersData)
  };
  var description = window.prompt("请输入存档名");
  if (description) {
    var success = function (res) {
      alert("新建完成");
      getGistList();
    };
    var url = "/giteegist/";
    var fileName = "Data_KYJG";
    var data = '{"access_token": "' + tokenPara + '","description":"' + description + '","files": {"' + fileName + '": ' + JSON.stringify(markersJsonData) + '}}';
    console.log(JSON.stringify(JSON.parse(data)));
    $.ajax({
      async: false,
      type: "POST",
      url: url,
      data: JSON.stringify(JSON.parse(data)),
      contentType: "application/json",
      success: success,
    });
  }
}

/**
 *修改存档备注 by giteeGist
 *
 *@param fileID {string} 需要修改的存档ID
 *
 * tips: 修改完成会调用 getGistList() 同步数据
 */
function updateGistDescription(fileID) {
  var description = window.prompt("请输入存档名");
  if (description) {
    var success = function (res) {
      console.log(res);
      if (res.id == fileID) {
        let lastUpdateTime = formatDate(new Date(res.updated_at));
        localStorage.setItem("lastUpdateTime", lastUpdateTime);
      }
      alert("修改备注成功！");
      getGistList();
    };
    let err = function (msg) {
      console.log(msg);
    };
    var url = "/giteegist/" + fileID;
    var data = '{"access_token": "' + tokenPara + '","description":"' + description + '"}';
    $.ajax({
      async: false,
      type: "PATCH",
      url: url,
      data: JSON.stringify(JSON.parse(data)),
      contentType: "application/json",
      success: success,
      error: err,
    });
  }
}

/**
 *删除存档 by giteeGis
 *
 *@param fileID {string} 需要删除的存档ID
 *
 * tips: 删除完成会调用 getGistList() 同步数据
 * 删除会丢失之前的存档，如需要请加不可恢复提示
 */
function deleteGistFile(fileID) {
  var msg = "存档删除后不可恢复，您确定要删除这个存档吗？";
  if (confirm(msg) == true) {
    var success = function (res) {
      console.log(res);
      alert("删除完成！");
      getGistList();
    };
    let err = function (msg) {
      console.log(msg);
    };
    var url = "/giteegist/" + fileID + "?access_token=" + tokenPara;
    $.ajax({
      async: false,
      type: "DELETE",
      url: url,
      contentType: "application/json",
      success: success,
      error: err,
    });
  }
}

/**
 *加载存档 by giteeGis
 *
 *@param fileID {string} 需要加载的存档ID
 *
 * tips: 删除完成会调用 getGistList() 同步数据
 * 导入会丢失现在存档，如需要请加备份提示
 * 
 */
function loadGistFile(fileID, fileLastUpdateTime) {
  for (let file of user_files) {
    if (file.id == fileID) {
      localStorage.clear();
      // @ts-ignore
      var markerLogArr = eval(file.data);
      for (var i = 0; i < markerLogArr.length; i++) {
        localStorage.setItem(markerLogArr[i], "1");
      }
      localStorage.setItem("lastUpdateTime", fileLastUpdateTime);
      localStorage.setItem("lastUpdateID", fileID);
      alert("导入该存档成功!");
      getGistList();
    }
  }
}

/**
 *判断存档是修改还是新增
 *
 *@param fileName {string} 当前需要上传的存档名
 *
 * tips: 上传完成会调用 getFileList() 同步数据
 */
function checkFile(fileName) {
  let isUpdate = false;
  let fileIndex = 0;
  for (let name of user_fileNames) {
    console.log(name)
    if (name == fileName) {
      var fileID = user_fileIds[fileIndex];
      isUpdate = true;
      break;
    }
    fileIndex++;
  }
  if (isUpdate) {
    updateFile(fileName, fileID);
  } else {
    addNewFile(fileName);
  }
}

/**
 *上传存档
 *
 *@param fileName {string} 当前需要上传的存档名
 *
 * tips: 上传完成会调用 getFileList() 同步数据
 */
function addNewFile(fileName) {
  var markersData = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i); //获取本地存储的Key
    // @ts-ignore
    if (localStorage.getItem(key) == 1) markersData.push(key); //所有value
  }
  var success = function (res) {
    if (res === "login") {
      alert("未登录gitee账号或者登录已过期！");
    } else {
      // if (user_fileNames.length == 0) {
      //   uid = window.prompt("请输入第一个原神UID");
      //   if (uid != null && uid != "") {
      //     user_fileNames.push(uid);
      //   }
      // } else {
      //   uid = window.prompt("增加一个原神UID");
      //   if (uid != null && uid != "") {
      //     user_fileNames.push(uid);
      //   }
      // }
      //把存档的值存储(请根据实际情况修改这部分)
      alert("上传完成");
      getFileList();
    }
  };
  let err = function (msg) {
    alert(msg);
  };
  var url = "/database/file/addNewFile";
  var data = {
    access_token: tokenPara,
    fileName: fileName,
    fileContent: markersData,
  };
  $.ajax({
    async: false,
    type: "POST",
    url: url,
    data: JSON.stringify(data),
    contentType: "application/json",
    success: success,
  });
}

/**
 *修改存档
 *@param fileName {string} 当前需要修改的存档名
 *@param fileID {string} 当前需要修改的存档ID
 *修改会丢失之前的存档，如需要请加备份提示
 */
function updateFile(fileName, fileID) {
  var markersData = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i); //获取本地存储的Key
    // @ts-ignore
    if (localStorage.getItem(key) == 1) markersData.push(key); //所有value
  }
  var success = function (res) {
    if (res === "login") {
      alert("未登录gitee账号或者登录已过期！");
    } else {
      console.log(res);
      alert("保存成功！");
      getFileList();
    }
  };
  let err = function (msg) {
    console.log(msg);
  };
  var markersJsonData = {
    content: JSON.stringify(markersData)
  };
  console.log(JSON.stringify(markersJsonData));
  var url = "/giteegist/" + fileID;
  var data = '{"access_token": "' + tokenPara + '","files": {"' + fileName + '": ' + JSON.stringify(markersJsonData) + '}}';
  $.ajax({
    async: false,
    type: "PATCH",
    url: url,
    data: JSON.stringify(JSON.parse(data)),
    contentType: "application/json",
    success: success,
    error: err,
  });

}

/*
	导入存档
	不需要调后台，因为查过了，number传入当前需要导入的存档在数组中的序号
	导入会丢失现在存档，如需要请加备份提示
*/
function loadFile(number) {
  localStorage.clear();
  // @ts-ignore
  var markerLogArr = user_fileContents(number);
  for (var i = 0; i < markerLogArr.length; i++) {
    localStorage.setItem(markerLogArr[i], "1");
  }
  alert("导入该存档成功!");
}

/*
  删除存档，number传入当前需要导入的存档在数组中的序号
  <注意：这个是调接口的删除，未上传的存档删除直接从数组中delete就行>
*/
function deleteFile(number) {
  var markersData = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i); //获取本地存储的Key
    // @ts-ignore
    if (localStorage.getItem(key) == 1) markersData.push(key); //所有value
  }
  var url = "/database/file/deleteFile";
  var data = {
    access_token: tokenPara,
    fileId: user_fileIds[number],
  };
  var success = function (res) {
    if (res === "login") {
      alert("未登录gitee账号或者登录已过期！");
    } else {
      //把存档的值删除(请根据实际情况修改这部分)
      user_fileNames.splice(number, 1);
      user_fileContents.splice(number, 1);
      user_fileIds.splice(number, 1);
    }
  };
  let err = function (msg) {
    alert(msg);
  };
  $.ajax({
    async: false,
    type: "POST",
    url: url,
    data: JSON.stringify(data),
    contentType: "application/json",
    success: success,
  });
}

/**
 * 添加issue
 * @param issueName {string} 提交的issue标题，可以为资源名，如蒙德宝箱164
 * @param issueContent {string | string[]}issue的具体内容
 * @param issueLabels {string | string[]} issue的标签逗号隔开 如 "宝箱,错点"
 */
function createIssue(issueName, issueContent, issueLabels) {
  var url = "/database/file/createIssue";
  var data = {
    access_token: tokenPara,
    issueName: issueName,
    issueContent: issueContent,
    issueLabels: issueLabels,
  };
  var success = function (res) {
    if (res === "login") {
      alert("未登录gitee账号或者登录已过期！");
    } else {
      alert("提交成功！");
    }
  };
  let err = function (msg) {
    alert(msg);
  };
  $.ajax({
    async: false,
    type: "POST",
    url: url,
    data: JSON.stringify(data),
    contentType: "application/json",
    success: success,
  });
}

/*
	上传base64文件：未测试
*/
function uploadBase64(filePath, fileName, imgBase64) {
  var url = "/database/upload/uploadBase64";
  var data = {
    filePath: filePath,
    fileName: fileName,
    imgBase64: imgBase64,
  };
  var success = function (res) {
    alert("操作完成!");
  };
  let err = function (msg) {
    alert(msg);
  };
  $.ajax({
    async: false,
    type: "POST",
    url: url,
    data: JSON.stringify(data),
    contentType: "application/json",
    success: success,
  });
}