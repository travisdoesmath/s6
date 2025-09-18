const composerData = {
    pentadData: [
        {
            id: 0,
            synthemes: [
                ['05', '41', '23'],
                ['15', '30', '24'],
                ['25', '01', '34'],
                ['35', '40', '12'],
                ['45', '02', '13']
            ],
            '5-cycle': ['0', '1', '3', '2', '4']
        },
        {
            id: 1,
            synthemes: [
                ['05', '13', '24'],
                ['15', '02', '34'],
                ['25', '30', '41'],
                ['35', '40', '12'],
                ['45', '01', '23'],
            ],
            '5-cycle': ['0', '1', '2', '4', '3']
        },
        {
            id: 2,
            synthemes: [
                ['05', '12', '34'],
                ['15', '30', '24'],
                ['25', '40', '13'],
                ['35', '02', '41'],
                ['45', '01', '23'],
            ],
            '5-cycle': ['0', '3', '2', '1', '4']
        },
        {
            id: 3,
            synthemes: [
                ['05', '12', '34'],
                ['15', '40', '23'],
                ['25', '30', '41'],
                ['35', '01', '24'],
                ['45', '02', '13'],
            ],
            '5-cycle': ['0', '1', '4', '3', '2']
        },
        {
            id: 4,
            synthemes: [
                ['05', '13', '24'],
                ['15', '40', '23'],
                ['25', '01', '34'],
                ['35', '02', '41'],
                ['45', '30', '12']
            ],
            '5-cycle': ['0', '2', '1', '3', '4']
        },
        {
            id: 5,
            synthemes: [
                ['05', '41', '23'],
                ['15', '02', '34'],
                ['25', '40', '13'],
                ['35', '01', '24'],
                ['45', '30', '12']
            ],
            '5-cycle': ['0', '1', '2', '3', '4']
        }
    ]

}

const composerConfig =  {
    showCycle: true,
    r: 100,
    R: 350,
    nodeR: 30,
    nodePadding: 12.5
}

const mysticComposerConfig =  {
    showCycle: true,
    r: 100,
    nodeR: 20,
    configuration: 'rectangle'
}

const mysticComposerConfig2 =  {
    showCycle: true,
    R: 350,
    r: 100,
    nodeR: 15,
    configuration: 'star',
    labels: false

}

const linkedPermutationComposerConfig =  {
    n: 6,
    psi: new Permutation(6, labels=['A', 'B', 'C', 'D', 'E', 'F'])
}

let starCoords = {
            'center': new Coords(0, 0),
            'top': new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5)),
            'top right': new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5)),
            'bottom right': new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5)),
            'bottom left': new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5)),
            'top left': new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5))
        }

const permutationComposer = new PermutationComposer({}, {n: 6}, document.getElementById('permutations'));
const triangleComposer = new TriangleComposer({}, {r: 80}, document.getElementById('triangles'));
const trianglePermutationComposer = new TrianglePermutationComposer({}, {r: 160, n: 3}, document.getElementById('triangle-s3'));
const linkedPermutationComposer = new LinkedPermutationComposer({}, linkedPermutationComposerConfig, document.getElementById('linked-permutations'));const pentadComposer = new PentadComposer(composerData, {}, document.getElementById('pentads'));
const mysticComposer = new MysticStarComposer(composerData, mysticComposerConfig, document.getElementById('mystic'));
const mysticComposer2 = new MysticStarComposer(composerData, mysticComposerConfig2, document.getElementById('mystic2')); 
const composer = new StarComposer(composerData, composerConfig, document.getElementById('main'));