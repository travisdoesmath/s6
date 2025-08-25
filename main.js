mainSvg = document.getElementById('main');

// Set the width and height of the SVG
mainSvg.setAttribute('width', '800');
mainSvg.setAttribute('height', '800');

let pentagramCoords = {
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
let r = 80;
let nodeR = 20;
let nodePadding = 7.5;

let colors = ['#cc1515', '#e5b900', '#00ad00', '#00a0d8', '#9417e5'];

let pentagramData = [
    {
        location: 'center',
        synthemes: [
            ['01', '25', '34'],
            ['02', '13', '45'],
            ['03', '24', '15'],
            ['04', '35', '12'],
            ['05', '14', '23']
        ],
        '5-cycle': ['12', '23', '34', '45', '15']
    },
    {
        location: 'top',
        synthemes: [
            ['01', '25', '34'],
            ['02', '35', '14'],
            ['03', '12', '45'],
            ['04', '23', '15'],
            ['05', '13', '24']
        ],
        '5-cycle': ['12', '24', '34', '35', '15']
    },
    {
        location: 'top right',
        synthemes: [
            ['01', '24', '35'],
            ['02', '13', '45'],
            ['03', '14', '25'],
            ['04', '15', '23'],
            ['05', '12', '34']
        ],
        '5-cycle': ['12','23','35','45','14']
    },
        {
        location: 'bottom right',
        synthemes: [
            ['01', '23', '45'],
            ['02', '14', '35'],
            ['03', '15', '24'],
            ['04', '13', '25'],
            ['05', '12', '34']
        ],
        '5-cycle': ['14','34','23','25','15']
    },
    {
        location: 'bottom left',
        synthemes: [
            ['01', '23', '45'],
            ['02', '15', '34'],
            ['03', '14', '25'],
            ['04', '12', '35'],
            ['05', '13', '24']
        ],
        '5-cycle': ['12','25','45','34','13']
    },
        {
        location: 'top left',
        synthemes: [
            ['01', '24', '35'],
            ['02', '15', '34'],
            ['03', '12', '45'],
            ['04', '13', '25'],
            ['05', '14', '23']
        ],
        '5-cycle': ['13','23','24','45','15']
    }
]

let pentagramLocations = {
    'center': { cx: cx, cy: cy },
    'top':  {cx: cx + R * Math.sin(10 * Math.PI / 5), cy: cy - R * Math.cos(10 * Math.PI / 5)},
    'top right': { cx: cx + R * Math.sin(2 * Math.PI / 5), cy: cy - R * Math.cos(2 * Math.PI / 5) },
    'bottom right': { cx: cx + R * Math.sin(4 * Math.PI / 5), cy: cy - R * Math.cos(4 * Math.PI / 5) },
    'bottom left': { cx: cx + R * Math.sin(6 * Math.PI / 5), cy: cy - R * Math.cos(6 * Math.PI / 5) },
    'top left': { cx: cx + R * Math.sin(8 * Math.PI / 5), cy: cy - R * Math.cos(8 * Math.PI / 5) }
}

function drawPentagram(cx, cy, r, data) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    let location = pentagramLocations[data.location];
    g.setAttribute('transform', `translate(${location.cx}, ${location.cy})`);
    g.setAttribute('id', data.location.replace(' ', '-'));

    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathString = 'M';
    for (let i = 1; i <= 5; i++) {
        pathString += ` ${r * pentagramCoords[`${i}`].x} ${-r * pentagramCoords[`${i}`].y}`;
    }
    pathString += ' Z';
    bgPath.setAttribute('d', pathString);
    bgPath.setAttribute('fill', '#444');
    bgPath.setAttribute('stroke', 'none');
    g.appendChild(bgPath);

    colors.forEach((color, i) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${r * pentagramCoords['0'].x}`);
        line.setAttribute('y1', `${-r * pentagramCoords['0'].y}`);
        line.setAttribute('x2', `${r * pentagramCoords[`${i + 1}`].x}`);
        line.setAttribute('y2', `${-r * pentagramCoords[`${i + 1}`].y}`);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '5');
        line.setAttribute('stroke-linecap', 'round');
        g.appendChild(line);

    })

    let bgDuads = ['12','23','34','45','15', '13', '24', '35', '14', '25'];
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
        g.appendChild(line);
    })



    data.synthemes.forEach((syntheme, i) => {
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
                if (data['5-cycle'].includes(duad)) {
                    line.setAttribute('stroke-dasharray', '1,12');
                }
                line.setAttribute('stroke-linecap', 'round');
                g.appendChild(line);
            }
        })
        
    });

    '12345'.split('').forEach(i => {
        const coord = pentagramCoords[i];
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        node.setAttribute('transform', `translate(${r * coord.x}, ${-r * coord.y})`);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '0');
        circle.setAttribute('cy', '0');
        circle.setAttribute('r', `${nodeR}`);
        circle.setAttribute('fill', 'black');
        node.appendChild(circle);
        // '12 23 34 45 15 13 24 35 14 25'.split(' ').forEach(duad => {
        //     let [left, right] = duad.split('');
        //     const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        //     line.setAttribute('x1', `${r * coord.x + (nodeR - 5) * pentagramCoords[left].x}`);
        //     line.setAttribute('y1', `${-r * coord.y - (nodeR - 5) * pentagramCoords[left].y}`);
        //     line.setAttribute('x2', `${r * coord.x + (nodeR - 5) * pentagramCoords[right].x}`);
        //     line.setAttribute('y2', `${-r * coord.y - (nodeR - 5) * pentagramCoords[right].y}`);
        //     line.setAttribute('stroke', '#444');
        //     line.setAttribute('stroke-width', '1');
        //     node.appendChild(line);
        // });
        syntheme = data.synthemes[i - 1];
        syntheme.forEach(duad => {
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
            node.appendChild(circle1);

            const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle2.setAttribute('cx', `${(nodeR - nodePadding) * pentagramCoords[right].x}`);
            circle2.setAttribute('cy', `${-(nodeR - nodePadding) * pentagramCoords[right].y}`);
            circle2.setAttribute('r', '2');
            circle2.setAttribute('fill', colors[i - 1]);
            circle2.setAttribute('stroke', 'none');
            node.appendChild(circle2);

            node.appendChild(line);
        });

        g.appendChild(node);
    })

    mainSvg.appendChild(g);
}

let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
g.setAttribute('transform', `translate(${cx}, ${cy})`);

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
            g.appendChild(line);
            line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${R * pentagramCoords[data.start].x}`);
            line.setAttribute('y1', `${-R * pentagramCoords[data.start].y}`);
            line.setAttribute('x2', `${R * pentagramCoords[data.end].x}`);
            line.setAttribute('y2', `${-R * pentagramCoords[data.end].y}`);
            line.setAttribute('stroke', data.color);
            line.setAttribute('stroke-width', '8');
            g.appendChild(line);
        }
        else {
            let arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arc.setAttribute('d', `M ${R * pentagramCoords[data.start].x} ${-R * pentagramCoords[data.start].y} A ${R} ${R} 0 0 1 ${R * pentagramCoords[data.end].x} ${-R * pentagramCoords[data.end].y}`);
            arc.setAttribute('fill', 'none');
            arc.setAttribute('stroke', 'black');
            arc.setAttribute('stroke-width', '16');
            g.appendChild(arc);
            arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arc.setAttribute('d', `M ${R * pentagramCoords[data.start].x} ${-R * pentagramCoords[data.start].y} A ${R} ${R} 0 0 1 ${R * pentagramCoords[data.end].x} ${-R * pentagramCoords[data.end].y}`);
            arc.setAttribute('fill', 'none');
            arc.setAttribute('stroke', data.color);
            arc.setAttribute('stroke-width', '8');
            arc.setAttribute('stroke-linecap', 'round');
            arc.setAttribute('stroke-dasharray', '1,12');
            g.appendChild(arc);
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
        g.appendChild(arc);

        arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', pathString);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', color);
        arc.setAttribute('stroke-width', '8');
        g.appendChild(arc);

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

mainSvg.appendChild(g);

pentagramData.forEach(pentagram => {
    const cx = pentagramLocations[pentagram.location].cx;
    const cy = pentagramLocations[pentagram.location].cy;

    drawPentagram(cx, cy, r, pentagram);
});

function movePentagram([pentagram, start, end, t]) {
    pentagram.setAttribute('transform', `translate(${start.cx + t * (end.cx - start.cx)}, ${start.cy + t * (end.cy - start.cy)})`);

}

function swapPentagrams(P1, P2) {

}

// document.getElementById('top').setAttribute('style', 'display: none;');