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

    let R = config.R;
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

function createEdges(pentagram, backgroundGroup, linesGroup, r) {
    let pentagramBgPath = createElement('path', {d: createPentagramPath(pentagram), class: 'background-path', parent: backgroundGroup});

    duadList.forEach(duad => {
        const outline = createElement('path', {duad: duad, class: 'outline', parent: linesGroup})
        const path = createElement('path', {duad: duad, class: 'syntheme-line', parent: linesGroup})  
    })

    pentagram.synthemes.forEach((syntheme, i) => {
        syntheme.forEach(duad => {
            let [left, right] = duad.split('');

                let pentagramCycle = pentagram['5-cycle'].map((v, i, arr) => {
                    let d = [v, arr[(i+1) % arr.length]].join(''); 
                    return clockwiseForm[d];
                })
                let inCycle = false;
                if (pentagramCycle.includes(duad) && config.showCycle) {
                    inCycle = true;
                }

                const pentagramPath = arcPath(duad, r);

                const duadLines = linesGroup.querySelectorAll(`path[duad="${duad}"]`);
                duadLines.forEach(line => {
                    line.setAttribute('d', pentagramPath)
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
        const r = config.r;
        const node = createElement('g', {
            transform: `translate(${r * coord.x}, ${-r * coord.y})`,
            class: `node node-${i}`,
            id: `node-${pentagram.id}-${i}`,
            parent: nodesGroup
        });
        const nodeCircle = createElement('circle', {
            cx: '0',
            cy: '0',
            r: `${config.nodeR}`,
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
            const path = arcPath(duad, config.nodeR - config.nodePadding);

            const line = createElement('path', {
                d: path,
                stroke: `var(--color${i}-light)`,
                'stroke-width': `${config.nodeR/10}`,
                parent: duadGroup
            });

            const circle1 = createElement('circle', {
                cx: `${(config.nodeR - config.nodePadding) * pentagramCoords[locationEnum[left]].x}`,
                cy: `${-(config.nodeR - config.nodePadding) * pentagramCoords[locationEnum[left]].y}`,
                r: `${config.nodeR/10}`,
                fill: `var(--color${i}-light)`,
                stroke: 'none',
                parent: duadGroup
            });

            const circle2 = createElement('circle', {
                cx: `${(config.nodeR - config.nodePadding) * pentagramCoords[locationEnum[right]].x}`,
                cy: `${-(config.nodeR - config.nodePadding) * pentagramCoords[locationEnum[right]].y}`,
                r: `${config.nodeR/10}`,
                fill: `var(--color${i}-light)`,
                stroke: 'none',
                parent: duadGroup
            });

        });
        nodesGroup.appendChild(node);
    })
}

function createPentagram(pentagram, target) {

    let [pentagramGroup, backgroundGroup, linesGroup, nodesGroup] = createPentagramLayers(pentagram, target);
    createEdges(pentagram, backgroundGroup, linesGroup, config.r);
    createPentagramNodes(pentagram, nodesGroup);
    let labelGroup = createElement('g', {
        'class': 'labelGroup',
        parent: pentagramGroup
    });
    let labelBg = createElement('circle', {
        cx: '0',
        cy: '0',
        r: '3',
        fill: pentagram.id === 0 ? '#ddd' : `var(--color${pentagram.id})`,
        parent: labelGroup
    });
    let text = createElement('text', {
        class: 'pentagram-name',
        parent: labelGroup
    });
    text.innerHTML = pentagram.id == 0 ? 6 : pentagram.id;
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

    let r = config.r;

    for (let i = 1; i <= 5; i++) {
        pathString += ` ${r * coords[i].x} ${-r * coords[i].y}`;
    }
    pathString += ' Z';

    return pathString;
}

function morphPentagram(pentagram, t) {
    let pentagramGroup = document.getElementById(pentagram.id);
    let [backgroundGroup, linesGroup, nodesGroup] = Array.from(pentagramGroup.children);

    const bgPath = backgroundGroup.querySelector('path');
    if (t < 0.5) {
        bgPath.setAttribute('d', createInterpolatedPentagramPath(t));
    } else {
        bgPath.setAttribute('d', createInterpolatedPentagramPath(1 - t));
    }

    duadList.forEach(duad => {
        let path = interpolateArcPath(
            duad,
            config.r, t);
        let nodePath = interpolateArcPath(
            duad, 
            config.nodeR - config.nodePadding, t);

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
        let nodeLocation = {
            x: config.r * (location1.x + (location2.x - location1.x) * t),
            y: -config.r * (location1.y + (location2.y - location1.y) * t)
        }   
        document.querySelectorAll(`.node-${i}`).forEach(node => {
            node.setAttribute('transform', `translate(${nodeLocation.x}, ${nodeLocation.y})`);
        })
    })
}

function shiftPentagram(pentagram, t) {
    let pentagramGroup = document.getElementById(pentagram.id);

    let location1 = pentagramCoords[pentagramLocations[pentagram.id]];
    let location2 = pentagramCoords[locationEnum[currentPsi[pentagram.id]]];

    let cx = config.R * (location1.x + location2.x) / 2;
    let cy = config.R * (location1.y + location2.y) / 2;

    // Calculate semi-major and semi-minor axes
    let dx = config.R * (location2.x - location1.x) / 2;
    let dy = config.R * (location2.y - location1.y) / 2;
    let a = Math.sqrt(dx * dx + dy * dy); // semi-major axis
    let b = a * 0.01; // semi-minor axis (half the major axis for a 2:1 ratio)

    let angle = Math.PI * (1 - t);

    // Rotate the ellipse to align with the start and end points
    let rotationAngle = Math.atan2(dy, dx);

    // Parametric equations for ellipse with rotation
    let location = {
        x: cx + (a * Math.cos(angle) * Math.cos(rotationAngle) - b * Math.sin(angle) * Math.sin(rotationAngle)),
        y: cy + (b * Math.sin(angle) * Math.cos(rotationAngle) + a * Math.cos(angle) * Math.sin(rotationAngle))
    };

    pentagramGroup.setAttribute('transform', `translate(${location.x}, ${-location.y})`);
}

function interpolatePentagram(pentagram, t) {
    shiftPentagram(pentagram, t);
    morphPentagram(pentagram, t);
}

function interpolateArcPath(duad, R, t, locations = nodeLocations) {
    let [start1, end1] = duad.split('');
    let start2;
    let end;
    if (locations == nodeLocations) {
        [start2, end2] = [start1, end1].map(x => x == 0 ? 0 : cycleInverse[x - 1]);
    } else {
        [start2, end2] = [start1, end1].map(x => currentPsi[x]);
    }

    let middle1Duad = `${reverseLocationEnum[locations[start1]]}${reverseLocationEnum[locations[end1]]}`

    let middle1 = middles[clockwiseForm[middle1Duad]];
    let middle2 = middles[clockwiseForm[`${start2}${end2}`]];

    let inCycle = false;
    let pathString = 'M ';
    let lambda1 = 0.69;
    let lambda2 = 1;

    let p1coords = {
        start: pentagramCoords[locations[start1]],
        end: pentagramCoords[locations[end1]]
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

function easeInOutCubic(x) {
return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInOutSine(x) {
return -(Math.cos(Math.PI * x) - 1) / 2;
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
}

function interpolateBackground(t) {
    duadList.forEach(duad => {
        let path = interpolateArcPath(
            duad,
            config.R, t, pentagramLocations);

        let bgLine = background.querySelectorAll(`path[duad="${duad}"]`);
        bgLine.forEach(line => line.setAttribute('d', path));
    });
}

function animate(t) {
    if (animStart === undefined) {
        animStart = t;
    }
    const elapsed = t - animStart;
    const shift = Math.min(elapsed / 1200, 1.5);
    if (shift < 1) {
        //let t = easeInOutCubic(shift);
        let t = easeInOutSine(shift);
        interpolateBackground(t)
        interpolatePentagram(pentagramData[0], t);
        interpolatePentagram(pentagramData[1], t);
        interpolatePentagram(pentagramData[2], t);
        interpolatePentagram(pentagramData[3], t);
        interpolatePentagram(pentagramData[4], t);
        interpolatePentagram(pentagramData[5], t);
        shiftNodes(t);
        requestAnimationFrame(animate);
    } else {
        animStart = undefined;
        updatePentagrams();
        // requestAnimationFrame(animate);
    }
    
}

function drawBackground() {
    background.setAttribute('id', 'background-layer');
    mainSvg.appendChild(background);
    createEdges(pentagramData[0], background, background, config.R);    
}