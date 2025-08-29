const config = {
    showCycle: true
}

mainSvg = document.getElementById('main');

// Set the width and height of the SVG
mainSvg.setAttribute('width', '800');
mainSvg.setAttribute('height', '800');

const pentagramCoords = {
    '0': {x: 0, y: 0},
    '1': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
    '2': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
    '3': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
    '4': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
    '5': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}
}

let cx = 400;
let cy = 400;
let R = 250;
const r = 80;
const nodeR = 20;
const nodePadding = 7.5;

const colors = ['#cc1515', '#e5b900', '#00ad00', '#00a0d8', '#9417e5'];

let cycle = ['1', '2', '3', '4', '5'];

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

let locationEnum = {
    0: 'center',
    1: 'top',
    2: 'top right',
    3: 'bottom right',
    4: 'bottom left',
    5: 'top left'

}

let pentagramLocations = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5
}

const pentagramLocationCoords = {
    'center': { cx: cx, cy: cy },
    'top':  {cx: cx + R * Math.sin(10 * Math.PI / 5), cy: cy - R * Math.cos(10 * Math.PI / 5)},
    'top right': { cx: cx + R * Math.sin(2 * Math.PI / 5), cy: cy - R * Math.cos(2 * Math.PI / 5) },
    'bottom right': { cx: cx + R * Math.sin(4 * Math.PI / 5), cy: cy - R * Math.cos(4 * Math.PI / 5) },
    'bottom left': { cx: cx + R * Math.sin(6 * Math.PI / 5), cy: cy - R * Math.cos(6 * Math.PI / 5) },
    'top left': { cx: cx + R * Math.sin(8 * Math.PI / 5), cy: cy - R * Math.cos(8 * Math.PI / 5) }
}

let pentagramGroups = [];

function drawPentagram(p1) {
    drawPentagramInterpolation(p1, p1, 0);
}

function createPentagram(pentagram) {
    let pentagramGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pentagramGroup.setAttribute('id', pentagram.id);
    pentagramGroups.push(pentagramGroup);

    let backgroundGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    backgroundGroup.setAttribute('class', 'background');
    pentagramGroup.appendChild(backgroundGroup);

    let linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linesGroup.setAttribute('class', 'lines');
    pentagramGroup.appendChild(linesGroup);

    let nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'nodes');
    pentagramGroup.appendChild(nodesGroup);

    let location = pentagramLocationCoords[locationEnum[pentagramLocations[pentagram.id]]];
    pentagramGroup.setAttribute('transform', `translate(${location.cx}, ${location.cy})`);
    pentagramGroup.setAttribute('id', pentagram.id);

    

    let bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', createPentagramPath(pentagram));
    bgPath.setAttribute('fill', '#444');
    bgPath.setAttribute('stroke', 'none');
    bgPath.setAttribute('class', 'background')
    backgroundGroup.appendChild(bgPath);

    let centerLinesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    centerLinesGroup.setAttribute('class', 'center-lines');
    linesGroup.appendChild(centerLinesGroup);

    [1, 2, 3, 4, 5].forEach((v, i) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', `${r * pentagramCoords[`${v}`].x}`);
        line.setAttribute('y2', `${-r * pentagramCoords[`${v}`].y}`);
        line.setAttribute('data-id', `${v}`);
        line.setAttribute('stroke', colors[i]);
        line.setAttribute('stroke-width', '5');
        line.setAttribute('stroke-linecap', 'round');
        centerLinesGroup.appendChild(line);
    })

    let backgroundLinesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    backgroundLinesGroup.setAttribute('class', 'background-lines');
    linesGroup.appendChild(backgroundLinesGroup);

    let bgDuads = ['12', '23', '34', '45', '15', '13', '24', '35', '14', '25'];
    bgDuads.forEach(duad => {
        let [left, right] = duad.split('');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${r * pentagramCoords[left].x}`);
        line.setAttribute('y1', `${-r * pentagramCoords[left].y}`);
        line.setAttribute('x2', `${r * pentagramCoords[right].x}`);
        line.setAttribute('y2', `${-r * pentagramCoords[right].y}`);
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', '16');
        line.setAttribute('stroke-linecap', 'round');
        backgroundLinesGroup.appendChild(line);
    })

    let synthemeLinesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    synthemeLinesGroup.setAttribute('class', 'syntheme-lines');
    linesGroup.appendChild(synthemeLinesGroup);

    pentagram.synthemes.forEach((syntheme, i) => {
        syntheme.forEach(duad => {
            let [left, right] = duad.split('');
            if (left !== '0') {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', `${r * pentagramCoords[left].x}`);
                line.setAttribute('y1', `${-r * pentagramCoords[left].y}`);
                line.setAttribute('x2', `${r * pentagramCoords[right].x}`);
                line.setAttribute('y2', `${-r * pentagramCoords[right].y}`);
                line.setAttribute('stroke', colors[i]);
                line.setAttribute('stroke-width', '8');
                line.setAttribute('data-id', duad);
                let cycle = pentagram['5-cycle'].map((v, i, arr) => {let [a, b] = [v, arr[(i+1) % arr.length]].sort(); return a + b;})
                if (cycle.includes(duad) && config.showCycle) {
                    line.setAttribute('stroke-dasharray', '1,12');
                }
                line.setAttribute('stroke-linecap', 'round');
                synthemeLinesGroup.appendChild(line);
            }
        })
        
    });

    '12345'.split('').forEach(i => {
        const coord = pentagramCoords[i];
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        node.setAttribute('transform', `translate(${r * coord.x}, ${-r * coord.y})`);
        node.setAttribute('class', 'node');
        node.setAttribute('id', `node-${pentagram.id}-${i}`);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '0');
        circle.setAttribute('cy', '0');
        circle.setAttribute('r', `${nodeR}`);
        circle.setAttribute('fill', 'black');
        node.appendChild(circle);

        const synthemeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        synthemeGroup.setAttribute('class', 'syntheme');
        node.appendChild(synthemeGroup);

        syntheme = pentagram.synthemes[i - 1];
        syntheme.forEach(duad => {
            const duadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            duadGroup.setAttribute('class', 'duad');
            duadGroup.setAttribute('data-id', duad);
            synthemeGroup.appendChild(duadGroup);

            let [left, right] = duad.split('');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${(nodeR - nodePadding) * pentagramCoords[left].x}`);
            line.setAttribute('y1', `${-(nodeR - nodePadding) * pentagramCoords[left].y}`);
            line.setAttribute('x2', `${(nodeR - nodePadding) * pentagramCoords[right].x}`);
            line.setAttribute('y2', `${-(nodeR - nodePadding) * pentagramCoords[right].y}`);
            line.setAttribute('stroke', colors[i - 1]);
            line.setAttribute('stroke-width', '2');

            const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle1.setAttribute('cx', `${(nodeR - nodePadding) * pentagramCoords[left].x}`);
            circle1.setAttribute('cy', `${-(nodeR - nodePadding) * pentagramCoords[left].y}`);
            circle1.setAttribute('r', '2');
            circle1.setAttribute('fill', colors[i - 1]);
            circle1.setAttribute('stroke', 'none');
            duadGroup.appendChild(circle1);

            const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle2.setAttribute('cx', `${(nodeR - nodePadding) * pentagramCoords[right].x}`);
            circle2.setAttribute('cy', `${-(nodeR - nodePadding) * pentagramCoords[right].y}`);
            circle2.setAttribute('r', '2');
            circle2.setAttribute('fill', colors[i - 1]);
            circle2.setAttribute('stroke', 'none');
            duadGroup.appendChild(circle2);

            duadGroup.appendChild(line);
        });

        nodesGroup.appendChild(node);
    })

    mainSvg.appendChild(pentagramGroup);

}

function createPentagramPath(pentagram) {
    return createInterpolatedPentagramPath(pentagram, pentagram, 0);
}

function interpolateCoordinates(p1, p2, t) {
    let coords = [{x: 0, y: 0}];
    for (let i = 0; i < 5; i++) {
        let p1coords = pentagramCoords[i+1];
        let p2coords = pentagramCoords[cycle[i]];
        let interpolatedCoords = {
            x: p1coords.x + (p2coords.x - p1coords.x) * t,
            y: p1coords.y + (p2coords.y - p1coords.y) * t
        };
        coords.push(interpolatedCoords);
    }
    return coords;
}

function createInterpolatedPentagramPath(p1, p2, t) {
    let coords = interpolateCoordinates(p1, p2, t);

    let pathString = 'M';

    for (let i = 1; i <= 5; i++) {
        let idx = cycle[i-1];
        pathString += ` ${r * coords[idx].x} ${-r * coords[idx].y}`;
    }
    pathString += ' Z';

    return pathString;
}

function interpolatePentagrams(p1, p2, t) {
    let coords = interpolateCoordinates(p1, p2, t);
    //let cycle = p1['5-cycle'].map((v, i, arr) => {let [a, b] = [v, arr[(i+1) % arr.length]].sort(); return a + b;})


    let pentagramGroup = document.getElementById(p1.id);
    let [backgroundGroup, linesGroup, nodesGroup] = Array.from(pentagramGroup.children);
    let [centerLinesGroup, backgroundLinesGroup, synthemeLinesGroup] = Array.from(linesGroup.children);

    let location1 = pentagramLocationCoords[locationEnum[pentagramLocations[p1.id]]];
    let location2 = pentagramLocationCoords[locationEnum[pentagramLocations[p2.id]]];
    let location = {
        cx: location1.cx + (location2.cx - location1.cx) * t,
        cy: location1.cy + (location2.cy - location1.cy) * t
    };
    pentagramGroup.setAttribute('transform', `translate(${location.cx}, ${location.cy})`);

    const bgPath = backgroundGroup.querySelector('path');
    if (t < 0.5) {
        bgPath.setAttribute('d', createInterpolatedPentagramPath(p1, p2, t));
        // centerLinesGroup.setAttribute('opacity', 1 - t * 25);
    } else {
        bgPath.setAttribute('d', createInterpolatedPentagramPath(p2, p1, 1 - t));
        // centerLinesGroup.setAttribute('opacity', t * 25 - 24);
    }

    Array.from(centerLinesGroup.children).forEach((line, i) => {
        let idx = cycle[i];
        let lineIdx = line.getAttribute('data-id');
        // console.log(lineIdx)
        line.setAttribute('x1', `${0}`);
        line.setAttribute('y1', `${0}`);
        line.setAttribute('x2', `${r * coords[lineIdx].x}`)
        line.setAttribute('y2', `${-r * coords[lineIdx].y}`);
        // line.setAttribute('x2', `${r * coords[p1['5-cycle'].indexOf(`${i+1}`)].x}`);
        // line.setAttribute('y2', `${-r * coords[p1['5-cycle'].indexOf(`${i+1}`)].y}`);
    });

    let bgDuads = ['12', '23', '34', '45', '15', '13', '24', '35', '14', '25'];
    Array.from(backgroundLinesGroup.children).forEach((line, i) => {
        let bgDuad = bgDuads[i];
        line.setAttribute('x1', `${r * coords[bgDuad[0]].x}`);
        line.setAttribute('y1', `${-r * coords[bgDuad[0]].y}`);
        line.setAttribute('x2', `${r * coords[bgDuad[1]].x}`);
        line.setAttribute('y2', `${-r * coords[bgDuad[1]].y}`);
    });

    // let duads = p1.synthemes.reduce((x, y) => x.concat(y)).filter(x => x.slice(0,1) != 0)
    Array.from(synthemeLinesGroup.children).forEach((line, i) => {

        let duad = line.getAttribute('data-id');
        let [left, right] = duad.split('');
        if (right !== '0') {
            // right = p1['5-cycle'][right-1];
            // right = p1['5-cycle'].indexOf(right) + 1;
        }
        if (left !== '0') {
            // left = p1['5-cycle'][left-1];
            // left = p1['5-cycle'].indexOf(left) + 1;
        }
        line.setAttribute('x1', `${r * coords[right].x}`);
        line.setAttribute('y1', `${-r * coords[right].y}`);
        line.setAttribute('x2', `${r * coords[left].x}`);
        line.setAttribute('y2', `${-r * coords[left].y}`);
    });

    Array.from(nodesGroup.children).forEach((node, i) => {
        // let idx = p1['5-cycle'][i];
        let nodeId = node.getAttribute('id');
        let idx = nodeId.split('-')[2];

        node.setAttribute('transform', `translate(${r * coords[idx].x}, ${-r * coords[idx].y})`);
        let synthemeGroup = node.children[1];
        let synthemes = p1.synthemes[i];
        // if (i !== 0) {
        //     synthemes = p1.synthemes[idx-1];
        // }
        Array.from(synthemeGroup.children).forEach((duadGroup, j) => {
            let duad = duadGroup.getAttribute('data-id');
            let [left, right] = duad.split('');
            // if (left !== '0') {
            //     left = p1['5-cycle'][left-1];
            // }
            // if (right !== '0') {
            //     right = p1['5-cycle'][right-1];
            // }
            Array.from(duadGroup.children).forEach((element, k) => {
                if (k === 2) { // element is a line
                    let line = element;
                    line.setAttribute('x1', `${(nodeR - nodePadding) * coords[left].x}`);
                    line.setAttribute('y1', `${-(nodeR - nodePadding) * coords[left].y}`);
                    line.setAttribute('x2', `${(nodeR - nodePadding) * coords[right].x}`);
                    line.setAttribute('y2', `${-(nodeR - nodePadding) * coords[right].y}`);
                } else { // element is a circle
                    let circle = element;
                    let coordIdx = k % 2 == 0 ? right : left;
                    circle.setAttribute('cx', `${(nodeR - nodePadding) * coords[coordIdx].x}`);
                    circle.setAttribute('cy', `${-(nodeR - nodePadding) * coords[coordIdx].y}`);
                }
                
            })
        })

    });

}

const background = document.createElementNS('http://www.w3.org/2000/svg', 'g');
background.setAttribute('transform', `translate(${cx}, ${cy})`);

function drawArc(data) {
    if (data.middle == undefined) {
        if (data.start === '0') {
            let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${R * pentagramCoords[data.start].x}`);
            line.setAttribute('y1', `${-R * pentagramCoords[data.start].y}`);
            line.setAttribute('x2', `${R * pentagramCoords[data.end].x}`);
            line.setAttribute('y2', `${-R * pentagramCoords[data.end].y}`);
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '16');
            background.appendChild(line);
            line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${R * pentagramCoords[data.start].x}`);
            line.setAttribute('y1', `${-R * pentagramCoords[data.start].y}`);
            line.setAttribute('x2', `${R * pentagramCoords[data.end].x}`);
            line.setAttribute('y2', `${-R * pentagramCoords[data.end].y}`);
            line.setAttribute('stroke', data.color);
            line.setAttribute('stroke-width', '8');
            background.appendChild(line);
        }
        else {
            let arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arc.setAttribute('d', `M ${R * pentagramCoords[data.start].x} ${-R * pentagramCoords[data.start].y} A ${R} ${R} 0 0 1 ${R * pentagramCoords[data.end].x} ${-R * pentagramCoords[data.end].y}`);
            arc.setAttribute('fill', 'none');
            arc.setAttribute('stroke', 'black');
            arc.setAttribute('stroke-width', '16');
            background.appendChild(arc);
            arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arc.setAttribute('d', `M ${R * pentagramCoords[data.start].x} ${-R * pentagramCoords[data.start].y} A ${R} ${R} 0 0 1 ${R * pentagramCoords[data.end].x} ${-R * pentagramCoords[data.end].y}`);
            arc.setAttribute('fill', 'none');
            arc.setAttribute('stroke', data.color);
            arc.setAttribute('stroke-width', '8');
            arc.setAttribute('stroke-linecap', 'round');
            arc.setAttribute('stroke-dasharray', '1,12');
            background.appendChild(arc);
        }
    } else {
        [start, end, middle, left, right, color] = [data.start, data.end, data.middle, data.left, data.right, data.color];
        let pathString = 'M ';
        let p = 0.75;

        let p0x = R * pentagramCoords[start].x;
        let p0y = -R * pentagramCoords[start].y;

        let p1x = p * R * pentagramCoords[middle].x;
        let p1y = -p * R * pentagramCoords[middle].y;

        let p2x = R * pentagramCoords[end].x;
        let p2y = -R * pentagramCoords[end].y;


        //pathString += `${p0x} ${p0y} C ${c0x} ${c0y}, ${c1x} ${c1y}, ${p1x} ${p1y} C ${c2x} ${c2y}, ${c3x} ${c3y} ${p2x} ${p2y} C ${c4x} ${c4y} ${c5x} ${c5y} ${p3x} ${p3y}`;
        //pathString += `${p0x} ${p0y} C ${c0x} ${c0y} ${c1x} ${c1y} ${p1x} ${p1y} S ${c2x} ${c2y} ${p2x} ${p2y}`;
        pathString += `${p0x} ${p0y} Q ${p1x} ${p1y} ${p2x} ${p2y}`;

        //pathString += `${p0x} ${p0y} L ${c0x} ${c0y} L ${p1x} ${p1y} L ${c2x} ${c2y}, ${p3x} ${p3y}`;
        //pathString += `${p0x} ${p0y} L ${c0x} ${c0y}`;

        // pathString += `${startX} ${-R * pentagramCoords[start].y - r * pentagramCoords[end].y} `;

        // pathString += `C ${c1x} ${c1y}, `;
        // pathString += `${c2x} ${c2y}, `;
        // pathString += `${endX} ${endY} `;
        // // pathString += 'S';

        let arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', pathString);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', 'black');
        arc.setAttribute('stroke-width', '16');
        background.appendChild(arc);

        arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', pathString);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', color);
        arc.setAttribute('stroke-width', '8');
        background.appendChild(arc);

    }
}

let arcData = [
    {
        start: '2',
        end: '5',
        middle: '1',
        left: '4',
        right: '3',
        color: colors[0]
    },
    {
        start: '3',
        end: '1',
        middle: '2',
        left: '5',
        right: '4',
        color: colors[1]
    },
    {
        start: '4',
        end: '2',
        middle: '3',
        left: '1',
        right: '5',
        color: colors[2]
    },
    {
        start: '5',
        end: '3',
        middle: '4',
        left: '2',
        right: '1',
        color: colors[3]
    },
    {
        start: '1',
        end: '4',
        middle: '5',
        left: '3',
        right: '2',
        color: colors[4]
    }
]

'12345'.split('').forEach(i => {
    drawArc({
        start: '0',
        end: i,
        color: colors[i - 1]
    });
});

arcData.forEach(arc => {
    drawArc(arc);
});

drawArc({ start: '1', end: '2', color: colors[3]});
drawArc({ start: '2', end: '3', color: colors[4]});
drawArc({ start: '3', end: '4', color: colors[0]});
drawArc({ start: '4', end: '5', color: colors[1]});
drawArc({ start: '5', end: '1', color: colors[2]});

mainSvg.appendChild(background);

pentagramData.forEach(pentagram => {
    createPentagram(pentagram);
});



function easeInOutCubic(x) {
return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

let animStart;

function updatePentagrams() {
    selectedNodeIndices = [];
    document.querySelectorAll('.node.selected').forEach(node => {
        node.classList.toggle('selected');
    });
    pentagramLocations = {
        0: pentagramLocations[1],
        1: pentagramLocations[0],
        2: pentagramLocations[3],
        3: pentagramLocations[2],
        4: pentagramLocations[5],
        5: pentagramLocations[4]
    }
    pentagramGroups.forEach(pentagramGroup => {
        [backgroundGroup, lineGroup, nodeGroup] = Array.from(pentagramGroup.children);
        [centerLinesGroup, backgroundLinesGroup, synthemeLinesGroup] = Array.from(lineGroup.children);
        Array.from(synthemeLinesGroup.children).forEach(line => {
            let duad = line.getAttribute('data-id');
            [left, right] = duad.split('');
            line.setAttribute('data-id', `${cycle[left - 1]}${cycle[right - 1]}`);
        });
        Array.from(nodeGroup.children).forEach((node, i) => {
            let nodeId = node.getAttribute('id');
            let pentagramIdx = nodeId.split('-')[1];
            let nodeIdx = nodeId.split('-')[2];
            let idx = cycle[nodeIdx - 1];
            node.setAttribute('id', `node-${pentagramIdx}-${idx}`);
            let synthemeGroup = node.children[1];
            Array.from(synthemeGroup.children).forEach(duadGroup => {
                let duad = duadGroup.getAttribute('data-id');
                [left, right] = duad.split('');
                if (left !== '0') {
                    left = cycle[left - 1];
                }
                if (right !== '0') {
                    right = cycle[right - 1];
                }
                duadGroup.setAttribute('data-id', `${left}${right}`);
            });
        });
    });
}

function animate(t) {
    if (animStart === undefined) {
        animStart = t;
    }
    const elapsed = t - animStart;
    const shift = Math.min(elapsed / 1200, 1.5);
    if (shift < 1) {
        if (shift < 0.5) {
            background.setAttribute('opacity', 1 - 0.8 * easeInOutCubic(2 * shift));
        } else {
            background.setAttribute('opacity', 1 - 0.8 * easeInOutCubic(2 * (1-shift)));
        }
        let duad = selectedNodeIndices.sort().join('');
        let mapping = phi[duad]

        interpolatePentagrams(pentagramData[0], pentagramData[mapping[0]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[1], pentagramData[mapping[1]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[2], pentagramData[mapping[2]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[3], pentagramData[mapping[3]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[4], pentagramData[mapping[4]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[5], pentagramData[mapping[5]], easeInOutCubic(shift));

        requestAnimationFrame(animate);

    } else {
        animStart = undefined;
        updatePentagrams();
        // requestAnimationFrame(animate);
    }
    
}

// requestAnimationFrame(animate);

// document.addEventListener('click', () => {
//     animStart = undefined;
//     requestAnimationFrame(animate);
// });

let selectedNodeIndices = [];

const phi = {
    '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
    '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
    '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0},
    '15': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4},
    '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
    '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
    '25': {0: 4, 1: 3, 2: 5, 3: 1, 4: 2, 5: 0},
    '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
    '35': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0},
    '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}
}

document.querySelectorAll('.node').forEach(node => {
    node.addEventListener('click', () => {
        node.classList.toggle('selected');
        if (node.classList.contains('selected')) {
            let nodeIdx = node.getAttribute('id').split('-')[2];
            selectedNodeIndices.push(nodeIdx);
        } else {
            selectedNodeIndices = selectedNodeIndices.filter(n => n !== nodeIdx);
        }
        if (selectedNodeIndices.length === 2) {
            console.log(selectedNodeIndices)
            cycle = ['1', '2', '3', '4', '5']
            let [a, b] = selectedNodeIndices;
            cycle[a - 1] = b;
            cycle[b - 1] = a;

            requestAnimationFrame(animate);
        }
        //requestAnimationFrame(animate);
    });
});

function movePentagram([pentagram, start, end, t]) {
    pentagram.setAttribute('transform', `translate(${start.cx + t * (end.cx - start.cx)}, ${start.cy + t * (end.cy - start.cy)})`);

}

function swapPentagrams(P1, P2) {

}

// document.getElementById('top').setAttribute('style', 'display: none;');