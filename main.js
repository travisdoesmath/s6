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

let starCoords = {
    'center': new Coords(0, 0),
    'top': new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5)),
    'top right': new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5)),
    'bottom right': new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5)),
    'bottom left': new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5)),
    'top left': new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5))
}

const linkedPermutationComposerConfig =  {
    n: 6,
    psi: new Permutation(6, labels=['A', 'B', 'C', 'D', 'E', 'F'])
}

const mysticRectangleConfig =  {
    showCycle: true,
    r: 100,
    nodeR: 20,
    useArcs: false,
    showBackground: false,
    configuration: 'rectangle',
    showLabels: true,
    labelType: 'letter',
    showCenterLines: false,
    colorScheme: 'in-cycle',
    nodeType: 'label',
}

const mysticStarFormationConfig =  {
    showCycle: true,
    R: 350,
    r: 100,
    nodeR: 17.5,
    useArcs: false,
    showBackground: false,
    configuration: 'star',
    showLabels: false,
    showCenterLines: false,
    colorScheme: 'in-cycle',
    nodeType: 'label',
}

const hybridComposerConfig =  {
    showCycle: true,
    r: 100,
    R: 350,
    nodeR: 17.5,
    nodePadding: 12.5,
    useArcs: false,
    showBackground: false,
    configuration: 'star',
    showCenterLines: true,
    colorScheme: 'syntheme',
    nodeType: 'label',
    showLabels: false,
}

const synthemeNodesComposerConfig =  {
    showCycle: true,
    r: 100,
    R: 350,
    nodeR: 30,
    nodePadding: 12.5,
    useArcs: true,
    configuration: 'star',
    showCenterLines: true,
    showBackground: true,
    nodeType: 'syntheme',
    highlightSteps: true,
    showLabels: false,
}

const finalComposerConfig =  {
    showCycle: true,
    r: 100,
    R: 350,
    nodeR: 30,
    nodePadding: 12.5,
    useArcs: true,
    configuration: 'star',
    showCenterLines: true,
    showBackground: true,
    nodeType: 'syntheme',
    showLabels: true,
    labelType: 'multicolor',
    showCenterNode: true,
}


const permutationComposer = new PermutationComposer({}, {n: 6}, document.getElementById('permutations'));
const triangleComposer = new TriangleComposer({}, {r: 80}, document.getElementById('triangles'));
const trianglePermutationComposer = new TrianglePermutationComposer({}, {r: 160, n: 3}, document.getElementById('triangle-s3'));
const linkedPermutationComposer = new LinkedPermutationComposer({}, linkedPermutationComposerConfig, document.getElementById('linked-permutations'));const pentadComposer = new PentadComposer(composerData, {}, document.getElementById('pentads'));
const mysticRectangleConfigurationComposer = new StarComposer(composerData, mysticRectangleConfig, document.getElementById('mystic'));
const mysticStarConfigurationComposer = new StarComposer(composerData, mysticStarFormationConfig, document.getElementById('mystic2')); 
const mysticSynthemeComposer = new StarComposer(composerData, hybridComposerConfig, document.getElementById('mystics-and-synthemes'));
const synthemeNodesComposer = new StarComposer(composerData, synthemeNodesComposerConfig, document.getElementById('syntheme-nodes'));
const finalComposer = new StarComposer(composerData, finalComposerConfig, document.getElementById('final'));