(function (PLUGIN_ID) {
  "use strict";
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  let locationAddress = null;
  // 取得外掛後台設定值
  const punchUserFieldCode = config.punchUser;
  const punchDateFieldCode = config.punchDate;
  const punchinTimeFieldCode = config.punchInTime;
  const punchOutTimeFieldCode = config.punchOutTime;
  const punchinLocationFieldCode = config.punchInLocation;
  const punchOutLocationFieldCode = config.punchOutLocation;
  const client = new KintoneRestAPIClient();
  let timeout = 10 * 1000; // ms
  const interval = 100; // ms
  kintone.events.on("mobile.app.record.index.show", function (event) {
    const loginUserCode = kintone.getLoginUser().code;
    if (String(event.viewId) !== config.listID) {
      return event;
    }
    // 設定打卡畫面
    setHtmlStructure();
    // 載入 API key
    function load(src) {
      const head = document.getElementsByTagName("head")[0];
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = src;
      head.appendChild(script);
    }
    // 等Google 參考載入
    function waitLoaded() {
      setTimeout(function () {
        timeout -= interval;
        if (
          typeof google !== "undefined" &&
          typeof google.maps !== "undefined" &&
          typeof google.maps.version !== "undefined"
        ) {
          setLocationAddress(); // 顯示地圖至畫面
        } else if (timeout > 0) {
          waitLoaded();
        } else {
          // abort
        }
      }, interval);
    }
    // 導入Google Map API
    load(`https://maps.googleapis.com/maps/api/js?key=${config.GoogleToken}`);
    waitLoaded();
    // 取的畫面元素
    const btnPunchIn = document.getElementById("punchIn"); // 上班按鈕
    const btnPunchOut = document.getElementById("punchOut"); // 下班按鈕
    const showDateSpace = document.getElementById("date"); // 顯示日期位置
    const showTimeSpace = document.getElementById("time"); // 顯示時間位置
    // 回傳星期幾
    function getDayInWeek() {
      const day = moment(new Date()).day();
      switch (day) {
        case 1:
          return "一";
        case 2:
          return "二";
        case 3:
          return "三";
        case 4:
          return "四";
        case 5:
          return "五";
        case 6:
          return "六";
        case 0:
          return "日";
      }
    }
    // 設定顯示時間、日期
    function setTime() {
      showDateSpace.innerText = `${moment().format(
        "YYYY/MM/DD"
      )} (${getDayInWeek()})`;
      showTimeSpace.innerText = moment().format("HH:mm:ss");
    }
    setInterval(setTime, 1000);

    // 定位並顯示至google map上
    function setLocationAddress() {
      // Google Map 顯示
      const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 0,
        streetViewControl: true,
      });

      const geocoder = new google.maps.Geocoder();
      if (navigator.geolocation) {
        // 定位取得經緯度
        navigator.geolocation.getCurrentPosition((position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          // google.maps.LatLng 物件(經緯度)
          const coord = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );

          // 傳入 latLng 資訊至 geocoder.geocode
          geocoder.geocode({ latLng: coord }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              // 如果有資料就會回傳
              if (results) {
                console.log(results[0]);
                const marker = new google.maps.Marker({
                  position: pos,
                  title: String(results[0].formatted_address),
                  draggable: true,
                });
                locationAddress = results[0].formatted_address;
                const popupContent = new google.maps.InfoWindow();
                google.maps.event.addListener(
                  marker,
                  "click",
                  (function () {
                    return function () {
                      popupContent.setContent(results[0].formatted_address);
                      popupContent.open(map, marker);
                    };
                  })(marker)
                );
                marker.setMap(map);
                map.setCenter(pos);
                map.setZoom(16);
                google.maps.event.trigger(marker, "click", {}); // 啟動後自動顯示當前地址(popupContent)
              }
            }
            // 經緯度資訊錯誤
            else {
              alert("Reverse Geocoding failed because: " + status);
            }
          });
        });
      }
    }

    // 打卡按鈕(上班)
    btnPunchIn.onclick = () => {
      // 查看是否已經打過上班卡
      client.record
        .getAllRecords({
          app: kintone.mobile.app.getId(),
          condition: `${punchUserFieldCode} in("${loginUserCode}") and ${punchDateFieldCode} =TODAY()`,
        })
        // 刷地圖、更新當前所在位置
        .then((resp) => {
          setLocationAddress();
          return resp;
        })
        .then((resp) => {
          if (resp.length !== 0) {
            throw new Error("今日已打過上班卡");
          }
          const params = {
            app: kintone.mobile.app.getId(),
            record: {
              [punchUserFieldCode]: {
                value: [
                  {
                    code: loginUserCode,
                  },
                ],
              },
              [punchDateFieldCode]: {
                value: moment().format("YYYY-MM-DD"),
              },
              [punchinTimeFieldCode]: {
                value: moment().format("HH:mm"),
              },
              [punchinLocationFieldCode]: {
                value: locationAddress,
              },
            },
          };
          client.record.addRecord(params);
        })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "成功完成打卡",
            showConfirmButton: false,
            timer: 2000,
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: "warning",
            title: error.message,
          });
          console.error(error.message);
        });
    };

    // 打卡按鈕(下班)
    btnPunchOut.onclick = () => {
      // 查看是否已經打過下班卡
      client.record
        .getAllRecords({
          app: kintone.mobile.app.getId(),
          condition: `${punchUserFieldCode} in("${loginUserCode}") and ${punchDateFieldCode} =TODAY()`,
        })
        // 刷地圖、更新當前所在位置
        .then((resp) => {
          setLocationAddress();
          return resp;
        })
        .then((resp) => {
          if (resp.length === 0) {
            throw new Error("今日未打上班卡");
          } else if (resp[0][punchOutTimeFieldCode].value) {
            throw new Error("今日已打過下班卡");
          }
          const params = {
            app: kintone.mobile.app.getId(),
            id: resp[0].$id.value,
            record: {
              [punchOutTimeFieldCode]: {
                value: moment().format("HH:mm"),
              },
              [punchOutLocationFieldCode]: {
                value: locationAddress,
              },
            },
          };
          client.record.updateRecord(params);
        })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "成功完成打卡",
            showConfirmButton: false,
            timer: 2000,
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: "warning",
            title: error.message,
          });
          console.error(error.message);
        });
    };
    return event;
  });
})(kintone.$PLUGIN_ID);
