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
    let location = pentagramCoords[pentagramLocations[pentagram.id]];

    let pentagramGroup = createElement('g', {
        id: pentagram.id,
        transform: `translate(${R * location.x}, ${-R * location.y})`,
        parent: target
    });
    pentagramGroups.push(pentagramGroup);

    let backgroundGroup = createElement('g', {class: 'background', parent: pentagramGroup});
    let linesGroup = createElement('g', {class: 'lines', parent: pentagramGroup});
    let nodesGroup = createElement('g', {class: 'nodes', parent: pentagramGroup});
    return [pentagramGroup, backgroundGroup, linesGroup, nodesGroup];
}

function createPentagramEdges(pentagram, backgroundGroup, linesGroup) {
    let bgPath = createElement('path', {d: createPentagramPath(pentagram), class: 'background-path', parent: backgroundGroup});

    duadList.forEach(duad => {
        const outline = createElement('path', {duad: duad, class: 'outline', parent: linesGroup})
        const path = createElement('path', {duad: duad, class: 'syntheme-line', parent: linesGroup})
    })

    pentagram.synthemes.forEach((syntheme, i) => {
        syntheme.forEach(duad => {
            let [left, right] = duad.split('');

                let pentagramCycle = pentagram['5-cycle'].map((v, i, arr) => {let [a, b] = [v, arr[(i+1) % arr.length]].sort(); return a + b;})
                let inCycle = false;
                if (pentagramCycle.includes(duad) && config.showCycle) {
                    inCycle = true;
                }

                const path = arcPath(duad, r);

                const duadLines = linesGroup.querySelectorAll(`path[duad="${duad}"]`);
                duadLines.forEach(line => {
                    line.setAttribute('d', path)
                    line.setAttribute('data-id', i + 1)
                    if (!line.classList.contains('outline') && inCycle) {
                        line.classList.add('in-cycle')
                    }
                })
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
            const path = arcPath(duad, nodeR - nodePadding);

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
    createPentagramEdges(pentagram, backgroundGroup, linesGroup);
    createPentagramNodes(pentagram, nodesGroup);
    let text = createElement('text', {
        class: 'pentagram-name',
        parent: pentagramGroup
    });
    text.innerHTML = pentagram.id;
}

function createPentagramPath() {
    return createInterpolatedPentagramPath(0);
}

function interpolateCoordinates(t) {
    let coords = [];
    for (let i = 0; i < 6; i++) {
        let p1coords = pentagramCoords[locationEnum[i]];
        let p2coords = pentagramCoords[locationEnum[currentPhi[i]]];
        let interpolatedCoords = {
            x: p1coords.x + (p2coords.x - p1coords.x) * t,
            y: p1coords.y + (p2coords.y - p1coords.y) * t
        };
        coords.push(interpolatedCoords);
    }
    return coords;
}

function createInterpolatedPentagramPath(t) {
    let coords = interpolateCoordinates(t);

    let pathString = 'M';

    for (let i = 1; i <= 5; i++) {
        pathString += ` ${r * coords[i].x} ${-r * coords[i].y}`;
    }
    pathString += ' Z';

    return pathString;
}

function morphPentagram(pentagram, t) {
    let coords = interpolateCoordinates(t);

    let pentagramGroup = document.getElementById(pentagram.id);
    let [backgroundGroup, linesGroup, nodesGroup] = Array.from(pentagramGroup.children);

    const bgPath = backgroundGroup.querySelector('path');
    if (t < 0.5) {
        bgPath.setAttribute('d', createInterpolatedPentagramPath(t));
    } else {
        bgPath.setAttribute('d', createInterpolatedPentagramPath(1 - t));
    }
    
    const duads = ['01', '02', '03', '04', '05', '12','13','14','15','23','24','25','34','35','45'].map(duad => clockwiseForm[duad]);

    duads.forEach(duad => {
        let path = interpolateArcPath(
            duad,
            r, t);
        let nodePath = interpolateArcPath(
            duad, 
            nodeR - nodePadding, t);

        let synthemeLine = linesGroup.querySelectorAll(`path[duad="${duad}"]`);
        synthemeLine.forEach(line => line.setAttribute('d', path));

        let nodeSyntheme = nodesGroup.querySelector(`.node>.syntheme>.duad[data-id="${duad}"]`); 
        nodeSyntheme.querySelector('path').setAttribute('d', nodePath);
    });
    


}

function shiftNodes(t) {
    [1, 2, 3, 4, 5].forEach(i => {
        let location1 = pentagramCoords[nodeLocations[i]];
        let location2 = pentagramCoords[locationEnum[cycleInverse[i-1]]];
        if (t == 0) {
            console.log(i, nodeLocations[i], cycle[i-1], locationEnum[cycleInverse[i-1]]);
        }
        let nodeLocation = {
            x: r * (location1.x + (location2.x - location1.x) * t),
            y: -r * (location1.y + (location2.y - location1.y) * t)
        }   

        document.querySelectorAll(`.node-${i}`).forEach(node => {


            node.setAttribute('transform', `translate(${nodeLocation.x}, ${nodeLocation.y})`);

        })

    })
}

function shiftPentagram(pentagram, t) {
    let pentagramGroup = document.getElementById(pentagram.id);

    let reverseLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([key, value]) => [value, key]));

    let location1 = pentagramCoords[pentagramLocations[pentagram.id]];
    let location2 = pentagramCoords[locationEnum[currentPsi[pentagram.id]]];

    let location = {
        x: R * (location1.x + (location2.x - location1.x) * t),
        y: -R * (location1.y + (location2.y - location1.y) * t)
    };

    pentagramGroup.setAttribute('transform', `translate(${location.x}, ${location.y})`);

}

function interpolatePentagram(pentagram, t) {
    shiftPentagram(pentagram, t);
    morphPentagram(pentagram, t);
}

function interpolateArcPath(duad, R, t) {
    let [start1, end1] = duad.split('');
    let [start2, end2] = [start1, end1].map(x => x == 0 ? 0 : cycleInverse[x - 1]);

    let middle1Duad = `${reverseLocationEnum[nodeLocations[start1]]}${reverseLocationEnum[nodeLocations[end1]]}`

    let middle1 = middles[clockwiseForm[middle1Duad]];
    let middle2 = middles[clockwiseForm[`${start2}${end2}`]];
    // let middle1 = undefined;
    // let middle2 = undefined;

    let inCycle = false;
    let pathString = 'M ';
    let lambda1 = 0.69;
    let lambda2 = 1;

    let p1coords = {
        start: pentagramCoords[nodeLocations[start1]],
        end: pentagramCoords[nodeLocations[end1]]
    }

    let p2coords = {
        start: pentagramCoords[locationEnum[start2]],
        end: pentagramCoords[locationEnum[end2]]
    }

    if (middle1 === undefined) {
        p1coords.middle = {x: (p1coords.start.x + p1coords.end.x) / 2, y: (p1coords.start.y + p1coords.end.y) / 2};
    } else if (middle1 < 0) {
        let middle = pentagramCoords[locationEnum[-middle1]];
        p1coords.middle = {x: -lambda2 * middle.x, y: -lambda2 * middle.y};
    } else {
        let middle = pentagramCoords[locationEnum[middle1]];
        p1coords.middle = {x: lambda1 * middle.x, y: lambda1 * middle.y};
    }

    if (middle2 === undefined) {
        p2coords.middle = {x: (p2coords.start.x + p2coords.end.x) / 2, y: (p2coords.start.y + p2coords.end.y) / 2};
    } else if (middle2 < 0) {
        let middle = pentagramCoords[locationEnum[-middle2]];
        p2coords.middle = {x: -lambda2 * middle.x, y: -lambda2 * middle.y};
    } else {
        let middle = pentagramCoords[locationEnum[middle2]];
        p2coords.middle = {x: lambda1 * middle.x, y: lambda1 * middle.y};
    }

    let point0 = {
        x: R * ((1 - t) * p1coords.start.x + t * p2coords.start.x),
        y: -R * ((1 - t) * p1coords.start.y + t * p2coords.start.y)
    }

    let point1 = {
        x: R * ((1 - t) * p1coords.middle.x + t * p2coords.middle.x),
        y: -R * ((1 - t) * p1coords.middle.y + t * p2coords.middle.y)
    }

    let point2 = {
        x: R * ((1 - t) * p1coords.end.x + t * p2coords.end.x),
        y: -R * ((1 - t) * p1coords.end.y + t * p2coords.end.y)
    }

    pathString += `${point0.x} ${point0.y} Q ${point1.x} ${point1.y} ${point2.x} ${point2.y}`;
    return pathString
}

function arcPath(duad, R, t = 1) {
    return interpolateArcPath(duad, R, 0);
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
        pathString = arcPath(duad, R, t);

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
        0: locationEnum[currentPsi[0]],
        1: locationEnum[currentPsi[1]],
        2: locationEnum[currentPsi[2]],
        3: locationEnum[currentPsi[3]],
        4: locationEnum[currentPsi[4]],
        5: locationEnum[currentPsi[5]]
    }
    for (let i = 1; i <= 5; i++) {
        nodeLocations[i] = locationEnum[cycleInverse[i - 1]];
    }
    

    oldCycle = cycle;
    // pentagramLocations = Object.fromEntries(Object.entries(pentagramLocations).map(([key, value]) => [value, +key]));
    // pentagramGroups.forEach(pentagramGroup => {
    //     [backgroundGroup, lineGroup, nodeGroup] = Array.from(pentagramGroup.children);
    //     [centerLinesGroup, backgroundLinesGroup, synthemeLinesGroup] = Array.from(lineGroup.children);
    //     Array.from(centerLinesGroup.children).forEach((line, i) => {
    //         let idx = line.getAttribute('data-id');
    //         line.setAttribute('data-id', `${cycle[idx - 1]}`);
    //     });
    //     Array.from(synthemeLinesGroup.children).forEach(line => {
    //         let idx = line.getAttribute('data-id');
    //         line.setAttribute('data-id', `${cycle[idx - 1]}`);
    //     });
    //     Array.from(nodeGroup.children).forEach((node, i) => {
    //         let nodeId = node.getAttribute('id');
    //         let pentagramIdx = nodeId.split('-')[1];
    //         let nodeIdx = nodeId.split('-')[2];
    //         let idx = cycle[nodeIdx - 1];
    //         node.setAttribute('id', `node-${pentagramIdx}-${idx}`);
    //         node.setAttribute('class', `node node-${idx}`);
    //         let synthemeGroup = node.children[1];
    //         Array.from(synthemeGroup.children).forEach(duadGroup => {
    //             let duad = duadGroup.getAttribute('data-id');
    //             [left, right] = duad.split('');
    //             if (left !== '0') {
    //                 left = cycle[left - 1];
    //             }
    //             if (right !== '0') {
    //                 right = cycle[right - 1];
    //             }
    //             duadGroup.setAttribute('data-id', `${left}${right}`);
    //         });
    //     });
    // });
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
        // let reverseLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([key, value]) => [value, key]));

        interpolatePentagram(pentagramData[0], easeInOutCubic(shift));
        interpolatePentagram(pentagramData[1], easeInOutCubic(shift));
        interpolatePentagram(pentagramData[2], easeInOutCubic(shift));
        interpolatePentagram(pentagramData[3], easeInOutCubic(shift));
        interpolatePentagram(pentagramData[4], easeInOutCubic(shift));
        interpolatePentagram(pentagramData[5], easeInOutCubic(shift));
        shiftNodes(easeInOutCubic(shift));

        requestAnimationFrame(animate);

    } else {
        animStart = undefined;
        updatePentagrams();
        // requestAnimationFrame(animate);
    }
    
}
function drawBackground() {
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