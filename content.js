/* Module 1 content. Plain data — no logic here. */

var LESSON = {
  number: '01',
  title: 'Energy, power, time, money',
  lead: 'The arithmetic that every later module sits on. If this is solid, everything else is vocabulary.',
  sections: [
    {
      h: 'Power is a rate. Energy is an amount.',
      p: [
        'A battery is described by two numbers: how fast it can move energy (MW) and how much it holds (MWh). Nothing else about its size matters until you add a third number: time.',
        'A 100 MW plant running for 4 hours delivers 400 MWh. The same plant running for 1 hour delivers 100 MWh. The power never changed.'
      ],
      formula: 'Energy [MWh] = Power [MW] × Time [h]'
    },
    {
      h: 'Duration and C-rate are the same fact, twice',
      p: [
        'Duration is how long the battery lasts at full power. C-rate is how fast it empties, expressed as a multiple of its own capacity.',
        'A 4-hour battery is a 0.25C battery. A 2-hour battery is 0.5C. A 1-hour battery is 1C.',
        'German utility-scale projects sit mostly at 0.25–0.5C. That is not a technical accident — it is where cells are happiest and where the market pays.'
      ],
      formula: 'Duration [h] = Energy [MWh] ÷ Power [MW]\nC-rate = Power [MW] ÷ Energy [MWh] = 1 ÷ Duration [h]'
    },
    {
      h: 'Units: the error that costs millions',
      p: [
        'Wh, kWh, MWh, GWh climb by factors of 1,000. So do W, kW, MW.',
        'A 3.2 V, 314 Ah cell holds 3.2 × 314 = 1,004.8 Wh. That is 1.0048 kWh — one kilowatt-hour, not one thousand.',
        'Write the unit next to every number, every time. A factor-of-1,000 slip on a 400 MWh order is roughly €40 million.'
      ],
      formula: 'Energy [Wh] = Voltage [V] × Charge [Ah]'
    },
    {
      h: 'Losses gross up. They do not add on.',
      p: [
        'Energy measured at the POI is what survives the trip from the DC terminals. If 8 % is lost on the way, the delivered energy is 92 % of what you started with.',
        'So to deliver 400 MWh you need 400 ÷ 0.92 = 434.8 MWh at the terminals. Multiplying 400 by 1.08 gives 432 — close, and wrong, because it applies the loss to the output instead of the input.',
        'The rule: divide by (1 − loss), never multiply by (1 + loss).'
      ],
      formula: 'E_DC = E_POI ÷ (1 − L)\n400 ÷ 0.92 = 434.8 MWh      (not 432)'
    },
    {
      h: 'From megawatt-hours to boxes',
      p: [
        'Products come in fixed sizes — today mostly 5 MWh per 20-foot container. You cannot buy 434.8 MWh, so you round up to whole containers.',
        '434.8 ÷ 5 = 86.96 → 87 containers → 435 MWh installed. The 0.2 MWh you did not need is called overbuild, and it is the first, smallest version of the same idea that returns in Module 3.'
      ],
      formula: 'Containers = ⌈E_DC ÷ MWh per container⌉'
    },
    {
      h: 'Worked example — the anchor plant',
      p: [
        'Contract: 100 MW for 4 hours, measured at the POI. Losses DC→POI: 8 %. Containers: 5 MWh.',
        'Energy at POI: 100 × 4 = 400 MWh.',
        'Energy at DC terminals: 400 ÷ 0.92 = 434.8 MWh.',
        'Containers: 434.8 ÷ 5 = 86.96 → 87 → 435 MWh installed.',
        'C-rate: 100 ÷ 400 = 0.25 — a four-hour battery, exactly where the German market sits.',
        'This ignores degradation. In year 20 the same plant will not hold 435 MWh, which is why Module 3 exists. For now, hold the arithmetic.'
      ],
      formula: '400 MWh → 434.8 MWh → 87 containers → 435 MWh installed → 0.05 % overbuild'
    }
  ]
};

var DRILLS = [
  {
    id: 'd1',
    q: 'A battery is rated 3 MW / 12 MWh. What is its duration, in hours?',
    unit: 'h', answer: 4, tol: 0.001,
    why: '12 ÷ 3 = 4 h.'
  },
  {
    id: 'd2',
    q: 'What is the C-rate of a 2-hour battery?',
    unit: 'C', answer: 0.5, tol: 0.005,
    why: 'C-rate = 1 ÷ duration = 1 ÷ 2 = 0.5C.'
  },
  {
    id: 'd3',
    q: 'What is the C-rate of a 6-hour battery? (three decimals)',
    unit: 'C', answer: 1 / 6, tol: 0.003,
    why: '1 ÷ 6 = 0.167C. Long-duration systems are low C-rate by definition.'
  },
  {
    id: 'd4',
    q: 'A cell is 3.2 V and 280 Ah. How much energy does it hold, in kWh?',
    unit: 'kWh', answer: 0.896, tol: 0.001,
    why: '3.2 × 280 = 896 Wh = 0.896 kWh. Divide by 1,000 to get kWh.'
  },
  {
    id: 'd5',
    q: '416 cells of 3.2 V are put in series. What is the string voltage?',
    unit: 'V', answer: 1331.2, tol: 0.1,
    why: 'Series adds voltage: 416 × 3.2 = 1,331.2 V. Amp-hours stay the same.'
  },
  {
    id: 'd6',
    q: 'A plant delivers 100 MW for 2 hours. How much energy reaches the grid?',
    unit: 'MWh', answer: 200, tol: 0.01,
    why: '100 × 2 = 200 MWh. Careful: this is before losses.'
  },
  {
    id: 'd7',
    q: 'You must deliver 200 MWh at the POI and losses are 8 %. What energy is needed at the DC terminals?',
    unit: 'MWh', answer: 217.39, tol: 0.05,
    why: '200 ÷ 0.92 = 217.39 MWh. Not 216 (that is 200 × 1.08).'
  },
  {
    id: 'd8',
    q: 'You need 217.4 MWh at DC and each container holds 5 MWh. How many containers?',
    unit: 'containers', answer: 44, tol: 0.01,
    why: '217.4 ÷ 5 = 43.48 → round up to 44. You cannot buy 43.48 boxes.'
  },
  {
    id: 'd9',
    q: 'A 50 MW / 100 MWh system: what is its duration, in hours?',
    unit: 'h', answer: 2, tol: 0.001,
    why: '100 ÷ 50 = 2 h — a 0.5C battery.'
  },
  {
    id: 'd10',
    q: 'Deliver 500 MWh at the POI with 10 % losses. What is needed at DC?',
    unit: 'MWh', answer: 555.56, tol: 0.05,
    why: '500 ÷ 0.90 = 555.56 MWh.'
  },
  {
    id: 'd11',
    q: 'The anchor plant is 100 MW / 400 MWh. What is its C-rate?',
    unit: 'C', answer: 0.25, tol: 0.005,
    why: '100 ÷ 400 = 0.25C — the 4-hour sweet spot.'
  },
  {
    id: 'd12',
    q: 'A 1.5 MW system runs for 3 hours. How much energy does it move?',
    unit: 'MWh', answer: 4.5, tol: 0.01,
    why: '1.5 × 3 = 4.5 MWh.'
  }
];
