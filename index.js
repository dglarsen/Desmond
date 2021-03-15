import "ol/ol.css";
import "ol-ext/control/LayerSwitcher.css";
import "ol-ext/control/Search.css";
import "ol-ext/dist/ol-ext.css";

var styles = `
      .ol-control.ol-bar .ol-option-bar .ol-control {
        display: table-row;
      }
      .ol-control.ol-bar .ol-control.ol-option-bar {
        top: -200px;
        left: -600px;
      }
      .ol-control.ol-bar {
        top: auto;
        left: auto;
        right: 5px;
        bottom: 45px;
      }
}
`
var styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = styles
document.head.appendChild(styleSheet)

import BingMaps from "ol/source/BingMaps";
import Map from "ol/Map";
import View from "ol/View";
import { Fill, Stroke, Circle, Style, Text } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import LayerGroup from "ol/layer/Group";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import TileWMS from "ol/source/TileWMS";
import FullScreen from "ol/control/FullScreen";
import Attribution from "ol/control/Attribution";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";
import Bar from "ol-ext/control/Bar";
import Toggle from "ol-ext/control/Toggle";
import TextButton from "ol-ext/control/TextButton";
import WMSCapabilities from "ol/format/WMSCapabilities";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import FeatureSelect from "ol/interaction/Select";
import RasterSource from "ol/source/Raster";
import ImageWMS from "ol/source/ImageWMS";
import { ScaleLine, Control, defaults as defaultControls } from "ol/control";
import { getPointResolution, get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
import Graticule from "ol-ext/control/Graticule";
import { fromLonLat } from "ol/proj";
import ColorScaleControl from "./FGColorScaleControl"
import SearchFeature from "./FGSearchFeature";
import PrintScaleControl from "./FGPrintScaleControl";
import ColorScaleLegendControl from "./FGColorScaleLegendControl";
//import HistogramControl from "./FGHistogramControl";
//import ClickInfoControl from "./FGClickInfoControl";

proj4.defs(
  "EPSG:26911",
  "+proj=utm +zone=11 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs "
);
register(proj4);
var proj26911 = getProjection("EPSG:26911");
proj26911.setExtent([202273.913, 2989975.9668, 797726.087, 8696934.7173]);
var projectExtent = proj26911.getExtent();
var size = getWidth(projectExtent) / 256;
var resolutions = new Array(19);
var matrixIds = new Array(19);
for (var z = 0; z < 19; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var grat = new Graticule({
  step: 20,
  stepCoord: 2,
  projection: "EPSG:26911"
});

var labelStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    rotation: 0,
    textAlign: "left",
    overflow: true,
    fill: new Fill({
      color: "#000"
    }),
    stroke: new Stroke({
      color: "#fff",
      width: 3
    })
  })
});

var wellStyle = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({ color: "rgba(255, 0, 0, 0.1)" }),
    stroke: new Stroke({ color: "blue", width: 1 })
  })
});
var style = [wellStyle, labelStyle];

var parser = new WMSCapabilities();
var capabilities;
fetch(
  "https://larsenwest.ca:8443/geoserver/wms?service=WMS&version=1.1.1&request=GetCapabilities"
).then(function (response) {
  response.text().then(function (data) {
    capabilities = parser.read(data);
    for (let layer_index in layer_list_31) {
      var layer = layer_list_31[layer_index];
      layer.setExtent(
        capabilities["Capability"]["Layer"]["Layer"].find(function (element) {
          // UTM ZONE 11 vs Google Proj
          return element["Name"] == layer.getSource().getParams()["LAYERS"];
        })["BoundingBox"][0]["extent"]
      );
    }
    for (let layer_index in layer_list_mag) {
      var layer = layer_list_mag[layer_index];
      layer.setExtent(
        capabilities["Capability"]["Layer"]["Layer"].find(function (element) {
          // UTM ZONE 11 vs Google Proj
          return element["Name"] == layer.getSource().getParams()["LAYERS"];
        })["BoundingBox"][0]["extent"]
      );
    }

    for (let layer_index in layer_list_38) {
      var layer = layer_list_38[layer_index];
      layer.setExtent(
        capabilities["Capability"]["Layer"]["Layer"].find(function (element) {
          // UTM ZONE 11 vs Google Proj
          return element["Name"] == layer.getSource().getParams()["LAYERS"];
        })["BoundingBox"][0]["extent"]
      );
    }
  });
});

//histogram calc
var wmsSource = new ImageWMS({
  url: "https://larsenwest.ca:8443/geoserver/wms",
  title: "wmsLayer",
  params: {
    LAYERS: "TallCree_2751:NorthTallCree_Area1_EM31"
  },
  serverType: "geoserver",
  //crossOrigin: "anonymous"
  crossOrigin: ""
});

var wmsLayer = new ImageLayer({
  source: wmsSource
});

var vectorSource = new VectorSource({
  format: new GeoJSON(),
  url:
  "https://larsenwest.ca:8443/geoserver/focusedgeo_postgis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=focusedgeo_postgis:TallCree_SiteList&maxFeatures=50&outputFormat=application/json&srsname=EPSG:26911"
});

var fill = new Fill({
  color: "rgba(255,255,255,0.4)"
});

var stroke = new Stroke({
  color: "#3399CC",
  width: 1.25
});

function tileLayerFactory(site) {
  var title = site.split(":")[1];
  return new TileLayer({
    title: title,
    //extent: [-13884991, 2870341, -7455066, 6338219],
    preload: 0,
    visible: true,
    source: new TileWMS({
      projection: "EPSG:900913",
      url: "https://larsenwest.ca:8443/geoserver/TallCree_2751/wms",
      attributions:
      '© <a href="https://aksgeoscience.com" ><img src="akslogo.jpg"></a>',
      crossOrigin: "",
      params: {
        LAYERS: site,
        TILED: true
      },
      serverType: "geoserver"
      //  enableOpacitySliders: true
      //  transition: 0,
    })
  });
}

var sites_list_31 = [
  "TallCree_2751:BeaverRanch_EM31",
  "TallCree_2751:NorthTallCree_Area1_EM31",
  "TallCree_2751:NorthTallCree_Area2_EM31",
  "TallCree_2751:OldLandFill_EM31",
  "TallCree_2751:SouthLandFill_EM31"
];
var layer_list_31 = [];
for (let site_index in sites_list_31) {
  var layer = tileLayerFactory(sites_list_31[site_index]);
  layer_list_31.push(layer);
}

var sites_list_38 = [
  "TallCree_2751:BeaverRanch_EM31_Inphase",
  "TallCree_2751:NorthTallCree_Area1_EM31_Inphase",
  "TallCree_2751:NorthTallCree_Area2_EM31_Inphase",
  "TallCree_2751:OldLandFill_EM31_Inphase",
  "TallCree_2751:SouthLandFill_EM31_Inphase"
];

var layer_list_38 = [];
for (let site_index in sites_list_38) {
  var layer = tileLayerFactory(sites_list_38[site_index]);
  layer_list_38.push(layer);
}
var sites_list_mag = [
  "TallCree_2751:BeaverRanch_MAG",
  "TallCree_2751:NorthTallCree_Area1_MAG",
  "TallCree_2751:NorthTallCree_Area2_MAG",
  "TallCree_2751:OldLandFill_MAG",
  "TallCree_2751:SouthLandFill_MAG"
];

var layer_list_mag = [];
for (let site_index in sites_list_mag) {
  var layer = tileLayerFactory(sites_list_mag[site_index]);
  layer_list_mag.push(layer);
}
var sites_vector_layer = new VectorLayer({
  source: vectorSource,
  title: "Sites",
  style: new Style({
    image: new Circle({
      fill: fill,
      stroke: stroke,
      radius: 5
    }),
    fill: fill,
    stroke: stroke
  })
});
//var scaleLine = new ScaleLine({});
var scaleLine = new ScaleLine({ bar: true, text: true, minWidth: 125 });
var view = new View({
  // center: fromLonLat([4.8, 47.75]),
  center: [582100, 6436700],
  projection: proj26911,
  //center: [-12882970.16, 8061171.78],
  //projection: projection,
  zoom: 16
});
var attribution = new Attribution({
  collapsible: false
});
//grid

//end of grid
var colorScaleControl31 = new ColorScaleControl();
colorScaleControl31.setName("<u>EM31:</u> ");
colorScaleControl31.setLayerList(layer_list_31);
//colorScaleControl31.element.style.bottom = "180px";
//colorScaleControl31.element.style.right = "10px";
var colorScaleControl38 = new ColorScaleControl();
colorScaleControl38.setName("<u>EM38:</u> ");
colorScaleControl38.setLayerList(layer_list_38);
//colorScaleControl38.element.style.bottom = "210px";
//colorScaleControl38.element.style.right = "10px";
var colorScaleControlMag = new ColorScaleControl();
colorScaleControlMag.setName("<u>MAG:</u> ");
colorScaleControlMag.setLayerList(layer_list_mag);
//colorScaleControlMag.element.style.bottom = "240px";
//colorScaleControlMag.element.style.right = "10px";


function toggleGraticuleLines(on) {
  var style;
  if(on) {
    style = new Style({
      text: new Text({
        font: "12px Calibri,sans-serif",
        rotation: 0,
        textAlign: "left",
        overflow: true,
        fill: new Fill({
          color: "#000"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3
        })
      }),
      stroke: new Stroke({
        color: "#000",
        width: 1
      }),
      fill: new Fill({
        color: "#fff"
      })
    });
  } else {
    style = new Style({
      text: new Text({
        font: "12px Calibri,sans-serif",
        rotation: 0,
        textAlign: "left",
        overflow: true,
        fill: new Fill({
          color: "#000"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3
        })
      }),
      fill: new Fill({
        color: "#000"
      })
    });
  }
  grat.setStyle(style);
  map.render();
};

var map = new Map({
  target: "map",
  units: "m",
  controls: defaultControls().extend([
    new FullScreen(),
    scaleLine,
    attribution
  ]),
  layers: [
    new TileLayer({
      visible: true,
      title: "Bing",
      preload: Infinity,
      source: new BingMaps({
        key:
        "82o22Jd9KBSXdi7KOw9F~-ljDB0Kkf0oF-Egpwvb9_w~Aqsa-2Is6gI2fOr88_Kgqe8RC041lQaheYQt9ISHnZ2L4jpJkBerWGqwZ2t31CRV",
        imagerySet: "Aerial",
        // use maxZoom 19 to see stretched tiles instead of the BingMaps
        // "no photos at this zoom level" tiles
        maxZoom: 19
      })
    }),
    new LayerGroup({
      title: "Magnetometer",
      visible: false,
      layers: layer_list_mag
    }),
    new LayerGroup({
      title: "EM31_inphase",
      visible: false,
      layers: layer_list_38
    }),
    new LayerGroup({
      title: "EM31",
      layers: layer_list_31
    }),
    new TileLayer({
      title: "EM31_notFactory",
      //extent: [-13884991, 2870341, -7455066, 6338219],
      //   preload: Infinity,
      visible: false,
      source: new TileWMS({
        crossOrigin: "",
        url: "https://larsenwest.ca:8443/geoserver/TallCree_2751/wms",
        params: {
          LAYERS:
          "SouthLandFill_EM31,NorthTallCree_Area2_EM31,OldLandFill_EM31,BeaverRanch_EM31,NorthTallCree_Area1_EM31",
          TILED: true
        },
        serverType: "geoserver"
        //  enableOpacitySliders: true
        //  transition: 0,
      })
    }),
    new TileLayer({
      title: "EM track",
      //extent: [-13884991, 2870341, -7455066, 6338219],
      //   preload: Infinity,
      visible: true,
      source: new TileWMS({
        crossOrigin: "",
        url: "https://larsenwest.ca:8443/geoserver/TallCree_2751/wms",
        params: {
          LAYERS:
          "SouthLandFill_track,NorthTallCree_Area2_track,OldLandFill_track,BeaverRanch_EM31_track,NorthTallCree_Area1_track",
          TILED: true
        },
        serverType: "geoserver"
        //  enableOpacitySliders: true
        //  transition: 0,
      })
    }),
    sites_vector_layer
  ],
  view: view
});

map.addControl(grat);

var color_scale_legend = new ColorScaleLegendControl(wmsSource);
map.addControl(color_scale_legend);
color_scale_legend.setup();
// var layerSwitcher = new ol.control.LayerSwitcher({        enableOpacitySliders: true    });
var layerSwitcher = new LayerSwitcher();
map.addControl(layerSwitcher);

//var click_info_control = new ClickInfoControl();
//map.addControl(click_info_control);
//click_info_control.setup(map, wmsSource);

//var histogram_control = new HistogramControl(map, wmsSource);
//map.addControl(histogram_control);
//histogram_control.setup(map);


var search = new SearchFeature({
  //target: $(".options").get(0),
  source: vectorSource,
  property: "name",
  minLength: -1,
  placeholder: "Site Name",
  maxItems: 1000
});

// Select feature when click on the reference index
search.on("select", function (e) {
  // select.getFeatures().clear();
  // select.getFeatures().push (e.search);
  var p = e.search.getGeometry().getFirstCoordinate();
  map.getView().animate({
    center: p,
    zoom: 17
  });
});


map.addControl(search);

var feature_select = new FeatureSelect();

map.addInteraction(feature_select);
feature_select.on("select", function (e) {
  if (e.selected[0])
  e.selected[0].setStyle(function (feature) {
    labelStyle.getText().setText(feature.get("name"));
    return style;
  });

  //var style = sites_vector_layer.getStyle();
});

var print = new PrintScaleControl();

var sub1 = new Bar(
  {	toggleOne: true,
    controls:
    [
      colorScaleControl31,
      colorScaleControl38,
      colorScaleControlMag,
      print,
      new Toggle({
        html: 'Grid',
        active:true,
        onToggle: function() {
        toggleGraticuleLines(this.getActive());
        }
      })
    ]
  });

var mainbar = new Bar(
  {	controls: [
    new Toggle(
      {	html: 'Tools',
      // First level nested control bar
      bar: sub1,
      onToggle: function() {}
    })
  ]
});
map.addControl ( mainbar );
