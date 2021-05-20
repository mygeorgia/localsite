// INIT
var dataParameters = [];
var dp = {};
var layerControl = {}; // Object containing one control for each map on page.
if(typeof hash === 'undefined') {
  // Need to figure out where already declared.
  // Avoid putting var in front, else "Identifier 'hash' has already been declared" error occurs here: http://localhost:8887/localsite/map/
  hash = {};
}
if(typeof dataObject == 'undefined') {
  var dataObject = {};
}
if(typeof priorHash == 'undefined') {
  var priorHash = {};
}

/* Allows map to remove selected shapes when backing up. */
document.addEventListener('hashChangeEvent', function (elem) {
  console.log("map.js detects hashChangeEvent");

  // NEED TO FIRST REMOVE FROM index.html and embed-map.js. Also prevent map-filters.js from involking loadMap1
  //loadMap1("map.js");

}, false);


// Set your own Mapbox access token below.
// Restrict which domains your token is loaded through.
// https://blog.mapbox.com/url-restrictions-for-access-tokens-5f7f7eb90092
var mbAttr = '<a href="https://www.mapbox.com/">Mapbox</a>', mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZWUyZGV2IiwiYSI6ImNqaWdsMXJvdTE4azIzcXFscTB1Nmcwcm4ifQ.hECfwyQtM7RtkBtydKpc5g';

//////////////////////////////////////////////////////////////////
// Loads from JSON API, Google Sheet or CSV file
//  longitude, latitude for position (lon, lat also supported)
//  one numerical or categorical attribute to be visualized
//  + (optional) attributes like  "address" to be shown in tooltip and list.
// 
// 1. set class of aside element above to match the name of the data
// 2. insert data into aside element
// 3. specify the following dp (data parameters) 
// 4. initialize map center with [lat, lon]
// 5. Load Layers Asynchronously
//
// options for scales:
// "scaleThreshold", "scaleOrdinal", "scaleOrdinal" or "scaleQuantile"
//
// hashChanged() resides within map-filters.js. In the index.html pages, any hash change invokes loadMap1
//////////////////////////////////////////////////////////////////

/////////// LOAD FROM HTML ///////////

// INTERMODAL PORTS - was here

var localsite_map = true; // Used by man-embed.js to detect map.js load.

/*
var localsite_map = localsite_map || (function(){
    var _args = {}; // private

    return {
        init : function(Args) {
            _args = Args;
            // some other initialising
        },
    };
}());
*/

/* Allows map to remove selected shapes when backing up. */
document.addEventListener('hashChangeEvent', function (elem) {
  console.log("map.js detects URL hashChangeEvent");
  hashChangedMap();
}, false);
document.addEventListener('hiddenhashChangeEvent', function (elem) {
  console.log("map.js detects hiddenhashChangeEvent");
  hashChangedMap();
}, false);

var priorHashMap = {};
function hashChangedMap() {
  let hash = getHash();


  // For PPE embed, also in map-filters.js. Will likely change
  if (!hash.show) {
    // For embed link
    hash.show = param.show;
    hiddenhash.show = param.show;
  }
  if (!hash.state) {
    // For embed link
    hash.state = param.state;
    hiddenhash.state = param.state;
  }

  // Temp for PPE
  if (!hash.state && location.host.indexOf("georgia") >= 0) {
    hash.state = "GA";
    hiddenhash.state = "GA";
  }


  if (hash.show != priorHashMap.show) {
    //applyIO(hiddenhash.naics);
    loadMap1("hashChanged() in map-filters.js", hash.show);
  } else if (hash.state && hash.state != priorHashMap.state) {
    // Why are new map points not appearing
    loadMap1("hashChanged() in map-filters.js new state " + hash.state, hash.show);
  }
  priorHashMap = getHash();
}
$(document).ready(function () {
  hashChangedMap();
});

function loadFromSheet(whichmap,whichmap2,dp,basemaps1,basemaps2,attempts,callback) {
  // To Do: Map background could be loaded while waiting for D3 file. 
  // Move "d3.csv(dp.dataset).then" further down into a new function that starts with the following line.

  console.log('loadFromSheet ' + whichmap);
  // Even without dataset, set titles since NAICS industries are still loaded.
  let defaults = {};
  defaults.zoom = 7;
  defaults.numColumns = ["zip","lat","lon"];
  defaults.nameColumn = "name";
  defaults.valueColumn = "name"; // For color coding
  defaults.latColumn = "latitude";
  defaults.lonColumn = "longitude";
  //defaults.scaleType = "scaleQuantile";
  defaults.scaleType = "scaleOrdinal";
  defaults.dataTitle = "Data Projects"; // Must match "map.addLayer(overlays" below.
  if (dp.latitude && dp.longitude) {
      mapCenter = [dp.latitude,dp.longitude];
  } else {
    mapCenter = [33.74,-84.38]; // Some center is always needed, else error will occur when first using flyTo.
  }

  // Make all keys lowercase - add more here, good to loop through array of possible keeys
  if (dp.itemsColumn) {
    dp.itemsColumn = dp.itemsColumn.toLowerCase();
  }

  if (dp.dataTitle) {
    $("#showAppsText").text(dp.dataTitle);
    $("#showAppsText").attr("title",dp.dataTitle);
    $(".regiontitle").text(dp.dataTitle);
  } else {
    // Handled by getNaics_setHiddenHash()
    //$("#showAppsText").text(hash.show.charAt(0).toUpperCase() + hash.show.substr(1).replace(/\_/g," "));  
  }
  if (dp.listTitle) {
    dp.dataTitle = dp.listTitle;
  }

  if (typeof d3 !== 'undefined') {
    if (!dp.dataset && !dp.googleDocID) {
      console.log('CANCEL loadFromSheet - no dataset selected for top map.');
      $("#" + whichmap).hide();
      $("#data-section").hide();
      $(".keywordField").hide();
      return;
    } else {
      console.log('loadFromSheet into #' + whichmap);
      $(".keywordField").show();
      $("#" + whichmap).show();
    }

    dp = mix(dp,defaults); // Gives priority to dp
    if (dp.addLink) {
      //console.log("Add Link: " + dp.addLink)
    }
    if (dp.showShapeMap) {
      let hash = getHash();
      renderMapShapes("map1", hash); // County select map
    }
    let map = document.querySelector('#' + whichmap)._leaflet_map; // Recall existing map
    var container = L.DomUtil.get(map);
    if (container == null) { // Initialize map
      map = L.map(whichmap, {
        center: mapCenter,
        scrollWheelZoom: false,
        zoom: dp.zoom,
        dragging: !L.Browser.mobile, 
        tap: !L.Browser.mobile
      });
      
      
      // setView does not seem to have an effect triggering map.on below
      /*
      map = L.map(whichmap,{
        center: mapCenter,
        scrollWheelZoom: false,
        zoom: dp.zoom,
        zoomControl: false
      });
      // Placing map.whenReady or map.on('load') here did not resolve
      map.setView(mapCenter,dp.zoom);
      */
    } else {
      map.setView(mapCenter,dp.zoom);
    }
    let map2 = {};
    if (whichmap2) {
      $("#list_main").show();
      map2 = document.querySelector('#' + whichmap2)._leaflet_map; // Recall existing map
      var container2 = L.DomUtil.get(map2);
      if (container2 == null) { // Initialize map
        map2 = L.map(whichmap2, {
          center: mapCenter,
          scrollWheelZoom: false,
          zoom: 5,
          dragging: !L.Browser.mobile, 
          tap: !L.Browser.mobile
        });
      }
    }

    // 5. Load Layers Asynchronously
    //var dataset = "../community/map/zip/basic/places.csv";

    // Change below
    // latColumn: "lat",
    //      lonColumn: "lon",
    //var dataset = "https://datascape.github.io/community/map/zip/basic/places.csv";

    // ADD DATASET TO DUAL MAPS

    // We are currently loading dp.dataset from a CSV file.
    // Later we will check if the filename ends with .csv

    if (dp.dataset && (dp.dataset.toLowerCase().includes(".json") || dp.datatype == "json")) { // To Do: only check that it ends with .json
      $.getJSON(dp.dataset, function (data) {
        dp.data = readJsonData(data, dp.numColumns, dp.valueColumn);
        processOutput(dp,map,map2,whichmap,whichmap2,basemaps1,basemaps2,function(results){
          callback(); // Triggers initialHighlight()
        });
      });
    } else if (dp.dataset) {
      d3.csv(dp.dataset).then(function(data) { // One row per line
          //console.log("To do: store data in browser to avoid repeat loading from CSV.");

          dp.data = makeRowValuesNumeric(data, dp.numColumns, dp.valueColumn);
          
          // Make element key always lowercase
          //dp.data_lowercase_key;

          processOutput(dp,map,map2,whichmap,whichmap2,basemaps1,basemaps2,function(results){});
      })
    } else if (dp.googleDocID) {
      // 
      loadScript(dual_map.modelearth_data_root() + '/localsite/map/neighborhood/js/tabletop.js', function(results) {

        tabletop = Tabletop.init( { key: dp.googleDocID, // from constants.js
          callback: function(data, tabletop) { 

            //onTabletopLoad(dp1) 
            dataMixedCase = tabletop.sheets(dp.sheetName).elements; // dp.data is called points in MapsForUs.js
            //dp.data_lowercase_key;

            // Currently assumes dp.data is blank - later we may need to append.
            // Also, tag a start and end time to determine if it would be faster to append the array of objects once populated.
            dp.data = [];

            // Convert all keys to lowercase
            for (var i = 0, l = dataMixedCase.length; i < l; i++) {
              var key, keys = Object.keys(dataMixedCase[i]);
              var n = keys.length;
              //var newobj={}
              dp.data[i] = {};
              while (n--) {
                key = keys[n];
                //if (key.toLowerCase() != key) {
                  dp.data[i][key.toLowerCase()] = dataMixedCase[i][key];
                  //dp.data[i][key] = null;
                //}
              }
              //console.log("TEST dp.data[i]");
              //console.log(dp.data[i]);
            }

            // Above is not working yet, need to traverse rows.
            //dp.data = dataMixedCase;

            // TO DO
            // dataMixedCase delete
            processOutput(dp,map,map2,whichmap,whichmap2,basemaps1,basemaps2,function(results){
              callback(); // Triggers initialHighlight()
            });
            
          } 
        });
        
      });

    }
    
    //.catch(function(error){ 
    //     alert("Data loading error: " + error)
    //})
  } else {
      attempts = attempts + 1;
      if (attempts < 2000) {
        // To do: Add a loading image after a coouple seconds. 2000 waits about 300 seconds.
        setTimeout( function() {
          loadFromSheet(whichmap,whichmap2,dp,basemaps1,basemaps2,attempts,callback);
        }, 20 );
      } else {
        alert("D3 javascript not available for loading map dataset.")
      }
  }
}

function processOutput(dp,map,map2,whichmap,whichmap2,basemaps1,basemaps2,callback) {
  dp.scale = getScale(dp.data, dp.scaleType, dp.valueColumn);
  dp.group = L.layerGroup();
  dp.group2 = L.layerGroup();
  dp.iconName = 'star';
  //dataParameters.push(dp);

  // Remove - clear the markers from the map for the layer
   if (map.hasLayer(overlays1[dp.dataTitle])){
      overlays1[dp.dataTitle].remove();
   }
   if (map2.hasLayer(overlays2[dp.dataTitle])){
      overlays2[dp.dataTitle].remove();
   }

   // Prevents dups of layer from appearing
   // Each dup shows a data subset when filter is being applied.
   if (overlays1[dp.dataTitle]) {
      layerControl[whichmap].removeLayer(overlays1[dp.dataTitle]);
   }
   if (overlays2[dp.dataTitle]) {
      // Not working, multiple checkboxes appear
      layerControl[whichmap2].removeLayer(overlays2[dp.dataTitle]);
      //controlLayers.removeLayer(overlays2[dp.dataTitle]);
   }

  // Allows for use of dp.dataTitle with removeLayer and addLayer
  overlays1[dp.dataTitle] = dp.group;
  overlays2[dp.dataTitle] = dp.group2;

  if (layerControl[whichmap] != undefined) {
    // Remove existing instance of layer
    //layerControl[whichmap].removeLayer(overlays[dp.dataTitle]); // Remove from control 
    //map.removeLayer(overlays[dp.dataTitle]); // Remove from map
  }

  if (layerControl[whichmap] != undefined && dp.group) {
      //layerControl[whichmap].removeLayer(dp.group);
  }


  // Still causes jump
  //overlays2["Intermodal Ports 2"] = overlays["Intermodal Ports"];

  // ADD BACKGROUND BASEMAP
  if (layerControl[whichmap] == undefined) {
    layerControl[whichmap] = L.control.layers(basemaps1, overlays1).addTo(map); // Init layer checkboxes
    basemaps1["Grayscale"].addTo(map); // Set the initial baselayer.  OpenStreetMap
  } else {
    layerControl[whichmap].addOverlay(dp.group, dp.dataTitle); // Add layer checkbox
  }
  // ADD BACKGROUND BASEMAP to Side Map
  if (layerControl[whichmap2] == undefined) {
    layerControl[whichmap2] = L.control.layers(basemaps2, overlays2).addTo(map2); // Init layer checkboxes
    basemaps2["OpenStreetMap"].addTo(map2); // Set the initial baselayer.
  } else {
    layerControl[whichmap2].addOverlay(dp.group2, dp.dataTitle); // Add layer checkbox
  }

  if (dp.showLegend != false) {
    //addLegend(dp.scale, dp.scaleType, dp.name); // To big and d3-legend.js file is not available in embed, despite 
  }

  // ADD ICONS TO MAP
  // All layers reside in dataParameters object:
  //console.log("dataParameters:");
  //console.log(dataParameters);

  if (dp.showLayer != false) {
    $("#widgetTitle").text(dp.dataTitle);
    dp = showList(dp,map); // Reduces list based on filters
    addIcons(dp,map,map2);
    // These do not effect the display of layer checkboxes
    map.addLayer(overlays1[dp.dataTitle]);
    map2.addLayer(overlays2[dp.dataTitle]);
  }
  $("#activeLayer").text(dp.dataTitle); // Resides after showList

  //callback(map); // Sends to function(results).  "var map =" can be omitted when calling this function


  // Runs too soon, unless placed within d3.csv.
  // Otherwise causes: Cannot read property 'addOverlay' of undefined

  //map.whenReady(function(){ 
  //map.on('load',function(){ // Never runs
    //alert("loaded")
    callback(dp)
  //});

  /*
  // Neigher map.whenReady or map.on('load') seems to require SetView()
  if (document.body.clientWidth > 500) { // Since map tiles do not fully load when below list. Could use a .5 sec timeout perhaps.
    setTimeout( function() {
      //$("#sidemapCard").hide(); // Hide after size is available for tiles.
    }, 3000 ); // Allow ample time to load.
  }
  */
}


/////////// MAP SETTINGS ///////////

// 33.863516,-84.368775
//var mapCenter = [32.90,-83.35]; // [latitude, longitude]
var mapCenter = [33.7490,-84.3880]; // [latitude, longitude]

// Add above to include overlays WITHOUT showing in legend:
// layers: [dataParameters[0].group]

// If added both baseLayers and overlays WITHOUT showing in legend:
// layers: [grayscale, dataParameters[0].group]

// Avoid layers: [grayscale] above 
// - two sets of tiles would be loaded when upper baseLayer is changed using radio buttons.

// Two sets prevents one map from changing the other


var overlays1 = {};
var overlays2 = {};
dataParameters.forEach(function(ele) {
  overlays1[ele.name] = ele.group; // Add to layer menu
  overlays2[ele.name] = ele.group2; // Add to layer menu
})

// NOT USED IN CURRENT REPO - Check if still used when transitioning PPE map
function populateMap(whichmap, dp, callback) { // From JSON within page
    var circle;
    let defaults = {};
    defaults.zoom = 7;
    if (dp.latitude && dp.longitude) {
      mapCenter = [dp.latitude,dp.longitude]; 
    } else {
      mapCenter = [33.74,-84.38];
    }

    dp = mix(dp,defaults); // Gives priority to dp

    var map = L.map(whichmap,{
      center: mapCenter,
      scrollWheelZoom: false,
      zoom: dp.zoom,
      zoomControl: false,
      dragging: !L.Browser.mobile, 
      tap: !L.Browser.mobile
    });

    map.setView(mapCenter,dp.zoom);

    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    overlays1[dp.dataTitle] = dp.group; // Allows for use of dp.name with removeLayer and addLayer

    // Adds checkbox, but unselects other map on page
    //overlays2[dp.dataTitle] = dp.group;
    overlays2[dp.dataTitle ] = dp.group2; //Haven't test switch to this

    /*
    if (layerControl[whichmap] == undefined) {
      baseLayers["Streets"].addTo(map); // Set the initial baselayer.

      //layerControl[whichmap] = L.control.layers(baseLayers, overlays).addTo(map);

    }
    */

    if (layerControl[whichmap] == undefined) {
      layerControl[whichmap] = L.control.layers(basemaps1, overlays1).addTo(map); // Push multple layers
      //basemaps1["Satellite"].addTo(map);
      basemaps1["Streets"].addTo(map);
    } else {
      layerControl[whichmap].addOverlay(dp.group, dp.dataTitle); // Appends to existing layers
    }
    
    // Attach the icon to the marker and add to the map
    //L.marker([33.74,-84.38], {icon: busIcon}).addTo(map)
    
    // Set .my-div-icon styles in CSS
    //var myIcon = L.divIcon({className: 'my-div-icon'});
    //L.marker([32.90,-83.83], {icon: myIcon}).addTo(map);

    addIcons(dp, map);
    map.addLayer(overlays1[dp.dataTitle]);
    
    // Both work
    map.on('load',function(){

      // Sample of single icon - place in addIcons function
      // Create a semi-transparent bus icon
      var busIcon = L.IconMaterial.icon({
        icon: 'local_shipping',            // Name of Material icon
        iconColor: '#fff',              // Material icon color (could be rgba, hex, html name...)
        markerColor: 'rgba(255,0,0,0.5)',  // Marker fill color
        outlineColor: 'rgba(255,0,0,0.5)',            // Marker outline color
        outlineWidth: 1,                   // Marker outline width 
      });

      callback(map)
    }); //  event handler before you load the map
    //map.whenReady(callback(map)); //  event handler before you load the map with SetView()
    
}



/////////////////////////////////////////
// helper functions
/////////////////////////////////////////
function addLegend(scale, scaleType, title) {

  $("#allLegends").text(""); // Clear prior results
  var svg = d3.select("#allLegends")
    .append("div")
      .attr("class", "legend "  + title)
    .append("svg")
      .style("width", 200);
      // .styleX("height", 300)

  svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(20,20)");


  var legend = d3.legendColor()
    .labelFormat(d3.format(".2f"))
    .title(title);

  if (scaleType === "scaleThreshold") {
    legend = legend.labels(d3.legendHelpers.thresholdLabels);
  }

  legend.scale(scale);  

  svg.select("g.legend")
    .call(legend);

  //alert($(".legendCells .cell").length)
  $("#legendHolder").height(80 + $(".legendCells .cell").length * 19);
}

function hex2rgb(hex) {
  // long version
  r = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (r) {
    return r.slice(1,4).map(function(x) { return parseInt(x, 16); });
  }
  // short version
  r = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (r) {
    return r.slice(1,4).map(function(x) { return 0x11 * parseInt(x, 16); });
  }
  return null;
}
function addIcons(dp,map,map2) {
  var circle,circle2;
  var iconColor, iconColorRGB, iconName;
  var colorScale = dp.scale;
  dp.data.forEach(function(element) {
    
    // Add a lowercase instance of each column name
    var key, keys = Object.keys(element);
    var n = keys.length;
    //var element={};
    while (n--) {
      key = keys[n];
      element[key.toLowerCase()] = element[key];
    }

    iconColor = colorScale(element[dp.valueColumn]);
    if (dp.color) { 
      iconColor = dp.color;
    }

    //console.log("element state " + element.state + " iconColor: " + iconColor)
    if (typeof dp.latColumn == "undefined") {
      dp.latColumn = "lat";
    }
    if (typeof dp.lonColumn == "undefined") {
      dp.lonColumn = "lon";
    }

    iconColorRGB = hex2rgb(iconColor);
    iconName = dp.iconName;
    var busIcon = L.IconMaterial.icon({ /* Cannot read property 'icon' of undefined */
      icon: iconName,            // Name of Material icon - star
      iconColor: '#fff',         // Material icon color (could be rgba, hex, html name...)
      markerColor: 'rgba(' + iconColorRGB + ',0.7)',  // Marker fill color
      outlineColor: 'rgba(' + iconColorRGB + ',0.7)', // Marker outline color
      outlineWidth: 1,                   // Marker outline width 
    })

    let name = element.name;
    if (element[dp.nameColumn]) {
      name = element[dp.nameColumn];
    } else if (element.title) {
      name = element.title;
    }

    if (!element[dp.latColumn] || !element[dp.lonColumn]) {
      console.log("Missing lat/lon: " + name)
      return;
    }
    // Attach the icon to the marker and add to the map
    //L.marker([element[dp.latColumn], element[dp.lonColumn]], {icon: busIcon}).addTo(map)

    if (dp.markerType == "google") {
        if (1==2 && param["show"] != "suppliers" && (location.host == 'georgia.org' || location.host == 'www.georgia.org')) {
          // Show an old-style marker when Google Material Icon version not supported
          circle = L.marker([element[dp.latColumn], element[dp.lonColumn]]).addTo(dp.group);
          circle2 = L.marker([element[dp.latColumn], element[dp.lonColumn]]).addTo(dp.group2);
        } else {
          //if (!dp.showShapeMap) {
            // If this line returns an error, try setting dp1.latColumn and dp1.latColumn to the names of your latitude and longitude columns.
            circle = L.marker([element[dp.latColumn], element[dp.lonColumn]], {icon: busIcon}).addTo(dp.group); // Works, but not in Drupal site.
            //circle2 = L.marker([element[dp.latColumn], element[dp.lonColumn]], {icon: busIcon}).addTo(dp.group2);
          //}
          // Display a small circle on small side map2
          circle2 = L.circle([element[dp.latColumn], element[dp.lonColumn]], {
                color: colorScale(element[dp.valueColumn]),
                fillColor: colorScale(element[dp.valueColumn]),
                fillOpacity: 1,
                radius: markerRadius(1,map2) // was 50.  Aiming for 1 to 10
            }).addTo(dp.group2);
        }
    } else {
      circle = L.circle([element[dp.latColumn], element[dp.lonColumn]], {
                color: colorScale(element[dp.valueColumn]),
                fillColor: colorScale(element[dp.valueColumn]),
                fillOpacity: 1,
                radius: markerRadius(1,map) // was 50.  Aiming for 1 to 10
            }).addTo(dp.group);
      circle2 = L.circle([element[dp.latColumn], element[dp.lonColumn]], {
                color: colorScale(element[dp.valueColumn]),
                fillColor: colorScale(element[dp.valueColumn]),
                fillOpacity: 1,
                radius: markerRadius(1,map2) // was 50.  Aiming for 1 to 10
            }).addTo(dp.group2);
    }

    // MAP POPUP
    var output = "<b>" + name + "</b><br>";
    if (element.description) {
      output += element.description + "<br>";
    } else if (element.description) {
      output += element.description + "<br>";
    } else if (element["business description"]) {
      output += element["business description"] + "<br>";
    }
    if (element[dp.addressColumn]) {
      output +=  element[dp.addressColumn] + "<br>";
    } else if (element.address || element.city || element.state || element.zip) { 
      if (element.address) {
        output += element.address + "<br>";
      } else {
        if (element.city) {
          output += element.city;
        }
        if (element.state || element.zip) {
          output += ", ";
        }
        if (element.state) {
          output += element.state + " ";
        }
        if (element.zip) {
          output += element.zip;
        }
        output += "<br>";
      }
    }

    if (element.phone || element.phone_afterhours) {
      if (element.phone) {
        output += element.phone + " ";
      }
      if (element.phone_afterhours) {
       output += element.phone_afterhours;
      }
      output += "<br>";
    }
    if (element[dp.valueColumn]) {
      if (dp.valueColumnLabel) {
        output += "<b>" + dp.valueColumnLabel + ":</b> " + element[dp.valueColumn].replace(/,/g,", ") + "<br>";
      } else if (element[dp.valueColumn] != element.name) {
        output += element[dp.valueColumn].replace(/,/g,", ") + "<br>";
      }
    }
    if (element.schedule) {
      output += "Hours: " + element.schedule + "<br>";
    }
    if (element.items) {
      output += "<b>Items:</b> " + element.items + "<br>";
    }

    if (element.website && !element.website.toLowerCase().includes("http")) {
        element.website = "http://" + element.website;
    }
    if (element.website) {
      if (element.website.length <= 50) {
        output += "<b>Website:</b> <a href='" + element.website + "' target='_blank'>" + element.website.replace("https://","").replace("http://","").replace("www.","").replace(/\/$/, "") + "</a>";
      } else {
        // To Do: Display domain only
        output += "<b>Website:</b> <a href='" + element.website + "' target='_blank'>" + element.website.replace("https://","").replace("http://","").replace("www.","").replace(/\/$/, "") + "</a>"; 
      }
    }
    if (dp.listLocation != false) {
      if (element[dp.latColumn]) {
        if (element.website) {
          output += " | ";
        }
        //console.log("latitude2: " + dp.latColumn + " " + element.latitude);
        //output += "<div class='detail' latitude='" + element[dp.latColumn] + "' longitude='" + element[dp.lonColumn] + "'>Zoom In</div> | ";
        output += "<a href='https://www.waze.com/ul?ll=" + element[dp.latColumn] + "%2C" + element[dp.lonColumn] + "&navigate=yes&zoom=17'>Waze Directions</a><br>";
      }
    } else if (element.website) {
      output += "<br>";
    }
    if (dp.distance) {
      output += "distance: " + dp.distance + "<br>";
    }

    element.mapframe = getMapframe(element);
    if (element.mapframe) {
      output += "<a href='#show=360&m=" + element.mapframe + "'>Birdseye View<br>";
    }
    if (element.property_link) {
      output += "<a href='" + element.property_link + "'>Property Details</a><br>";
    } else if (element["name"]) {
      output += "<a href='#show=" + hash.show + "&name=" + element["name"].replace(/\ /g,"_") + "''>View Details</a><br>";
    }
    // ADD POPUP BUBBLES TO MAP POINTS
    if (circle) {
      circle.bindPopup(output);
    }
    circle2.bindPopup(output);

    /*
    map.on('zoomend', function() {
      console.log('zoomend',map.getZoom())
      circle.setRadius(markerRadius(1,map));
    });
    */

  });

  // Also see community-forecasting/map/leaflet/index.html for sample of svg layer that resizes with map
  map.on('zoomend', function() { // zoomend
    //L.layerGroup().eachLayer(function (marker) {
    dp.group.eachLayer(function (marker) { // This hits every point individually. A CSS change might be less script processing intensive
      //console.log('zoom ' + map.getZoom());
      if (marker.setRadius) {
        // Only reached when circles are used instead of map points.
        marker.setRadius(markerRadius(1,map));
      }
    });


    //if (map.getZoom() === 15)  {
    //alert(map.getZoom()) 
    
    // NOTE - This will get called for each layer
    //alert("zoomed"); // Occurs twice
    var elements = document.getElementsByClassName('l-icon-material');
    for (var i=0, max=elements.length; i < max; i++) {
      //elements[i].style.backgroundColor = "transparent"; // "rgba(0, 0, 0, 0)";

      if (map.getZoom() >= 9)  {
        elements[i].style.marginTop = "-42px"; // Move circle to default when mappoint shape displayed.
        elements[i].childNodes[0].style.opacity = 1; // The path within SVG. Show mappoint shape around circle with icon. Undoes custom hide in leaflet.icon-material.js line 57.
      } else {
        elements[i].style.marginTop = "-14px"; // Move circle down when mappoint shape not displayed.
        elements[i].childNodes[0].style.opacity = 0;
      }
      //elements[i].child.style.opacity = 1;
      // path.setAttribute('opacity', 0);

      //elements[i].style.fillOpacity = 0;
      //elements[i].style.opacity = 0; // works
      //elements[i].style.width      = 6; // works sorta - crops

      //elements[i].style.display = "none"; // works
      //elements[i].style.width      = 16;
      //elements[i].style.height     = 20;
      //elements[i].style.marginLeft = 8;
      //elements[i].style.marginTop  = 22;
    }
    


  });
  map2.on('zoomend', function() { // zoomend
    // Resize the circle to avoid large circles on close-ups
    dp.group2.eachLayer(function (marker) { // This hits every point individually. A CSS change might be less processing intensive
      //console.log('zoom ' + map.getZoom());
      if (marker.setRadius) {
        marker.setRadius(markerRadius(1,map2));
      }
    });
    $(".leaflet-interactive").show();
  });
  map2.on('zoom', function() {
    // Hide the circles so they don't fill screen. Set small to hide.
    $(".leaflet-interactive").hide();
    $(".l-icon-material").show();
  });

  $('.detail').click(function() { // Provides close-up with map2
      $("#sidemapCard").show(); // map2 - show first to maximize time tiles have to see full size of map div.

      // Reduce the size of all circles - to do: when zoom is going in 
      /* No effect
      dp.group2.eachLayer(function (marker) { // This hits every point individually. A CSS change might be less script processing intensive
        //console.log('zoom ' + map.getZoom());
        if (marker.setRadius) {
          console.log("marker.setRadius" + markerRadiusSmall(1,map2));
          marker.setRadius(markerRadiusSmall(1,map2));
        }
      });
      */
      

      //$('.detail').css("border","none");
      //$('.detail').css("background-color","inherit");
      //$('.detail').css("padding","12px 0 12px 4px");
      $('.detail').removeClass("detailActive");

      console.log("List detail click");
      let locname = $(this).attr("name").replace(/ /g,"_");
      updateHash({"name":locname});
      $('#sidemapName').text($(this).attr("name"));

      //$(this).css("border","1px solid #ccc");
      //$(this).css("background-color","rgb(250, 250, 250)");
      //$(this).css("padding","15px");
      $(this).addClass("detailActive");
      var listingsVisible = $('#detaillist .detail:visible').length;
      if (listingsVisible == 1) {
        $("#viewAllLink").show();
      }
      if ($(this).attr("latitude") && $(this).attr("longitude")) {
        popMapPoint(dp, map2, $(this).attr("latitude"), $(this).attr("longitude"), $(this).attr("name"));
      } else {
        $("#sidemapCard").hide();
      }
      // Might reactivate scrolling to map2
      /*
      window.scrollTo({
        top: $("#sidemapCard").offset().top - 140,
        left: 0
      });
      */

      $(".go_local").show();
    }
  );
  $('.showItemMenu').click(function () {
    $("#itemMenu").show();

    $("#itemMenu").prependTo($(this).parent());

    event.stopPropagation();
    //$("#map").show();
    // $(this).css('border', 'solid 1px #aaa');
  });
  $('.showLocMenu').click(function () {
    $(".locMenu").show();
    //event.stopPropagation();
  });
  $('#hideSideMap').click(function () {
    $("#sidemapCard").hide(); // map2
  });

}

function markerRadiusSmall(radiusValue,map) {
  return .00001;
}
function markerRadius(radiusValue,map) {
  //return 100;
  // Standard radiusValue = 1
  let mapZoom = map.getZoom();
  let smallerWhenClose = 30;
  if (mapZoom >= 5) { smallerWhenClose = 20};
  if (mapZoom >= 8) { smallerWhenClose = 15};
  if (mapZoom >= 9) { smallerWhenClose = 10};
  if (mapZoom >= 10) { smallerWhenClose = 4};
  if (mapZoom >= 11) { smallerWhenClose = 1.8};
  if (mapZoom >= 12) { smallerWhenClose = 1.4};
  if (mapZoom >= 13) { smallerWhenClose = 1};
  if (mapZoom >= 14) { smallerWhenClose = .8};
  if (mapZoom >= 15) { smallerWhenClose = .4};
  if (mapZoom >= 17) { smallerWhenClose = .3};
  if (mapZoom >= 18) { smallerWhenClose = .2};
  if (mapZoom >= 20) { smallerWhenClose = .1};
  let radiusOut = (radiusValue * 2000) / mapZoom * smallerWhenClose;

  //console.log("mapZoom:" + mapZoom + " radiusValu:" + radiusValue + " radiusOut:" + radiusOut);
  return radiusOut;
}
function changeCat(catTitle) {
  $('#catSearch').val(catTitle);

  $('#items').prop("checked", true); // Add front to parameter name.

  $('#industryCatList > div').removeClass('catListSelected');

  $('.catList > div').filter(function(){
      return $(this).text() === catTitle
  }).addClass('catListSelected');

  $("#topPanel").hide();
  $('#catListHolderShow').text('Product Categories');
  //$('html,body').animate({
  //    scrollTop: $("#hublist").offset().top - 250
  //});
}

// MAP 1
// var map1 = {};
var showprevious = param["show"];

var tabletop; // Allows us to wait for tabletop to load.

function loadMap1(calledBy, show, dp) { // Called by index.html, map-embed.js and map-filters.js

  console.log('loadMap1 calledBy ' + calledBy + ' show: ' + show);
  if (!show) {
    show = param["show"];
  }

  let hash = getHash();
  //if (!show && param["go"]) {
  //  show = param["go"].toLowerCase();
  //}
  if (show != showprevious) {
    changeCat(""); // Clear side
  }
  //$("#list_main").hide(); // Hide list and map2 until displayed by state-specific data

  // To do: limit to when layer changes
  //$(".layerclass").hide(); // Hides suppliers, and other layer-specific css
  
  //alert("show: " + show);
  // Note: light_nolabels does not work on https. Remove if so. Was positron_light_nolabels.
  var basemaps1 = {
    //'Grayscale' : L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}), // No longer works, may require registration change.
    // OpenStreetMap_BlackAndWhite:
      'Grayscale' : L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
          maxZoom: 18, attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      }),

    // https://github.com/CartoDB/basemap-styles
    //'Grayscale' : L.tileLayer('https://{s}.tile.cartocdn.com/{z}/{x}/{y}.png', {
    //   attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    //   subdomains: 'abcd',
    //   maxZoom: 20,
    //   minZoom: 0
    // }),
    'Satellite' : L.tileLayer(mbUrl, {maxZoom: 25, id: 'mapbox.satellite', attribution: mbAttr}),
    //'Streets' : L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr}),
    'OpenStreetMap' : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    }),
  }
  var basemaps2 = {
    //'Grayscale' : L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
    'Grayscale' : L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
          maxZoom: 18, attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      }),
    'Satellite' : L.tileLayer(mbUrl, {maxZoom: 25, id: 'mapbox.satellite', attribution: mbAttr}),
    //'Streets' : L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr}),
    'OpenStreetMap' : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    }),
  }
  var baselayers = {
    'Rail' : L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
        minZoom: 2, maxZoom: 19, tileSize: 256, attribution: '<a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>'
    }),
  }
  /*
    'Positron' : L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      attributionX: 'positron_lite_rainbow'
    }),
    'Litegreen' : L.tileLayer('//{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
        attribution: 'Tiles <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a>'
    }),
    'EsriSatellite' : L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
    }),
    'Dark' : L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
        attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
    }),
  */

  // This was outside of functions, but caused error because L was not available when dual-map.js loaded before leaflet.
  // Not sure if it was working, or if it will contine to work here.
  // Recall existing map https://github.com/leaflet/issues/6298
  // https://plnkr.co/edit/iCgbRjW4aymAjoVoicZQ?p=preview&preview
  L.Map.addInitHook(function () {
    // Store a reference of the Leaflet map object on the map container,
    // so that it could be retrieved from DOM selection.
    // https://leafletjs.com/reference-1.3.4.html#map-getcontainer
    this.getContainer()._leaflet_map = this;
  });

  let community_root = dual_map.community_data_root();
  //let state_root = "/georgia-data/";
  //let state_root = dual_map.custom_data_root();
  let state_abbreviation = hash.state || "GA";

  let dp1 = {}
  // Might use when height is 280px
  dp1.latitude = 31.6074;
  dp1.longitude = -81.8854;

  // Georgia
  //dp1.latitude = 32.9;
  //dp1.longitude = -83.4;
  dp1.zoom = 7;

  let theState = $("#state_select").find(":selected").val();
  if (!theState && param["state"]) {
    theState = param["state"].toUpperCase();
  }
  if (!theState) {
    //theState = "GA";
  }
  if (theState != "") {
    let kilometers_wide = $("#state_select").find(":selected").attr("km");
    //zoom = 1/kilometers_wide * 1800000;

    if (theState == "HI") { // Hawaii
        dp1.zoom = 6
    } else if (kilometers_wide > 1000000) { // Alaska
        dp1.zoom = 4
    }
    dp1.latitude = $("#state_select").find(":selected").attr("lat");
    dp1.longitude = $("#state_select").find(":selected").attr("lon");
  }

  dp1.listLocation = false; // Hides Waze direction link in list, remains in popup.

  if (show && show.length) {
    $("." + show).show(); // Show layer's divs, after hiding all layer-specific above.
  }
  $(".headerOffset2").height($("#filterFieldsHolder").height() + "px"); // Adjust incase reveal/hide changes height.

  // Google Sheets must be published with File > Publish to Web to avoid error: "blocked by CORS policy: No 'Access-Control-Allow-Origin' header" 

  //if (dp && dp[0]) { // Parameters set in page or layer json
  if (dp && dp.dataset) { // Parameters set in page or layer json
    dp1 = dp;
  } else if (show == "farmfresh" && state_abbreviation) {
    dp1.listTitle = "USDA Farm Produce";
    //if (location.host.indexOf('localhost') >= 0) {
      dp1.valueColumn = "type";
      dp1.valueColumnLabel = "Type"; // was: Prepared Food
      //dp1.dataset = "../../../community/farmfresh/scraper/out/states/ga/markets.csv";
      dp1.dataset = "https://model.earth/community-data/us/state/" + state_abbreviation.toUpperCase() + "/" + state_abbreviation.toLowerCase() + "-farmfresh.csv";
    //} else {
    //  // Older data
    //  dp1.valueColumn = "Prepared";
    //  dp1.dataset = dual_map.custom_data_root()  + "farmfresh/farmersmarkets-" + state_abbreviation + ".csv";
    //}
    dp1.name = "Local Farms"; // To remove
    dp1.dataTitle = "Farm Fresh Produce";

    dp1.markerType = "google"; // BUGBUG doesn't seem to work with county boundary background (showShapeMap)
    //dp1.showShapeMap = true;

    dp1.search = {"In Market Name": "MarketName","In County": "County","In City": "city","In Street": "street","In Zip": "zip","In Website": "Website"};
    dp1.nameColumn = "marketname";
    dp1.titleColumn = "marketname";
    dp1.searchFields = "marketname";
    dp1.addressColumn = "street";
    dp1.latColumn = "y";
    dp1.lonColumn = "x";
    dp1.stateColumn = "state";

    dp1.addlisting = "https://www.ams.usda.gov/services/local-regional/food-directories-update";
    // community/farmfresh/ 
    dp1.listInfo = "Farmers markets and local farms providing fresh produce directly to consumers. <a style='white-space: nowrap' href='https://model.earth/community/farmfresh/ga/'>About Data</a> | <a href='https://www.ams.usda.gov/local-food-directories/farmersmarkets'>Update Listings</a>";
  
  } else if (show == "brigades") {
    dp1.listTitle = "Coding Brigades";
    dp1.dataset = "https://neighborhood.org/brigade-information/organizations.json";
    dp1.datatype = "json";
    dp1.listInfo = "<a href='https://neighborhood.org/brigade-information/'>Source</a> and upcoming: <a href='https://neighborhood.org/brigade-project-index/get-indexed/'>Brigade Project Index</a>"

    // , "In Address": "address", "In County Name": "county", "In Website URL": "website"
    dp1.search = {"In Location Name": "name"};

  } else if (show == "buses") {
    dp1.listTitle = "Bus Locations";
    dp1.dataset = "https://api.marta.io/buses";
    dp1.datatype = "json";
    dp1.nameColumn = "route";
    dp1.itemsColumn = "DIRECTION";
    dp1.valueColumn = "DIRECTION";
    dp1.valueColumnLabel = "Direction";
    dp1.latitude = 33.74;
    dp1.longitude = -84.38;
    dp1.zoom = 12;
    dp1.refreshminutes = "1";
    dp1.listInfo = "Enhancements to the MARTA API<br>by Code for Atlanta member jakswa. <a href='https://github.com/jakswa/marta_ui'>GitHub</a>"

    // , "In Address": "address", "In County Name": "county", "In Website URL": "website"
    dp1.search = {"In Route Number": "ROUTE", "In Vehicle Number": "VEHICLE"}; // Or lowercase?

  } else if (show == "trees" && theState == "CA") {
    dp1.listTitle = "Trees";
    dp1.dataset = "https://storage.googleapis.com/public-tree-map/data/map.json";
    dp1.nameColumn = "name_botanical";
    // , "In Address": "address", "In County Name": "county", "In Website URL": "website"
    dp1.search = {"Common Name": "family_common_name", "Family Name": "family_name_botanical", "Botanical Name": "name_botanical"};

  } else if (theState == "GA") {

      if (show == "opendata") {
        dp1.editLink = "https://docs.google.com/spreadsheets/d/1bvD9meJgMqLywdoiGwe3f93sw1IVI_ZRjWSuCLSebZo/edit?usp=sharing";
        dp1.dataTitle = "Georgia Open Data";
        dp1.listTitle = "Georgia Open Data Resources";
        dp1.googleDocID = "1bvD9meJgMqLywdoiGwe3f93sw1IVI_ZRjWSuCLSebZo";
        dp1.sheetName = "OpenData";
        dp1.itemsColumn = "Category1"; // For side nav search
        dp1.valueColumn = "Category1";
        dp1.valueColumnLabel = "Type";
        dp1.listInfo = "<a href='https://docs.google.com/spreadsheets/d/1bvD9meJgMqLywdoiGwe3f93sw1IVI_ZRjWSuCLSebZo/edit?usp=sharing'>Update Google Sheet</a>.";
          dp1.search = {"In Dataset Name": "name", "In Type": "Category1", "In Website URL": "website"};
              
      } else if (show == "360") {
        dp1.listTitle = "Birdseye Views";
        //  https://model.earth/community-data/us/state/GA/VirtualTourSites.csv
        dp1.dataset =  dual_map.custom_data_root() + "360/GeorgiaPowerSites.csv";

      } else if (show == "recycling" || show == "transfer" || show == "recyclers" || show == "inert" || show == "landfills") { // recycling-processors
        if (!param.state || param.state == "GA") {
          dp1.editLink = "https://docs.google.com/spreadsheets/d/1YmfBPEFpfmaKmxcnxijPU8-esVkhaVBE1wLZqPNOKtY/edit?usp=sharing";
          dp1.googleDocID = "1YmfBPEFpfmaKmxcnxijPU8-esVkhaVBE1wLZqPNOKtY";
          if (show == "transfer") {
            dp1.listTitle = "Georgia Transfer Stations";
            dp1.sheetName = "Transfer Stations";
            dp1.valueColumn = "waste type"; // Bug - need to support uppercase too.
            dp1.valueColumnLabel = "Waste Type";
          } else if (show == "recyclers") {
            dp1.listTitle = "Georgia Companies that Recycle During Manufacturing";
            dp1.sheetName = "Manufacturer Recyclers";
            dp1.valueColumn = "category"; // Bug - need to support uppercase too.
            dp1.valueColumnLabel = "Recycles";
          } else if (show == "landfills") {
            dp1.listTitle = "Georgia Landfills";
            dp1.sheetName = "Landfills";
            dp1.valueColumn = "sector"; // Bug - need to support uppercase too.
            dp1.valueColumnLabel = "Sector";
          } else if (show == "inert") {
            dp1.listTitle = "Georgia Inert Waste Landfills";
            dp1.sheetName = "Inert Waste Landfills";
            dp1.valueColumn = "sector"; // Bug - need to support uppercase too.
            dp1.valueColumnLabel = "Sector";
          } else {
            dp1.listTitle = "Georgia Recycling Processors";
            dp1.sheetName = "Recycling Processors";
            dp1.valueColumn = "category";
            dp1.valueColumnLabel = "Materials Category";
          }
          dp1.nameColumn = "company";
          dp1.listInfo = "<br><br>View additional <a href='../map/recycling/ga/'>recycling datasets</a>.<br>Submit updates by posting comments in our 5 <a href='https://docs.google.com/spreadsheets/d/1YmfBPEFpfmaKmxcnxijPU8-esVkhaVBE1wLZqPNOKtY/edit?usp=sharing'>Google Sheet Tabs</a>.";
          
          //dp1.latColumn = "latitude";
          //dp1.lonColumn = "longitude";
          dp1.search = {"In Location Name": "name", "In Address": "address", "In County Name": "county", "In Website URL": "website"};
        }
      } else if (show == "vehicles" || show == "ev") {
        dp1.listTitle = "Motor Vehicle and Motor Vehicle Equipment Manufacturing";
        if (show == "ev") {
          dp1.listTitle = "Electric Vehicle Manufacturing";
        }
        dp1.editLink = "https://docs.google.com/spreadsheets/d/1OX8TsLby-Ddn8WHa7yLKNpEERYN_RlScMrC0sbnT1Zs/edit?usp=sharing";
        dp1.googleDocID = "1OX8TsLby-Ddn8WHa7yLKNpEERYN_RlScMrC0sbnT1Zs";
        dp1.sheetName = "Automotive";
        dp1.listInfo = "<br><br>Post comments in our <a href='https://docs.google.com/spreadsheets/d/1OX8TsLby-Ddn8WHa7yLKNpEERYN_RlScMrC0sbnT1Zs/edit?usp=sharing'>Google Sheet</a> to submit updates. Learn about <a href='../../community/projects/mobility/'>data sources</a>.";
        dp1.valueColumn = "ev industry";
        dp1.valueColumnLabel = "EV Industry";
        dp1.markerType = "google";
        dp1.search = {"EV Industry": "ev industry", "In Location Name": "name", "In Address": "address", "In County Name": "county", "In Website URL": "website"};
      } else if (show == "solar") {
        dp1.listTitle = "Solar Companies";
        dp1.editLink = "https://docs.google.com/spreadsheets/d/1yt_saLpiBNPR1g_r2mn9-U5DozqLoVJHVwfR-4f0HTU/edit?usp=sharing";
        dp1.googleDocID = "1yt_saLpiBNPR1g_r2mn9-U5DozqLoVJHVwfR-4f0HTU";
        dp1.sheetName = "Companies";
        dp1.listInfo = "<br><br>Post comments in our <a href='https://docs.google.com/spreadsheets/d/1yt_saLpiBNPR1g_r2mn9-U5DozqLoVJHVwfR-4f0HTU/edit?usp=sharing'>Google Sheet</a> to submit map updates.<br>View Georgia's <a href='https://www.solarpowerworldonline.com/2020-top-georgia-contractors/'>top solar contractors by KW installed</a>.";
        dp1.valueColumn = "firm type";
        dp1.valueColumnLabel = "Firm Type";
        dp1.markerType = "google";
        dp1.search = {"In Location Name": "name", "In Address": "address", "In County Name": "county", "In Website URL": "website"};
      } else if (show == "vax" || show == "vac") { // Phase out vac
        dp1.listTitle = "Vaccine Locations";
        //dp1.dataset = "https://docs.google.com/spreadsheets/d/1odIH33Y71QGplQhjJpkYhZCfN5gYCA6zXALTctSavwE/gviz/tq?tqx=out:csv&sheet=Sheet1"; // MapBox sample
        // Link above works, but Google enforces CORS with this link to Vaccine data:
        //dp1.dataset = "https://docs.google.com/spreadsheets/d/1q5dvOEaAoTFfseZDqP_mIZOf2PhD-2fL505jeKndM88/gviz/tq?tqx=out:csv&sheet=Sheet3";
        dp1.editLink = "https://docs.google.com/spreadsheets/d/1_wvZXUWFnpbgSAZGuIb1j2ni8p9Gqj3Qsvd8gV95i90/edit?ts=60233cb5#gid=698462553";
        dp1.googleDocID = "1_wvZXUWFnpbgSAZGuIb1j2ni8p9Gqj3Qsvd8gV95i90";
        dp1.sheetName = "Current Availability";
        dp1.listInfo = "<br><br><a href='https://docs.google.com/spreadsheets/d/1_wvZXUWFnpbgSAZGuIb1j2ni8p9Gqj3Qsvd8gV95i90/edit?ts=60233cb5#gid=698462553'>Help update Google Sheet data by posting comments</a>.<br><br><a href='https://myvaccinegeorgia.com/'>Preregister with myvaccinegeorgia.com</a> and join the <a href='https://vaxstandby.com/'>VAX Standby</a> list to receive a message when extra doses are available. Also receive text messages on availability from <a href='https://twitter.com/DiscoDroidAI'>Disco Droid</a> or check their <a href='https://twitter.com/DiscoDroidAI'>Tweets</a>.<br><br><a href='https://www.vaccinatega.com/vaccination-sites/providers-in-georgia'>Check provider status</a> at <a href='https://VaccinateGA.com'>VaccinateGA.com</a> and <a href='neighborhood/'>assist with data and coding</a>.";
        // <a href='neighborhood/vaccines/'>view availability and contribute updates</a>
        dp1.search = {"In Location Name": "name", "In Address": "address", "In County Name": "county", "In Website URL": "website"};
        // "In Description": "description", "In City Name": "city", "In Zip Code" : "zip"
        dp1.valueColumn = "county";
        dp1.valueColumnLabel = "County";
        dp1.countyColumn = "county";
        dp1.itemsColumn = "Category1";
      } else if (show == "smart") { // param["data"] for legacy: https://www.georgia.org/smart-mobility
        dp1.dataTitle = "Smart Data Projects";
        dp1.listTitle = "Data Driven Decision Making";
        //dp1.listSubtitle = "Smart & Sustainable Movement of Goods & Services";
        dp1.industryListTitle = "Mobility Tech";

        console.log("map.js loading " + dual_map.custom_data_root() + "communities/map-georgia-smart.csv");

        dp1.dataset =  dual_map.custom_data_root() + "communities/map-georgia-smart.csv";
        dp1.listInfo = "Includes Georgia Smart Community Projects";
        dp1.search = {"In Title": "title", "In Description": "description", "In Website URL": "website", "In Address": "address", "In City Name": "city", "In Zip Code" : "zip"};
        dp1.markerType = "google";
        dp1.showShapeMap = true;

      } else if (show == "logistics") { // "http://" + param["domain"]

        dp1.listTitle = "Logistics";

        dp1.listInfo = "Select a category to filter your results.";
        //dp1.dataset = "https://georgiadata.github.io/display/data/logistics/coi_with_cognito.csv";
        dp1.dataset = "../../display/data/logistics/coi_with_cognito.csv";

        dp1.dataTitle = "Manufacturers and Distributors";
        dp1.itemsColumn = "items";
        dp1.valueColumn = "type";
        dp1.valueColumnLabel = "Type";
        dp1.markerType = "google";
        //dp1.keywords = "items";
        // "In Business Type": "type", "In State Name": "state", "In Postal Code" : "zip"
        dp1.search = {"In Items": "items", "In Website URL": "website", "In City Name": "city", "In Zip Code" : "zip"};
        dp1.nameColumn = "title";
        dp1.latColumn = "lat_rand";
        dp1.lonColumn = "lon_rand";

        dp1.nameColumn = "company";
        dp1.latColumn = "latitude";
        dp1.lonColumn = "longitude";
        dp1.showLegend = false;

        dp1.listLocation = false;
        dp1.addLink = "https://www.georgia.org/covid19response"; // Not yet used

      } else if (show == "suppliers" || show == "ppe") { 

        // https://docs.google.com/spreadsheets/d/1bqMTVgaMpHIFQBNdiyMe3ZeMMr_lp9qTgzjdouRJTKI/edit?usp=sharing
        dp1.listTitle = "Georgia COVID-19 Response"; // Appears at top of list
        //dp1.listTitle = "Georgia PPE Suppliers"; // How do we set the layer title for checkbox?
        //dp1.editLink = "";
        dp1.googleDocID = "1bqMTVgaMpHIFQBNdiyMe3ZeMMr_lp9qTgzjdouRJTKI";
        dp1.sheetName = "GA Suppliers List";
        dp1.listInfo = "Select a category to the left to filter results. View&nbsp;<a href='https://map.georgia.org/display/products/suppliers-pdf/ga_suppliers_list_2021-03-10.pdf' target='_parent'>PDF&nbsp;version</a>&nbsp;of&nbsp;the&nbsp;complete&nbsp;list.";
        
        //dp1.dataTitle = "Manufacturers and Distributors";
        dp1.dataTitle = "PPE Suppliers";
        dp1.itemsColumn = "items";
        dp1.valueColumn = "type";
        dp1.valueColumnLabel = "Type";
        dp1.color = "#ff9819"; // orange
        dp1.markerType = "google";
        dp1.search = {"In Company Name": "company", "In Items": "items", "In Website URL": "website", "In City Name": "city", "In Zip Code" : "zip"};
        dp1.nameColumn = "company";

      } else if (show == "suppliersX" || show == "ppeX") { // "http://" + param["domain"]

        dp1.listTitle = "Georgia COVID-19 Response";
        dp1.listTitle = "Georgia Suppliers of&nbsp;Critical Items <span style='white-space:nowrap'>to Fight COVID-19</span>"; // For iFrame site
        // https://www.georgia.org/sites/default/files/2021-01 
        dp1.listInfo = "Select a category to the left to filter results. View&nbsp;<a href='https://map.georgia.org/display/products/suppliers-pdf/ga_suppliers_list_2021-03-10.pdf' target='_parent'>PDF&nbsp;version</a>&nbsp;of&nbsp;the&nbsp;complete&nbsp;list.";
        dp1.dataset = "https://map.georgia.org/display/products/suppliers/us_ga_suppliers_ppe_2021_02_24.csv";
        //dp1.dataset = "/display/products/suppliers/us_ga_suppliers_ppe_2020_06_17.csv";

        dp1.dataTitle = "Manufacturers and Distributors";
        dp1.itemsColumn = "items";
        dp1.valueColumn = "type";
        dp1.valueColumnLabel = "Type";
        dp1.color = "#ff9819"; // orange
        dp1.markerType = "google";
        //dp1.keywords = "items";
        // "In Business Type": "type", "In State Name": "state", "In Postal Code" : "zip"
        dp1.search = {"In Items": "items", "In Website URL": "website", "In City Name": "city", "In Zip Code" : "zip"};
        dp1.nameColumn = "title";
        dp1.latColumn = "lat_rand";
        dp1.lonColumn = "lon_rand";

        if (param["initial"] != "response") {
          dp1.nameColumn = "company";
          dp1.latColumn = "latitude";
          dp1.lonColumn = "longitude";
          dp1.showLegend = false;
        }

        dp1.listLocation = false;
        dp1.addLink = "https://www.georgia.org/covid19response"; // Not yet used

      } else if (show == "restaurants") {
        // Fulton County 5631 restaurants
        
        dp1 = {};
        dp1.listTitle = "Restaurant Ratings";
        dp1.dataTitle = "Restaurant Ratings";
        dp1.dataset = "/community/tools/map.csv";
        dp1.latitude = 32.9;
        dp1.longitude = -83.4;

        //dp1.showLayer = false;
        dp1.name = "Fulton County Restaurants";
        dp1.titleColumn = "restaurant";
        dp1.nameColumn = "restaurant";

        dp1.valueColumnLabel = "Health safety score";
        dp1.valueColumn = "score";
        dp1.scale = "scaleThreshold";

        dp1.latColumn = "latitude";
        dp1.lonColumn = "longitude";

        dp1.dataset = "/community/farmfresh/usa/georgia/fulton_county_restaurants.csv"; // Just use 50
        dp1.dataTitle = "Restaurant Scores";
        dp1.titleColumn = "restaurant";
        dp1.listInfo = "Fulton County";
      } else if (show == "pickup") {
        // Atlanta Pickup
        dp1.latitude = 33.76;
        dp1.longitude = -84.3880;
        dp1.zoom = 14;

        // CURBSIDE PICKUP
        dp1.listTitle = "Restaurants with Curbside Pickup";
        dp1.listInfo = "Data provided by coastapp.com. <a href='https://coastapp.com/takeoutcovid/atl/' target='_blank'>Make Updates</a>";
        dp1.dataset = "/community/places/usa/ga/restaurants/atlanta-coastapp.csv";
        dp1.dataTitle = "Curbside Pickup";
        // 
        dp1.markerType = "google";
        dp1.search = {"In Restaurant Name": "Name", "In Description": "Description", "In City Name": "City", "In Address" : "Address"};
        dp1.nameColumn = "Name";
        dp1.titleColumn = "Description";
        //dp1.addressColumn = "Address";
        //dp1.website = "Link";
        dp1.valueColumnLabel = "Delivery";
        dp1.valueColumn = "Delivery";
        dp1.listLocation = true;

      } else {
        console.log("no show text match for listing map: " + show);
      }

  } // end state GA

  // Load the map using settings above

  // INIT - geo fetches the county for filtering. This will be limited to datasets that contain County columns
  hash = getHash();
  if (hash.geo) {
    loadGeos(hash.geo,0,function(results) {
      loadFromSheet('map1','map2', dp1, basemaps1, basemaps2, 0, function(results) {
        initialHighlight(hash);
      });
    });
  } else {
    // Set to Georiga - later we'll show globe
    if (!hash.state) {
      //hash.state = "GA"
      $(".locationTabText").text("States and counties...")
    } else {
      $("#state_select").val(hash.state);
      $(".locationTabText").text($("#state_select").find(":selected").text());
      $(".locationTabText").attr("title",$("#state_select").find(":selected").text());
    }

    loadFromSheet('map1','map2', dp1, basemaps1, basemaps2, 0, function(results) {
      initialHighlight(hash);  
    });
  }
  // Return to top for mobile users on search.
  if (document.body.clientWidth <= 500) {
    window.scrollTo({
      top: 0,
      left: 0
    });
  }
  showprevious = show;
}
function initialHighlight(hash) {
  if (hash.name) {
    let locname = hash.name.replace(/_/g," ");

    // console.log("Auto select the first location in list")
    //$("#detaillist > [name='"+locname+"']" ).trigger("click");

    //$("#detaillist").scrollTop($("#detaillist").scrollTop() + $("#detaillist > [name='"+locname+"']" ).position().top);

    // https://stackoverflow.com/questions/2346011/how-do-i-scroll-to-an-element-within-an-overflowed-div?noredirect=1&lq=1

    var element = document.getElementById("detaillist");
    //element.scrollTop = element.scrollHeight;
    //$("#detaillist").scrollTop(200);

    $("#detaillist").scrollTo("#detaillist > [name='"+locname+"']");

  } else {
    if (!(param["show"] == "suppliers" || param["show"] == "ppe")) {
        // console.log("Auto select the first location in list")
        //$("#detaillist > div:first-of-type" ).trigger("click");
    }
  }
}

jQuery.fn.scrollTo = function(elem) {

    // BUG Reactivate test with http://localhost:8887/localsite/info/#show=ppe&name=Code_the_South
    /*
    if (typeof $(elem) !== "undefined" && typeof $(this) !== "undefined") { // Exists
      $(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(elem).offset().top);
      return this;
    } else {
      // element does not exist
    }
    */
};

function onTabletopLoad(dp1) {
  //createDocumentSettings(tabletop.sheets(constants.informationSheetName).elements); // Custom - remove
  // Custom
  documentSettings = {

  }

  var points = tabletop.sheets(dp1.sheetName).elements;
  //var layers = determineLayers(points);
  if (documentSettings["Map Type:"] === 'Heatmap') {
    //mapHeatmap(points);
  } else {
    //mapPoints(points, layers);
    //displayListVax(points, layers);
  }
  //console.log(points)
}



function loadGeos(geo, attempts, callback) {

  // load only, no search filter display - get county name from geo value.
  // created from a copy of showCounties() in search-filters.js

  if (typeof d3 !== 'undefined') {

    let hash = getHash();
    let stateID = {AL:1,AK:2,AZ:4,AR:5,CA:6,CO:8,CT:9,DE:10,FL:12,GA:13,HI:15,ID:16,IL:17,IN:18,IA:19,KS:20,KY:21,LA:22,ME:23,MD:24,MA:25,MI:26,MN:27,MS:28,MO:29,MT:30,NE:31,NV:32,NH:33,NJ:34,NM:35,NY:36,NC:37,ND:38,OH:39,OK:40,OR:41,PA:42,RI:44,SC:45,SD:46,TN:47,TX:48,UT:49,VT:50,VA:51,WA:53,WV:54,WI:55,WY:56,AS:60,GU:66,MP:69,PR:72,VI:78,}
    //let theState = "GA"; // TEMP - TODO: loop trough states from start of geo
    let theState = hash.state;

    var geos=geo.split(",");
    fips=[]
    for (var i = 0; i<geos.length; i++){
        fip=geos[i].split("US")[1]
        if(fip.startsWith("0")){
            fips.push(parseInt(geos[i].split("US0")[1]))
        }else{
            fips.push(parseInt(geos[i].split("US")[1]))
        }
    }
    st=(geos[0].split("US")[1]).slice(0,2)
    if(st.startsWith("0")){
        dataObject.stateshown=(geos[0].split("US0")[1]).slice(0,1)
    }else{
        if(geos[0].split("US")[1].length==4){
            dataObject.stateshown=(geos[0].split("US")[1]).slice(0,1)
        }else{
            dataObject.stateshown=(geos[0].split("US")[1]).slice(0,2)
        }
    }

    //Load in contents of CSV file
    if (theState) {
      d3.csv(dual_map.community_data_root() + "us/state/" + theState + "/" + theState + "counties.csv").then(function(myData,error) {
        if (error) {
          //alert("error")
          console.log("Error loading file. " + error);
        }
        let geoArray = [];

        myData.forEach(function(d, i) {

          let geoParams = {};
          d.difference =  d.US_2007_Demand_$;

          // OBJECTID,STATEFP10,COUNTYFP10,GEOID10,NAME10,NAMELSAD10,totalpop18,Reg_Comm,Acres,sq_miles,Label,lat,lon
          //d.name = ;
          //d.idname = "US" + d.GEOID + "-" + d.NAME + " County";

          //d.perMile = Math.round(d.totalpop18 / d.sq_miles).toLocaleString(); // Breaks sort
          d.perMile = Math.round(d.totalpop18 / d.sq_miles);

          d.sq_miles = Number(Math.round(d.sq_miles).toLocaleString());
          var activeGeo = false;
          var theGeo = "US" + d.GEOID;
          //alert(geo + " " + theGeo)
          let geos=geo.split(",");
          //fips=[]
          for (var i = 0; i<geos.length; i++){
              if (geos[i] == theGeo) {
                activeGeo = true;
              }
          }


          geoParams.name = d.NAME;
          geoParams.pop = d.totalpop18;
          geoParams.permile = d.perMile;
          geoParams.active = activeGeo;

          geoArray.push([theGeo, geoParams]); // Append an array with an object as the value
        });

        console.log("geoArray")
        console.log(geoArray)
        dataObject.geos = geoArray;
        callback();
      });
    }
  } else {
    attempts = attempts + 1;
        if (attempts < 2000) {
          // To do: Add a loading image after a coouple seconds. 2000 waits about 300 seconds.
          setTimeout( function() {
            loadGeos(geo,attempts);
          }, 20 );
        } else {
          alert("D3 javascript not available for loading counties csv.")
        }
  }
}

function getMapframe(element) {
  if (element.virtual_tour) {
    if (element.virtual_tour.toLowerCase().includes("kuula.co")) {
      // viewID resides at the end of Kuula incomoing link.
      let pieces = element.virtual_tour.split("/");
      let viewID = pieces[pieces.length-1];
      // Embed Format: "https://kuula.co/share/collection/" + viewID + "?fs=1&vr=1&zoom=0&initload=1&thumbs=1&chromeless=1&logo=-1";
      element.mapframe = "kuula_" + viewID;
    } else {
      // Incoming: https://roundme.com/tour/463798/view/1595277/
      // Embed Format: https://roundme.com/embed/463798/1595277
      element.mapframe = "roundme_" + element.virtual_tour.replace("https://roundme.com/tour/","").replace("view/","");
    }
  }
  return(element.mapframe);
}

function showList(dp,map) {
  
  console.log("Call showList for " + dp.dataTitle + " list")
  var iconColor, iconColorRGB;
  var colorScale = dp.scale;
  let count = 0;
  let showCount = 0;

  var productMatchFound = 0;
  var dataMatchCount = 0;
      // Keyword Search
  var keyword = "";
  var products = "";
  var productcodes = "";
  var products_array = [];
  var productcode_array = [];

  isObject = function(a) {
      return (!!a) && (a.constructor === Object);
  };

  if (dp.listTitle) {$(".listTitle").html(dp.listTitle); $(".listTitle").show()};
  if (dp.listSubtitle) {$(".listSubtitle").html(dp.listSubtitle); $(".listSubtitle").show()};

  // Add checkboxes
  if (dp.search && $("#activeLayer").text() != dp.dataTitle) { // Only set when active layer changes, otherwise selection overwritten on change.
    
    let search = [];
    if (param["search"]) {
      search = param["search"].replace(/\+/g," ").toLowerCase().split(",");
    }
    let checkCols = "";
    let checked = "";
    $.each(dp.search, function( key, value ) {
      checked = "";
      if (search.length == 0) {
        checked = "checked"; // No hash value limiting to specific columns.
      } else if(jQuery.inArray(value, search) !== -1) {
        checked = "checked";
      }
      checkCols += '<div><input type="checkbox" class="selected_col" name="in" id="' + value + '" ' + checked + '><label for="' + value + '" class="filterCheckboxTitle"> ' + key + '</label></div>';
    });
    $("#selected_col_checkboxes").html(checkCols);
    // Populate from hash
    //alert("populate")


    // BUGBUG - When toggling the activeLayer is added, this will need to be cleared to prevent multiple calls to loadMap1
     
    $('.selected_col[type=checkbox]').change(function() {
        //$('#topPanel').hide();
        let search = $('.selected_col:checked').map(function() {return this.id;}).get().join(','); 
        //alert(search)
        /* delete
        var hash = getHash(); 
        if (hash["q"]) {
          alert(hash["q"])
        }
        */
        if ($("#keywordsTB").val()) {
          updateHash({"search":search});
          loadMap1("map.js keywordsTB");
        }
        event.stopPropagation();
    });

  }


  var allItemsPhrase = "all categories";
  if ($("#keywordsTB").val()) {
    keyword = $("#keywordsTB").val().toLowerCase();
  }
  if ($("#catSearch").val()) {
    products = $("#catSearch").val().replace(" AND ",";").toLowerCase().replace(allItemsPhrase,"");
    products_array = products.split2(/\s*;\s*/);
  }
  if ($("#productCodes").val()) {
    // For each product ID - Still to implement, copied for map-filters.js
    productcodes = $("#productCodes").val().replace(";",",");
    productcode_array = productcodes.split2(/\s*,\s*/); // Removes space when splitting on comma
  }

  let selected_col = [];
  selected_col = $('.selected_col:checked').map(function() {return this.id;});
  //let selected_columns_object = {}; // For count of each

  if (selected_col.length == 0 && keyword && keyword != allItemsPhrase && products_array.length == 0) {
    $("#keywordFields").show();
    alert("Please check at least one column to search.")
  }
  var data_sorted = []; // An array of objects
  var data_out = [];

  $("#detaillist").text(""); // Clear prior results

  if (1==2) {
    // ADD DISTANCE
    dp.data.forEach(function(element) {

        if (element[dp.latColumn]) {
          //output += "distance: " + calculateDistance(element[dp.latColumn], element[dp.lonColumn], dp.latitude, dp.longitude, "M");
          element.distance = calculateDistance(element[dp.latColumn], element[dp.lonColumn], dp.latitude, dp.longitude, "M").toFixed(2);
        }
        data_sorted.push(element);
    });
    data_sorted.sort((a, b) => { // Sort by proximity
        return a.distance - b.distance;
    });

    dp.data = data_sorted;
  }

  //alert(dp.data); //TEMP
  let hash = getHash(); 

  dp.data.forEach(function(elementRaw) {
    count++;
    foundMatch = 0;
    productMatchFound = 0;

    if (count > 2000) {
        return;
    }
    let showIt = true;
    if (hash["name"] && elementRaw["name"]) { // Match company name from URL to isolate as profile page.
      //console.log("elementRaw[name] " + elementRaw["name"]);
      if (hash["name"].replace(/\_/g," ") == elementRaw["name"]) {
        //alert(hash["name"])
        showCount++;
      } else {
        showIt = false; // Hide others to show profile below map with all.
      }
    } 

    /*
    if (keyword == allItemsPhrase) { // Use a div argument instead
        keyword == ""; products = "";
        $("#keywordsTB").text(""); // Not working
        foundMatch++;
    } else 
    */
    
    /*
    if (products == allItemsPhrase) {
        console.log("products == allItemsPhrase")
        productMatchFound++;
    } else 
    */

    //if (keyword.length > 0 || products_array.length > 0 || productcode_array.length > 0) {

          if (products_array.length > 0) {
            for(var p = 0; p < products_array.length; p++) { // A list from #catSearch field
              if (products_array[p].length > 0) {

                  if (elementRaw[dp.itemsColumn] && elementRaw[dp.itemsColumn].toLowerCase().indexOf(products_array[p].toLowerCase()) >= 0) {

                    productMatchFound++;

                    //console.log("foundMatch: " + elementRaw[dp.itemsColumn] + " contains: " + products_array[p]);
                    
                  } else {
                    console.log("No Match: " + elementRaw[dp.itemsColumn] + " does not contain: " + products_array[p]);
                  }
              }
            }
          } else {
            productMatchFound = 1; // Matches all products
          }

          if (dataObject.geos && elementRaw[dp.countyColumn]) { // Use name of county pre-loaded into dataObject.
            
            for(var g = 0; g < dataObject.geos.length; g++) {
              if (dataObject.geos[g][1].active == true) {
                //alert(elementRaw[dp.countyColumn])
                //alert(dataObject.geos[g][1].name)
                if(elementRaw[dp.countyColumn].toLowerCase() == dataObject.geos[g][1].name.toLowerCase()) { // If the current row matches an active county

                  //alert(dataObject.geos[g][1].name); // The county name
                  foundMatch++;
                }
                
              }
            }
          } else if (keyword.length > 0) {

            console.log('Search for "' + keyword + '" - Fields to search: ' + JSON.stringify(dp.search));
            
            if (typeof dp.search != "undefined") { // An object containing interface labels and names of columns to search.

            //console.log("Search in selected_col ")
            //console.log(selected_col)

            //console.log("Search in dp.search ")
            //console.log(dp.search)

              $.each(dp.search, function( key, value ) { // Works for arrays and objects. key is the index value for arrays.
                //console.log(elementRaw[key]);
                //selected_columns_object[key] = 0;
                if (elementRaw[value]) {
                  if (elementRaw[value].toString().toLowerCase().indexOf(keyword) >= 0) {
                    foundMatch++;
                  }
                }

              });

            } else { // dp.search is not defined, so try titlecolumn
              //console.log("no dp.search, try: " + elementRaw[dp.titleColumn]);
              if (elementRaw[dp.titleColumn] && elementRaw[dp.titleColumn].toLowerCase().indexOf(keyword) >= 0) {
                console.log("foundMatch in title");
                foundMatch++;
              }
              if (elementRaw[dp.valueColumn] && elementRaw[dp.valueColumn].toLowerCase().indexOf(keyword) >= 0) {
                console.log("foundMatch in value");
                foundMatch++;
              }

              // MIGHT REMOVE
              if ($("#findKeywords").is(":checked") > 0 && elementRaw[dp.keywords] && elementRaw[dp.keywords].toLowerCase().indexOf(keyword) >= 0) {
                console.log("SWITCH TO SEACH OBJECT - foundMatch keywords");
                foundMatch++;
              }

            }

            

            /*
            //if ($(dataSet[i][0].length > 0)) {
              if ($("#findCompany").is(":checked") > 0 && dataSet[i][0].toString().toLowerCase().indexOf(keyword) >= 0) {
                console.log("foundMatch A");
                foundMatch++;
              }
            //}
            if ($("#findWebsite").is(":checked") > 0 && dataSet[i][1].toString().toLowerCase().indexOf(keyword) >= 0) {
              console.log("foundMatch B");
              foundMatch++;
            }
            if ($("#findDetails").is(":checked") > 0 && dataSet[i][2].toString().toLowerCase().indexOf(keyword) >= 0) {
              console.log("foundMatch C");
              foundMatch++;
            }
            if ($("#findProduct").is(":checked") > 0 && dataSet[i][3].toString().toLowerCase().indexOf(keyword) >= 0) {
              console.log("foundMatch D");
              foundMatch++;
            }
            if ($("#findProduct").is(":checked") > 0 && dataSet[i][4].toString().toLowerCase().indexOf(keyword) >= 0) { // Description
              console.log("foundMatch E");
              foundMatch++;
            }
            */

          } else {
            foundMatch++; // No geo or keyword filter
          }

          //console.log("foundMatch " + foundMatch)
          if (1==2) { // Not yet tested here
            console.log("Check if listing's product HS codes match.");
            for(var pc = 0; pc < productcode_array.length; pc++) { 
              if (productcode_array[pc].length > 0) {
                if (isInt(productcode_array[pc])) { // Int
                  //var codesArray = $(this.childNodes[3]).text().replace(";",",").split(/\s*,\s*/);
                  var codesArray = dataSet[i][5].toString().replace(";",",").split2(/\s*,\s*/);
                  for(var j = 0; j < codesArray.length; j++) {
                    if (isInt(codesArray[j])) {
                      if (codesArray[j].startsWith(productcode_array[pc])) { // If columns values start with search values.
                        console.log("codesArray " + j + " " + codesArray[j] + " starts with " + productcode_array[pc]);
                      
                        console.log("foundMatch D");
                        productMatchFound++; // Might not be needed here
                        foundMatch++;
                        //$(this).show();
                      }
                    }
                  }
                } else {
                  console.log("productcode not int")
                  // TO DO: Match the product description instead.

                    //productMatchFound++;

                }
              }
            }
          }

    //} else {
    //  // Automatically find match since there are no filters
    //  //console.log("foundMatch - since no filters");
    //  foundMatch++;
    //}

    if (elementRaw.status == "0") {
      foundMatch = 0;
    }
    //console.log("foundMatch: " + foundMatch + ", productMatchFound: " + productMatchFound);

    if (foundMatch > 0 && productMatchFound > 0) {
      dataMatchCount++;
    //if (count <= 500) {

      data_out.push(elementRaw);
      var key, keys = Object.keys(elementRaw);
      var n = keys.length;
      var element={};
      while (n--) {
        key = keys[n];
        //element[key] = elementRaw[key]; // Also keep uppercase for element["Prepared"]
        element[key.toLowerCase()] = elementRaw[key];
      }

      iconColor = colorScale(element[dp.valueColumn]);
      if (dp.color) { 
        iconColor = dp.color;
      }
      //iconColorRGB = hex2rgb(iconColor);

      //console.log("element state2 " + element.state + " iconColor: " + iconColor)


      /*
      // Make dp lowercase and add element.
      var key, keys = Object.keys(dp);
      var n = keys.length;
      var element={};
      while (n--) {
        key = keys[n];
        if (key != "data") { // Skip dp.data
          element[key.toLowerCase()] = dp[key];
          // BUGBUG, did I accidentally leave off second () here:
          dp[key.toLowerCase()] = dp[key].toLowerCase; // Creates some dups, but fastest that way. Lowercase values then match below
        }
      }
      */

      // Bug, this overwrote element.latitude and element.longitude
      //element = mix(dp,element); // Adds existing column names, giving priority to dp assignments made within calling page.
      
      let name = element.name;
      if (element[dp.nameColumn]) {
        name = element[dp.nameColumn];
      } else if (element.title) {
        name = element.title;
      }
      name = capitalizeFirstLetter(name);
      var theTitleLink = 'https://www.google.com/maps/search/' + (name + ', ' + element.county + ' County').replace(/ /g,"+");

      if (element.website && !element.website.toLowerCase().includes("http")) {
        element.website = "http://" + element.website;
      }
      element.mapframe = getMapframe(element);

      // TO INVESTIGATE - elementRaw (not element) has to be used here for color scale.

      if (1==1) {
        // DETAILS LIST
        // colorScale(element[dp.valueColumn])
        //console.log("iconColor test here: " + iconColor)
        //console.log("color test here: " + colorScale(elementRaw[dp.valueColumn]))

        // Hide all until displayed after adding to dom
        if (element[dp.latColumn] && element[dp.lonColumn]) {
          output = "<div style='display:none' class='detail' name='" + name.replace(/'/g,'&#39;') + "' latitude='" + element[dp.latColumn] + "' longitude='" + element[dp.lonColumn] + "'>";
        } else {
          output = "<div style='display:none' class='detail' name='" + name.replace(/'/g,'&#39;') + "'>";
        }

        output += "<div class='showItemMenu' style='float:right'>&mldr;</div>"; 
        output += "<div style='padding-bottom:4px'><div style='width:15px;height:15px;margin-right:6px;margin-top:8px;background:" + colorScale(elementRaw[dp.valueColumn]) + ";float:left'></div>";

        //output += "<div style='position:relative'><div style='float:left;min-width:28px;margin-top:2px'><input name='contact' type='checkbox' value='" + name + "'></div><div style='overflow:auto'><div>" + name + "</div>";
                  
        //output += "<div style='overflow:auto'>";
        
        output += "<b style='font-size:20px; font-weight:400; color:#333;'>" + name + "</b></div>";
        if (element[dp.description]) {
          output += "<div style='padding-bottom:8px'>" + element[dp.description] + "</div>";
        } else if (element.description) {
          output += "<div style='padding-bottom:8px'>" + element.description + "</div>";
        } else if (element["business description"]) {
          output += "<div style='padding-bottom:8px'>" + element["business description"] + "</div>";
        }

        // Lower
        output += "<div style='font-size:0.95em;line-height:1.5em'>";

        if (element.items) {
          output += "<b>Items:</b> " + element.items + "<br>";
        }
        
        if (element[dp.addressColumn]) { 
            output +=  element[dp.addressColumn] + "<br>"; 
        } else if (element.address || element.city || element.state || element.zip) {
          output += "<b>Location:</b> ";
          if (element.address) {
            output += element.address + "<br>";
          } else {
            if (element.city) {
              output += element.city;
            }
            if (element.state || element.zip) {
              output += ", ";
            }
            if (element.state) {
              output += element.state + " ";
            }
            if (element.zip) {
              output += element.zip;
            }
            if (element.city || element.state || element.zip) {
              output += "<br>";
            }
          }
        }
        if (element.county) {
          output += '<b>Location:</b> ' + element.county + " County<br>";
        }

        if (element.website) {
          if (element.website.length <= 50) {
            output += "<b>Website:</b> <a href='" + element.website + "' target='_blank'>" + element.website.replace("https://","").replace("http://","").replace("www.","").replace(/\/$/, "") + "</a><br>";
          } else {
            // To Do: Display domain only
            output += "<b>Website:</b> <a href='" + element.website + "' target='_blank'>" + element.website.replace("https://","").replace("http://","").replace("www.","").replace(/\/$/, "") + "</a><br>"; 
          }
        } else if (element.webpage) {
          // Switch to calling Webpage, probably add linkify above.
          output += '<b>Webpage:</b> ' + linkify(element.webpage + "<br>");
        }
        if (element.category1) {
          output += "<b>Type:</b> " + element.category1 + "<br>";
        }
        if (element.district) {
          output += "<b>District:</b> " + element.district + "<br>";
        }
        if (element.location) {
          if (isObject(element.location)) {
            // No need to display since Location is also proviced as a string in Brigade data
            //output += "<b>Location Object:</b><br>" + element.location + "<br>";
            //for (e in element.location){
            //  output += "<div>" + e + ": " + element.location[e] + "</div>";
            //}             
          } else {
            output += "<b>Location:</b> " + element.location + "<br>";
          }
        }
        if (element.comments) {
          output += element.comments + "<br>";
        }
        if (element.availability) {
          output += element.availability + "<br>";
        }
        //output += element.name + " View Details<br>";

        if (element.phone || element.phone_afterhours) {
          if (element.phone) {
            output += "<b>Phone:</b> " + element.phone + " ";
          }
          if (element.phone_afterhours) {
           output += element.phone_afterhours;
          }
          output += "<br>";
        }

        if (element.schedule) {
          output += "<b>Hours:</b> " + element.schedule + "<br>";
        }
        if (element["jobs range"]) {
          output += "<b>Employees:</b> " + element["jobs range"] + "<br>";
        } else if (element["jobs 2021"]) {
          output += "<b>Employees:</b> " + element["jobs 2021"] + "<br>";
        }

        if (element[dp.valueColumn]) {
          if (dp.valueColumnLabel) {
            output += "<b>" + dp.valueColumnLabel + ":</b> " + element[dp.valueColumn] + "<br>";
          } else if (element[dp.valueColumn] != element.name) {
            output += element[dp.valueColumn] + "<br>";
          }
        }

        if (element.mapframe) {
            output += "<a href='#show=360&m=" + element.mapframe + "'>Birdseye View<br>";
        }
        if (element.property_link) {
            output += "<a href='" + element.property_link + "'>Property Details</a><br>";
        }
        if (element.county) {
            output += '<a href="' + theTitleLink + '">Google Map</a> ';
        }
        
        if (dp.editLink) {
          if (element.county) {
            output += "&nbsp;| &nbsp;"
          }
          output += "<a href='" + dp.editLink + "' target='edit" + param["show"] + "'>Make Updates</a><br>";
        }
        if (!element.county && !(element[dp.latColumn] && element[dp.lonColumn])) {
          if (!element[dp.lonColumn]) {
            output += "<span>Add latitude and longitude</span><br>";
          } else {
            output += "<span>Add address or lat/lon values</span><br>";
          }
        }

        //alert(dp.listLocation)
        if (dp.listLocation != false) {
          
          if (element[dp.latColumn]) {
              output += "<a href='https://www.waze.com/ul?ll=" + element[dp.latColumn] + "%2C" + element[dp.lonColumn] + "&navigate=yes&zoom=17'>Waze Directions</a>";
          }
        }

        if (element.facebook) {
          if (element.facebook.toLowerCase().indexOf('facebook.com') < 0) {
            element.facebook = 'https://facebook.com/search/top/?q=' + element.facebook.replace(/'/g,'%27').replace(/ /g,'%20')
          }
          if (element[dp.latColumn] && dp.listLocation != false) {
            output += " | ";
          }
          output += "<a href='" + element.facebook + "' target='_blank'>Facebook</a>";
        }
        if (element.twitter) {
          if (element[dp.latColumn] || element.facebook) {
            output += " | ";
          }
          output += "<a href='" + element.twitter + "' target='_blank'>Twitter</a>";
        }
        if ((element[dp.latColumn] && dp.listLocation != false) || element.facebook || element.twitter) {
          output += "<br>";
        }

        if (element.county) {
          //output += element.county + " County<br>";
        }

        
        if (element.distance) {
            output += "<b>Distance:</b> " + element.distance + " miles<br>"; 
          
        }
        output += "</div>"; // End Lower
        output += "</div>"; // End detail

        $("#detaillist").append(output);
      }
    }
  });
  console.log("Total " + dp.dataTitle + " " + count);

  if (hash.name && $("#detaillist > [name='"+ hash.name.replace(/_/g,' ') +"']").length) {
    let listingName = hash.name.replace(/_/g,' ');
    $("#detaillist > [name='"+ listingName.replace(/'/g,'&#39;') +"']").show(); // To do: check if this or next line for apostrophe in name.
    $("#detaillist > [name='"+ listingName +"']").show();
    // Clickit
    setTimeout(function(){  
      $("#detaillist > [name='"+ listingName +"']" ).trigger("click"); // Not working to show close-up map
    }, 100);
  } else {
    $("#detaillist .detail").show(); // Show all
  }
    //$("#detaillist > [name='"+ name.replace(/'/g,'&#39;') +"']").show();

  // BUGBUG - May need to clear first to avoid multiple calls.
  $('.detail').mouseover(
      function() { 
        //popMapPoint(dp, map, $(this).attr("latitude"), $(this).attr("longitude"));
      }
  );

  var imenu = "<div style='display:none'>";
  imenu += "<div id='itemMenu' class='popMenu filterBubble'>";
  imenu += "<div>View On Map</div>";
  imenu += "<div class='localonly mock-up' style='display:none'>Supplier Impact</div>";
  imenu += "<div class='localonly mock-up' style='display:none'>Production Impact</div>";
  imenu += "<div class='localonly mock-up' style='display:none'>Add to Collections</div>";
  imenu += "<hr class='localonly mock-up' style='display:none;padding:0px !important'>";
  imenu += "<div class='localonly mock-up' style='display:none' id='showLocalNews'>Submit Updates</div>";
  imenu += "</div>";
  imenu += "</div>";
  $("body").append(imenu);

  var locmenu = "<div class='showLocMenu' style='float:right;font-size: 24px;cursor: pointer;'>…</div>";
  locmenu += "<div class='locMenu popMenu filterBubble' style='float:right;display:none'>";
  locmenu += "<div class='filterBubble'>";
  locmenu += "<div id='hideSidemap' class='close-X' style='position:absolute;right:0px;top:8px;padding-right:10px;color:#999'>&#10005; Close Map</div>";
  locmenu += "</div>";
  locmenu += "</div>";
  //$("#sidemapbar").prepend(locmenu);

  if (dataMatchCount > 0) {
      let searchFor = "";
      if ($("#catSearch").val()) {
        searchFor = "<b>" + $("#catSearch").val() + "</b> - "; // was twice BUGBUG
      }
      if (dataMatchCount == count) {
        searchFor += dataMatchCount + " records. ";
      } else if (count==1) {
        searchFor += dataMatchCount + " matching results within " + count + " records. ";
      } else {
        searchFor += dataMatchCount + " matching results within " + count + " records. ";
      }
      // alert("showCount " + showCount); // 0 unless filtering for a profile
      //if (showCount == 1 && count - dataMatchCount > 1) {
      if (showCount != dataMatchCount && count != dataMatchCount) {
        if (showCount >= 1) {
          if (showCount > 1) {
            searchFor += " Viewing " + showCount;
          }
          //line below was here
        }
      }
      searchFor += " <div id='viewAllLink' style='float:right;display:none;'><a href='#show=" + param["show"] + "'>View All</a></div>";
      

      if (dp.listInfo) {
        searchFor += dp.listInfo;
      }
      // searchFor += "<br>";
      $("#dataList").html(searchFor);
      $("#resultsPanel").show();
      $("#dataList").show();

      //console.log(selected_col);
      //alert(selected_columns_object[2].value)
  } else {
      $("#dataList").html("No match found in " + count + " records. <a href='#' onclick='clickClearButton();return false;'>Clear Filters</a><br>");
          
    var noMatch = "<div>No match found in " + (dataSet.length - 1) + " records. <a href='#' onclick='clickClearButton();return false;'>Clear filters</a>.</div>"
    $("#nomatchText").html(noMatch);
    $("#nomatchPanel").show();
  }

  $(document).click(function(event) { // Hide open menus
      $('#itemMenu').hide();
      $('#locMenu').hide();
  });

  dp.data = data_out;
  return dp;
}
function capitalizeFirstLetter(str, locale=navigator.language) {
  if (!str) return "";
  return str.replace(/^\p{CWU}/u, char => char.toLocaleUpperCase(locale));
}
function linkify(inputText) { // https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
  //return(inputText);
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">Website</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">Website</a>');

  //Change email addresses to mailto:: links.
  //replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  //replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
  // https://outlook.office365.com/owa/calendar/WhitfieldVaccineSchedule@gets.onmicrosoft.com/bookings/

  return replacedText;
}

function popMapPoint(dp, map, latitude, longitude, name) {
  //return;
  let center = [latitude,longitude];

  // BUGBUG - causes map point on other map to temporarily disappear.
  //map.flyTo(center, 15); // 19 in lake

  // Because flyTo causes points on other map to disappear
  map.setView(center, 11);

  // Add a single map point
  var iconColor, iconColorRGB, iconName;
  var colorScale = dp.scale;

  iconColor = "#440";
  if (dp.color) {
    iconColor = dp.color;
  }
  iconColorRGB = hex2rgb(iconColor);
  iconName = dp.iconName;
  var busIcon = L.IconMaterial.icon({
    icon: iconName,            // Name of Material icon - star
    iconColor: '#fff',         // Material icon color (could be rgba, hex, html name...)
    markerColor: 'rgba(' + iconColorRGB + ',0.7)',  // Marker fill color
    outlineColor: 'rgba(' + iconColorRGB + ',0.7)', // Marker outline color
    outlineWidth: 1,                   // Marker outline width 
  })

  //dp.group2.clearLayers();

  // Attach the icon to the marker and add to the map
  //dp.group2 = 

  // To do: Make this point clickable. Associate popup somehow.
  circle = L.marker([latitude,longitude], {icon: busIcon}).addTo(map)
  circle.bindPopup(name);


  //var markerGroup = L.layerGroup().addTo(map);
  //L.marker([latitude,longitude]).addTo(markerGroup);

  // Didn't work here
  /*
  if (dp.markerType == "google") {
      if (location.host == 'georgia.org' || location.host == 'www.georgia.org') {
        circle = L.marker([element[dp.latColumn], element[dp.lonColumn]]).addTo(dp.group);
      } else {
        // If this line returns an error, try setting dp1.latColumn and dp1.latColumn to the names of your latitude and longitude columns.
        circle = L.marker([latitude,longitude], {icon: busIcon}).addTo(dp.group); // Works, but not in Drupal site.
      }
  } else {
    circle = L.circle([element[dp.latColumn], element[dp.lonColumn]], {
              color: colorScale(element[dp.valueColumn]),
              fillColor: colorScale(element[dp.valueColumn]),
              fillOpacity: 1,
              radius: markerRadius(1,map) // was 50.  Aiming for 1 to 10
          }).addTo(dp.group);
  }
  */
  if (param["initial"] == "response") {
    if (dp.public == "Yes") {
      $(".suppliers_pre_message").hide();
    } else {
      //alert(dp.public)
      $(".suppliers_pre_message").show();
    }
  }
}

// Scales: http://d3indepth.com/scales/
function getScale(data, scaleType, valueCol) {
  var scale;
  if (scaleType === "scaleThreshold") {
    var min = d3.min(data, function(d) { return d[valueCol]; });
    var max = d3.max(data, function(d) { return d[valueCol]; });
    var d = (max-min)/7;
    scale = d3.scaleThreshold()
      .domain([min+1*d,min+2*d,min+3*d,min+4*d,min+5*d,min+6*d])
      .range(['#ffffe0','#ffd59b','#ffa474','#f47461','#db4551','#b81b34','#8b0000']);
  } else if (scaleType === "scaleQuantize") {
    scale = d3.scaleQuantize()
      .domain(d3.extent(data, function(d) { return d[valueCol]; }))
      .range(['#ffffe0','#ffd59b','#ffa474','#f47461','#db4551','#b81b34','#8b0000']);
  } else if (scaleType === "scaleQuantile") {
    scale = d3.scaleQuantile()
      .domain(data.map(function(d) { return d[valueCol]; }).sort(function(a, b){return a-b}))
      .range(['#ffffe0','#ffd59b','#ffa474','#f47461','#db4551','#b81b34','#8b0000']);            
  } else if (scaleType === "scaleOrdinal") {
    scale = d3.scaleOrdinal()
      .domain(data.map(function(d) { return d[valueCol]; }))
      .range(d3.schemePaired);
  }
  return scale;
}

// For pipe separated
function readData(selector, delimiter, columnsNum, valueCol) {
  var psv = d3.dsvFormat(delimiter);
  var initialData = psv.parse(removeWhiteSpaces(d3.select(selector).text())); 
  _data = initialData.filter(function(e) { return e[valueCol].length !== 0; });
  console.log("Skipped: " + (initialData.length - _data.length) + " rows.");
  
  if (typeof columnsNum !== "undefined") {
    _data.forEach( function (row) {
      convertToNumber(row, columnsNum);
    });
  }
  //console.log(_data);
  return _data;
}
function readJsonData(_data, columnsNum, valueCol) {

  //console.log("_data")
  //console.log(_data)
  //return _data;



  // Not needed. Since it's json, first array (row) may not have the same quantity as next ones.
  /*
  var col = [];
   for (var i = 0; i < _data.length; i++) {
        for (var key in _data[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }
  */

  /*
  // Convert numbers to number. Works, but we might not need
    for (var i = 0; i < _data.length; i++) {
      console.log("TTTTEEESSSTTT");
      console.log(_data[i]);
      //for (var j = 0; j < _data[i].length; j++) {
      for (j in _data[i] ) { // For each key in object containing the row's key-value pairs
        //console.log("TTTT3 " + j);
        //for (d in _data[i][j] ) {

        //for (var key in _data[i]) {
          //row = removeWhiteSpaces(row);
          //convertToNumber(row, columnsNum);
          //console.log(_data[i][j]);
          if (isNumeric(_data[i][j])) {
            _data[i][j] = +_data[i][j]; // convert number strings to number
          }
        //}
      }
    };
  */
  return _data;
  
}
function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
function makeRowValuesNumeric(_data, columnsNum, valueCol) {
  //console.log(_data);
  
  // 'for of' loop is more efficient than forEach. 
  // Also works on objects. You can call it like this 'for let d of Object.entries(data){ }'

  // Might not need this, try removing
  if (typeof columnsNum !== "undefined") {
    _data.forEach( function (row) {
      //row = removeWhiteSpaces(row);
      convertToNumber(row, columnsNum);
    });
  }

  //console.log(_data); // Careful, this can overwhelm browser
  return _data;
}
function convertToNumber(d, _columnsNum) {
  for (var perm in d) {
    if (_columnsNum.indexOf(perm) > -1)
      if (Object.prototype.hasOwnProperty.call(d, perm)) {
        d[perm] = +d[perm];
      }
    }  
  return d;
} 

function removeWhiteSpaces (str) {
  return str.replace(/^\s+|\s+$|\s+(?=\s)/g, "");
}


var revealHeader = true;
$('#sidecolumnContent a').click(function(event) {
  revealHeader = false;
  /*
  setTimeout(function(){ 
    var y = $(window).scrollTop();  //your current y position on the page
    //$(window).scrollTop(y-50); // Adjust for fixed header.

  }, 10);
  */
});


// FIXED MAP POSITION ON SCROLL
function elementScrolled(elem) { // scrolled into view
  var docViewTop = $(window).scrollTop();
  var docViewBottom = docViewTop + $(window).height();
  var elemTop = $(elem).offset().top;
  return ((elemTop <= docViewBottom) && (elemTop >= docViewTop));
}
function bottomReached(elem) { // bottom scrolled into view
  var docViewTop = $(window).scrollTop();
  var docViewBottom = docViewTop + $(window).height();
  var hangover = 10; // Extend into the next section, so map remains visible.
  //var elemTop = $(elem).offset().top;
  var elemBottom = $(elem).offset().top + $(elem).height() + hangover - docViewBottom;
  //console.log('offset: ' + $(elem).offset().top + ' height:' + $(elem).height() + ' docViewBottom:' + docViewBottom + ' elemBottom: ' + elemBottom);
  //console.log('bottomReached elemBottom: ' + elemBottom);
  return (elemBottom < 0);
}
function topReached(elem) { // top scrolled out view
  var docViewTop = $(window).scrollTop();
  //var docViewBottom = docViewTop + $(window).height();
  var pretop = 80; // Extend into the next section, so map remains visible.
  //var elemTop = $(elem).offset().top;
  var elemTop = $(elem).offset().top - docViewTop - pretop;
  //console.log('offset: ' + $(elem).offset().top + ' height:' + $(elem).height() + ' docViewBottom:' + docViewBottom + ' elemBottom: ' + elemBottom);
  //console.log('topReached elemTop: ' + elemTop);
  return (elemTop < 0);
}


 // Anchors corresponding to menu items

/*
var scrollItems = menuItems.map(function(){
   var item = $($(this).attr("href"));
    if (item.length) { return item; }
});
var topMenuHeight = 150;
*/


var mapFixed = false;
var previousScrollTop = $(window).scrollTop();
$(window).scroll(function() {
  if (revealHeader == false) {
    $('.headerbar').hide(); $('.showMenuSmNav').show(); $('#logoholderbar').show(); $('#logoholderside').show();
    $('#filterFieldsHolder').hide();
    $('.headerOffset').hide();
    if (!$("#filterFieldsHolder").is(':visible')) { // Retain search filters space at top, unless they are already hidden
      $('#headerFixed').hide();
    }
    
    revealHeader = true; // For next manual scroll
  } else if ($(window).scrollTop() > previousScrollTop) { // Scrolling Up
    if ($(window).scrollTop() > previousScrollTop + 20) { // Scrolling Up fast
      $('.headerbar').hide(); $('.showMenuSmNav').show(); $('#logoholderbar').show(); $('#logoholderside').show();
      //$('#filterFieldsHolder').hide();
      $('.headerOffset').hide();
      if (!$("#filterFieldsHolder").is(':visible')) { // Retain search filters space at top, unless they are already hidden
        $('#headerFixed').hide();
      }
    }
  } else { // Scrolling Down
    if ($(window).scrollTop() < (previousScrollTop - 20)) { // Reveal if scrolling down fast
      $('.headerbar').show(); $('.showMenuSmNav').hide(); $('#logoholderbar').hide(); $('#logoholderside').hide();
      //$('#filterFieldsHolder').show();
      if ($("#headerbar").length) {
        $('.headerOffset').show();
      }
      $('#headerFixed').show();
    } else if ($(window).scrollTop() == 0) { // At top
      $('.headerbar').show(); $('.showMenuSmNav').hide(); $('#logoholderbar').hide(); $('#logoholderside').hide();
      //$('#filterFieldsHolder').show();
      if ($("#headerbar").length) {
        $('.headerOffset').show();
      }
      $('#headerFixed').show();
    }
  }
  previousScrollTop = $(window).scrollTop();

  lockSidemap(mapFixed);
});
function lockSidemap() {
  // Detect when #hublist is scrolled into view and add class mapHolderFixed.
  // Include mapHolderBottom when at bottom.
  if (bottomReached('#hublist')) {
    if (mapFixed==true) { // Only unstick when crossing thresehold to minimize interaction with DOM.
      //console.log('bottom Visible');
      $('#mapHolderInner').removeClass('mapHolderFixed');
      $('#mapHolderInner').addClass('mapHolderBottom');
      // Needs to be at bottom of dev
      mapFixed = false;
    }
  } else if (topReached('#hublist')) {
    if (mapFixed==false) {
      let mapHolderInner = $('#mapHolderInner').width();
      //alert(mapHolderInner)
      $('#mapHolderInner').addClass('mapHolderFixed');
      $("#mapHolderInner").css("width",mapHolderInner);
      $('#mapHolderInner').removeClass('mapHolderBottom');
      //alert("fixed position")
      mapFixed = true;
    }
  } else if(!topReached('#hublist') && mapFixed == true) { // Not top reached (scrolling down)
    $('#mapHolderInner').removeClass('mapHolderFixed');
    mapFixed = false;
  }
}
function calculateDistance(lat1, lon1, lat2, lon2, unit) {
  var radlat1 = Math.PI * lat1/180
  var radlat2 = Math.PI * lat2/180
  //var radlon1 = Math.PI * lon1/180
  //var radlon2 = Math.PI * lon2/180
  var theta = lon1-lon2
  var radtheta = Math.PI * theta/180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180/Math.PI
  dist = dist * 60 * 1.1515
  if (unit=="K") { dist = dist * 1.609344 } // Kilometers
  if (unit=="N") { dist = dist * 0.8684 } // Nautical miles
  return dist
}
$(window).resize(function() {
  $(".headerOffset2").height($("#filterFieldsHolder").height() + "px");
});
console.log('end of localsite/js/map.js');