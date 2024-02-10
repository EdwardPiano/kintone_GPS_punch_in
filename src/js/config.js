(function (PLUGIN_ID) {
  "use strict";

  console.log("PLUGIN_ID ", PLUGIN_ID);
  const client = new KintoneRestAPIClient();

  // 獲取所有選項物件
  const punchUserElement = document.getElementById("userSelection"); // 打卡user
  const punchDateElement = document.getElementById("punchDate"); // 打卡日期
  const punchInTimeElement = document.getElementById("punch-in-time"); // 上班時間
  const punchInLocationElement = document.getElementById("punch-in-location"); // 上班位置
  const punchOutTimeElement = document.getElementById("punch-out-time"); // 下班時間
  const punchOutLocationElement = document.getElementById("punch-out-location"); // 下班位置
  const listIDElement = document.getElementById("listID"); // 一覽表ID
  const GoogleTokenElement = document.getElementById("GoogleToken"); // Google API使用權
  const saveBtn = document.getElementById("save");
  const cancelBtn = document.getElementById("cancel");

  // Escape HTML
  const escapeHtml = (htmlStr) => {
    return htmlStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // 設定上次保存的值
  const setDefault = () => {
    const conf = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (conf) {
      punchUserElement.value = conf.punchUser;
      punchDateElement.value = conf.punchDate;
      punchInTimeElement.value = conf.punchInTime;
      punchInLocationElement.value = conf.punchInLocation;
      punchOutTimeElement.value = conf.punchOutTime;
      punchOutLocationElement.value = conf.punchOutLocation;
      listIDElement.value = conf.listID !== undefined ? conf.listID : "";
      GoogleTokenElement.value =
        conf.GoogleToken !== undefined ? conf.GoogleToken : "";
    }
  };

  // 新增選項到表單的欄位中
  const setElementPotions = () => {
    const params = {
      app: kintone.app.getId(),
      preview: true,
    };
    return client.app
      .getFormFields(params)
      .then((resp) => {
        console.log(resp);
        for (const key of Object.keys(resp.properties)) {
          const prop = resp.properties[key];
          const punchUserOption = document.createElement("option"); // 打卡使用者(欄位選項)
          const punchDateOption = document.createElement("option"); // 打卡日期(欄位選項)
          const punchInTimeElementOption = document.createElement("option"); // 上班時間(欄位選項)
          const punchOutTimeElementOption = document.createElement("option"); // 下班時間(欄位選項)
          const punchInTextElementOption = document.createElement("option"); // 上班地點(欄位選項)
          const punchOutTextElementOption = document.createElement("option"); // 下班地點(欄位選項)
          switch (prop.type) {
            // 欄位類型為時間
            case "TIME":
              punchInTimeElementOption.setAttribute(
                "value",
                escapeHtml(prop.code)
              );
              punchInTimeElementOption.innerText = escapeHtml(prop.label);
              punchInTimeElement.appendChild(punchInTimeElementOption);

              punchOutTimeElementOption.setAttribute(
                "value",
                escapeHtml(prop.code)
              );
              punchOutTimeElementOption.innerText = escapeHtml(prop.label);
              punchOutTimeElement.appendChild(punchOutTimeElementOption);
              break;
            case "DATE":
              punchDateOption.setAttribute("value", escapeHtml(prop.code));
              punchDateOption.innerText = escapeHtml(prop.label);
              punchDateElement.appendChild(punchDateOption);
              break;
            // 欄位類型為文字
            case "SINGLE_LINE_TEXT":
              punchInTextElementOption.setAttribute(
                "value",
                escapeHtml(prop.code)
              );
              punchInTextElementOption.innerText = escapeHtml(prop.label);
              punchInLocationElement.appendChild(punchInTextElementOption);

              punchOutTextElementOption.setAttribute(
                "value",
                escapeHtml(prop.code)
              );
              punchOutTextElementOption.innerText = escapeHtml(prop.label);
              punchOutLocationElement.appendChild(punchOutTextElementOption);
              break;
            // 欄位類行為選擇使用者
            case "USER_SELECT":
              punchUserOption.setAttribute("value", escapeHtml(prop.code));
              punchUserOption.innerHTML = escapeHtml(prop.label);
              punchUserElement.appendChild(punchUserOption);
              break;
          }
        }
      })
      .catch((error) => {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "錯誤",
          text: error,
        });
      });
  };

  // 回上一頁
  cancelBtn.onclick = () => {
    history.back();
  };

  // 保存當前頁面的選擇
  saveBtn.onclick = () => {
    const config = {};
    if (
      !punchUserElement.value ||
      !punchDateElement.value ||
      !punchInTimeElement.value ||
      !punchInLocationElement.value ||
      !punchOutTimeElement.value ||
      !punchOutLocationElement.value ||
      !listIDElement.value ||
      !GoogleTokenElement.value
    ) {
      Swal.fire({
        icon: "error",
        title: "欄位值未完成",
        text: "請完成所有必填欄位",
      });
      return false;
    }
    config.punchUser = punchUserElement.value;
    config.punchDate = punchDateElement.value;
    config.punchInTime = punchInTimeElement.value;
    config.punchInLocation = punchInLocationElement.value;
    config.punchOutTime = punchOutTimeElement.value;
    config.punchOutLocation = punchOutLocationElement.value;
    config.listID = listIDElement.value;
    config.GoogleToken = GoogleTokenElement.value;
    kintone.plugin.app.setConfig(config);
    return true;
  };

  setElementPotions().then(() => {
    setDefault();
  });
})(kintone.$PLUGIN_ID);
