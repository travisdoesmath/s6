class Arc {
    constructor(data, config, target) {
        this.duad = data.duad;
        this.r = data.r;
        this.pentagram = data.pentagram;
        this.composer = data.pentagram.composer;
        this.globals = data.pentagram.composer.globals;
        this.target = target;
        this.classPrefix = config.classPrefix || '';
        this.config = config;
        if (this.config.hasOutline) {
            this.outline = target.querySelector(`.outline[duad='${this.duad}']`);
            if (!this.outline) {
                this.outline = createElement('path', {
                    class: 'outline',
                    duad: this.duad,
                    parent: target
                });
            }
        }
        this.pathElement = target.querySelector(`.syntheme-line[duad='${this.duad}']`);
        if (!this.pathElement) {
            this.pathElement = createElement('path', {
                class: `${this.classPrefix}syntheme-line`,
                duad: this.duad,
                parent: target
            });
        }
        if (this.config.showCycles) {
            let pentagramCycle = this.pentagram.fiveCycle.map((v, i, arr) => {
                let d = [v, arr[(i+1) % arr.length]].join(''); 
                return this.pentagram.composer.clockwiseForm[d];
            })
            this.inCycle = false;
            if (pentagramCycle.includes(duad) && this.composer.config.showCycle) {
                this.inCycle = true;
            }
        }
        this.middles = {
            '12': -4,
            '23': -5,
            '34': -1,
            '45': -2,
            '51': -3,
            '13': 2,
            '24': 3,
            '35': 4,
            '41': 5,
            '52': 1,
        }

        const pathString = this.interpolatePathString();

        this.pathElement.setAttribute('d', pathString);
        if (config.hasOutline) {
            this.outline.setAttribute('d', pathString);
            if (!this.pathElement.classList.contains('outline') && this.inCycle) {
                this.pathElement.classList.add('in-cycle')
            }
        }
    }
    
    morph(t, cycleFunction) {
        const pathString = this.interpolatePathString(t, cycleFunction);
        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
        }
    }

    interpolatePathString(t=0, cycleFunction) {
        let [start1, end1] = this.duad.split('');
        let start2;
        let end2;
        if (cycleFunction) {
            [start2, end2] = [start1, end1].map(cycleFunction);
        } else {
            [start2, end2] = [start1, end1];
        }

        const locations = this.globals.nodeLocations;
        const locationEnum = this.globals.locationEnum;
        const reverseLocationEnum = this.globals.reverseLocationEnum;
        const clockwiseForm = this.globals.clockwiseForm;
        const pentagramCoords = this.globals.pentagramCoords;

        let middle1Duad = `${reverseLocationEnum[locations[start1]]}${reverseLocationEnum[locations[end1]]}`

        let middle1 = this.middles[clockwiseForm[middle1Duad]];
        let middle2 = this.middles[clockwiseForm[`${start2}${end2}`]];

        let pathString = 'M ';
        let lambda1 = 0.69;
        let lambda2 = 1;

        let p1coords = {
            start: pentagramCoords[locations[start1]],
            end: pentagramCoords[locations[end1]]
        }

        let p2coords = {
            start: pentagramCoords[locations[start2]],
            end: pentagramCoords[locations[end2]]
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
            x: this.r * ((1 - t) * p1coords.start.x + t * p2coords.start.x),
            y: -this.r * ((1 - t) * p1coords.start.y + t * p2coords.start.y)
        }

        let point1 = {
            x: this.r * ((1 - t) * p1coords.middle.x + t * p2coords.middle.x),
            y: -this.r * ((1 - t) * p1coords.middle.y + t * p2coords.middle.y)
        }

        let point2 = {
            x: this.r * ((1 - t) * p1coords.end.x + t * p2coords.end.x),
            y: -this.r * ((1 - t) * p1coords.end.y + t * p2coords.end.y)
        }

        pathString += `${point0.x} ${point0.y} Q ${point1.x} ${point1.y} ${point2.x} ${point2.y}`;
        return pathString
    }    
}

class PentagramNode {
    constructor(data, config, target) {
        this.id = data.id;
        this.syntheme = data.syntheme;
        this.r = data.r;
        this.padding = data.padding;
        this.pentagram = data.pentagram;
        this.globals = data.pentagram.composer.globals;
        this.target = target;

        this.nodeCircle = createElement('circle', {
            cx: '0',
            cy: '0',
            r: this.r,
            fill: `var(--color${this.id.split('-')[2]}-dark)`,
            parent: this.target
        });
        const synthemeGroup = createElement('g', {
            class: 'syntheme',
            parent: this.target
        });

        
        this.syntheme.forEach(duad => {
            const duadGroup = createElement('g', {
                class: 'duad',
                'data-id': duad,
                parent: synthemeGroup
            });
            const arcData = {
                duad: duad,
                r: this.r - this.padding,
                pentagram: this.pentagram,
                composer: this.pentagram.composer
            }
            const arcConfig = {
                hasOutline: true,
                classPrefix: 'node-'
            }
            const arc = new Arc(arcData, arcConfig, duadGroup);            

            let [left, right] = duad.split('');

            const pentagramCoords = this.globals.pentagramCoords;
            const locationEnum = this.globals.locationEnum;
            const i = this.id.split('-')[2];

            const circle1 = createElement('circle', {
                cx: `${(this.r - this.padding) * pentagramCoords[locationEnum[left]].x}`,
                cy: `${-(this.r - this.padding) * pentagramCoords[locationEnum[left]].y}`,
                r: `${this.r/10}`,
                fill: `var(--color${i}-light)`,
                stroke: 'none',
                parent: duadGroup
            });

            const circle2 = createElement('circle', {
                cx: `${(this.r - this.padding) * pentagramCoords[locationEnum[right]].x}`,
                cy: `${-(this.r - this.padding) * pentagramCoords[locationEnum[right]].y}`,
                r: `${this.r/10}`,
                fill: `var(--color${i}-light)`,
                stroke: 'none',
                parent: duadGroup
            });
        });

    }
}

class Pentagram {
    constructor(data, config, target) {
        this.id = data.id;
        this.synthemes = data.synthemes;
        this.target = target;
        this.config = config;
        this.composer = data.composer;
        this.r = data.r;
        this.globals = data.composer.globals;
        this.arcs = [];
    }

    createEdges() {
        let duadList = this.globals.duadList;
        duadList.forEach(duad => {
            const outline = createElement('path', {duad: duad, class: 'outline', parent: this.layers.lines})
            const pathElement = createElement('path', {duad: duad, class: 'syntheme-line', parent: this.layers.lines})
        })
        
        duadList.forEach(duad => {
            const arcData = {
                duad: duad,
                r: this.r,
                pentagram: this,
            }
            const arcConfig = {
                hasOutline: true,
            }
            const arc = new Arc(arcData, arcConfig, this.layers.lines);
            this.arcs.push(arc);
        })
    }

    shift(t, R) {
        let location1 = this.globals.pentagramCoords[this.globals.pentagramLocations[this.id]];
        let location2 = this.globals.pentagramCoords[this.globals.locationEnum[this.globals.currentPsi[this.id]]];

        let cx = R * (location1.x + location2.x) / 2;
        let cy = R * (location1.y + location2.y) / 2;

        // Calculate semi-major and semi-minor axes
        let dx = R * (location2.x - location1.x) / 2;
        let dy = R * (location2.y - location1.y) / 2;
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

        this.group.setAttribute('transform', `translate(${location.x}, ${-location.y})`);
    }

    createInterpolatedPentagramPath(t) {
        let coords = interpolateCoordinates(t);

        let pathString = 'M';

        let r = config.r;

        for (let i = 1; i <= 5; i++) {
            pathString += ` ${r * coords[i].x} ${-r * coords[i].y}`;
        }
        pathString += ' Z';

        return pathString;
    }

    morph(t) {
        // let [backgroundGroup, linesGroup, nodesGroup] = Array.from(this.group.children);

        // const bgPath = backgroundGroup.querySelector('path');
        // if (t < 0.5) {
        //     bgPath.setAttribute('d', this.createInterpolatedPentagramPath(t));
        // } else {
        //     bgPath.setAttribute('d', this.createInterpolatedPentagramPath(1 - t));
        // }

        this.arcs.forEach(arc => arc.morph(t, x => x == 0 ? 0 : this.globals.cycle[x - 1]));
    }
}

class ForegroundPentagram extends Pentagram {
    constructor(data, config, target) {
        super(data, config, target);
        this.fiveCycle = data['5-cycle'];
        this.globals = data.composer.globals;
        let location = this.globals.pentagramCoords[this.globals.pentagramLocations[this.id]];
        this.R = data.R;
        this.r = data.r;
        this.nodeR = data.nodeR;
        this.nodePadding = data.nodePadding;
        this.group = createElement('g', {
            id: this.id,
            transform: `translate(${this.R * location.x}, ${-this.R * location.y})`,
            parent: this.target
        });
        this.layers = {
            background: createElement('g', {class: 'background', parent: this.group}),
            lines: createElement('g', {class: 'lines', parent: this.group}),
            nodes: createElement('g', {class: 'nodes', parent: this.group}),
            labels: createElement('g', {class: 'labels', parent: this.group})
        }
        this.createEdges();
        this.createNodes();
    }
    
    createNodes() {
        const pentagramCoords = this.globals.pentagramCoords;
        const locationEnum = this.globals.locationEnum;
        '12345'.split('').forEach(i => {
            const coord = pentagramCoords[locationEnum[i]];
            const nodeGroup = createElement('g', {
                id: this.id, 
                transform: `translate(${this.r * coord.x}, ${-this.r * coord.y})`,
                class: `node node-${i}`,
                id: `node-${this.id}-${i}`,
                parent: this.layers.nodes,
            });
            nodeGroup.addEventListener('click', () => {
                let nodeIdx = nodeGroup.getAttribute('id').split('-')[2];
                if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
                {
                    let nodes = document.querySelectorAll(`.node-${nodeIdx}`);
                    nodes.forEach(n => n.classList.toggle('selected'));
                }
                if (nodeGroup.classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
                    this.globals.selectedNodeIndices.push(nodeIdx);
                } else {
                    this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
                }
                if (this.globals.selectedNodeIndices.length === 2) {
                    
                    // let reversePentagramLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([k,v]) => [v,k]));

                    let duad = this.globals.clockwiseForm[this.globals.selectedNodeIndices.map(x => this.globals.reverseLocationEnum[this.globals.nodeLocations[x]]).join('')];

                    for (let i = 0; i < 5; i++) {
                        this.globals.currentPhi[i] = this.globals.phi[duad][this.globals.currentPhi[i]];
                    }
                    this.globals.currentPhiInverse = Object.fromEntries(Object.entries(this.globals.currentPhi).map(([key, value]) => [value, +key]));

                    for (let i = 0; i < 6; i++) {
                        this.globals.currentPsi[i] = this.globals.phi[duad][this.globals.currentPsi[i]];
                    }
                    this.globals.currentPsiInverse = Object.fromEntries(Object.entries(this.globals.currentPsi).map(([key, value]) => [value, +key]));

                    let [a, b] = duad.split('');
                    let cycle = this.globals.cycle;
                    let swap = cycle[a - 1];
                    cycle[a - 1] = cycle[b - 1];
                    cycle[b - 1] = swap;
                    this.globals.cycleInverse = [1, 2, 3, 4, 5].map(i => cycle.indexOf(i) + 1);

                    let leftPentagram = document.getElementById(`${a}`);
                    let rightPentagram = document.getElementById(`${b}`);
                    
                    // let centerPentagram = document.getElementById(reversePentagramLocationMap['center']);
                    // let highlightDuad = centerPentagram.querySelector(`.outline[duad="${duad}"]`)
                    // let highlightBgDuad = background.querySelector(`path[duad="${duad}"]`)
                    // let highlightLeftNode = leftPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
                    // let highlightRightNode = rightPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
                    // highlightDuad.classList.add('highlight');
                    // highlightBgDuad.classList.add('highlight');
                    // highlightLeftNode.classList.add('highlight');
                    // highlightRightNode.classList.add('highlight');

                    setTimeout(() => {
                        requestAnimationFrame(animate);
                    }, 0)

                    // requestAnimationFrame(animate);
                } else {
                    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
                }

                //requestAnimationFrame(animate);
            });
            const nodeData = {
                id: `node-${this.id}-${i}`,
                syntheme: this.synthemes[i - 1],
                r: this.nodeR,
                padding: this.nodePadding,
                pentagram: this,
                group: nodeGroup
            }
            const nodeConfig = {

            }
            const node = new PentagramNode(nodeData, nodeConfig, nodeGroup);
            // const coord = pentagramCoords[locationEnum[i]];
            // const r = config.r;


        })
    }
}

class BackgroundPentagram extends Pentagram {
    constructor(data, target, composer) {
        super(data, target, composer);
        this.group = createElement('g', {
            id: 'background-layer',
            parent: this.target
        });
        this.layers = {
            background: createElement('g', {class: 'background', parent: this.group}),
            lines: createElement('g', {class: 'lines', parent: this.group})
        }
        this.createEdges();
    }
}

class PentagramComposer {
    constructor(data, config, target) {
        this.data = data;
        this.config = config;
        this.target = target;
        const duadList = ['05','04','03','02','01','12','23','34','45','51','13','24','35','41','52'];
        this.globals = {
            currentPhi: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
            cycle: [1, 2, 3, 4, 5],
            cycleInverse: [1, 2, 3, 4, 5],
            currentPhiInverse: [1, 2, 3, 4, 5],
            currentPsi: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
            currentPsiInverse: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
            duadList: duadList,
            clockwiseForm: [0, 1, 2, 3, 4, 5]
                .map(i => [0, 1, 2, 3, 4, 5].map(j => [i, j]).filter(([i, j]) => i !== j))
                .reduce((acc, elem) => acc.concat(elem), [])
                .reduce((acc, [i, j]) => {
                    acc[`${i}${j}`] = duadList.includes(`${i}${j}`) ? `${i}${j}` : `${j}${i}`;
                    return acc;
                }, {}),
            selectedNodeIndices: [],
            nodeLocations: {
                0: 'center',
                1: 'top',
                2: 'top right',
                3: 'bottom right',
                4: 'bottom left',
                5: 'top left'
            },
            pentagramLocations: {
                0: 'center',
                1: 'top',
                2: 'top right',
                3: 'bottom right',
                4: 'bottom left',
                5: 'top left'
            },
            nodeLocations: {
                0: 'center',
                1: 'top',
                2: 'top right',
                3: 'bottom right',
                4: 'bottom left',
                5: 'top left'
            },
            pentagramCoords: {
                'center': {x: 0, y: 0},
                'top': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
                'top right': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
                'bottom right': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
                'bottom left': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
                'top left': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}
            },
            locationEnum: {
                0: 'center',
                1: 'top',
                2: 'top right',
                3: 'bottom right',
                4: 'bottom left',
                5: 'top left'
            },
            reverseLocationEnum: {
                'center': 0,
                'top': 1,
                'top right': 2,
                'bottom right': 3,
                'bottom left': 4,
                'top left': 5
            },
            phi : {
                '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
                '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
                '41': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0},
                '51': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4},
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
                '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
                '52': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3},
                '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
                '35': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2},
                '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}
            }
        }

        this.createBackground();
        this.pentagrams = this.createPentagrams();        
    }

    createBackground() {
        const backgroundData = {
            id: 0,
            synthemes: [
                ['01', '24', '35'],
                ['02', '51', '34'],
                ['03', '12', '45'],
                ['04', '13', '52'],
                ['05', '41', '23']
            ],
            r: this.config.R,
            composer: this
        }
        const backgroundConfig = {
            showCycle: false            
        }
        this.background = new BackgroundPentagram(backgroundData, backgroundConfig, this.target);
    }

    createPentagrams() {
        let pentagrams = []
        this.data.pentagramData.forEach(pentagram => {
            const pentagramGroup = createElement('g', {
                class: 'pentagram',
                'data-id': pentagram.id,
            })

            const pentagramData = {
                id: pentagram.id,
                synthemes: pentagram.synthemes,
                '5-cycle': pentagram['5-cycle'],
                r: this.config.r,
                R: this.config.R,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                composer: this,
            }
            const configData = {
                showCycle: this.config.showCycle,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding
            }
            const newPentagram = new ForegroundPentagram(pentagramData, configData, this.target);
            pentagrams.push(newPentagram);
        });
        return pentagrams;
    }

    interpolate(t) {
        this.background.morph(t);
        this.pentagrams.forEach(pentagram => {
            pentagram.morph(t);
            pentagram.shift(t, this.config.R);
        });
    }

    updatePentagrams() {
        this.globals.selectedNodeIndices = [];
        // updateBackground = true;

        document.querySelectorAll('.node.selected').forEach(node => {
            node.classList.toggle('selected');
        });
        document.querySelectorAll('.highlight').forEach(highlight => {
            highlight.classList.toggle('highlight');
        });
        this.globals.pentagramLocations = {
            0: this.globals.locationEnum[this.globals.currentPsi[0]],
            1: this.globals.locationEnum[this.globals.currentPsi[1]],
            2: this.globals.locationEnum[this.globals.currentPsi[2]],
            3: this.globals.locationEnum[this.globals.currentPsi[3]],
            4: this.globals.locationEnum[this.globals.currentPsi[4]],
            5: this.globals.locationEnum[this.globals.currentPsi[5]]
        }
        for (let i = 1; i <= 5; i++) {
            this.globals.nodeLocations[i] = this.globals.locationEnum[cycleInverse[i - 1]];
        }
    }

}