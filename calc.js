/* Pure arithmetic for Module 1. No DOM, no globals leaking. */
(function (root) {
  'use strict';

  var Calc = {
    /** Duration in hours for a given power and energy. */
    durationH: function (pMW, mwh) {
      if (!(pMW > 0) || !(mwh >= 0)) throw new Error('pMW must be > 0, mwh >= 0');
      return mwh / pMW;
    },

    /** C-rate = power / energy = 1 / duration. */
    cRate: function (durationHours) {
      if (!(durationHours > 0)) throw new Error('duration must be > 0');
      return 1 / durationHours;
    },

    /** Energy needed at DC terminals to deliver energy at the POI through losses. */
    grossUp: function (poiMWh, lossPercent) {
      if (!(lossPercent >= 0 && lossPercent < 100)) throw new Error('loss must be 0..<100');
      return poiMWh / (1 - lossPercent / 100);
    },

    /** Number of containers (integer) for a required DC energy. */
    containers: function (dcMWh, containerMWh) {
      if (!(containerMWh > 0)) throw new Error('containerMWh must be > 0');
      return Math.ceil(dcMWh / containerMWh - 1e-9);
    },

    /** Cell energy in Wh from nominal voltage and amp-hours. */
    cellWh: function (volts, ampHours) {
      return volts * ampHours;
    },

    /** String voltage for cells in series. */
    stringVoltage: function (cells, cellVolts) {
      return cells * cellVolts;
    },

    /** Overbuild as a fraction, e.g. 0.31 for 31 %. */
    overbuild: function (installed, required) {
      if (!(required > 0)) throw new Error('required must be > 0');
      return installed / required - 1;
    },

    round: function (x, digits) {
      var f = Math.pow(10, digits === undefined ? 2 : digits);
      return Math.round(x * f) / f;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Calc;
  root.Calc = Calc;
})(typeof self !== 'undefined' ? self : globalThis);
