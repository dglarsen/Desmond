import "ol/ol.css";
import "ol-ext/control/LayerSwitcher.css";
import "ol-ext/control/Search.css";
import "ol-ext/dist/ol-ext.css";

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
import SearchFeature from "./FGSearchFeature.js";
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
  crossOrigin: "anonymous"
});
var updateLegend = function (resolution) {
  var graphicUrl = wmsSource.getLegendUrl(resolution);
  var img = document.getElementById("legend");
  img.src = graphicUrl;
};

var minCond = 1;
var maxCond = 100;
var bins = 21;
/**
 * Calculate the Vegetation Greenness Index (VGI) from an input pixel.  This
 * is a rough estimate assuming that pixel values correspond to reflectance.
 * @param {Array<number>} pixel An array of [R, G, B, A] values.
 * @return {number} The VGI value for the given pixel.
 */

function Cond(pixel) {
  var r = pixel[0] * 1;
  return r;
}
/*
 * Summarize values for a histogram.
 * @param {numver} value A VGI value.
 * @param {Object} counts An object for keeping track of VGI counts.
 */
function summarize(value, counts) {
  var min = counts.min;
  var max = counts.max;
  var num = counts.values.length;
  if (value < min) {
    // do nothing
  } else if (value >= max) {
    counts.values[num - 1] += 1;
  } else {
    var index = Math.floor((value - min) / counts.delta);
    counts.values[index] += 1;
  }
}
/**
 * Create a raster source where pixels with VGI values above a threshold will
 * be colored green.
 */
var raster = new RasterSource({
  sources: [wmsSource],
  /**
   * Run calculations on pixel data.
   * @param {Array} pixels List of pixels (one per source).
   * @param {Object} data User data object.
   * @return {Array} The output pixel.
   */
  operation: function (pixels, data) {
    var pixel = pixels[0];
    var value = Cond(pixel);
    summarize(value, data.counts);
    if (value >= data.threshold) {
      pixel[0] = 255;
      pixel[1] = 255;
      pixel[2] = 255;
      pixel[3] = 75;
    } else {
      pixel[3] = 0;
    }
    return pixel;
  },
  lib: {
    Cond: Cond,
    summarize: summarize
  }
});
raster.set("threshold", 0.1);

function createCounts(min, max, num) {
  var values = new Array(num);
  for (var i = 0; i < num; ++i) {
    values[i] = 0;
  }
  return {
    min: min,
    max: max,
    values: values,
    delta: (max - min) / num
  };
}

raster.on("beforeoperations", function (event) {
  event.data.counts = createCounts(minCond, maxCond, bins);
  event.data.threshold = raster.get("threshold");
});

raster.on("afteroperations", function (event) {
  schedulePlot(event.resolution, event.data.counts, event.data.threshold);
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

var Jsonix = require("jsonix").Jsonix;
var XLink_1_0 = require("w3c-schemas").XLink_1_0;
var GML_2_1_2 = require("ogc-schemas").GML_2_1_2;
var Filter_1_0_0 = require("ogc-schemas").Filter_1_0_0;
var SLD_1_0_0 = require("ogc-schemas").SLD_1_0_0;

var context = new Jsonix.Context(
  [SLD_1_0_0, GML_2_1_2, XLink_1_0, Filter_1_0_0],
  {
    namespacePrefixes: {
      "http://www.w3.org/1999/xlink": "xlink",
      "http://www.opengis.net/sld": "sld"
    }
  }
);

var marshaller = context.createMarshaller();

function generateScale(minimum, maximum) {
  if (!(maximum > minimum)) {
    // TODO: fix this so we don't have hardcoded defaults, or better yet
    // don't make requests for bad parameters
    return [0, 20, 40, 60, 80];
  }
  var range = maximum - minimum;

  var segment = range / 4.0;
  var quantities = [];
  for (var i = 0; i < 5; i++) {
    quantities.push(minimum + i * segment);
  }
  return quantities;
}

function layerSLDJSONFactory(layer_name, minimum, maximum) {
  var quantities = generateScale(minimum, maximum);
  return {
    TYPE_NAME: "SLD_1_0_0.NamedLayer",
    name: layer_name,
    namedStyleOrUserStyle: [
      {
        TYPE_NAME: "SLD_1_0_0.UserStyle",
        title: "FocusedGeo Rainbow Scale",
        featureTypeStyle: [
          {
            TYPE_NAME: "SLD_1_0_0.FeatureTypeStyle",
            rule: [
              {
                TYPE_NAME: "SLD_1_0_0.Rule",
                symbolizer: [
                  {
                    name: {
                      namespaceURI: "http://www.opengis.net/sld",
                      localPart: "IsDefault",
                      prefix: "",
                      key: "{http://www.opengis.net/sld}IsDefault",
                      string: "{http://www.opengis.net/sld}IsDefault"
                    },
                    value: true
                  },
                  {
                    name: {
                      namespaceURI: "http://www.opengis.net/sld",
                      localPart: "RasterSymbolizer",
                      prefix: "",
                      key: "{http://www.opengis.net/sld}RasterSymbolizer",
                      string: "{http://www.opengis.net/sld}RasterSymbolizer"
                    },
                    value: {
                      TYPE_NAME: "SLD_1_0_0.RasterSymbolizer",
                      colorMap: {
                        TYPE_NAME: "SLD_1_0_0.ColorMap",
                        colorMapEntry: [
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#0000ff",
                            quantity: quantities[0]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#00ffff",
                            quantity: quantities[1]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#00ff00",
                            quantity: quantities[2]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#ffff00",
                            quantity: quantities[3]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#ff0000",
                            quantity: quantities[4]
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

function sldJSONFactory(sites_list, minimum, maximum) {
  var layer_sld_array = [];
  for (let site_index in sites_list) {
    layer_sld_array.push(
      layerSLDJSONFactory(sites_list[site_index], minimum, maximum)
    );
  }
  return {
    name: {
      namespaceURI: "http://www.opengis.net/sld",
      localPart: "StyledLayerDescriptor",
      prefix: "",
      key: "{http://www.opengis.net/sld}StyledLayerDescriptor",
      string: "{http://www.opengis.net/sld}StyledLayerDescriptor"
    },
    value: {
      TYPE_NAME: "SLD_1_0_0.StyledLayerDescriptor",
      version: "1.0.0",
      namedLayerOrUserLayer: layer_sld_array
    }
  };
}

function tileLayerFactory(site, sld_xml) {
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
        TILED: true,
        //'STYLES': 'test,FocusedGeo Rainbow Scale',
        SLD_BODY: sld_xml
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
  // TODO: Fix this so that it uses the default value given in the control
  var sld_json = sldJSONFactory([sites_list_31[site_index]], 0, 50);
  var sld_xml = marshaller.marshalString(sld_json);
  var layer = tileLayerFactory(sites_list_31[site_index], sld_xml);
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
  // TODO: Fix this so that it uses the default value given in the control
  var sld_json = sldJSONFactory([sites_list_38[site_index]], 0, 50);
  var sld_xml = marshaller.marshalString(sld_json);
  var layer = tileLayerFactory(sites_list_38[site_index], sld_xml);
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
  // TODO: Fix this so that it uses the default value given in the control
  var sld_json = sldJSONFactory([sites_list_mag[site_index]], 0, 50);
  var sld_xml = marshaller.marshalString(sld_json);
  var layer = tileLayerFactory(sites_list_mag[site_index], sld_xml);
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

var map = new Map({
  target: "map",
  units: "m",
  controls: defaultControls().extend([
    new FullScreen(),
    scaleLine,
    attribution,
    grat,
    new ColorScaleControl()
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
    new ImageLayer({
      source: raster
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
// Initial legend
var resolution = map.getView().getResolution();
updateLegend(resolution);

// Update the legend when the resolution changes
map.getView().on("change:resolution", function (event) {
  var resolution = event.target.getResolution();
  updateLegend(resolution);
});
// var layerSwitcher = new ol.control.LayerSwitcher({        enableOpacitySliders: true    });
var layerSwitcher = new LayerSwitcher();
map.addControl(layerSwitcher);

map.on("singleclick", function (evt) {
  document.getElementById("info").innerHTML = "";
  var viewResolution = /** @type {number} */ (view.getResolution());
  var url = wmsSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    "EPSG:26911",
    { INFO_FORMAT: "text/html" }
  );
  if (url) {
    fetch(url)
      .then(function (response) {
        return response.text();
      })
      .then(function (html) {
        document.getElementById("info").innerHTML = html;
      });
  }
});

map.on("pointermove", function (evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.forEachLayerAtPixel(pixel, function () {
    return true;
  });
  map.getTargetElement().style.cursor = hit ? "pointer" : "";
});
var timer = null;
function schedulePlot(resolution, counts, threshold) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(plot.bind(null, resolution, counts, threshold), 1000 / 60);
}

var barWidth = 5;
var plotHeight = 150;
var chart = d3
  .select("#plot")
  .append("svg")
  .attr("width", barWidth * bins)
  .attr("height", plotHeight);

var chartRect = chart.node().getBoundingClientRect();

var tip = d3.select(document.body).append("div").attr("class", "tip");

function plot(resolution, counts, threshold) {
  var yScale = d3
    .scaleLinear()
    .domain([0, d3.max(counts.values)])
    .range([0, plotHeight]);

  var bar = chart.selectAll("rect").data(counts.values);

  bar.enter().append("rect");

  bar
    .attr("class", function (count, index) {
      var value = counts.min + index * counts.delta;
      return "bar" + (value >= threshold ? " selected" : "");
    })
    .attr("width", barWidth - 2);

  bar
    .transition()
    .attr("transform", function (value, index) {
      return (
        "translate(" +
        index * barWidth +
        ", " +
        (plotHeight - yScale(value)) +
        ")"
      );
    })
    .attr("height", yScale);

  bar.on("mousemove", function (count, index) {
    var threshold = counts.min + index * counts.delta;
    if (raster.get("threshold") !== threshold) {
      raster.set("threshold", threshold);
      raster.changed();
    }
  });

  bar.on("mouseover", function (count, index) {
    var area = 0;
    for (var i = counts.values.length - 1; i >= index; --i) {
      area += resolution * resolution * counts.values[i];
    }
    tip.html(message(counts.min + index * counts.delta, area));
    tip.style("display", "block");
    tip.transition().style({
      left: chartRect.left + index * barWidth + barWidth / 2 + "px",
      top: d3.event.y - 60 + "px",
      opacity: 1
    });
  });

  bar.on("mouseout", function () {
    tip
      .transition()
      .style("opacity", 0)
      .each("end", function () {
        tip.style("display", "none");
      });
  });
}
function message(value, area) {
  var acres = (area / 4046.86).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return acres + " acres at<br>" + value.toFixed(2) + " VGI or above";
}
var search = new SearchFeature({
  //target: $(".options").get(0),
  source: vectorSource,
  property: "name",
  minLength: -1,
  placeholder: "Site Name",
  maxItems: 1000
});
;

search.getInputField().addEventListener("focus", function (e) {
  console.log("Focused");
  search.search();
  search.drawList_("*");
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

//print to scale
var dims = {
  a0: [1189, 841],
  tabloid: [431.8, 279.4],
  a2: [594, 420],
  a3: [420, 297],
  letter: [279.4, 215.9],
  a5: [210, 148]
};

// export options for html-to-image.
// See: https://github.com/bubkoo/html-to-image#options
var exportOptions = {
  filter: function (element) {
    var className = element.className || "";
    return (
      className.indexOf("ol-control") === -1 ||
      className.indexOf("ol-layerswitcher") === -1 ||
      className.indexOf("ol-scale") > -1 ||
      (className.indexOf("ol-attribution") > -1 &&
        className.indexOf("ol-uncollapsible"))
    );
  }
};

var exportButton = document.getElementById("export-pdf");

exportButton.addEventListener(
  "click",
  function () {
    exportButton.disabled = true;
    document.body.style.cursor = "progress";

    var format = document.getElementById("format").value;
    var resolution = document.getElementById("resolution").value;
    var scale = document.getElementById("scale").value;
    var dim = dims[format];
    var width = Math.round((dim[0] * resolution) / 25.4);
    var height = Math.round((dim[1] * resolution) / 25.4);
    var viewResolution = map.getView().getResolution();
    var scaleResolution =
      scale /
      getPointResolution(
        map.getView().getProjection(),
        resolution / 25.4,
        map.getView().getCenter()
      );

    map.once("rendercomplete", function () {
      exportOptions.width = width;
      exportOptions.height = height;
      domtoimage
        .toJpeg(map.getViewport(), exportOptions)
        .then(function (dataUrl) {
          var pdf = new jsPDF("landscape", undefined, format);
          pdf.addImage(dataUrl, "JPEG", 0, 0, dim[0], dim[1]);
          pdf.save("map.pdf");
          // Reset original map size
          scaleLine.setDpi();
          map.getTargetElement().style.width = "";
          map.getTargetElement().style.height = "";
          map.updateSize();
          map.getView().setResolution(viewResolution);
          exportButton.disabled = false;
          document.body.style.cursor = "auto";
        });
    });

    // Set print size
    scaleLine.setDpi(resolution);
    map.getTargetElement().style.width = width + "px";
    map.getTargetElement().style.height = height + "px";
    map.updateSize();
    map.getView().setResolution(scaleResolution);
  },
  false
);
0.168;
