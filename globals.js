let colors = ['#d55e00', '#cc79a7', '#0072b2', '#f0e442', '	#009e73'];
let cycle = [1, 2, 3, 4, 5];
let currentPhi = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5};
let currentPhiInverse = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5};
let arcData = [
    {
        start: '2',
        end: '5',
        middle: '1',
        left: '4',
        right: '3',
        colorIdx: 0
    },
    {
        start: '3',
        end: '1',
        middle: '2',
        left: '5',
        right: '4',
        colorIdx: 1
    },
    {
        start: '4',
        end: '2',
        middle: '3',
        left: '1',
        right: '5',
        colorIdx: 2
    },
    {
        start: '5',
        end: '3',
        middle: '4',
        left: '2',
        right: '1',
        colorIdx: 3
    },
    {
        start: '1',
        end: '4',
        middle: '5',
        left: '3',
        right: '2',
        colorIdx: 4
    }
]
let pentagramLocations = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5
}
let pentagramGroups = [];
let animStart;
let updateBackground = true;
let selectedNodeIndices = [];
