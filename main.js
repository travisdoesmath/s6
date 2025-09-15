const composerData = {
    pentagramData: [
        {
            id: 0,
            synthemes: [
                ['01', '52', '34'],
                ['02', '13', '45'],
                ['03', '24', '51'],
                ['04', '35', '12'],
                ['05', '41', '23']
            ],
            '5-cycle': ['1', '2', '3', '4', '5']
        },
        {
            id: 1, 
            synthemes: [
                ['01', '52', '34'],
                ['02', '35', '41'],
                ['03', '12', '45'],
                ['04', '23', '51'],
                ['05', '13', '24']
            ],
            '5-cycle': ['1', '2', '4', '3', '5']
        },
        {
            id: 2,
            synthemes: [
                ['01', '24', '35'],
                ['02', '13', '45'],
                ['03', '41', '52'],
                ['04', '51', '23'],
                ['05', '12', '34']
            ],
            '5-cycle': ['1','2','3','5','4']
        },
        {
            id: 3,
            synthemes: [
                ['01', '23', '45'],
                ['02', '41', '35'],
                ['03', '51', '24'],
                ['04', '13', '52'],
                ['05', '12', '34']
            ],
            '5-cycle': ['1','4','3','2','5']
        },
        {
            id: 4,
            synthemes: [
                ['01', '23', '45'],
                ['02', '51', '34'],
                ['03', '41', '52'],
                ['04', '12', '35'],
                ['05', '13', '24']
            ],
            '5-cycle': ['1','2','5','4','3']
        },
        {
            id: 5,
            synthemes: [
                ['01', '24', '35'],
                ['02', '51', '34'],
                ['03', '12', '45'],
                ['04', '13', '52'],
                ['05', '41', '23']
            ],
            '5-cycle': ['1','3','2','4','5']
        }
    ],
}
const composerConfig =  {
    showCycle: true,
    r: 10,
    R: 35,
    nodeR: 3,
    nodePadding: 1.25
}

const mysticComposerConfig =  {
    showCycle: true,
    R: 10,
    nodeR: 2
}

const composer = new PentagramComposer(composerData, composerConfig, document.getElementById('main'));
const mysticComposer = new MysticPentagramComposer(composerData, mysticComposerConfig, document.getElementById('mystic'));
const pentadComposer = new PentadComposer(composerData, {}, document.getElementById('pentads'));
const permutationComposer = new PermutationComposer({}, {n: 6}, document.getElementById('permutations'));
const linkedPermutationComposer = new LinkedPermutationComposer({}, {n: 6}, document.getElementById('linked-permutations'));