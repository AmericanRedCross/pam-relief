var map = new L.Map("map", {
  center: [-16.741, 168.646],
  zoom: 7,
  minZoom: 6,
  zoomControl: false
});

var hotAttribution = 'Base data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | Map style by <a href="http://hot.openstreetmap.org" target="_blank">H.O.T.</a> | &copy; <a href="https://ifrc.org/" title="IFRC" target="_blank">IFRC</a> 2014 | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';
var hotUrl = hotUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
new L.TileLayer(hotUrl, {attribution: hotAttribution}).addTo(map);


// Add our Leaflet zoom control manually where we want it
var zoomControl = L.control.zoom({
    position: 'topright'
});
map.addControl(zoomControl);

// Add our loading control in the same position and pass the
// zoom control to attach to it
var loadingControl = L.Control.loading({
    position: 'topright',
    zoomControl: zoomControl
});
map.addControl(loadingControl);

var distributionsLayer = L.geoJson().addTo(map);

// comma seperator for thousands
var formatCommas = d3.format(",");

var distributionsData = [];
var coordinateData = [];
var mapPoints = [];

var distributionItems = [
"shelter tool kit",
"tarpaulin",
"collapsible jerry can (10L)",
"jerry can (20L)",
"hygiene kit",
"bucket",
"kitchen set",
"sleeping mat",
"blanket",
"solar lamp",
"mosquito net",
"rice (25kg)",
// "EC food (for 1 hh 1 day)",
"drinking water (litres)"
];

// get data files
function getData(){
  d3.csv("data/datadata.csv", function(data){
    distributionsData = data;
    d3.csv("data/mapper.csv", function(data){
      coordinateData = data;
      formatData();
  	});
  });
}

function formatData() {
  $.each(coordinateData, function(placeI, place) {
      var latlng = [parseFloat(place.long), parseFloat(place.lat)];
      var thisGeoJsonObject = {
          "type": "Feature",
          "properties": {
              "mapper": place.mapper,
              "place_name": place['place_name'],
              "totals": {}
          },
          "geometry": {
              "type": "Point",
              "coordinates": latlng
          }
      };
      $.each(distributionItems, function(itemI, item){
        thisGeoJsonObject.properties.totals[item] = 0;
      });
      mapPoints.push(thisGeoJsonObject);
  });
  $.each(distributionsData, function(eventI, event){
    $.each(mapPoints, function(pointI, point){
      if(point.properties.mapper === event.mapper){
        $.each(distributionItems, function(itemI, item){
          if(isNaN(parseInt(event[item], 10)) != true){
            point.properties.totals[item] += parseInt(event[item], 10);
          }
        });
      }
    });
  });
  addToMap();
}

var circleStyle = {
  fillColor: '#ed1b2e',
  color: '#ed1b2e'
};

function onMarker(feature, layer) {
  var popupHtml = "<h4>" + feature.properties.place_name + '</h4><table class="popup-table"><tbody>';
  $.each(feature.properties.totals, function(index, item){
    if(item > 0){
      popupHtml += '<tr><td class="item-count">' + formatCommas(item) + '</td>' +
          '<td></td><td class="item-name"> ' + index + '</td></tr>';
    }
  });
  popupHtml += '</tbody></table>';

  layer.bindPopup(popupHtml);
  layer.on({
    mouseover: markerMousover,
    mouseout: markerMouseout
  });
}

function markerMousover(e){
  var tooltipText = e.target.feature.properties['place_name'];
  $('#tooltip').append(tooltipText);
}

function markerMouseout(e){
  $('#tooltip').empty();
}


function addToMap(){
  L.geoJson(mapPoints, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, circleStyle);
    },
    onEachFeature: onMarker
  }).addTo(distributionsLayer);

  // zoomOut();

}




// show disclaimer text on click of dislcaimer link
function showDisclaimer() {
  window.alert("The maps used do not imply the expression of any opinion on the part of the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

// tooltip follows cursor
$(document).ready(function() {
    $('#map').mouseover(function(e) {
        //Set the X and Y axis of the tooltip
        $('#tooltip').css('top', e.pageY + 10 );
        $('#tooltip').css('left', e.pageX + 20 );
    }).mousemove(function(e) {
        //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
        $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});
    });

});

function zoomOut(){
  map.fitBounds(distributionsLayer.getBounds().pad(0.1,0.1));
}

getData();
