function setHtmlStructure() {
  const divTimeCard = document.getElementById("timeCard");
  divTimeCard.innerHTML = `
    <div id="map"></div>
    <div class='showTimeSpace'>
    <div id='date'></div>
    <div id='time'></div>
    </div>
    <div class='btnZone'>
    <div><button id="punchIn" class='punchIn' type='submit'>上班</button></div>
    <div><button id="punchOut" class='punchOut' type='submit'>下班</button></div>
    </div>`;
}
