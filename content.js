/* Module 1 content. Plain data — no logic here. */

var LESSON = {
  number: '01',
  title: 'Energy, power, time, money',
  lead: 'The arithmetic that every later module sits on. If this is solid, everything else is vocabulary.',
  sections: [
    {
      h: 'Power is a rate. Energy is an amount.',
      p: [
        `A battery is described by two numbers: how fast it can move energy (MW) and how much it holds (MWh). Neither tells you what the plant can do until you add the third thing — time.`,
        `A 100 MW plant running for four hours delivers 400 MWh. The same plant running for one hour delivers 100 MWh. The power never changed; only the duration did. Every commercial conversation about storage eventually becomes a conversation about which of those two numbers the contract is really buying.`,
        `The water analogy is the one that sticks. Energy is the volume of water in the tank. Power is how wide the pipe is. A wide pipe empties the tank quickly; a narrow pipe takes all day. The tank holds the same amount either way.`
      ],
      formula: 'Energy [MWh] = Power [MW] × Time [h]',
      example: {
        title: 'Worked example — same tank, two pipes',
        body: `The anchor plant holds 400 MWh. With a 100 MW pipe it empties in four hours; with a 200 MW pipe, in two. The battery did not change size — but the second plant earns in different markets, needs a different interconnection, and pays a different price per MW. This is why "a 400 MWh battery" is an incomplete description of an asset.`
      },
      mistake: `Quoting a battery by its energy alone. "We have 400 MWh" says nothing about whether the plant can deliver 50 MW or 200 MW, and those are different products at different prices.`,
      check: `A plant is rated 3 MW / 12 MWh. How long can it run at full power? Answer: four hours.`
    },
    {
      h: 'Duration and C-rate are the same fact, twice',
      p: [
        `Duration is how long the battery lasts at full power. C-rate is how fast it empties, expressed as a multiple of its own capacity. They are reciprocals, and confusing them is the most common arithmetic error in the industry.`,
        `A four-hour battery is 0.25C. A two-hour battery is 0.5C. A one-hour battery is 1C. The rule is simply: C-rate × duration = 1.`,
        `German utility-scale projects sit mostly at 0.25–0.5C, and that is not an accident of engineering. Cells are happiest and longest-lived in that range, and the market pays for four-hour blocks that displace evening peaks.`,
        `This is also why a two-hour asset and a four-hour asset are not interchangeable even when they cost the same per MWh: they compete in different markets, and the two-hour plant will cycle harder for its revenue.`
      ],
      formula: 'Duration [h] = Energy [MWh] ÷ Power [MW]\nC-rate = Power [MW] ÷ Energy [MWh] = 1 ÷ Duration [h]',
      example: {
        title: 'Worked example — reading a datasheet',
        body: `A product sheet says 5 MW / 20 MWh. Duration = 20 ÷ 5 = 4 h. C-rate = 5 ÷ 20 = 0.25C. Now suppose a supplier offers 5 MW / 10 MWh at the same price per kWh: duration halves to 2 h, C-rate doubles to 0.5C, and the cell will cycle twice as hard for the same revenue. Same megawatts, different asset.`
      },
      mistake: `Saying "4-hour battery, so 0.5C". It is 0.25C. The 0.5C figure belongs to a two-hour system, and the error propagates into PCS sizing, warranty limits and degradation estimates.`,
      check: `What is the C-rate of a 6-hour battery? Answer: 1 ÷ 6 ≈ 0.167C.`
    },
    {
      h: 'Units: the error that costs millions',
      p: [
        `Wh, kWh, MWh and GWh climb by factors of a thousand. So do W, kW and MW. There is nothing difficult about this, and it is where a shocking share of expensive mistakes begin.`,
        `A 3.2 V, 314 Ah cell holds 3.2 × 314 = 1,004.8 Wh. That is 1.0048 kWh — one kilowatt-hour, not one thousand. Drop a factor of a thousand into a purchase order and you have ordered either a thousand times too much or a thousandth of what you need.`,
        `The discipline is mechanical: write the unit next to every number, in every email, every spreadsheet cell, every slide. Engineers who never make this mistake are not cleverer — they are more boring about units.`,
        `The practical habit is to put the unit in the column header and never in the cell — a spreadsheet of bare numbers with a stated unit is safer than one where every cell repeats it differently.`
      ],
      formula: 'Energy [Wh] = Voltage [V] × Charge [Ah]\n1 kWh = 1,000 Wh · 1 MWh = 1,000 kWh · 1 GWh = 1,000 MWh',
      example: {
        title: 'Worked example — from one cell to a container',
        body: `One cell: 3.2 V × 314 Ah = 1,004.8 Wh = 1.0048 kWh. A 5 MWh container therefore needs about 4,976 cells. Now price it: at €70/kWh the cells in one container cost roughly €350,000. Get the kWh/Wh conversion wrong in the tender and you are out by a factor of a thousand on a €350,000 line — about €350 million.`
      },
      mistake: `Writing "1004.8 kWh" for a cell. The number is right and the unit is wrong by a factor of a thousand; a reviewer who reads quickly will believe it.`,
      check: `A cell is 3.2 V and 280 Ah. What is its energy in kWh? Answer: 0.896 kWh.`
    },
    {
      h: 'Losses gross up. They do not add on.',
      p: [
        `Energy measured at the POI is what survives the journey from the DC terminals. If 8 % is lost on the way, the delivered energy is 92 % of what you started with — which means you must start with more, not less.`,
        `So to deliver 400 MWh you need 400 ÷ 0.92 = 434.8 MWh at the terminals. Multiplying 400 by 1.08 gives 432 — close, and wrong, because it applies the loss to the output instead of the input.`,
        `The rule is: divide by (1 − loss), never multiply by (1 + loss). The two answers differ by about half a percent here, and by much more once several stages are chained together.`,
        `When someone quotes you a loss figure, the useful question is always "percent of what?" — because a loss on the input and a loss on the output are different numbers, and only one of them can be divided out.`
      ],
      formula: 'E_DC = E_POI ÷ (1 − L)\n400 ÷ 0.92 = 434.8 MWh      (not 432)',
      example: {
        title: 'Worked example — where the half percent goes',
        body: `At 400 MWh per day, the 2.8 MWh difference between the correct and incorrect methods is about 1,000 MWh a year. At a €40/MWh spread that is €40,000 a year of margin that was never in the model. The error is small per cycle and relentless per decade.`
      },
      mistake: `Adding the loss percentage to the contract number because it "feels like" adding a margin. It is not a margin, it is a denominator.`,
      check: `Deliver 500 MWh at 10 % losses. What is needed at DC? Answer: 500 ÷ 0.9 = 555.6 MWh.`
    },
    {
      h: 'From megawatt-hours to boxes',
      p: [
        `Products come in fixed sizes — today mostly 5 MWh or 6.25 MWh per 20-foot container. You cannot buy 434.8 MWh, so you round up to whole containers: 434.8 ÷ 5 = 86.96, so 87 containers, or 435 MWh installed.`,
        `The 0.2 MWh you did not strictly need is called overbuild. It is the smallest version of the same idea that returns in Module 3, where degradation means the plant must start deliberately above its contract to stay above it in year twenty.`,
        `This is also where the first real commercial decision appears: another container is another €300–400k and another 20 feet of site. Rounding up is never free, and rounding down is never compliant.`,
        `Suppliers quote container energy at beginning of life and at a stated temperature; the number you can actually use is lower, and the difference is the subject of the next module.`
      ],
      formula: 'Containers = ⌈E_DC ÷ MWh per container⌉',
      example: {
        title: 'Worked example — the anchor plant',
        body: `Contract: 100 MW for 4 h at the POI, 8 % losses, 5 MWh containers. POI energy 400 MWh; DC energy 434.8 MWh; containers 86.96 → 87; installed 435 MWh. Overbuild versus the DC requirement: 0.05 %. The plant is now described as 100 MW / 435 MWh installed, delivering 400 MWh at the POI.`
      },
      mistake: `Sizing to the exact number and then discovering that no supplier sells a fraction of a container — or that the last container is needed only because of a rounding error in the loss calculation.`,
      check: `You need 217.4 MWh at DC and containers are 5 MWh. How many? Answer: 44.`
    },
    {
      h: 'The same plant, described five ways',
      p: [
        `A single asset is legitimately described as 100 MW, 400 MWh at the POI, 435 MWh at the DC terminals, 87 containers, and 0.25C. All five are true, and each one belongs in a different document.`,
        `The power rating goes in the interconnection application and the PCS specification. The POI energy goes in the offtake agreement. The DC energy goes in the battery supply contract and the augmentation plan. The container count goes in the site layout. The C-rate goes in the degradation and warranty discussion.`,
        `Most confusion in this industry is not technical — it is two people using different true numbers for the same plant without saying which boundary they mean.`,
        `A well-run project states the boundary every time: "400 MWh at the POI" or "435 MWh at the DC terminals". It costs four words and prevents most of the arguments that reach lawyers.`
      ],
      formula: '100 MW · 400 MWh at POI · 435 MWh at DC · 87 containers · 0.25C',
      example: {
        title: 'Worked example — the question that exposes it',
        body: `Ask "what is the capacity of this plant?" and you will get 400 from the developer, 435 from the battery supplier and 80 from the PCS engineer who is thinking in MVA. All three are answering a different question. In a review, the first thing you establish is which number each party is quoting and at which boundary.`
      },
      mistake: `Letting a single spreadsheet carry one "capacity" cell used by every document. It will be right for one of them and wrong for the other four.`,
      check: `Which figure belongs in the offtake contract — 400 MWh or 435 MWh? Answer: 400 MWh, measured at the POI.`
    }
  ],
};

var DRILLS = [
  {
    id: 'd1',
    q: 'A battery is rated 3 MW / 12 MWh. What is its duration, in hours?',
    unit: 'h', answer: 4, tol: 0.001,
    why: '12 ÷ 3 = 4 h. Energy divided by power is duration — the same relation you will use on every project.'
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
