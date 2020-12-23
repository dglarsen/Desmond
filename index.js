import 'ol/ol.css';
import 'ol-ext/control/LayerSwitcher.css';
import 'ol-ext/control/Search.css';
import "ol-ext/dist/ol-ext.css";

import BingMaps from 'ol/source/BingMaps';
import Map from 'ol/Map';
import View from 'ol/View';
import { transform } from 'ol/proj';
import {Fill, Stroke, Circle, Style} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import LayerGroup from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import Zoom from 'ol/control/Zoom';
import ZoomSlider from 'ol/control/ZoomSlider';
import FullScreen from 'ol/control/FullScreen';
import ScaleLine from 'ol/control/ScaleLine';
import Attribution from 'ol/control/Attribution';
import {Control, defaults as defaultControls} from 'ol/control';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import SearchFeature from 'ol-ext/control/SearchFeature';
import Select from 'ol-ext/control/Select';

// TODO: fix this ugly hack, bad bad bad
var minimum = document.createElement('input');
var maximum = document.createElement('input');

var ColorScaleControl = /*@__PURE__*/(function (Control) {
  function ColorScaleControl(opt_options) {
    var options = opt_options || {};

    minimum.type = "number";
    minimum.value = 0;

    maximum.type = "number";
    maximum.value = 10;

    var element = document.createElement('div');
    element.id = 'ColorScale';
    element.className = 'rotate-north ol-unselectable ol-control';
    element.appendChild(minimum);
    element.appendChild(maximum);

    Control.call(this, {
      element: element,
      target: options.target,
    });

    minimum.addEventListener('change', this.handleChange.bind(this), false);
    maximum.addEventListener('change', this.handleChange.bind(this), false);
  }

  if ( Control ) ColorScaleControl.__proto__ = Control;
  ColorScaleControl.prototype = Object.create( Control && Control.prototype );
  ColorScaleControl.prototype.constructor = ColorScaleControl;

  ColorScaleControl.prototype.handleChange = function handleChange () {
    for (let layer_index in layer_list) {
      var source = layer_list[layer_index].getSource();
      var params = source.getParams();
      // TODO: this is fragile, will only work for sources with one layer
      var sld_json = sldJSONFactory([params["LAYERS"]], parseFloat(minimum.value), parseFloat(maximum.value));
      var sld_xml = marshaller.marshalString(sld_json);
      params['SLD_BODY'] = sld_xml;
      source.updateParams(params);
    }
  };

  return ColorScaleControl;
}(Control));

var vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: 'https://larsenwest.ca:8443/geoserver/focusedgeo_postgis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=focusedgeo_postgis:Canlin_EM_LIST_dec15&maxFeatures=50&outputFormat=application/json'
    });

 var fill = new Fill({
   color: 'rgba(255,255,255,0.4)'
 });

 var stroke = new Stroke({
   color: '#3399CC',
   width: 1.25
 });

 var Jsonix = require('jsonix').Jsonix;
 var XLink_1_0 = require('w3c-schemas').XLink_1_0;
 var GML_2_1_2 = require('ogc-schemas').GML_2_1_2;
 var Filter_1_0_0 = require('ogc-schemas').Filter_1_0_0;
 var SLD_1_0_0 = require('ogc-schemas').SLD_1_0_0;

 var context =  new Jsonix.Context([SLD_1_0_0,GML_2_1_2,XLink_1_0,Filter_1_0_0],  {
             namespacePrefixes : {
                 'http://www.w3.org/1999/xlink' : 'xlink',
                 'http://www.opengis.net/sld' : 'sld' }
             });

 var marshaller = context.createMarshaller();

function generateScale(minimum, maximum) {
  if(!(maximum > minimum)) {
    // TODO: fix this so we don't have hardcoded defaults, or better yet
    // don't make requests for bad parameters
    return [0, 20, 40, 60, 80];
  }
  var range = maximum - minimum;

  var segment = range / 4.0;
  var quantities = [];
  for (var i = 0; i < 5; i++) {
    quantities.push(minimum+(i * segment));
  }
  return quantities;
}

 function layerSLDJSONFactory (layer_name, minimum, maximum) {
   var quantities = generateScale(minimum, maximum);
   return {
     "TYPE_NAME": "SLD_1_0_0.NamedLayer",
     "name": layer_name,
     "namedStyleOrUserStyle": [
       {
         "TYPE_NAME": "SLD_1_0_0.UserStyle",
         "title": "FocusedGeo Rainbow Scale",
         "featureTypeStyle": [
           {
             "TYPE_NAME": "SLD_1_0_0.FeatureTypeStyle",
             "rule": [
               {
                 "TYPE_NAME": "SLD_1_0_0.Rule",
                 "symbolizer": [
                   {
                     "name": {
                       "namespaceURI": "http://www.opengis.net/sld",
                       "localPart": "IsDefault",
                       "prefix": "",
                       "key": "{http://www.opengis.net/sld}IsDefault",
                       "string": "{http://www.opengis.net/sld}IsDefault"
                     },
                     "value": true
                   },
                   {
                     "name": {
                       "namespaceURI": "http://www.opengis.net/sld",
                       "localPart": "RasterSymbolizer",
                       "prefix": "",
                       "key": "{http://www.opengis.net/sld}RasterSymbolizer",
                       "string": "{http://www.opengis.net/sld}RasterSymbolizer"
                     },
                     "value": {
                       "TYPE_NAME": "SLD_1_0_0.RasterSymbolizer",
                       "colorMap": {
                         "TYPE_NAME": "SLD_1_0_0.ColorMap",
                         "colorMapEntry": [
                           {
                             "TYPE_NAME": "SLD_1_0_0.ColorMapEntry",
                             "color": "#0000ff",
                             "quantity": quantities[0]
                           },
                           {
                             "TYPE_NAME": "SLD_1_0_0.ColorMapEntry",
                             "color": "#00ffff",
                             "quantity": quantities[1]
                           },
                           {
                             "TYPE_NAME": "SLD_1_0_0.ColorMapEntry",
                             "color": "#00ff00",
                             "quantity": quantities[2]
                           },
                           {
                             "TYPE_NAME": "SLD_1_0_0.ColorMapEntry",
                             "color": "#ffff00",
                             "quantity": quantities[3]
                           },
                           {
                             "TYPE_NAME": "SLD_1_0_0.ColorMapEntry",
                             "color": "#ff0000",
                             "quantity": quantities[4]
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
   }
 }

function sldJSONFactory(sites_list, minimum, maximum) {

  var layer_sld_array = [];
  for (let site_index in sites_list) {
       layer_sld_array.push(layerSLDJSONFactory(sites_list[site_index], minimum, maximum));
  }
  return  {
    "name": {
      "namespaceURI": "http://www.opengis.net/sld",
      "localPart": "StyledLayerDescriptor",
      "prefix": "",
      "key": "{http://www.opengis.net/sld}StyledLayerDescriptor",
      "string": "{http://www.opengis.net/sld}StyledLayerDescriptor"
    },
    "value": {
      "TYPE_NAME": "SLD_1_0_0.StyledLayerDescriptor",
      "version": "1.0.0",
      "namedLayerOrUserLayer": layer_sld_array
    }
  };
}

function tileLayerFactory(site, sld_xml) {
  var title = site.split(":")[1];
  return new TileLayer({
      title: title,
      //extent: [-13884991, 2870341, -7455066, 6338219],
      preload: Infinity,
      visible: true,
      source: new TileWMS({
             url: 'https://larsenwest.ca:8443/geoserver/Canlin/wms',
             attributions: '© <a href="https://aksgeoscience.com" >AKS Geoscience</a>',
             params: {
                       'LAYERS': site,
                       'TILED': true,
                       //'STYLES': 'test,FocusedGeo Rainbow Scale',
                       'SLD_BODY': sld_xml
             },
             serverType: 'geoserver',
             //  enableOpacitySliders: true
             //  transition: 0,
         }),
        'SLD_BODY': sld_xml
    })
}

var sites_list = ['Canlin:site_10_11_26_13_02w4_31', 'Canlin:site_11_16_20_013_02w4_31', 'Canlin:site_12_16_27_013_02w4_31', 'Canlin:site_13_08_22_013_02w4_31', 'Canlin:site_14_06_29_013_03w4_31', 'Canlin:site_15_06_33_013_02w4_31', 'Canlin:site_16_08_26_013_03w4_31', 'Canlin:site_17_08_29_013_03w4_31', 'Canlin:site_18_08_32_013_03w4_31', 'Canlin:site_19_06_24_016_02w4_31', 'Canlin:site_1_15_25_014_02w4_31', 'Canlin:site_20_10_11_015_02w4_31', 'Canlin:site_21_14_19_016_01w4_31', 'Canlin:site_22_14_24_016_02w4_31', 'Canlin:site_23_16_09_015_01w4_31', 'Canlin:site_24_16_24_016_02w4_31', 'Canlin:site_25_05_15_016_02w4_31', 'Canlin:site_26_08_15_016_02w4_31', 'Canlin:site_27_14_23_016_02w4_31', 'Canlin:site_28_14_35_017_01w4_31', 'Canlin:site_29_16_23_016_02w4_31', 'Canlin:site_2_16_25_014_02w4_31', 'Canlin:site_30_04_20_019_01w4_31', 'Canlin:site_31_04_21_019_01w4_31', 'Canlin:site_32_06_16_019_01w4_31', 'Canlin:site_33_06_17_019_01w4_31', 'Canlin:site_34_10_16_019_01w4_31', 'Canlin:site_35_10-17-019-01w4_31', 'Canlin:site_3_02_36_014_02w4_31', 'Canlin:site_4_06_36_014_02w4_31', 'Canlin:site_5_08_03_015_02w4_31', 'Canlin:site_6_08_27_014_02w4_31', 'Canlin:site_7_14_18_015_01w4_31', 'Canlin:site_8_06_32_013_02w4_31', 'Canlin:site_9_10_30_013_02w4_31'];

var layer_list = [];
for (let site_index in sites_list) {
  var sld_json = sldJSONFactory([sites_list[site_index]], 0, 10);
  var sld_xml = marshaller.marshalString(sld_json);
  var layer = tileLayerFactory(sites_list[site_index], sld_xml);
  layer_list.push(layer);
}

/*******Temporary Code for testing**************/
var sites_list = ["Canlin:site_10_11_26_13_02w4_31", "Canlin:site_21_14_19_016_01w4_31"];
var sld_json = sldJSONFactory(sites_list);

var sld_xml = marshaller.marshalString(sld_json);

var sites_source = new TileWMS({
      url: 'https://larsenwest.ca:8443/geoserver/Canlin/wms',
    attributions: '© <a href="https://aksgeoscience.com" >AKS Geoscience</a>',
      params: {
        'LAYERS':'site_10_11_26_13_02w4_31,site_11_16_20_013_02w4_31,site_12_16_27_013_02w4_31,site_13_08_22_013_02w4_31,site_14_06_29_013_03w4_31,site_15_06_33_013_02w4_31,site_16_08_26_013_03w4_31,site_17_08_29_013_03w4_31,site_18_08_32_013_03w4_31,site_19_06_24_016_02w4_31,site_1_15_25_014_02w4_31,site_20_10_11_015_02w4_31,site_21_14_19_016_01w4_31,site_22_14_24_016_02w4_31,site_23_16_09_015_01w4_31,site_24_16_24_016_02w4_31,site_25_05_15_016_02w4_31,site_26_08_15_016_02w4_31,site_27_14_23_016_02w4_31,site_28_14_35_017_01w4_31,site_29_16_23_016_02w4_31,site_2_16_25_014_02w4_31,site_30_04_20_019_01w4_31,site_31_04_21_019_01w4_31,site_32_06_16_019_01w4_31,site_33_06_17_019_01w4_31,site_34_10_16_019_01w4_31,site_35_10-17-019-01w4_31,site_3_02_36_014_02w4_31,site_4_06_36_014_02w4_31,site_5_08_03_015_02w4_31,site_6_08_27_014_02w4_31,site_7_14_18_015_01w4_31,site_8_06_32_013_02w4_31,site_9_10_30_013_02w4_31',
        'TILED': true
      },
  serverType: 'geoserver',
//  enableOpacitySliders: true
//  transition: 0,
});

/*******END: Temporary Code for testing**************/
var map = new Map({
    target: 'map',
		controls: defaultControls().extend([
					new FullScreen(),
					new ScaleLine(),
          new ColorScaleControl()
					]),
	layers: [
        new TileLayer({
			  visible: true,
			  title: "Bing",
			  preload: Infinity,
			  source: new BingMaps({
				key:
				'82o22Jd9KBSXdi7KOw9F~-ljDB0Kkf0oF-Egpwvb9_w~Aqsa-2Is6gI2fOr88_Kgqe8RC041lQaheYQt9ISHnZ2L4jpJkBerWGqwZ2t31CRV',
				imagerySet: 'Aerial',
				// use maxZoom 19 to see stretched tiles instead of the BingMaps
				// "no photos at this zoom level" tiles
				 maxZoom: 19
       }),
			}),
							/*	 new TileLayer({
									  				  title: 'EM31',
										//extent: [-13884991, 2870341, -7455066, 6338219],
										preload: Infinity,
										visible: true,
										source: sites_source,
					 }),

			new TileLayer({
			    title: 'TEST',
					//extent: [-13884991, 2870341, -7455066, 6338219],
					preload: Infinity,
					visible: true,
					source: new TileWMS({
					       url: 'https://larsenwest.ca:8443/geoserver/Canlin/wms',
					       attributions: '© <a href="https://aksgeoscience.com" >AKS Geoscience</a>',
								 params: {
								           'LAYERS':'Canlin:site_10_11_26_13_02w4_31, Canlin:site_21_14_19_016_01w4_31',
													 'TILED': true,
                           //'STYLES': 'test,FocusedGeo Rainbow Scale',
                           'SLD_BODY': sld_xml
								 },
								 serverType: 'geoserver',
								 //  enableOpacitySliders: true
								 //  transition: 0,
             }),
			  }) ,
					  new TileLayer({
									  				  title: 'EM track',
										//extent: [-13884991, 2870341, -7455066, 6338219],
										preload: Infinity,
										visible: false,
										source: new TileWMS({
												  url: 'https://larsenwest.ca:8443/geoserver/Canlin/wms',
												attributions: '© <a href="https://aksgeoscience.com" >AKS Geoscience</a>',
													params: {
														'LAYERS':														'site_10_11_26_13_02w4_31_track,site_11_16_20_013_02w4_31_track,site_12_16_27_013_02w4_31_track,site_13_08_22_013_02w4_31_track,site_14_06_29_013_03w4_31_track,site_15_06_33_013_02w4_31_track,site_16_08_26_013_03w4_31_track,site_17_08_29_013_03w4_31_track,site_18_08_32_013_03w4_31_track,site_19_06_24_016_02w4_31_track,site_1_15_25_014_02w4_31_track,site_20_10_11_015_02w4_31_track,site_21_14_19_016_01w4_31_track,site_22_14_24_016_02w4_31_track,site_23_16_09_015_01w4_31_track,site_24_16_24_016_02w4_31_track,site_25_05_15_016_02w4_31_track,site_26_08_15_016_02w4_31_track,site_27_14_23_016_02w4_31_track,site_28_14_35_017_01w4_31_track,site_29_16_23_016_02w4_31_track,site_2_16_25_014_02w4_31_track,site_30_04_20_019_01w4_31_track,site_31_04_21_019_01w4_31_track,site_32_06_16_019_01w4_31_track,site_33_06_17_019_01w4_31_track,site_34_10_16_019_01w4_31_track,site_35_10_17_019_01w4_31_track,site_3_02_36_014_02w4_31_track,site_4_06_36_014_02w4_31_track,site_5_08_03_015_02w4_31_track,site_6_08_27_014_02w4_31_track,site_7_14_18_015_01w4_31_track,site_8_06_32_013_02w4_31_track,site_9_10_30_013_02w4_31_track',
														'TILED': true
													},
										  serverType: 'geoserver',
										//  enableOpacitySliders: true
										//  transition: 0,
								}),
					 }),
					  new TileLayer({
									  				  title: 'EM38',
										//extent: [-13884991, 2870341, -7455066, 6338219],
										preload: Infinity,
										visible: false,
										source: new TileWMS({
												  url: 'https://larsenwest.ca:8443/geoserver/Canlin/wms',
												attributions: '© <a href="https://aksgeoscience.com" >AKS Geoscience</a>',
													params: {
														'LAYERS':'site_10_11_26_13_02w4_38,site_11_16_20_013_02w4_38,site_12_16_27_013_02w4_38,site_13_08_22_013_02w4_38,site_14_06_29_013_03w4_38,site_15_06_33_013_02w4_38,site_16_08_26_013_03w4_38,site_17_08_29_013_03w4_38,site_18_08_32_013_03w4_38,site_19_06_24_016_02w4_38,site_1_15_25_014_02w4_38,site_20_10_11_015_02w4_38,site_21_14_19_016_01w4_38,site_22_14_24_016_02w4_38,site_23_16_09_015_01w4_38,site_24_16_24_016_02w4_38,site_25_05_15_016_02w4_38,site_26_08_15_016_02w4_38,site_27_14_23_016_02w4_38,site_28_14_35_017_01w4_38,site_29_16_23_016_02w4_38,site_2_16_25_014_02w4_38,site_30_04_20_019_01w4_38,site_31_04_21_019_01w4_38,site_32_06_16_019_01w4_38,site_33_06_17_019_01w4_38,site_34_10_16_019_01w4_38,site_35_10_17_019_01w4_38,site_3_02_36_014_02w4_38,site_4_06_36_014_02w4_38,site_5_08_03_015_02w4_38,site_6_08_27_014_02w4_38,site_7_14_18_015_01w4_38,site_8_06_32_013_02w4_38,site_9_10_30_013_02w4_38',
														'TILED': true
													},
										  serverType: 'geoserver',
										//  enableOpacitySliders: true
										//  transition: 0,
								}),
					 }),
						new TileLayer({
									  title: 'EM LIST',
										//extent: [-13884991, 2870341, -7455066, 6338219],
										preload: Infinity,
										visible: true,
										source: new TileWMS({
												  url: 'https://larsenwest.ca:8443/geoserver/wms',
												// attributions: '© <a href="https://sentinel.esa.int/web/sentinel/home" >Sentinel ESA</a>',
													params: {
														'LAYERS': 'CANLIN_EMList',
														'TILED': false
														},
										  serverType: 'geoserver',
										//  enableOpacitySliders: true
										//  transition: 0,
								}),
					 }),*/

           new VectorLayer({
           source: vectorSource,
           title: "Sites as Vectors",
           style:
           new Style({
           image: new Circle({
           fill: fill,
           stroke: stroke,
           radius: 5
           }),
           fill: fill,
           stroke: stroke
           }),
           }),

		    ].concat(layer_list),

  view: new View({
    center: [ -12260934,6510959],
    zoom: 9
  }),

});

   // var layerSwitcher = new ol.control.LayerSwitcher({        enableOpacitySliders: true    });
	 var layerSwitcher = new LayerSwitcher();
    map.addControl(layerSwitcher);
    var search = new SearchFeature(
		{	//target: $(".options").get(0),
			source: vectorSource,
			property: "wellid",
      minLength: 0
		});
	map.addControl (search);

	// Select feature when click on the reference index
	search.on('select', function(e)
		{	// select.getFeatures().clear();
			// select.getFeatures().push (e.search);
			var p = e.search.getGeometry().getFirstCoordinate();
			map.getView().animate({
        center:p,
        zoom: 15
      });
		});
