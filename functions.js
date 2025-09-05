function drawPentagram(p1) {
    drawPentagramInterpolation(p1, p1, 0);
}

function createElement(tagName, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'parent') {
            value.appendChild(element);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

function createPentagramLayers(pentagram, target) {
    let location = pentagramLocationCoords[locationEnum[pentagramLocations[pentagram.id]]];

    let pentagramGroup = createElement('g', {
        id: pentagram.id,
        transform: `translate(${location.cx}, ${location.cy})`,
        parent: target
    });
    pentagramGroups.push(pentagramGroup);

    let backgroundGroup = createElement('g', {class: 'background', parent: pentagramGroup});
    let linesGroup = createElement('g', {class: 'lines', parent: pentagramGroup});
    let nodesGroup = createElement('g', {class: 'nodes', parent: pentagramGroup});
    return [pentagramGroup, backgroundGroup, linesGroup, nodesGroup];
}

function createPentagramPaths(pentagram, backgroundGroup, linesGroup) {
    let bgPath = createElement('path', {d: createPentagramPath(pentagram), class: 'background-path', parent: backgroundGroup});
    let centerLinesGroup = createElement('g', {class: 'center-lines', parent: linesGroup});
    let outlinesGroup = createElement('g', {class: 'outlines', parent: linesGroup});

    [1, 2, 3, 4, 5].forEach((v, i) => {
        const line = createElement('line', {
            x1: 0,
            y1: 0,
            x2: `${r * pentagramCoords[locationEnum[v]].x}`,
            y2: `${-r * pentagramCoords[locationEnum[v]].y}`,
            'data-id': `${v}`,
            parent: centerLinesGroup
        });
    })

        let synthemeLinesGroup = createElement('g', {class: 'syntheme-lines', parent: linesGroup});
    pentagram.synthemes.forEach((syntheme, i) => {
        syntheme.forEach(duad => {
            let [left, right] = duad.split('');
            if (left !== '0') {
                let cycle = pentagram['5-cycle'].map((v, i, arr) => {let [a, b] = [v, arr[(i+1) % arr.length]].sort(); return a + b;})
                let inCycle = false;
                if (cycle.includes(duad) && config.showCycle) {
                    inCycle = true;
                }


                const path = arcPath({
                    start: left,
                    end: right,
                    middle: middles[duad],
                    left: left,
                    right: right,
                    color: colors[i - 1]
                }, r);
                const outline = createElement('path', {
                    d: path,
                    'duad': duad,
                    'data-id': i + 1,
                    'class': 'outline',
                    parent: outlinesGroup
                });
                const line = createElement('path', {
                    d: path,
                    'duad': duad,
                    'data-id': i + 1,
                    'class': inCycle ? 'syntheme-line in-cycle' : 'syntheme-line',
                    parent: synthemeLinesGroup
                });
            }
        })
        
    });
}

function createPentagramNodes(pentagram, nodesGroup) {
    '12345'.split('').forEach(i => {
        const coord = pentagramCoords[locationEnum[i]];
        const node = createElement('g', {
            transform: `translate(${r * coord.x}, ${-r * coord.y})`,
            class: `node node-${i}`,
            id: `node-${pentagram.id}-${i}`,
            parent: nodesGroup
        });
        const nodeCircle = createElement('circle', {
            cx: '0',
            cy: '0',
            r: `${nodeR}`,
            fill: `var(--color${i}-dark)`,
            parent: node
        });
        const synthemeGroup = createElement('g', {
            class: 'syntheme',
            parent: node
        });

        syntheme = pentagram.synthemes[i - 1];
        syntheme.forEach(duad => {
            const duadGroup = createElement('g', {
                class: 'duad',
                'data-id': duad,
                parent: synthemeGroup
            });

            let [left, right] = duad.split('');
            const path = arcPath({
                start: left,
                middle: middles[duad],
                end: right
            }, nodeR - nodePadding);

            const line = createElement('path', {
                d: path,
                stroke: `var(--color${i}-light)`,
                'stroke-width': `${nodeR/10}`,
                parent: duadGroup
            });

            const circle1 = createElement('circle', {
                cx: `${(nodeR - nodePadding) * pentagramCoords[locationEnum[left]].x}`,
                cy: `${-(nodeR - nodePadding) * pentagramCoords[locationEnum[left]].y}`,
                r: `${nodeR/10}`,
                fill: `var(--color${i}-light)`,
                stroke: 'none',
                parent: duadGroup
            });

            const circle2 = createElement('circle', {
                cx: `${(nodeR - nodePadding) * pentagramCoords[locationEnum[right]].x}`,
                cy: `${-(nodeR - nodePadding) * pentagramCoords[locationEnum[right]].y}`,
                r: `${nodeR/10}`,
                fill: `var(--color${i}-light)`,
                stroke: 'none',
                parent: duadGroup
            });

        });
        nodesGroup.appendChild(node);
    })
    // const centerCircle = createElement('circle', {
    //     cx: '0',
    //     cy: '0',
    //     r: `${nodeR}`,
    //     fill: `rgba(255, 255, 255, 0.1)`,
    //     stroke: `rgba(255,255,255,0.2)`,
    //     strokeWidth: `0.5`,
    //     opacity: '0.5',
    //     filter: 'blur(0.25px)',
    //     parent: nodesGroup
    // });
    // nodesGroup.appendChild(centerCircle);

}

function createPentagram(pentagram, target) {

    let [pentagramGroup, backgroundGroup, linesGroup, nodesGroup] = createPentagramLayers(pentagram, target);
    createPentagramPaths(pentagram, backgroundGroup, linesGroup);
    createPentagramNodes(pentagram, nodesGroup);
}

function createPentagramPath(pentagram) {
    return createInterpolatedPentagramPath(pentagram, pentagram, 0);
}

function interpolateCoordinates(p1, p2, t) {
    let coords = [{x: 0, y: 0}];
    for (let i = 0; i < 5; i++) {
        let p1coords = pentagramCoords[locationEnum[i+1]];
        let p2coords = pentagramCoords[locationEnum[cycle[i]]];
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
        pathString += ` ${r * coords[i].x} ${-r * coords[i].y}`;
    }
    pathString += ' Z';

    return pathString;
}

function interpolatePentagrams(p1, p2, t) {
    let coords = interpolateCoordinates(p1, p2, t);

    let pentagramGroup = document.getElementById(p1.id);
    let [backgroundGroup, linesGroup, nodesGroup] = Array.from(pentagramGroup.children);
    let [centerLinesGroup, backgroundLinesGroup, synthemeLinesGroup] = Array.from(linesGroup.children);

    let reverseLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([key, value]) => [value, key]));

    let location1 = pentagramLocationCoords[locationEnum[reverseLocationMap[p1.id]]];
    let location2 = pentagramLocationCoords[locationEnum[reverseLocationMap[p2.id]]];
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
        line.setAttribute('x1', `${0}`);
        line.setAttribute('y1', `${0}`);
        line.setAttribute('x2', `${r * coords[lineIdx].x}`)
        line.setAttribute('y2', `${-r * coords[lineIdx].y}`);
        // line.setAttribute('x2', `${r * coords[p1['5-cycle'].indexOf(`${i+1}`)].x}`);
        // line.setAttribute('y2', `${-r * coords[p1['5-cycle'].indexOf(`${i+1}`)].y}`);
    });

    // let bgDuads = ['12', '23', '34', '45', '15', '13', '24', '35', '14', '25'];
    // Array.from(backgroundLinesGroup.children).forEach((line, i) => {
    //     let bgDuad = bgDuads[i];
    //     line.setAttribute('x1', `${r * coords[bgDuad[0]].x}`);
    //     line.setAttribute('y1', `${-r * coords[bgDuad[0]].y}`);
    //     line.setAttribute('x2', `${r * coords[bgDuad[1]].x}`);
    //     line.setAttribute('y2', `${-r * coords[bgDuad[1]].y}`);
    // });

    // let duads = p1.synthemes.reduce((x, y) => x.concat(y)).filter(x => x.slice(0,1) != 0)
    Array.from(synthemeLinesGroup.children).forEach((line, i) => {

        let duad = line.getAttribute('duad');
        let [left, right] = duad.split('');
        if (right !== '0') {
            // right = p1['5-cycle'][right-1];
            // right = p1['5-cycle'].indexOf(right) + 1;
        }
        if (left !== '0') {
            // left = p1['5-cycle'][left-1];
            // left = p1['5-cycle'].indexOf(left) + 1;
        }
        let left2 = cycle[left - 1];
        let right2 = cycle[right - 1];
        let duad2 = clockwiseForm[[cycle[left - 1],  cycle[right - 1]].join('')];
        
        let path = interpolatedArcPath(
            {start: left, middle: middles[duad], end: right}, 
            {start: right2, middle: middles[duad2], end: left2}, 
            r, t);
        line.setAttribute('d', path);
        // line.setAttribute('x1', `${r * coords[right].x}`);
        // line.setAttribute('y1', `${-r * coords[right].y}`);
        // line.setAttribute('x2', `${r * coords[left].x}`);
        // line.setAttribute('y2', `${-r * coords[left].y}`);
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

function interpolatedArcPath(data1, data2, R, t) {
    let [start1, middle1, end1] = [data1.start, data1.middle, data1.end];
    let [start2, middle2, end2] = [data2.start, data2.middle, data2.end];
    if (end2 == start1) {
        [end2, start2] = [start2, end2];
    }
    if (middle1 === undefined) {
        let coord_x = t * pentagramCoords[locationEnum[end1]].x + (1-t) * pentagramCoords[locationEnum[end2]].x;
        let coord_y = t * pentagramCoords[locationEnum[end1]].y + (1-t) * pentagramCoords[locationEnum[end2]].y;
        return `M ${coord_x} ${coord_y} L ${R * pentagramCoords[locationEnum[end2]].x} ${-R * pentagramCoords[locationEnum[end2]].y}`
    }
    let inCycle = false;
    let pathString = 'M ';
    let p1 = 0.69;
    let p2 = 1;

    let p0x = R * (t * pentagramCoords[locationEnum[start1]].x + (1-t) * pentagramCoords[locationEnum[start2]].x);
    let p0y = -R * (t * pentagramCoords[locationEnum[start1]].y + (1-t) * pentagramCoords[locationEnum[start2]].y);

    let p1x;
    let p1y;

    if (middle1 < 0 && middle2 < 0) {
        middle1 = -middle1;
        middle2 = -middle2;
        p1x = -p2 * R * (t * pentagramCoords[locationEnum[middle1]].x + (1-t) * pentagramCoords[locationEnum[middle2]].x);
        p1y = p2 * R * (t * pentagramCoords[locationEnum[middle1]].y + (1-t) * pentagramCoords[locationEnum[middle2]].y);
    } else if (middle1 < 0 && middle2 >= 0) {
        middle1 = -middle1;
        p1x = R * (-p2 * t * pentagramCoords[locationEnum[middle1]].x + p1 * (1-t) * pentagramCoords[locationEnum[middle2]].x);
        p1y = R * (p2 * t * pentagramCoords[locationEnum[middle1]].y + -p1 * (1-t) * pentagramCoords[locationEnum[middle2]].y);
    } else if (middle1 >= 0 && middle2 < 0) {
        middle2 = -middle2;
        p1x = R * (p1 * t * pentagramCoords[locationEnum[middle1]].x + -p2 * (1-t) * pentagramCoords[locationEnum[middle2]].x);
        p1y = R * (-p1 * t * pentagramCoords[locationEnum[middle1]].y + p2 * (1-t) * pentagramCoords[locationEnum[middle2]].y);
    } else {
        p1x = p1 * R * (t * pentagramCoords[locationEnum[middle1]].x + (1-t) * pentagramCoords[locationEnum[middle2]].x);
        p1y = -p1 * R * (t * pentagramCoords[locationEnum[middle1]].y + (1-t) * pentagramCoords[locationEnum[middle2]].y);
    }

    let p2x = R * (t * pentagramCoords[locationEnum[end1]].x + (1-t) * pentagramCoords[locationEnum[end2]].x);
    let p2y = -R * (t * pentagramCoords[locationEnum[end1]].y + (1-t) * pentagramCoords[locationEnum[end2]].y);

    pathString += `${p0x} ${p0y} Q ${p1x} ${p1y} ${p2x} ${p2y}`;
    return pathString
}

function arcPath(data, R, t = 1) {
    let [start, middle, end] = [data.start, data.middle, data.end];
    if (middle === undefined) {
        return `M 0 0 L ${R * pentagramCoords[locationEnum[end]].x} ${-R * pentagramCoords[locationEnum[end]].y}`
    }
    let inCycle = false;
    let pathString = 'M ';
    //let p = 0.75;
    let p1 = 0.69;
    let p2 = 1;

    let p0x = R * pentagramCoords[locationEnum[start]].x;
    let p0y = -R * pentagramCoords[locationEnum[start]].y;

    let p1x;
    let p1y;

    if (middle < 0) {
        middle = -middle;
        p1x = -p2 * R * pentagramCoords[locationEnum[middle]].x;
        p1y = p2 * R * pentagramCoords[locationEnum[middle]].y;
        inCycle = true;
    } else {

        p1x = p1 * R * pentagramCoords[locationEnum[middle]].x;
        p1y = -p1 * R * pentagramCoords[locationEnum[middle]].y;

    }

    let p2x = R * pentagramCoords[locationEnum[end]].x;
    let p2y = -R * pentagramCoords[locationEnum[end]].y;

    let q0x = t * p1x + (1 - t) * p0x;
    let q0y = t * p1y + (1 - t) * p0y;

    let q1x = t * p2x + (1 - t) * p1x;
    let q1y = t * p2y + (1 - t) * p1y;

    let q2x = t * q1x + (1 - t) * q0x;
    let q2y = t * q1y + (1 - t) * q0y;

    pathString += `${p0x} ${p0y} Q ${q0x} ${q0y} ${q2x} ${q2y}`;
    return pathString
}

function drawArc(data, R, t) {
    let duad = clockwiseForm[[data.start, data.end].join('')];

    if (data.middle == undefined) {
        if (data.start === '0') {
            let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${R * pentagramCoords[locationEnum[data.start]].x}`);
            line.setAttribute('y1', `${-R * pentagramCoords[locationEnum[data.start]].y}`);
            line.setAttribute('x2', `${R * pentagramCoords[locationEnum[data.end]].x}`);
            line.setAttribute('y2', `${-R * pentagramCoords[locationEnum[data.end]].y}`);
            line.setAttribute('data-id', data.colorIdx + 1);
            line.setAttribute('class', 'outline')
            background.appendChild(line);
            line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${R * pentagramCoords[locationEnum[data.start]].x}`);
            line.setAttribute('y1', `${-R * pentagramCoords[locationEnum[data.start]].y}`);
            line.setAttribute('x2', `${R * pentagramCoords[locationEnum[data.end]].x}`);
            line.setAttribute('y2', `${-R * pentagramCoords[locationEnum[data.end]].y}`);
            line.setAttribute('data-id', data.colorIdx + 1);
            line.setAttribute('class', `bgLine`)
            background.appendChild(line);
        }
        else {
            let arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arc.setAttribute('d', `
                M ${R * pentagramCoords[locationEnum[data.start]].x} ${-R * pentagramCoords[locationEnum[data.start]].y} 
                A ${R} ${R} 0 0 1 ${R * pentagramCoords[locationEnum[data.end]].x} ${-R * pentagramCoords[locationEnum[data.end]].y}
            `);
            arc.setAttribute('fill', 'none');
            arc.setAttribute('data-id', duad);
            background.appendChild(arc);
            arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arc.setAttribute('d', `
                M ${R * pentagramCoords[locationEnum[data.start]].x} ${-R * pentagramCoords[locationEnum[data.start]].y} 
                A ${R} ${R} 0 0 1 ${R * pentagramCoords[locationEnum[data.end]].x} ${-R * pentagramCoords[locationEnum[data.end]].y}
            `);
            arc.setAttribute('fill', 'none');
            arc.setAttribute('class', 'bgLine')
            arc.setAttribute('data-color-idx', data.colorIdx);
            arc.setAttribute('stroke', colors[data.colorIdx]);
            arc.setAttribute('stroke-linecap', 'round');
            arc.setAttribute('stroke-dasharray', '1,1');
            background.appendChild(arc);
        }
    } else {
        // [start, end, middle, left, right, color] = [data.start, data.end, data.middle, data.left, data.right, data.color];
        let inCycle = data.middle < 0;
        pathString = arcPath(data, R, t);

        let arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', pathString);
        arc.setAttribute('class', 'outline');
        arc.setAttribute('duad', duad);
        arc.setAttribute('data-id', data.colorIdx + 1);
        background.appendChild(arc);

        arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arc.setAttribute('d', pathString);
        arc.setAttribute('class', 'bgLine');
        arc.setAttribute('data-id', data.colorIdx + 1);
        if (inCycle) {
            arc.setAttribute('stroke-linecap', 'round');
            arc.setAttribute('stroke-dasharray', '0,2');
        } else {
            arc.setAttribute('stroke-linecap', 'round');
            // arc.setAttribute('stroke-dasharray', `0,1,${data.colorIdx+1},1`);
        }
        arc.setAttribute('class', 'bgLine')
        background.appendChild(arc);

    }
}
function easeInOutCubic(x) {
return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function updatePentagrams() {
    updateBackground = true;
    selectedNodeIndices = [];
    document.querySelectorAll('.node.selected').forEach(node => {
        node.classList.toggle('selected');
    });
    document.querySelectorAll('.highlight').forEach(highlight => {
        highlight.classList.toggle('highlight');
    });
    pentagramLocations = {
        0: pentagramLocations[currentPhiInverse[0]],
        1: pentagramLocations[currentPhiInverse[1]],
        2: pentagramLocations[currentPhiInverse[2]],
        3: pentagramLocations[currentPhiInverse[3]],
        4: pentagramLocations[currentPhiInverse[4]],
        5: pentagramLocations[currentPhiInverse[5]]
    }
    // pentagramLocations = Object.fromEntries(Object.entries(pentagramLocations).map(([key, value]) => [value, +key]));
    pentagramGroups.forEach(pentagramGroup => {
        [backgroundGroup, lineGroup, nodeGroup] = Array.from(pentagramGroup.children);
        [centerLinesGroup, backgroundLinesGroup, synthemeLinesGroup] = Array.from(lineGroup.children);
        Array.from(centerLinesGroup.children).forEach((line, i) => {
            let idx = line.getAttribute('data-id');
            line.setAttribute('data-id', `${cycle[idx - 1]}`);
        });
        Array.from(synthemeLinesGroup.children).forEach(line => {
            let idx = line.getAttribute('data-id');
            line.setAttribute('data-id', `${cycle[idx - 1]}`);
        });
        Array.from(nodeGroup.children).forEach((node, i) => {
            let nodeId = node.getAttribute('id');
            let pentagramIdx = nodeId.split('-')[1];
            let nodeIdx = nodeId.split('-')[2];
            let idx = cycle[nodeIdx - 1];
            node.setAttribute('id', `node-${pentagramIdx}-${idx}`);
            node.setAttribute('class', `node node-${idx}`);
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
    // setTimeout(() => {
    //     requestAnimationFrame(animationLoop);
    // }, 1000);

}
function animate(t) {
    if (animStart === undefined) {
        animStart = t;
    }
    const elapsed = t - animStart;
    const shift = Math.min(elapsed / 1200, 1.5);
    if (shift < 1) {
        if (shift < 0.5) {
            background.setAttribute('opacity', 1 - easeInOutCubic(2 * shift));
        } else {
            background.setAttribute('opacity', 1 - easeInOutCubic(2 * (1-shift)));
        }
        let bgOpacity = background.getAttribute('opacity');
        if (bgOpacity <= epsilon && updateBackground) {
            colors = cycle.map(i => colors[i - 1]);
            document.querySelectorAll('.bgLine').forEach(arc => {
                let arcColorIdx = arc.getAttribute('data-color-idx');
                arc.setAttribute('stroke', colors[arcColorIdx]);
            });
            updateBackground = false;
        }
        let duad = clockwiseForm[selectedNodeIndices.join('')];
        currentPhi = phi[duad]
        currentPhiInverse = Object.fromEntries(Object.entries(currentPhi).map(([key, value]) => [value, +key]));

        // let reverseLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([key, value]) => [value, key]));

        interpolatePentagrams(pentagramData[pentagramLocations[0]], pentagramData[pentagramLocations[currentPhi[0]]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[pentagramLocations[1]], pentagramData[pentagramLocations[currentPhi[1]]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[pentagramLocations[2]], pentagramData[pentagramLocations[currentPhi[2]]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[pentagramLocations[3]], pentagramData[pentagramLocations[currentPhi[3]]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[pentagramLocations[4]], pentagramData[pentagramLocations[currentPhi[4]]], easeInOutCubic(shift));
        interpolatePentagrams(pentagramData[pentagramLocations[5]], pentagramData[pentagramLocations[currentPhi[5]]], easeInOutCubic(shift));

        requestAnimationFrame(animate);

    } else {
        animStart = undefined;
        updatePentagrams();
        // requestAnimationFrame(animate);
    }
    
}
function drawBackground() {
    background.setAttribute('transform', `translate(${cx}, ${cy})`);
    background.setAttribute('id', 'background-layer');

    '12345'.split('').forEach(i => {
        drawArc({
            start: '0',
            end: i,
            colorIdx: i - 1
        }, R);
    });

    arcData.forEach(arc => {
        drawArc(arc, R);
    });

    drawArc({ start: '1', middle: -4, end: '2', colorIdx: 3 }, R);
    drawArc({ start: '2', middle: -5, end: '3', colorIdx: 4 }, R);
    drawArc({ start: '3', middle: -1, end: '4', colorIdx: 0 }, R);
    drawArc({ start: '4', middle: -2, end: '5', colorIdx: 1 }, R);
    drawArc({ start: '5', middle: -3, end: '1', colorIdx: 2 }, R);

    // drawArc({ start: '1', end: '2', colorIdx: 3 });
    // drawArc({ start: '2', end: '3', colorIdx: 4 });
    // drawArc({ start: '3', end: '4', colorIdx: 0 });
    // drawArc({ start: '4', end: '5', colorIdx: 1 });
    // drawArc({ start: '5', end: '1', colorIdx: 2 });


    mainSvg.appendChild(background);
}