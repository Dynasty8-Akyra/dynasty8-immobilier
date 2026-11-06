
(() => {
  "use strict";
  console.log("DYNASTY 8 : démarrage de carte.js");

console.log("Leaflet :", typeof L);

console.log(
  "Conteneur viewport :",
  document.getElementById("viewport")
);

console.log(
  "Page carte :",
  document.querySelector(".map-page")
);

const root = document.getElementById("viewport");
if (!root) {
  console.error("DYNASTY 8 : conteneur de carte introuvable");
  return;
}

  const viewport = document.getElementById("viewport");

  if (!viewport || typeof L === "undefined") {
    if (viewport) {
      viewport.textContent = "Impossible de charger la carte.";
    }
    return;
  }

  // =====================================
  // COULEURS DYNASTY 8
  // =====================================

  const COLORS = {
    lux: "#bb65ff",
    res: "#4daeff",
    rural: "#28e6ed",
    ind: "#ff69b9",
    excluded: "#8e92a5"
  };

  // =====================================
  // QUARTIERS ET ZONES IMMOBILIERES
  // =====================================
  // Coordonnees provisoires sur 8192 x 8192.
  // Nous ajusterons les contours ensemble.

  const zones = {

    paleto: {
      name: "Paleto Bay",
      type: "Rural / Côtier",
      category: "rural",
      description: "Maisons et propriétés du nord de San Andreas.",
      interiors: [
        "Maisons",
        "Propriétés",
        "Commerces de proximité"
      ],
      


points: [
  [1224, 3619],
  [1240, 3603],
  [1255, 3589],
  [1270, 3571],
  [1289, 3546],
  [1304, 3523],
  [1315, 3500],
  [1326, 3476],
  [1340, 3444],
  [1362, 3427],
  [1389, 3412],
  [1415, 3408],
  [1435, 3404],
  [1459, 3399],
  [1481, 3387],
  [1494, 3376],
  [1502, 3374],
  [1511, 3376],
  [1527, 3377],
  [1535, 3385],
  [1539, 3399],
  [1538, 3414],
  [1535, 3427],
  [1533, 3444],
  [1529, 3456],
  [1524, 3468],
  [1535, 3472],
  [1544, 3477],
  [1549, 3482],
  [1556, 3487],
  [1561, 3493],
  [1565, 3500],
  [1568, 3506],
  [1565, 3514],
  [1524, 3556],
  [1475, 3606],
  [1325, 3756],
  [1231, 3846],
  [1165, 3797],
  [1150, 3782],
  [1150, 3763],
  [1160, 3746],
  [1170, 3727],
  [1182, 3707],
  [1194, 3681],
  [1193, 3663],
  [1192, 3650],
  [1206, 3638]
]

    },

    grapeseed: {
      name: "Grapeseed",
      type: "Rural / Côtier",
      category: "rural",
      description: "Fermes et maisons rurales.",
      interiors: ["Fermes","Maisons","Terrains"],
    points: [
  [2514, 4892],
  [2515, 4836],
  [2515, 4808],
  [2519, 4782],
  [2525, 4763],
  [2536, 4754],
  [2550, 4741],
  [2555, 4730],
  [2565, 4709],
  [2566, 4694],
  [2566, 4680],
  [2563, 4664],
  [2569, 4644],
  [2580, 4635],
  [2587, 4623],
  [2587, 4613],
  [2584, 4600],
  [2583, 4588],
  [2584, 4572],
  [2588, 4560],
  [2595, 4552],
  [2603, 4544],
  [2612, 4534],
  [2616, 4520],
  [2616, 4510],
  [2616, 4495],
  [2612, 4481],
  [2602, 4473],
  [2599, 4461],
  [2599, 4449],
  [2602, 4433],
  [2607, 4423],
  [2612, 4416],
  [2614, 4398],
  [2605, 4383],
  [2600, 4361],
  [2566, 4311],
  [2562, 4300],
  [2567, 4293],
  [2582, 4292],
  [2600, 4297],
  [2731, 4323],
  [2740, 4314],
  [2732, 4306],
  [2718, 4291],
  [2720, 4275],
  [2726, 4256],
  [2729, 4233],
  [2728, 4116],
  [2787, 4114],
  [2790, 4137],
  [2792, 4154],
  [2793, 4181],
  [2795, 4207],
  [2799, 4227],
  [2797, 4280],
  [2794, 4323],
  [2785, 4354],
  [2755, 4366],
  [2729, 4370],
  [2697, 4363],
  [2681, 4355],
  [2679, 4371],
  [2688, 4388],
  [2707, 4410],
  [2726, 4429],
  [2748, 4437],
  [2760, 4438],
  [2769, 4455],
  [2752, 4479],
  [2730, 4483],
  [2717, 4483],
  [2700, 4472],
  [2695, 4480],
  [2699, 4494],
  [2697, 4513],
  [2695, 4528],
  [2694, 4553],
  [2687, 4571],
  [2678, 4577],
  [2686, 4588],
  [2693, 4590],
  [2707, 4599],
  [2713, 4608],
  [2721, 4633],
  [2723, 4650],
  [2724, 4667],
  [2726, 4688],
  [2717, 4697],
  [2700, 4695],
  [2691, 4694],
  [2682, 4704],
  [2674, 4722],
  [2667, 4747],
  [2652, 4756],
  [2639, 4765],
  [2633, 4777],
  [2630, 4792],
  [2622, 4804],
  [2609, 4804],
  [2596, 4820],
  [2586, 4826],
  [2570, 4832],
  [2573, 4882],
  [2556, 4907],
  [2565, 4928],
  [2544, 4947],
  [2533, 4954],
  [2521, 4968],
  [2541, 4986],
  [2552, 5008],
  [2547, 5041],
  [2541, 5062],
  [2536, 5082],
  [2536, 5105],
  [2530, 5130],
  [2514, 5151],
  [2497, 5157],
  [2479, 5156],
  [2464, 5171],
  [2461, 5189],
  [2461, 5210],
  [2466, 5227],
  [2464, 5246],
  [2482, 5257],
  [2503, 5227],
  [2510, 5219],
  [2519, 5234],
  [2514, 5251],
  [2507, 5275],
  [2503, 5294],
  [2501, 5317],
  [2500, 5341],
  [2499, 5352],
  [2516, 5343],
  [2537, 5339],
  [2551, 5322],
  [2563, 5321],
  [2578, 5321],
  [2585, 5326],
  [2582, 5344],
  [2609, 5351],
  [2643, 5338],
  [2736, 5322],
  [2848, 5323],
  [2852, 5389],
  [2848, 5414],
  [2803, 5436],
  [2758, 5434],
  [2708, 5469],
  [2663, 5509],
  [2624, 5579],
  [2477, 5545],
  [2262, 5495],
  [2172, 5468],
  [2169, 5456],
  [2177, 5433],
  [2176, 5415],
  [2164, 5392],
  [2153, 5370],
  [2141, 5346],
  [2132, 5335],
  [2113, 5329],
  [2099, 5329],
  [2087, 5320],
  [2084, 5313],
  [2086, 5299],
  [2099, 5278],
  [2113, 5263],
  [2113, 5254],
  [2108, 5239],
  [2101, 5218],
  [2090, 5190],
  [2087, 5173],
  [2087, 5159],
  [2091, 5139],
  [2097, 5112],
  [2114, 5089],
  [2130, 5065],
  [2143, 5056],
  [2147, 5053],
  [2139, 5044],
  [2139, 5033],
  [2143, 5020],
  [2152, 5002],
  [2169, 4980],
  [2191, 4952],
  [2216, 4927],
  [2241, 4901],
  [2252, 4884],
  [2262, 4865],
  [2271, 4855],
  [2291, 4850],
  [2347, 4857],
  [2389, 4858],
  [2427, 4872],
  [2469, 4874],
  [2509, 4904]
]
    },

    sandy: {
      name: "Sandy Shores",
      type: "Rural / Côtier",
      category: "rural",
      description: "Habitations et propriétés du désert.",
      interiors: [
        "Maisons",
        "Mobil-homes",
        "Petits commerces"
      ],
      points: [
[3065,3697],[3154,3702],[3237,3707],[3404,3746],
[3455,3772],[3500,3804],[3661,3753],[3691,3756],
[3746,3817],[3793,3881],[3840,3879],[3893,3903],
[3929,3903],[3902,3932],[3899,3957],[3905,4001],
[3907,4050],[3907,4096],[3919,4138],[3944,4192],
[3951,4221],[3937,4257],[3906,4258],[3893,4253],
[3891,4253],[3885,4262],[3878,4277],[3858,4278],
[3842,4303],[3830,4332],[3828,4370],[3825,4405],
[3828,4442],[3830,4468],[3840,4489],[3855,4506],
[3842,4533],[3828,4569],[3825,4620],[3760,4583],
[3721,4591],[3702,4565],[3690,4524],[3683,4490],
[3653,4484],[3623,4507],[3601,4524],[3582,4521],
[3564,4480],[3572,4458],[3557,4432],[3533,4424],
[3502,4407],[3483,4296],[3485,4258],[3492,4195],
[3506,4161],[3514,4128],[3504,4088],[3487,4039],
[3480,4001],[3465,3968],[3421,3932],[3403,3902],
[3359,3896],[3322,3915],[3282,3940],[3251,3981],
[3233,4021],[3219,4076],[3213,4132],[3206,4258],
[3195,4388],[3195,4458],[3193,4531],[3199,4598],
[3209,4657],[3220,4707],[3231,4766],[3234,4831],
[3219,4868],[3256,4896],[3328,4931],[3360,4954],
[3401,4982],[3437,5015],[3483,5074],[3507,5110],
[3520,5156],[3541,5201],[3545,5247],[3565,5288],
[3577,5312],[3571,5334],[3554,5368],[3503,5448],
[3417,5514],[3322,5565],[3186,5620],[3100,5648],
[3049,5641],[3017,5624],[2988,5597],[2971,5572],
[2943,5534],[2918,5520],[2901,5489],[2892,5463],
[2896,5425],[2927,5375],[2949,5356],[2964,5305],
[2981,5276],[3014,5218],[3055,5152],[3070,5112],
[3018,5083],[2940,5039],[2923,5018],[2922,4984],
[2925,4950],[2932,4928],[2946,4902],[2972,4867],
[2993,4843],[3011,4826],[3039,4796],[3059,4773],
[3070,4754],[3080,4724],[3098,4681],[3115,4641],
[3128,4601],[3140,4540],[3137,4497],[3133,4374],
[3131,4340],[3139,4293],[3164,4232],[3169,4195],
[3173,4130],[3167,4075],[3158,4021],[3158,3983],
[3175,3970],[3184,3975],[3195,3976],[3211,3941],
[3226,3923],[3241,3898],[3260,3876],[3275,3863],
[3271,3846],[3264,3823],[3231,3830],[3185,3842],
[3152,3848],[3135,3855],[3121,3847],[3110,3847],
[3098,3851],[3080,3848],[3054,3839],[3040,3823],
[3035,3805],[3033,3782],[3046,3765],[3056,3749],
[3067,3728],[3069,3713]
]
    },

    chumash: {
      name: "Chumash",
      type: "Rural / Côtier",
      category: "rural",
      description: "Maisons et propriétés sur la côte ouest.",
      interiors: ["Maisons","Propriétés côtières"],
      points: [
  [4533,1979],[4522,1963],[4524,1943],[4546,1925],
  [4559,1907],[4578,1897],[4601,1884],[4626,1854],
  [4638,1839],[4648,1829],[4650,1811],[4651,1776],
  [4649,1753],[4642,1725],[4643,1702],[4643,1655],
  [4648,1641],[4660,1613],[4689,1601],[4732,1592],
  [4780,1589],[4810,1583],[4856,1577],[4878,1573],
  [4920,1586],[4938,1607],[4951,1612],[4975,1609],
  [4996,1620],[5028,1644],[5089,1684],[5124,1700],
  [5165,1711],[5188,1713],[5223,1706],[5259,1694],
  [5284,1682],[5312,1675],[5327,1665],[5364,1665],
  [5381,1678],[5400,1694],[5425,1704],[5416,1727],
  [5401,1746],[5401,1757],[5394,1770],[5360,1771],
  [5338,1781],[5323,1790],[5311,1803],[5294,1813],
  [5274,1823],[5245,1828],[5215,1830],[5189,1830],
  [5149,1819],[5113,1828],[5084,1830],[5060,1828],
  [5047,1821],[5025,1810],[5008,1795],[5003,1780],
  [5002,1758],[5003,1740],[4996,1719],[4970,1707],
  [4940,1698],[4907,1695],[4884,1697],[4854,1713],
  [4828,1723],[4804,1730],[4770,1735],[4745,1745],
  [4727,1762],[4696,1772],[4681,1800],[4681,1825],
  [4684,1840],[4676,1866],[4675,1896],[4650,1919],
  [4619,1937],[4593,1951],[4569,1962],[4550,1974]
]
    },

    vinewood_Hills: {
      name: "Vinewood Hills",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Villas et demeures d'exception.",
      interiors: [
        "Villas",
        "Maisons haut standing",
        "Propriétés avec piscine"
      ],
     points: [
  [4828,3588],[4848,3553],[4872,3545],[4889,3540],
  [4904,3538],[4906,3551],[4896,3564],[4896,3584],
  [4909,3596],[4930,3602],[4958,3609],[4987,3620],
  [4999,3640],[5016,3661],[5029,3680],[5042,3711],
  [5059,3736],[5050,3767],[5026,3777],[5006,3777],
  [4978,3766],[4958,3766],[4938,3777],[4914,3773],
  [4900,3767],[4878,3760],[4856,3760],[4844,3758],
  [4837,3738],[4834,3708],[4834,3685],[4837,3668],
  [4839,3646],[4837,3625]
]
    },

    richman: {
      name: "Richman",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Résidences de prestige.",
      interiors: ["Villas","Maisons haut standing"],
      points: [
  [5064,2962],[5028,2892],[5038,2856],[5024,2818],
  [5003,2807],[4970,2800],[4935,2793],[4917,2765],
  [4902,2729],[4881,2681],[4890,2667],[4917,2653],
  [4946,2638],[4967,2625],[4992,2601],[5012,2576],
  [5033,2551],[5050,2520],[5061,2489],[5070,2458],
  [5079,2437],[5098,2417],[5121,2413],[5148,2407],
  [5179,2400],[5205,2393],[5220,2397],[5236,2401],
  [5254,2399],[5285,2400],[5307,2409],[5339,2416],
  [5366,2422],[5402,2432],[5424,2439],[5447,2458],
  [5464,2477],[5473,2506],[5494,2524],[5491,2554],
  [5461,2562],[5437,2550],[5422,2557],[5396,2564],
  [5381,2585],[5360,2617],[5349,2631],[5335,2660],
  [5331,2675],[5330,2690],[5337,2703],[5359,2724],
  [5368,2744],[5375,2766],[5390,2769],[5400,2754],
  [5412,2730],[5423,2707],[5434,2686],[5444,2659],
  [5453,2646],[5466,2625],[5476,2602],[5499,2606],
  [5524,2630],[5546,2659],[5581,2684],[5602,2700],
  [5644,2722],[5622,2752],[5602,2769],[5587,2790],
  [5574,2808],[5550,2815],[5519,2814],[5490,2806],
  [5454,2806],[5427,2812],[5395,2832],[5380,2823],
  [5354,2812],[5318,2818],[5294,2842],[5280,2864],
  [5269,2892],[5265,2919],[5264,2956],[5264,2973],
  [5284,2973],[5312,2992],[5330,3000],[5347,3003],
  [5357,3017],[5364,3038],[5393,3050],[5424,3062],
  [5448,3077],[5470,3093],[5496,3111],[5529,3126],
  [5552,3142],[5575,3159],[5584,3201],[5571,3227],
  [5562,3241],[5552,3277],[5537,3277],[5515,3268],
  [5489,3262],[5468,3262],[5459,3262],[5437,3258],
  [5403,3256],[5389,3249],[5370,3232],[5346,3230],
  [5334,3211],[5321,3198],[5276,3193],[5238,3194],
  [5237,3234],[5224,3261],[5214,3285],[5212,3296],
  [5192,3290],[5180,3277],[5168,3252],[5160,3235],
  [5147,3229],[5125,3221],[5114,3207],[5105,3184],
  [5103,3153],[5106,3133],[5111,3110],[5114,3091],
  [5105,3067],[5092,3042],[5086,3016],[5081,2996]
]
    },

    mirror_park: {
      name: "Mirror Park",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Maisons résidentielles de bon standing.",
      interiors: ["Maisons","Maisons haut standing"],
      points: [
  [5629,4249],[5657,4241],[5680,4228],[5712,4216],
  [5734,4213],[5750,4227],[5759,4244],[5754,4271],
  [5748,4301],[5748,4321],[5743,4348],[5738,4374],
  [5728,4391],[5734,4418],[5749,4439],[5761,4446],
  [5777,4438],[5791,4415],[5803,4397],[5812,4377],
  [5821,4347],[5837,4328],[5849,4313],[5856,4298],
  [5865,4290],[5882,4287],[5906,4287],[5926,4288],
  [5946,4300],[5963,4327],[5972,4342],[5984,4365],
  [5997,4374],[6019,4391],[6039,4408],[6050,4421],
  [6043,4436],[6034,4449],[6032,4462],[6032,4490],
  [6032,4522],[6036,4536],[6034,4554],[6030,4575],
  [6030,4586],[6037,4605],[6050,4636],[6057,4656],
  [6058,4671],[6048,4687],[6026,4699],[6010,4699],
  [5992,4687],[5982,4678],[5953,4668],[5943,4682],
  [5921,4691],[5904,4694],[5883,4680],[5874,4660],
  [5864,4642],[5856,4624],[5848,4612],[5834,4612],
  [5806,4606],[5784,4591],[5772,4570],[5763,4552],
  [5761,4532],[5759,4507],[5762,4488],[5765,4477],
  [5755,4459],[5743,4457]
]
    },

    vespucci: {
      name: "Vespucci",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Maisons et résidences haut standing du littoral.",
      interiors: [
        "Maisons haut standing",
        "Appartements",
        "Résidences"
      ],
      points: [
        [5900,2900],[5680,3300],[5870,3600],
        [6250,3550],[6380,3100],[6150,2820]
      ]
    },

    little_seoul: {
      name: "Little Seoul",
      type: "Résidentiel",
      category: "res",
      description: "Logements urbains et appartements.",
      interiors: [
        "Appartements",
        "Studios",
        "Maisons de ville"
      ],
      points: [
  [6033,3043],[6056,3080],[6071,3108],[6092,3141],
  [6118,3166],[6153,3190],[6210,3222],[6254,3246],
  [6281,3258],[6317,3289],[6344,3305],[6368,3325],
  [6375,3342],[6360,3367],[6326,3386],[6295,3396],
  [6254,3404],[6225,3400],[6186,3394],[6156,3403],
  [6126,3417],[6100,3427],[6071,3427],[6036,3421],
  [6013,3410],[5991,3398],[5971,3394],[5957,3396],
  [5955,3340],[5952,3291],[5954,3251],[5952,3192],
  [5955,3141],[5981,3091]
]
    },

    rockford: {
      name: "Rockford Hills",
      type: "Résidentiel",
      category: "res",
      description: "Appartements et maisons du centre-ouest.",
      interiors: [
        "Appartements",
        "Maisons",
        "Penthouses"
      ],
      points: [
  [5609,2778],[5640,2744],[5671,2705],[5709,2698],
  [5743,2688],[5763,2659],[5793,2630],[5819,2612],
  [5856,2616],[5879,2629],[5894,2653],[5923,2683],
  [5955,2721],[5976,2755],[6010,2794],[6037,2835],
  [6063,2858],[6090,2893],[6118,2910],[6109,2934],
  [6085,2974],[6043,3019],[6020,3055],[5989,3089],
  [5962,3134],[5957,3198],[5957,3264],[5959,3335],
  [5959,3376],[5958,3424],[5957,3456],[5954,3476],
  [5924,3480],[5886,3485],[5865,3493],[5849,3514],
  [5844,3541],[5839,3575],[5838,3591],[5822,3599],
  [5798,3596],[5757,3582],[5735,3572],[5702,3571],
  [5653,3572],[5606,3579],[5558,3586],[5528,3594],
  [5501,3602],[5477,3602],[5457,3603],[5443,3588],
  [5443,3553],[5440,3523],[5439,3492],[5439,3432],
  [5439,3400],[5436,3345],[5445,3281],[5460,3263],
  [5506,3264],[5532,3277],[5545,3284],[5564,3254],
  [5576,3220],[5592,3186],[5605,3165],[5630,3127],
  [5643,3096],[5651,3070],[5633,3017],[5616,2987],
  [5593,2951],[5575,2925],[5568,2895],[5569,2852],
  [5572,2828],[5585,2811]
]
    },

    vinewood: {
      name: "Vinewood",
      type: "Résidentiel",
      category: "res",
      description: "Logements urbains de Vinewood.",
      interiors: [
        "Appartements",
        "Studios",
        "Maisons"
      ],
       points: [
  [5339,3227],[5326,3200],[5291,3193],[5259,3188],
  [5237,3192],[5238,3213],[5234,3236],[5226,3258],
  [5216,3284],[5210,3299],[5183,3285],[5173,3263],
  [5166,3244],[5148,3237],[5117,3226],[5105,3213],
  [5095,3179],[5095,3152],[5104,3120],[5108,3096],
  [5104,3083],[5097,3065],[5087,3048],[5080,3026],
  [5077,3014],[5074,2997],[5069,2977],[5061,2968],
  [5040,2964],[5009,2976],[4984,2980],[4968,2997],
  [4954,3028],[4954,3052],[4948,3084],[4948,3110],
  [4951,3134],[4951,3161],[4964,3195],[4971,3224],
  [4977,3251],[4972,3285],[4943,3295],[4910,3292],
  [4916,3318],[4926,3333],[4943,3360],[4960,3371],
  [4971,3393],[4977,3412],[4982,3427],[4998,3446],
  [5018,3454],[5036,3451],[5046,3469],[5049,3495],
  [5063,3526],[5069,3547],[5071,3575],[5070,3601],
  [5067,3623],[5080,3643],[5094,3666],[5114,3681],
  [5125,3701],[5125,3721],[5115,3749],[5111,3783],
  [5110,3806],[5086,3817],[5061,3831],[5022,3840],
  [5008,3854],[5003,3883],[4996,3917],[4998,3940],
  [5025,3960],[5063,3981],[5104,3989],[5151,3998],
  [5197,4006],[5230,4021],[5248,4035],[5267,4060],
  [5299,4084],[5303,4101],[5295,4139],[5286,4172],
  [5292,4189],[5309,4183],[5329,4149],[5346,4138],
  [5374,4158],[5382,4187],[5398,4231],[5407,4245],
  [5415,4262],[5440,4262],[5473,4243],[5500,4223],
  [5535,4199],[5565,4171],[5576,4141],[5595,4101],
  [5623,4088],[5627,4057],[5510,3732],[5463,3647],
  [5449,3609],[5443,3575],[5438,3528],[5438,3495],
  [5440,3462],[5436,3397],[5436,3346],[5442,3302],
  [5455,3270],[5457,3258],[5405,3254],[5384,3237]
]
    },

    downtown: {
      name: "Centre-ville",
      type: "Résidentiel",
      category: "res",
      description: "Appartements et studios de Los Santos.",
      interiors: [
        "Appartements",
        "Studios",
        "Penthouses"
      ],
      points: [
        [6150,4300],[6100,4810],[6400,5010],
        [6750,4860],[6740,4440],[6500,4190]
      ]
    },

    south_ls: {
      name: "South Los Santos",
      type: "Résidentiel",
      category: "res",
      description: "Maisons, appartements et petits logements.",
      interiors: [
        "Maisons",
        "Appartements",
        "Studios"
      ],
      points: [
        [6770,4000],[6700,4550],[7150,4730],
        [7410,4370],[7320,3970]
      ]
    },

    east_ls: {
      name: "East Los Santos",
      type: "Résidentiel",
      category: "res",
      description: "Habitations et immeubles de l'est de Los Santos.",
      interiors: [
        "Maisons",
        "Appartements",
        "Studios"
      ],
      points: [
        [6420,5100],[6380,5510],[6810,5680],
        [7220,5450],[7180,5000],[6750,4830]
      ]
    },

    la_puerta: {
      name: "La Puerta",
      type: "Industriel / Professionnel",
      category: "ind",
      description: "Garages et locaux professionnels.",
      interiors: [
        "Garages",
        "Entrepôts",
        "Ateliers"
      ],
      points: [
        [6850,3280],[6750,3680],[7040,3930],
        [7320,3740],[7270,3400]
      ]
    },

    port: {
      name: "Port de Los Santos",
      type: "Industriel / Professionnel",
      category: "ind",
      description: "Installations portuaires et stockage.",
      interiors: [
        "Entrepôts",
        "Hangars",
        "Garages"
      ],
      points: [
        [7430,4100],[7380,4780],[7700,5150],
        [7940,4890],[7870,4320]
      ]
    },

    zancudo: {
      name: "Fort Zancudo",
      type: "Zone exclue",
      category: "excluded",
      description: "Secteur non disponible à la vente.",
      interiors: [],
      points: [
        [3950,2150],[3780,2640],[4070,3120],
        [4470,3050],[4600,2500],[4350,2110]
      ]
    },

    airport: {
      name: "Aéroport de Los Santos",
      type: "Zone exclue",
      category: "excluded",
      description: "Secteur non disponible à la vente.",
      interiors: [],
      points: [
        [7250,2700],[7120,3190],[7480,3510],
        [7970,3290],[8050,2810],[7700,2520]
      ]
    },

    power: {
      name: "Centrale électrique",
      type: "Zone exclue",
      category: "excluded",
      description: "Secteur non disponible à la vente.",
      interiors: [],
      points: [
        [6380,5850],[6250,6120],[6490,6300],
        [6750,6120],[6700,5850]
      ]
    }

  };

  // =====================================
  // INITIALISATION CARTE GTA V
  // =====================================

  const CRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(
      1 / 32, 0, 1 / 32, 0
    )
  });

console.log("DYNASTY 8 — AVANT INITIALISATION");

const mapElement = document.getElementById("viewport");

console.log(
  "Dimensions viewport :",
  mapElement.getBoundingClientRect().width,
  mapElement.getBoundingClientRect().height
);

  const map = L.map("viewport", {
    crs: CRS,
    minZoom: 0,
    maxZoom: 5,
    zoomControl: false,
    attributionControl: false,
    preferCanvas: false,
    zoomSnap: 0.25,
    zoomDelta: 0.5
  });

  const bounds = [[0,0],[8192,8192]];
  
console.log("DYNASTY 8 — CARTE INITIALISÉE");

map.setView([5350, 4500], 3);

console.log("Centre :", map.getCenter());
console.log("Zoom :", map.getZoom());


  L.tileLayer(
    "https://viruxe.github.io/gtav-map-tiles/satelite/{z}/{x}-{y}.webp",
    {
      minZoom: 0,
      maxZoom: 5,
      noWrap: true,
      bounds: bounds,
      tileSize: 256,
      keepBuffer: 3
    }
  ).addTo(map);

  // =====================================
  // PANNEAU CATALOGUE
  // =====================================

  const panel = document.getElementById("zonePanel");
  const polygons = {};

  let pinned = null;
  let currentFilter = "all";

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function render(id) {
    if (!panel || !zones[id]) return;

    const z = zones[id];

    panel.innerHTML = `
      <div class="d8-panel-top">
        <div>
          <div class="d8-kicker">
            DYNASTY 8 · ZONE IMMOBILIÈRE
          </div>
          <h2>${escapeHTML(z.name)}</h2>
          <div class="type">${escapeHTML(z.type)}</div>
        </div>
        <button class="d8-close" type="button"
          aria-label="Fermer">×</button>
      </div>

      <div class="d8-panel-photo">
        <span>Catalogue de la zone · Photos à ajouter</span>
      </div>

      <p>${escapeHTML(z.description)}</p>

      <h3>Catégories autorisées</h3>

      <div class="d8-categories">
        ${
          z.interiors.length
            ? z.interiors.map(item => `
              <div class="chip">
                <span class="d8-pin">⌂</span>
                ${escapeHTML(item)}
              </div>
            `).join("")
            : '<div class="chip">Aucun bien disponible</div>'
        }
      </div>

      <small class="d8-note">
        Contours provisoires à ajuster selon le plan validé.
      </small>
    `;

    panel.classList.add("is-open");
  }

  // =====================================
  // SURBRILLANCE DES ZONES
  // =====================================

  function highlight(id) {
    for (const [key, polygon] of Object.entries(polygons)) {
      const active = key === id;

      polygon.setStyle({
        weight: active ? 5 : 3,
        fillOpacity: active ? 0.24 : 0.09
      });
    }
  }

  function preview(id) {
    if (pinned !== null) return;
    render(id);
    highlight(id);
  }

  function select(id) {
    pinned = id;
    render(id);
    highlight(id);
  }

  function close() {
    pinned = null;

    if (panel) {
      panel.classList.remove("is-open");
    }

    highlight(null);
  }

  // =====================================
  // CREATION DES POLYGONES
  // =====================================

  for (const [id, z] of Object.entries(zones)) {
    const color = COLORS[z.category];

    const polygon = L.polygon(z.points, {
      color: color,
      weight: 3,
      opacity: 0.96,
      fillColor: color,
      fillOpacity: 0.09,
      interactive: true,
      className: "d8-neon-polygon",
      dashArray: z.category === "excluded" ? "7 6" : null
    }).addTo(map);

    polygons[id] = polygon;

    // Nom visible seulement au survol
    polygon.bindTooltip(
      `<span class="d8-zone-label">${escapeHTML(z.name)}</span>`,
      {
        permanent: false,
        sticky: true,
        direction: "top",
        opacity: 1,
        className: "d8-label-tooltip"
      }
    );

    polygon.on("mouseover", () => preview(id));

    polygon.on("mouseout", () => {
      if (pinned === null) {
        if (panel) {
          panel.classList.remove("is-open");
        }
        highlight(null);
      }
    });

    polygon.on("click", () => select(id));
  }

  // =====================================
  // FERMETURE DU CATALOGUE
  // =====================================

  if (panel) {
    panel.addEventListener("click", event => {
      if (event.target.closest(".d8-close")) {
        close();
      }
    });
  }

  // =====================================
  // FILTRES DES ZONES
  // =====================================

  const filters = document.getElementById("filters");

  const aliases = {
    lux: "lux",
    res: "res",
    rural: "rural",
    ind: "ind",
    biz: "ind",
    all: "all"
  };

  if (filters) {
    filters.addEventListener("click", event => {
      const button = event.target.closest("button[data-type]");
      if (!button) return;

      currentFilter = aliases[button.dataset.type] || "all";

      filters.querySelectorAll("button[data-type]")
        .forEach(b => {
          b.classList.toggle("on", b === button);
        });

      for (const [id, z] of Object.entries(zones)) {
        const visible =
          currentFilter === "all" ||
          z.category === currentFilter;

        const layer = polygons[id];

        if (visible && !map.hasLayer(layer)) {
          layer.addTo(map);
        }

        if (!visible && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }

        if (!visible && pinned === id) {
          close();
        }
      }
    });
  }

  // =====================================
  // CONTROLES DE LA CARTE
  // =====================================

  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");
  const reset = document.getElementById("reset");

  if (zoomIn) {
    zoomIn.onclick = () => map.zoomIn(0.5);
  }

  if (zoomOut) {
    zoomOut.onclick = () => map.zoomOut(0.5);
  }

  if (reset) {
    reset.onclick = () => map.fitBounds(bounds);
  }

  

  // =========================================
  // DYNASTY 8 — MODE DESSIN DES QUARTIERS
  // =========================================

  const drawing = {
    enabled: false,
    points: [],
    polygon: null,
    markers: [],
    color: "#bb65ff"
  };

  // Barre d'outils de dessin
  const drawTools = document.createElement("div");
  drawTools.id = "d8-draw-tools";

  drawTools.innerHTML = `
    <div class="d8-draw-title">✦ ÉDITION DES ZONES</div>
    <button id="d8-draw-toggle" type="button">
      ✏️ Activer le dessin
    </button>
    <button id="d8-draw-undo" type="button">
      ↶ Annuler un point
    </button>
    <button id="d8-draw-copy" type="button">
      📋 Copier les coordonnées
    </button>
    <button id="d8-draw-clear" type="button">
      ✕ Effacer le tracé
    </button>
    <div id="d8-draw-count">0 point</div>
  `;

  document.body.appendChild(drawTools);

  const drawToggle = document.getElementById("d8-draw-toggle");
  const drawCount = document.getElementById("d8-draw-count");

  function refreshDrawing() {
    if (drawing.polygon) {
      map.removeLayer(drawing.polygon);
      drawing.polygon = null;
    }

    drawing.markers.forEach(marker => {
      map.removeLayer(marker);
    });

    drawing.markers = [];

    if (drawing.points.length >= 2) {
      drawing.polygon = L.polygon(drawing.points, {
        color: drawing.color,
        weight: 4,
        fillColor: drawing.color,
        fillOpacity: 0.15,
        interactive: false
      }).addTo(map);
    }

    drawing.points.forEach(point => {
      const marker = L.circleMarker(point, {
        radius: 5,
        color: "#ffffff",
        fillColor: drawing.color,
        fillOpacity: 1,
        weight: 2,
        interactive: false
      }).addTo(map);

      drawing.markers.push(marker);
    });

    drawCount.textContent =
      drawing.points.length +
      (drawing.points.length > 1 ? " points" : " point");
  }

  drawToggle.addEventListener("click", () => {
    drawing.enabled = !drawing.enabled;

    drawToggle.textContent = drawing.enabled
      ? "✓ Terminer le dessin"
      : "✏️ Activer le dessin";

    map.getContainer().style.cursor =
      drawing.enabled ? "crosshair" : "";

    drawTools.classList.toggle("drawing-active", drawing.enabled);
  });

  map.on("click", event => {
    if (!drawing.enabled) return;

    // Coordonnées arrondies pour carte.js
    const lat = Math.round(event.latlng.lat);
    const lng = Math.round(event.latlng.lng);

    drawing.points.push([lat, lng]);
    refreshDrawing();
  });

  document.getElementById("d8-draw-undo")
    .addEventListener("click", () => {
      drawing.points.pop();
      refreshDrawing();
    });

  document.getElementById("d8-draw-clear")
    .addEventListener("click", () => {
      drawing.points = [];
      refreshDrawing();
    });

  document.getElementById("d8-draw-copy")
    .addEventListener("click", async () => {
      if (drawing.points.length < 3) {
        alert("Place au moins 3 points sur la carte.");
        return;
      }

      const coordinates =
        "points: " +
        JSON.stringify(drawing.points, null, 2);

      try {
        await navigator.clipboard.writeText(coordinates);
        alert("Coordonnées copiées !");
      } catch (error) {
        window.prompt(
          "Copie ces coordonnées avec Ctrl + C :",
          coordinates
        );
      }
    });

  map.whenReady(() => {
    map.setView([5350, 4500], 3);

    setTimeout(() => {
      map.invalidateSize();

      const element = document.getElementById("viewport");

      console.log("=== DIAGNOSTIC DYNASTY 8 ===");
      console.log("Largeur carte :", element.clientWidth);
      console.log("Hauteur carte :", element.clientHeight);
      console.log("Zoom :", map.getZoom());
      console.log("Centre :", map.getCenter());
      console.log(
        "Images satellites :",
        document.querySelectorAll(".leaflet-tile").length
      );
      console.log(
        "Images chargées :",
        document.querySelectorAll(".leaflet-tile-loaded").length
      );
    }, 1000);
  });

})();
