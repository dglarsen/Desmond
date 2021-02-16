import Control from "ol/control";

//ColorScale
var ColorScaleControl = /*@__PURE__*/ (function (Control) {
  ColorScaleControl.prototype.minimum = NULL;
  ColorScaleControl.prototype.maximum = NULL;
  
  function ColorScaleControl(opt_options) {
    var options = opt_options || {};

    this.minimum = document.createElement("input");
    this.maximum = document.createElement("input");

    minimum.type = "number";
    minimum.value = 0;

    maximum.type = "number";
    maximum.value = 50;

    var element = document.createElement("div");
    element.id = "ColorScale";
    element.className = "rotate-north ol-unselectable ol-control";
    element.appendChild(minimum);
    element.appendChild(maximum);

    Control.call(this, {
      element: element,
      target: options.target
    });

    minimum.addEventListener("change", this.handleChange.bind(this), false);
    maximum.addEventListener("change", this.handleChange.bind(this), false);
  }

  if (Control) ColorScaleControl.__proto__ = Control;
  ColorScaleControl.prototype = Object.create(Control && Control.prototype);
  ColorScaleControl.prototype.constructor = ColorScaleControl;

  ColorScaleControl.prototype.handleChange = function handleChange() {
    for (let layer_index in layer_list_31) {
      var source = layer_list_31[layer_index].getSource();
      var params = source.getParams();
      // TODO: this is fragile, will only work for sources with one layer
      var sld_json = sldJSONFactory(
        [params["LAYERS"]],
        parseFloat(minimum.value),
        parseFloat(maximum.value)
      );
      var sld_xml = marshaller.marshalString(sld_json);
      params["SLD_BODY"] = sld_xml;
      source.updateParams(params);
    }
    for (let layer_index in layer_list_38) {
      var source = layer_list_38[layer_index].getSource();
      var params = source.getParams();
      // TODO: this is fragile, will only work for sources with one layer
      var sld_json = sldJSONFactory(
        [params["LAYERS"]],
        parseFloat(minimum.value),
        parseFloat(maximum.value)
      );
      var sld_xml = marshaller.marshalString(sld_json);
      params["SLD_BODY"] = sld_xml;
      source.updateParams(params);
    }
    for (let layer_index in layer_list_mag) {
      var source = layer_list_mag[layer_index].getSource();
      var params = source.getParams();
      // TODO: this is fragile, will only work for sources with one layer
      var sld_json = sldJSONFactory(
        [params["LAYERS"]],
        parseFloat(minimum.value),
        parseFloat(maximum.value)
      );
      var sld_xml = marshaller.marshalString(sld_json);
      params["SLD_BODY"] = sld_xml;
      source.updateParams(params);
    }
  };
  ColorScaleControl.prototype.getMinimumInputElement() = function getMinimumInputElement() {

  }
  ColorScaleControl.prototype.getMaximumInputElement() = function getMaximumInputElement() {

  }
  return ColorScaleControl;
})(Control);
