const arcRatio = 1.25;

const config = {
    showCycle: true
}
const epsilon = 1/1200
mainSvg = document.getElementById('main');
const svgWidth = mainSvg.clientWidth;
const svgHeight = mainSvg.clientHeight;
const svgSize = Math.min(svgWidth, svgHeight);

const middles = {
    '12': -4,
    '23': -5,
    '34': -1,
    '45': -2,
    '15': -3,
    '13': 2,
    '14': 5,
    '24': 3,
    '25': 1,
    '35': 4
}
const cx = 0;
const cy = 0;
const r = 10;
const R = 35;
const nodeR = 3;
const nodePadding = 1.25;
const pentagramCoords = {
    'center': {x: 0, y: 0},
    'top': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
    'top right': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
    'bottom right': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
    'bottom left': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
    'top left': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}
}
const pentagramLocationCoords = {
    'center': { cx: cx, cy: cy },
    'top':  {cx: cx + R * Math.sin(10 * Math.PI / 5), cy: cy - R * Math.cos(10 * Math.PI / 5)},
    'top right': { cx: cx + R * Math.sin(2 * Math.PI / 5), cy: cy - R * Math.cos(2 * Math.PI / 5) },
    'bottom right': { cx: cx + R * Math.sin(4 * Math.PI / 5), cy: cy - R * Math.cos(4 * Math.PI / 5) },
    'bottom left': { cx: cx + R * Math.sin(6 * Math.PI / 5), cy: cy - R * Math.cos(6 * Math.PI / 5) },
    'top left': { cx: cx + R * Math.sin(8 * Math.PI / 5), cy: cy - R * Math.cos(8 * Math.PI / 5) }
}
const pentagramData = [
    {
        id: 0,
        synthemes: [
            ['01', '25', '34'],
            ['02', '13', '45'],
            ['03', '24', '15'],
            ['04', '35', '12'],
            ['05', '14', '23']
        ],
        '5-cycle': ['1', '2', '3', '4', '5']
    },
    {
        id: 1, 
        synthemes: [
            ['01', '25', '34'],
            ['02', '35', '14'],
            ['03', '12', '45'],
            ['04', '23', '15'],
            ['05', '13', '24']
        ],
        '5-cycle': ['1', '2', '4', '3', '5']
    },
    {
        id: 2,
        synthemes: [
            ['01', '24', '35'],
            ['02', '13', '45'],
            ['03', '14', '25'],
            ['04', '15', '23'],
            ['05', '12', '34']
        ],
        '5-cycle': ['1','2','3','5','4']
    },
    {
        id: 3,
        synthemes: [
            ['01', '23', '45'],
            ['02', '14', '35'],
            ['03', '15', '24'],
            ['04', '13', '25'],
            ['05', '12', '34']
        ],
        '5-cycle': ['1','4','3','2','5']
    },
    {
        id: 4,
        synthemes: [
            ['01', '23', '45'],
            ['02', '15', '34'],
            ['03', '14', '25'],
            ['04', '12', '35'],
            ['05', '13', '24']
        ],
        '5-cycle': ['1','2','5','4','3']
    },
    {
        id: 5,
        synthemes: [
            ['01', '24', '35'],
            ['02', '15', '34'],
            ['03', '12', '45'],
            ['04', '13', '25'],
            ['05', '14', '23']
        ],
        '5-cycle': ['1','3','2','4','5']
    }
]
const locationEnum = {
    0: 'center',
    1: 'top',
    2: 'top right',
    3: 'bottom right',
    4: 'bottom left',
    5: 'top left'

}
const background = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const phi = {
    '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
    '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
    '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0},
    '15': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4},
    '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
    '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
    '25': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3},
    '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
    '35': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2},
    '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}
}

const testMap = {
    '12': 4,
    '13': 2,
    '14': 5,
    '15': 3,
    '23': 5,
    '24': 3,
    '25': 1,
    '34': 1,
    '35': 4,
    '45': 2
}