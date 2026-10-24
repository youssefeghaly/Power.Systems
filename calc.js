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


    /** Round-trip efficiency of a chain of stages, each given in percent. */
    chainRTE: function (stages) {
      if (!stages || !stages.length) throw new Error('stages required');
      return stages.reduce(function (acc, p) {
        if (!(p > 0 && p <= 100)) throw new Error('each stage must be 0..100 %');
        return acc * (p / 100);
      }, 1) * 100;
    },

    /** Energy delivered at the POI for a given DC energy and round-trip efficiency (%). */
    energyAtPoi: function (dcMWh, rtePercent) {
      return dcMWh * (rtePercent / 100);
    },

    /** DC energy needed to deliver a given POI energy at a round-trip efficiency (%). */
    dcForPoi: function (poiMWh, rtePercent) {
      if (!(rtePercent > 0)) throw new Error('rte must be > 0');
      return poiMWh / (rtePercent / 100);
    },

    /** Naive "add the losses up" answer, for contrast with the real product. */
    naiveRTE: function (stages) {
      var lost = stages.reduce(function (acc, p) { return acc + (100 - p); }, 0);
      return 100 - lost;
    },


    /** Three-phase fault current in kA: Ik = c · Un / (√3 · Z). */
    faultCurrent: function (voltageKv, zOhm, c) {
      if (!(voltageKv > 0) || !(zOhm > 0)) throw new Error('voltage and impedance must be > 0');
      return ((c === undefined ? 1.1 : c) * voltageKv * 1000) / (Math.sqrt(3) * zOhm) / 1000;
    },

    /** IEC 60255 inverse-time curve: t = TMS · k / ((I/Is)^α − 1), in seconds. */
    relayTime: function (curve, tms, is, current) {
      var table = {
        SI: [0.14, 0.02],
        VI: [13.5, 1],
        EI: [80, 2],
        LTI: [120, 1]
      };
      var p = table[curve];
      if (!p) throw new Error('unknown curve ' + curve);
      if (!(is > 0) || !(current > is)) return Infinity;
      return (tms * p[0]) / (Math.pow(current / is, p[1]) - 1);
    },

    /** Grading margin between two devices at a given current, in seconds. */
    gradingMargin: function (downstream, upstream, current) {
      return upstream - downstream;
    },


    /** Earth resistance of a vertical rod, Dwight. rho in Ω·m, L in m, a = radius in m. */
    earthRod: function (rho, L, a) {
      if (!(rho > 0) || !(L > 0) || !(a > 0)) throw new Error('rho, L and radius must be > 0');
      return (rho / (2 * Math.PI * L)) * (Math.log((4 * L) / a) - 1);
    },

    /** Earth resistance of a buried ring, Dwight. r = ring radius in m, a = conductor radius in m. */
    earthRing: function (rho, r, a) {
      if (!(rho > 0) || !(r > 0) || !(a > 0)) throw new Error('rho, r and radius must be > 0');
      return (rho / (2 * Math.PI * Math.PI * r)) * Math.log((8 * r) / a);
    },

    /** Earth potential rise, in volts. */
    epr: function (faultCurrent, rEarth) {
      return faultCurrent * rEarth;
    },

    /** Earth resistance needed to keep the rise below a permissible touch voltage. */
    requiredEarth: function (permissibleVolts, faultCurrent) {
      if (!(faultCurrent > 0)) throw new Error('fault current must be > 0');
      return permissibleVolts / faultCurrent;
    },

    /** Soils resistivity from a Wenner measurement: rho = 2 pi a R. */
    wenner: function (spacing, resistance) {
      return 2 * Math.PI * spacing * resistance;
    },

    round: function (x, digits) {
      var f = Math.pow(10, digits === undefined ? 2 : digits);
      return Math.round(x * f) / f;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Calc;
  root.Calc = Calc;
})(typeof self !== 'undefined' ? self : globalThis);
