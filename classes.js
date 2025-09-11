class Component {
    constructor(data, config, target, extensions={}) {
        if (this.constructor === Component) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.data = data;
        this.config = config;
        this.target = target;
        this.id = data.id;
        Object.entries(extensions).forEach(([key, value]) => {
            this[key] = value;
        })
        this.position = this.data.position || {x: 0, y: 0};
        this.group = createElement('g', {
            id: this.id,
            class: `${this.type}`,
            transform: `translate(${this.position.x}, ${this.position.y})`,
            parent: target

        })
        this.subcomponents = this.createSubcomponents();
    }

    createSubcomponents() {

    }

    morph(t) {
        // Implement interpolations that change the visual structure of the component
    }

    shift(t, linear=true) {
        const start = this.position;
        const end = this.targetPosition;
        const delta = end - start;
        if (linear) {
            let position = start + delta * t;
            this.group.setAttribute('transform', `translate(${position.x}, ${position.y})`);
        } else {
            // implement code for elliptic path
        }
    }

    update(data) {
        Object.entries(data).forEach(([key, value]) => {
            this[key] = value;
        });
    }
}

class Label extends Component {
    constructor(data, config, target) {
        super(data, config, target);
    }
}

class BaseComposer {
    constructor(data, config, target, extensions={}) {
        if (this.constructor === BaseComposer) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.data = data;
        this.config = config;
        this.target = target;
        this.animStart = undefined;
        Object.entries(extensions).forEach(([key, value]) => {
            this[key] = value;
        });
    }

    interpolate(t, multiStage=false) {
        if (multiStage) {
            if (t < 0.5) {
                this.components.forEach(component => {
                    component.morph(t);
                });
            } else {
                this.components.forEach(component => {
                    component.shift(t);
                });
            }
        } else {
            this.components.forEach((component, index) => {
                component.morph(t);
                component.shift(t);
            });
        }
    }

    interactionHandler() {

    }

    update() {
        this.updateComponents();
        this.updateState();
    }

    updateComponents() {
        this.components.forEach(component => {
            component.update();
        });
    }

    updateState() {

    }

    animate(t) {
        if (this.animStart === undefined) {
            this.animStart = t;
        }
        const elapsed = t - this.animStart;
        const shift = Math.min(elapsed / 1200, 1);
        
        if (shift < 1) {
            let t = easeInOutCubic(shift);
            this.interpolate(t);
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.animStart = undefined;
            this.update();
        }
    }
}

class Permutation {
    constructor(permutation) {
        if (typeof permutation == 'object') {
            this.permutation = permutation;
        } else if (Array.isArray(permutation)) {
            this.permutation = arrayToMap(permutation);
        } else if (typeof permutation == 'string') {
            this.permutation = stringToPermutationMap(permutation);
        } else if (typeof permutation == 'number') {
            this.permutation = Object.fromEntries([...Array(permutation).keys()].map(i => [i, i]));
        } else {
            throw new Error("Invalid permutation type");
        }
        this.cycleNotation = cycleNotation(this.permutation);
    }

    map(value) {
        return this.permutation[value] || value;
    }

    inverse(value) {
        value = String(value);
        return Object.keys(this.permutation).find(key => this.permutation[key] === value) || value;
    }
}

class Arc extends Component {
    constructor(data, config, target, extensions={}) {
        super(data, config, target, {
            type: 'arc',
            ...extensions
        });
        this.duad = data.duad;
        this.r = data.r;
        this.pentagram = data.pentagram;
        this.composer = data.pentagram.composer;
        this.globals = data.pentagram.composer.globals;
        this.locations = data.locations;
        this.target = target;
        this.classPrefix = config.classPrefix || '';
        this.colorIndex = data.colorIndex;
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
            this.outline.setAttribute('data-id', this.colorIndex);
        }
        this.pathElement = target.querySelector(`.duad-line[duad='${this.duad}']`);
        if (!this.pathElement) {
            this.pathElement = createElement('path', {
                class: `${this.classPrefix}duad-line`,
                duad: this.duad,
                parent: target
            });
        }
        this.pathElement.setAttribute('data-id', this.colorIndex);
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
    
    morph(t, cycleFunction, locations) {
        const pathString = this.interpolatePathString(t, cycleFunction, locations);
        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
        }
    }

    interpolatePathString(t=0, cycleFunction = x => x, locations = this.globals.pentagramLocations) {
        let [start1, end1] = this.duad.split('');
        let start2;
        let end2;
        [start2, end2] = [start1, end1].map(cycleFunction);

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

class Line {
    constructor(data, config, target) {
        this.duad = data.duad;
        this.r = data.r;
        this.pentagram = data.pentagram;
        this.composer = data.pentagram.composer;
        this.globals = data.pentagram.composer.globals;
        this.locations = this.globals.nodeLocations;
        this.target = target;
        this.classPrefix = config.classPrefix || '';
        this.colorIndex = data.colorIndex;
        this.config = config;

        if (this.config.hasOutline) {
            this.outline = target.querySelector(`.outline[duad='${this.duad}']`);
            if (!this.outline) {
                this.outline = createElement('line', {
                    class: 'outline',
                    duad: this.duad,
                    parent: target
                });
            }
        }
        this.lineElement = target.querySelector(`.mystic-line[duad='${this.duad}']`);
        if (!this.lineElement) {
            this.lineElement = createElement('line', {
                class: `${this.classPrefix}mystic-line`,
                duad: this.duad,
                parent: target
            });
        }
        this.lineElement.setAttribute('data-id', 2);
        if (this.config.showCycle) {
            let pentagramCycle = this.pentagram.data['5-cycle'].map((v, i, arr) => {
                let d = [v, arr[(i+1) % arr.length]].join(''); 
                return this.pentagram.composer.globals.clockwiseForm[d];
            })
            this.inCycle = false;
            if (pentagramCycle.includes(this.duad) && this.composer.config.showCycle) {
                this.inCycle = true;
                this.lineElement.setAttribute('in-cycle', 'true');
                this.lineElement.setAttribute('data-id', 1);
                this.outline.setAttribute('data-id', -1);
            }
        }

        this.morph(0, x => x, this.locations);
        
    }
    
    morph(t, cycleFunction) {
        const locations = this.locations;
        const locationEnum = this.globals.nodeLocationEnum;
        const pentagramCoords = this.globals.pentagramCoords;

        let [start1, end1] = this.duad.split('');
        let start2;
        let end2;
        [start2, end2] = [start1, end1].map(cycleFunction);

        let p1coords = {
            start: pentagramCoords[locations[start1]],
            end: pentagramCoords[locations[end1]]
        }

        let p2coords = {
            start: pentagramCoords[locationEnum[start2]],
            end: pentagramCoords[locationEnum[end2]]
        }

        let point0 = {
            x: this.r * ((1 - t) * p1coords.start.x + t * p2coords.start.x),
            y: -this.r * ((1 - t) * p1coords.start.y + t * p2coords.start.y)
        }

        let point1 = {
            x: this.r * ((1 - t) * p1coords.end.x + t * p2coords.end.x),
            y: -this.r * ((1 - t) * p1coords.end.y + t * p2coords.end.y)
        }

        this.lineElement.setAttribute('x1', point0.x);
        this.lineElement.setAttribute('y1', point0.y);
        this.lineElement.setAttribute('x2', point1.x);
        this.lineElement.setAttribute('y2', point1.y);
        if (this.config.hasOutline) {
            this.outline.setAttribute('x1', point0.x);
            this.outline.setAttribute('y1', point0.y);
            this.outline.setAttribute('x2', point1.x);
            this.outline.setAttribute('y2', point1.y);
            if (!this.lineElement.classList.contains('outline') && this.inCycle) {
                this.lineElement.classList.add('in-cycle')
            }
        }
    }
}

class PentagramNode extends Component {
    constructor(data, config, target) {
        super(data, config, target, {
            type: 'node',
            syntheme: data.syntheme,
            label: data.label,
            r: data.r,
            R: data.R,
            padding: data.padding,
            pentagram: data.pentagram,
            globals: data.pentagram.composer.globals
        });

    }

    createSubcomponents() {
        this.arcs = [];
        if (this.R == undefined || this.r == undefined) {
            console.log(this)
        }
        this.nodeCircle = createElement('circle', {
            cx: '0',
            cy: '0',
            r: this.r,
            
            parent: this.target
        });


        if (this.label) {
            const labelGroup = createElement('g', {
                class: 'label',
                parent: this.target
            });
            this.nodeCircle.setAttribute('fill', `var(--color1)`);
            let text = createElement('text', {
                class: 'mystic-pentagram-label',
                parent: labelGroup,
                fill: `var(--color1-dark)`,
                opacity: 0.5    
            });
            text.innerHTML = this.label;

        }

        
        if (this.syntheme) {
            const synthemeGroup = createElement('g', {
                class: 'syntheme',
                parent: this.target
            });
            this.nodeCircle.setAttribute('fill', `var(--color${this.id.split('-')[2]}-dark)`);
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
                    locations: this.globals.nodeLocations,
                    composer: this.pentagram.composer
                }
                const arcConfig = {
                    hasOutline: true,
                    classPrefix: 'node-'
                }
                const arc = new Arc(arcData, arcConfig, duadGroup);            
                this.arcs.push(arc);

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

    
}

class BasePentagram extends Component{
    constructor(data, config, target) {
        super(data, config, target, {
            synthemes: data.synthemes,
            composer: data.composer,
            r: data.r,
            globals: data.composer.globals
        });
    }

    createSubcomponents() {
        let subcomponents = {
            'arcs': [],
            'label': this.createLabel()
        };
        let duadList = this.globals.duadList;
        
        duadList.forEach(duad => {
            const outline = createElement('path', {duad: duad, class: 'outline', parent: this.group})
            const pathElement = createElement('path', {duad: duad, class: 'syntheme-line', parent: this.group})
        })
        
        this.synthemes.forEach((syntheme, i) => {
            syntheme.forEach(duad => {
                const arcData = {
                    duad: duad,
                    r: this.r,
                    pentagram: this,
                    locations: this.globals.pentagramLocations,
                    colorIndex: i + 1
                }
                const arcConfig = {
                    hasOutline: true,
                }
                const arc = new Arc(arcData, arcConfig, this.group);
                subcomponents.arcs.push(arc);
            })
        })
        return subcomponents;
    }

    createLabel() {
        const labelGroup = createElement('g', {
            id: this.id,
            class: 'label',
            parent: this.group
        });
        // const labelBg = createElement('circle', {
        //     cx: '0',
        //     cy: '0',
        //     r: '3',
        //     fill: this.id === 0 ? '#ddd' : `var(--color${this.id})`,
        //     parent: labelGroup
        // });
        let text = createElement('text', {
            class: 'pentagram-label',
            parent: labelGroup,
            fill: this.id === 0 ? '#666' : `var(--color${this.id}-dark)`,
            opacity: 0.5
        });
        text.innerHTML = ['A','B','C','D','E','F'][this.id];

        return {group: labelGroup, text: text};

    }

    morph(t) {
        this.arcs.forEach(arc => arc.morph(t, x => x == 0 ? 0 : this.globals.cycleInverse[x - 1]));
    }
}

class ForegroundPentagram extends BasePentagram {
    constructor(data, config, target) {
        super(data, config, target);
        this.type = 'foreground-pentagram';
        this.fiveCycle = data['5-cycle'];
        this.globals = data.composer.globals;
        let location = this.globals.pentagramCoords[this.globals.pentagramLocations[this.id]];
        this.locations = this.globals.pentagramLocations;
        this.R = data.R;
        this.r = data.r;
        this.nodeR = data.nodeR;
        this.nodePadding = data.nodePadding;
        
        // this.group = createElement('g', {
        //     id: this.id,
        //     transform: `translate(${this.R * location.x}, ${-this.R * location.y})`,
        //     parent: this.target
        // });
        this.layers = {
            background: createElement('g', {class: 'background', parent: this.group}),
            lines: createElement('g', {class: 'lines', parent: this.group}),
            nodes: createElement('g', {class: 'nodes', parent: this.group}),
            labels: createElement('g', {class: 'labels', parent: this.group})
        }
        this.createSubcomponents();
    }

    createSubcomponents() {
        super.createSubcomponents();
        this.nodes = this.createNodes();
    }

    morph(t, cycleFunction = x => x == 0 ? 0 : this.globals.cycleInverse[x - 1], locations = this.globals.nodeLocations) {
        this.arcs.forEach(arc => arc.morph(t, x => x == 0 ? 0 : this.globals.cycleInverse[x - 1], locations));
        this.nodes.forEach(node => node.shift(t));
    }
    createLabel() {
        const labelGroup = createElement('g', {
            id: this.id,
            class: 'label',
            parent: this.group
        });
        const labelBg = createElement('circle', {
            cx: '0',
            cy: '0',
            r: '3',
            fill: this.id === 0 ? '#ddd' : `var(--color${this.id})`,
            parent: labelGroup
        });
        let text = createElement('text', {
            class: 'pentagram-label',
            parent: labelGroup,
            fill: this.id === 0 ? '#666' : `var(--color${this.id}-dark)`,
            opacity: 0.5    
        });
        text.innerHTML = ['A','B','C','D','E','F'][this.id];
    }
    
    createNodes() {
        const pentagramCoords = this.globals.pentagramCoords;
        const locationEnum = this.globals.locationEnum;
        let nodes = [];
        '12345'.split('').forEach(i => {
            const coord = pentagramCoords[locationEnum[i]];
            const nodeGroup = createElement('g', {
                id: this.id, 
                transform: `translate(${this.r * coord.x}, ${-this.r * coord.y})`,
                class: `node node-${i}`,
                id: `node-${this.id}-${i}`,
                parent: this.group,
            });
            // nodeGroup.addEventListener('click', () => {
            //     let nodeIdx = nodeGroup.getAttribute('id').split('-')[2];
            //     if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
            //     {
            //         let nodes = this.target.querySelectorAll(`.node-${nodeIdx}`);
            //         nodes.forEach(n => n.classList.toggle('selected'));
            //     }
            //     if (nodeGroup.classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
            //         this.globals.selectedNodeIndices.push(nodeIdx);
            //     } else {
            //         this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
            //     }
            //     if (this.globals.selectedNodeIndices.length === 2) {
                    
            //         // let reversePentagramLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([k,v]) => [v,k]));

            //         let duad = this.globals.clockwiseForm[this.globals.selectedNodeIndices.map(x => this.globals.reverseLocationEnum[this.globals.nodeLocations[x]]).join('')];

            //         for (let i = 0; i < 5; i++) {
            //             this.globals.currentPhi[i] = this.globals.phi[duad][this.globals.currentPhi[i]];
            //         }
            //         this.globals.currentPhiInverse = Object.fromEntries(Object.entries(this.globals.currentPhi).map(([key, value]) => [value, +key]));

            //         for (let i = 0; i < 6; i++) {
            //             this.globals.currentPsi[i] = this.globals.phi[duad][this.globals.currentPsi[i]];
            //         }
            //         this.globals.currentPsiInverse = Object.fromEntries(Object.entries(this.globals.currentPsi).map(([key, value]) => [value, +key]));

            //         let [a, b] = duad.split('');
            //         let cycle = this.globals.cycle;
            //         let swap = cycle[a - 1];
            //         cycle[a - 1] = cycle[b - 1];
            //         cycle[b - 1] = swap;
            //         this.globals.cycleInverse = [1, 2, 3, 4, 5].map(i => cycle.indexOf(i) + 1);

            //         let leftPentagram = document.getElementById(`${a}`);
            //         let rightPentagram = document.getElementById(`${b}`);
                    
            //         // let centerPentagram = document.getElementById(reversePentagramLocationMap['center']);
            //         // let highlightDuad = centerPentagram.querySelector(`.outline[duad="${duad}"]`)
            //         // let highlightBgDuad = background.querySelector(`path[duad="${duad}"]`)
            //         // let highlightLeftNode = leftPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
            //         // let highlightRightNode = rightPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
            //         // highlightDuad.classList.add('highlight');
            //         // highlightBgDuad.classList.add('highlight');
            //         // highlightLeftNode.classList.add('highlight');
            //         // highlightRightNode.classList.add('highlight');

            //         setTimeout(() => {
            //             requestAnimationFrame(this.composer.animate.bind(this.composer));
            //         }, 0)

            //         // requestAnimationFrame(animate);
            //     } else {
            //         document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
            //     }

            //     //requestAnimationFrame(animate);
            // });
            const nodeData = {
                id: `node-${this.id}-${i}`,
                syntheme: this.synthemes[i - 1],
                R: this.r,
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

            nodes.push(node);


        })
        return nodes;
    }
}

class BackgroundPentagram extends BasePentagram {
    constructor(data, target, composer) {
        super(data, target, composer, 'background-pentagram');
        this.layers = {
            background: createElement('g', {class: 'background', parent: this.group}),
            lines: createElement('g', {class: 'lines', parent: this.group})
        }
        
        this.createSubcomponents();
    }
    morph(t) {
        this.arcs.forEach(arc => arc.morph(t, x => this.globals.currentPsi[x]), this.globals.pentagramLocations);
    }

}

class MysticPentagram extends BasePentagram {
    constructor(data, target, composer) {
        super(data, target, composer, {
            type: 'mystic',
            fiveCycle: data['5-cycle'],
            composer: data.composer,
            globals: data.composer.globals,
            R: data.R,
            nodeR: data.nodeR

        });
        let location = this.globals.locationCoords[this.globals.pentagramLocations[this.id]];
        this.locations = this.globals.pentagramLocations;
        this.nodeLocations = this.globals.nodeLocations
        this.createSubcomponents();
    }

    createSubcomponents() {
        this.lines = this.createEdges();
        this.createLabel();
        this.nodes = this.createNodes();
    }

    createEdges() {
        let duadList = this.globals.duadList;
        duadList.forEach(duad => {
            const outline = createElement('line', {duad: duad, class: 'outline', parent: this.group})
            const pathElement = createElement('line', {duad: duad, class: 'mystic-line', parent: this.group})
        })
        let lines = [];
        this.synthemes.forEach((syntheme, i) => {
            syntheme.filter(x => !x.startsWith('0')).forEach(duad => {
                const lineData = {
                    duad: duad,
                    r: this.R,
                    pentagram: this,
                    locations: this.globals.pentagramLocations,
                    colorIndex: i + 1
                }
                const lineConfig = {
                    hasOutline: true,
                    showCycle: this.config.showCycle,
                }
                const line = new Line(lineData, lineConfig, this.group);
                lines.push(line);
            })
        })
        return lines;
    }

    createLabel() {
        const labelGroup = createElement('g', {
            id: this.id,
            class: 'label',
            parent: this.group
        });
        const labelBg = createElement('circle', {
            cx: '0',
            cy: '0',
            r: '2',
            // fill: `var(--color${2})`,
            fill: 'none',
            parent: labelGroup
        });
        let text = createElement('text', {
            class: 'mystic-pentagram-label',
            parent: labelGroup,
            fill: `var(--color${2}-light)`,
            opacity: 0.5    
        });
        text.innerHTML = ['A','B','C','D','E','F'][this.id];

    }

    createNodes() {
        const pentagramCoords = this.globals.pentagramCoords;
        const locationEnum = this.globals.nodeLocationEnum;
        let nodes = [];
        '12345'.split('').forEach(i => {
            const coord = pentagramCoords[locationEnum[i]];
            const nodeGroup = createElement('g', {
                id: this.id, 
                transform: `translate(${this.R * coord.x}, ${-this.R * coord.y})`,
                class: `node node-${i}`,
                id: `node-${this.id}-${i}`,
                parent: this.group,
            });
            nodeGroup.addEventListener('click', () => {
                let nodeIdx = nodeGroup.getAttribute('id').split('-')[2];
                if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
                {
                    let nodes = this.target.querySelectorAll(`.node-${nodeIdx}`);
                    nodes.forEach(n => n.classList.toggle('selected'));
                }
                if (nodeGroup.classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
                    this.globals.selectedNodeIndices.push(nodeIdx);
                } else {
                    this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
                }
                if (this.globals.selectedNodeIndices.length === 2) {

                    let duad = this.globals.clockwiseForm[this.globals.selectedNodeIndices.map(x => this.globals.reversenodeLocationEnum[this.globals.nodeLocations[x]]).join('')];

                    console.log(this.globals.phi, duad)
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

                    setTimeout(() => {
                        requestAnimationFrame(this.composer.animate.bind(this.composer));
                    }, 0)

                    // requestAnimationFrame(animate);
                } else {
                    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
                }

                //requestAnimationFrame(animate);
            });
            console.log(this.R, this.nodeR)
            const nodeData = {
                id: `node-${this.id}-${i}`,
                label: i,
                R: this.R,
                r: this.nodeR,
                padding: this.nodePadding,
                pentagram: this,
                group: nodeGroup
            }
            const nodeConfig = {

            }
            const node = new PentagramNode(nodeData, nodeConfig, nodeGroup);
            nodes.push(node);


        })
        return nodes;
    }

    // morph(t, cycleFunction = x => x == 0 ? 0 : this.globals.cycleInverse[x - 1], locations = this.globals.nodeLocations) {
    //     this.arcs.forEach(arc => arc.morph(t, x => x == 0 ? 0 : this.globals.cycleInverse[x - 1], locations));
    //     this.nodes.forEach(node => node.shift(t));
    // }
    morph(t) {
        this.lines.forEach(line => line.morph(t, x => this.globals.cycleInverse[x-1], this.globals.nodeLocations));
        this.nodes.forEach(node => node.shift(t));
    }

    shift(t) {
        let location1 = this.globals.locationCoords[this.globals.pentagramLocations[this.id]];
        let location2 = this.globals.locationCoords[this.globals.locationEnum[this.globals.currentPsi[this.id]]];

        let location = {
            x: t * location2.x + (1 - t) * location1.x,
            y: t * location2.y + (1 - t) * location1.y
        };

        this.group.setAttribute('transform', `translate(${location.x}, ${location.y})`);
    }

}

class BasePentagramComposer extends BaseComposer {
    constructor(data, config, target) {
        let duadList =  ['05','04','03','02','01','12','23','34','45','51','13','24','35','41','52']
        let clockwiseForm = [...Array(6).keys()]
                .map(i => [...Array(6).keys()]
                    .map(j => [i, j])
                    .filter(([i, j]) => i !== j)
                )
                .reduce((acc, elem) => acc.concat(elem), [])
                .reduce((acc, [i, j]) => {
                    acc[`${i}${j}`] = duadList.includes(`${i}${j}`) ? `${i}${j}` : `${j}${i}`;
                    return acc;
                }, {});
        let phi = {
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
        let globals = {
            duadList: duadList,
            clockwiseForm: clockwiseForm,
            phi: phi
        }
        super(data, config, target, {
            globals: globals,
        });
    }
}

class PentagramComposer extends BasePentagramComposer {
    constructor(data, config, target) {
        let componentLocationLabels = {
            0: 'center',
            1: 'top',
            2: 'top right',
            3: 'bottom right',
            4: 'bottom left',
            5: 'top left'
        }
        let subcomponentLocationLabels = {
            0: 'center',
            1: 'top',
            2: 'top right',
            3: 'bottom right',
            4: 'bottom left',
            5: 'top left'
        }
        let pentagramCoords = {
            'center': {x: 0, y: 0},
            'top': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
            'top right': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
            'bottom right': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
            'bottom left': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
            'top left': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}

        }
        let componentLocationCoords = Object.fromEntries(Object.values(componentLocationLabels).map(key => [key, data.R * pentagramCoords[key]]));
        let subcomponentLocationCoords = Object.fromEntries(Object.values(subcomponentLocationLabels).map(key => [key, data.r * pentagramCoords[key]]));
        
        let globals = {
            componentLocationLabels: componentLocationLabels,
            componentLocationCoords: componentLocationCoords,
            subcomponentLocationLabels: subcomponentLocationLabels,
            subcomponentLocationCoords: subcomponentLocationCoords,
            currentPhi: new Permutation(6),
            currentPsi: new Permutation(6),
            selectedNodeIndices: [],
        }        
        super(data, config, target, {
            globals: globals,           
        });       
            
        this.createComponents();
    }

    createComponents() {
        this.createBackground();
        // this.pentagrams = this.createPentagrams();
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
        console.log(this.background);
    }

    createPentagrams() {
        let pentagrams = []
        this.data.pentagramData.forEach(pentagram => {
            console.log(this.config.r, this.config.R, this.config.nodeR)
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
            this.globals.nodeLocations[i] = this.globals.locationEnum[this.globals.cycleInverse[i - 1]];
        }
    }
}

class MysticPentagramComposer extends BasePentagramComposer {
    constructor(data, config, target) {
        let componentLocationLabels = {
            0: 'top left',
            1: 'top center',
            2: 'top right',
            3: 'bottom left',
            4: 'bottom center',
            5: 'bottom right'
        }
        let subcomponentLocationLabels = {
            0: 'center',
            1: 'top',
            2: 'top right',
            3: 'bottom right',
            4: 'bottom left',
            5: 'top left'
        }
        let pentagramCoords = {
            'center': {x: 0, y: 0},
            'top': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
            'top right': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
            'bottom right': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
            'bottom left': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
            'top left': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}

        }
        let componentLocationCoords = {
            'top left': {x: -25, y: -12.5},
            'top center': {x: 0, y: -12.5},
            'top right': {x: 25, y: -12.5},
            'bottom right': {x: 25, y: 12.5},
            'bottom center': {x: 0, y: 12.5},
            'bottom left': {x: -25, y: 12.5},
        }
        let subcomponentLocationCoords = Object.fromEntries(Object.values(subcomponentLocationLabels).map(key => [key, data.r * pentagramCoords[key]]));
        let phi = {
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
        
        let globals = {
            componentLocationLabels: componentLocationLabels,
            componentLocationCoords: componentLocationCoords,
            subcomponentLocationLabels: subcomponentLocationLabels,
            subcomponentLocationCoords: subcomponentLocationCoords,
            currentPhi: new Permutation(6),
            currentPsi: new Permutation(6),
            selectedNodeIndices: [],
        }        

        super(data, config, target, {
            duadList: duadList,
            phi: new Permutation(6),
            psi: new Permutation(6),
        });
        this.globals = {
            
            cycle: [1, 2, 3, 4, 5],
            cycleInverse: [1, 2, 3, 4, 5],
            currentPhi: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
            currentPhiInverse: {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 0},
            currentPsi: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
            currentPsiInverse: {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 0},
            duadList: duadList,
            clockwiseForm: [0, 1, 2, 3, 4, 5]
                .map(i => [0, 1, 2, 3, 4, 5].map(j => [i, j]).filter(([i, j]) => i !== j))
                .reduce((acc, elem) => acc.concat(elem), [])
                .reduce((acc, [i, j]) => {
                    acc[`${i}${j}`] = duadList.includes(`${i}${j}`) ? `${i}${j}` : `${j}${i}`;
                    return acc;
                }, {}),
            selectedNodeIndices: [],
            pentagramLocations: {
                0: 'top left',
                1: 'top center',
                2: 'top right',
                3: 'bottom left',
                4: 'bottom center',
                5: 'bottom right'
            },
            locationCoords: {
                'top left': {x: -25, y: -12.5},
                'top center': {x: 0, y: -12.5},
                'top right': {x: 25, y: -12.5},
                'bottom right': {x: 25, y: 12.5},
                'bottom center': {x: 0, y: 12.5},
                'bottom left': {x: -25, y: 12.5},
            },
            locationEnum: {
                0: 'top left',
                1: 'top center',
                2: 'top right',
                3: 'bottom left',
                4: 'bottom center',
                5: 'bottom right'
            },
            reverseLocationEnum: {
                'top left': 0,
                'top center': 1,
                'top right': 2,
                'bottom left': 3,
                'bottom center': 4,
                'bottom right': 5
            },

            pentagramCoords: {
                'center': {x: 0, y: 0},
                'top': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
                'top right': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
                'bottom right': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
                'bottom left': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
                'top left': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}
            },
            nodeLocations: {
                1: 'top',
                2: 'top right',
                3: 'bottom right',
                4: 'bottom left',
                5: 'top left'
            },
            nodeLocationEnum: {
                1: 'top',
                2: 'top right',
                3: 'bottom right',
                4: 'bottom left',
                5: 'top left'
            },
            reversenodeLocationEnum: {
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

        // this.pentagrams = this.createPentagrams();        
    }

    createSubcomponents() {
        let pentagrams = []
        this.data.pentagramData.forEach(pentagram => {
            const pentagramGroup = createElement('g', {
                class: 'pentagram',
                'data-id': pentagram.id,
            })

            const pentagramData = {
                id: pentagram.id,
                location: pentagram.location,
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
            const newPentagram = new MysticPentagram(pentagramData, configData, this.target);
            pentagrams.push(newPentagram);
        });
        return pentagrams;
    }

    interpolate(t) {
        // this.background.morph(t);
        this.pentagrams.forEach(pentagram => {
            pentagram.morph(t);
            pentagram.shift(t);
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
            this.globals.nodeLocations[i] = this.globals.nodeLocationEnum[this.globals.cycleInverse[i - 1]];
        }
    }
}

class Duad {
    constructor(data, target) {
        this.id = data.id;
        this.duad = data.duad;
        this.target = target;
        this.bgColor = data.bgColor;
        this.textColor = data.textColor;
        this.strokeColor = data.strokeColor;
        this.render();
    }

    render() {
        const duadBg = createElement('circle', {
            r: '2',
            fill: this.bgColor,
            // stroke: this.strokeColor,
            // 'stroke-width': '0.25',
            parent: this.target
        })
        const duadText = createElement('text', {
            class: 'duad',
            fill: this.textColor,
            parent: this.target
        });
        duadText.innerHTML = this.duad.split('').map(x => x == '0' ? 6 : +x).sort().join('');
    }
}

class Syntheme {
    constructor(data, target) {
        this.id = data.id;
        this.duads = data.duads;
        this.target = target;
        this.render();
    }

    render() {
        const synthemeElement = createElement('g', { 
            class: 'syntheme', 
            transform: `translate(3, ${-10 + 5 * this.id})`,
            parent: this.target 
        });
        const synthemeBorder = createElement('rect', {
            x: -14.5,
            y: -2.5,
            width: 23,
            height: 5,
            fill: `var(--color${this.id + 1})`,
            opacity: 0.25,   
            rx: 2.5,
            ry: 2.5,
            parent: synthemeElement
        });
        const synthemeLabel = createElement('g', {
            class: 'syntheme-label',
            transform: 'translate(-12,0)',
            parent: synthemeElement
        });
        createElement('circle', {
            cx: 0,
            cy: 0,
            r: 2,
            fill: `var(--color${this.id + 1}-dark)`,
            parent: synthemeLabel
        });
        const synthemeLabelText = createElement('text', {
            class: 'syntheme-label-text',
            fill: `var(--color${this.id + 1})`,
            'font-size': '2.5px',
            parent: synthemeLabel
        })
        synthemeLabelText.innerHTML = this.duads.filter(x => x.startsWith('0')).map(x => x.split('')[1])
        this.duads.map(x => x.split('').sort().join('')).sort().forEach((duad, i) => {
            const duadGroup = createElement('g', {
                class: 'duad',
                transform: `translate(${-6 + 6 * i}, 0)`,
                parent: synthemeElement
            });
            const duadData = {
                id: this.id,
                duad: duad,
                bgColor: `var(--color${this.id + 1})`,
                textColor: `var(--color${this.id + 1}-dark)`,
                strokeColor: `var(--color${this.id + 1})`,
            }
            new Duad(duadData, duadGroup);
        });
    }
}

class Pentad {
    constructor(data, config, target) {
        this.id = data.id;
        this.data = data;
        this.config = config;
        this.target = target;
        this.location = data.location;
        this.locationCoords = data.locationCoords;
        this.group = createElement('g', {
            id: this.id,
            transform: `translate(${this.locationCoords.x}, ${this.locationCoords.y})`,
            parent: this.target
        });
        this.label = createElement('text', {
            class: 'pentad-label',
            parent: this.group,
        })
        this.label.innerHTML = ['A','B','C','D','E','F'][this.id];


        this.createSynthemes();
    }

    createSynthemes() {
        this.data.synthemes.forEach((syntheme, i) => {
            const synthemeData = {
                id: i,
                duads: syntheme,
            }
            new Syntheme(synthemeData, this.group);
        });
    }
}

class PentadComposer {
    constructor(data, config, target) {
        this.data = data;
        this.config = config;
        this.target = target;
        this.pentadLocations = {
            0: 'top left', 
            1: 'top center', 
            2: 'top right', 
            3: 'bottom left', 
            4: 'bottom center', 
            5: 'bottom right'
        };
        this.pentadLocationCoords = {
            'top left': {x: -30, y: -5},
            'top center': {x: 0, y: -5},
            'top right': {x: 30, y: -5},
            'bottom left': {x: -30, y: 30},
            'bottom center': {x: 0, y: 30},
            'bottom right': {x: 30, y: 30}
        }
        this.pentadLocationEnum = {
            0: 'top left', 
            1: 'top center', 
            2: 'top right', 
            3: 'bottom left', 
            4: 'bottom center', 
            5: 'bottom right'
        }
        this.pentads = this.createPentads();
    }

    createPentads() {
        let pentads = []
        this.data.pentagramData.forEach(pentagram => {
            const location = this.pentadLocations[pentagram.id];
            const pentadData = {
                id: pentagram.id,
                '5-cycle': pentagram['5-cycle'],
                synthemes: pentagram.synthemes,
                location: location,
                locationCoords: this.pentadLocationCoords[location]
            };
            const pentadConfig = {};
            const pentad = new Pentad(pentadData, pentadConfig, this.target);
            pentads.push(pentad);
        });
        return pentads;
    }
}

class PermutationNode {
    constructor(data, target) {
        this.id = data.id;
        this.globals = data.globals;
        this.location = data.location;
        this.color = data.color;
        this.target = target;
        this.yOffset = data.yOffset || 0;
        this.group = createElement('g', {
            id: this.id,
            class: 'permutation-node',
            transform: `translate(${this.location.x}, ${this.location.y + (this.yOffset)})`,
            parent: this.target
        });
        this.group.addEventListener('click', () => {
            let nodeIdx = this.group.getAttribute('id');
            if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
            {

                this.group.classList.toggle('selected');
                if (this.group.classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
                    this.globals.selectedNodeIndices.push(nodeIdx);
                } else {
                    this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
                }
                if (this.globals.selectedNodeIndices.length === 2) {

                    let [a, b] = this.globals.selectedNodeIndices;
                    let cycle = this.globals.cycle;
                    let swap = cycle[a];
                    cycle[a] = cycle[b];
                    cycle[b] = swap;
                    if (this.globals.currentLinkedPermutation) {
                        let psi = this.globals.psi[this.globals.selectedNodeIndices.sort().join('')];
                        this.globals.currentLinkedPermutation = Object.fromEntries(Array.from({length: this.globals.cycle.length}).map((v, i) => [i, psi[+this.globals.currentLinkedPermutation[i]]]))
                    }
                    this.globals.cycleInverse = Array.from({length: this.globals.cycle.length}).map(i => cycle.indexOf(i) + 1);

                    setTimeout(() => {
                        requestAnimationFrame(this.globals.composer.animate.bind(this.globals.composer));
                    }, 0)

                    // requestAnimationFrame(animate);
                } else {
                    this.target.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
                }

                //requestAnimationFrame(animate);
            }
        });
        this.render();
    }

    shift(t, linear=false) {
        const start = this.globals.nodeLocations[this.globals.currentPermutation[this.id]];
        const end = this.globals.nodeLocations[this.globals.cycle[this.id]];
        if (linear) {
            const location = {
                x: (1-t) * start.x + t * end.x,
                y: (1-t) * start.y + t * end.y
            };
            this.group.setAttribute('transform', `translate(${location.x}, ${location.y + this.yOffset})`);
        } else {

            let cx = (start.x + end.x) / 2;
            let cy = (start.y + end.y) / 2;

            // Calculate semi-major and semi-minor axes
            let dx = (end.x - start.x) / 2;
            // let dy = (end.y - start.y) / 2;
            // let a = Math.sqrt(dx * dx + dy * dy); // semi-major axis
            let a = dx
            let b = a * 0.5; // semi-minor axis (half the major axis for a 2:1 ratio)

            let angle = Math.PI * (1 + t);

            // Rotate the ellipse to align with the start and end points
            // let rotationAngle = Math.atan2(dy, dx);

            // Parametric equations for ellipse with rotation
            let location = {
                x: cx + (a * Math.cos(angle)),
                y: cy + (b * Math.sin(angle))
            };

            this.group.setAttribute('transform', `translate(${location.x}, ${-location.y + this.yOffset})`);
        }
    }

    render() {
        const background = createElement('circle', {
            cx: 0,
            cy: 0,
            r: 5,
            fill: `var(${this.color})`,
            parent: this.group
        });
        const text = createElement('text', {
            x: 0,
            y: 0,
            fill: `var(${this.color}-dark)`,
            'font-size': 7,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            parent: this.group
        });
        text.innerHTML = this.id + 1;
    }
}

class PermutationComposer {
    constructor(config, target) {
        this.n = config.n;
        this.config = config;
        this.target = target;
        this.globals = {
            composer: this,
            selectedNodeIndices: [],
            currentPermutation: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            currentPermutationInverse: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            cycle: Array.from({ length: this.n }, (_, i) => i),
            nodeLocations: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, { 
                x: 15*(i - 2 * this.n/(this.n - 1)),
                y: 0
            }]))
        }
        this.animStart = undefined;
        this.nodes = this.createNodes();
        this.cycleLabel = this.createCycleLabel();
    }

    createCycleLabel() {
        const label = createElement('text', {
            x: 0,
            y: 15,
            fill: 'var(--color3-dark)',
            'font-size': 7,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            parent: this.target
        });
        label.innerHTML = cycleNotation(this.globals.cycle);
        return label
    }

    createNodes() {
        let nodes = [];
        for (let i = 0; i < this.n; i++) {
            const permutationNodeData = {
                id: i,
                location: this.globals.nodeLocations[i],
                globals: this.globals,
                color: '--color3',
                target: this.target
            };
            nodes.push(new PermutationNode(permutationNodeData, this.target));
        }
        return nodes;
    }

    interpolate(t) {
        this.nodes.forEach(node => {
            node.shift(t);
        });
    }

    update() {
        this.cycleLabel.innerHTML = cycleNotation(this.globals.cycle);

        this.globals.currentPermutation = Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, this.globals.cycle[i]]));
        this.globals.currentPermutationInverse = Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, this.globals.cycle.indexOf(i)]));
        this.globals.cycleInverse = Array.from({ length: this.n }, (_, i) => this.globals.cycle.indexOf(i));
        this.globals.selectedNodeIndices = [];
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }

    animate(t) {
        
        if (this.animStart === undefined) {
            this.animStart = t;
        }
        const elapsed = t - this.animStart;
        const shift = Math.min(elapsed / 600, 1);
        if (shift < 1) {
            let t = easeInOutSine(shift);
            this.interpolate(t);
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.animStart = undefined;
            this.update();
        }
    }
}

class LinkedPermutationComposer {
    constructor(config, target) {
        this.n = config.n;
        this.config = config;
        this.target = target;
        this.globals = {
            composer: this,
            selectedNodeIndices: [],
            currentPermutation: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            currentPermutationInverse: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            currentLinkedPermutation: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            currentLinkedPermutationInverse: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            psi: {
                '01': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2}, // (12)(36)(45)
                '02': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4}, // (13)(24)(56)
                '03': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1}, // (14)(26)(35)
                '04': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3}, // (15)(23)(46)
                '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0}, // (16)(25)(34)
                '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1}, // (15)(26)(43)
                '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3}, // (13)(25)(46)
                '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}, // (16)(24)(35)
                '15': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4}, // (14)(23)(56)
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0}, // (16)(23)(45)
                '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, // (14)(25)(36)
                '25': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3}, // (12)(35)(46)
                '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4}, // (12)(34)(56)
                '35': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2}, // (15)(24)(36)
                '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}  // (13)(26)(45)
            },
            cycle: Array.from({ length: this.n }, (_, i) => i),
            nodeLocations: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, { 
                x: 15*(i - 2 * this.n/(this.n - 1)),
                y: 0
            }]))
        }
        this.animStart = undefined;
        this.nodes = this.createNodes();
        this.cycleLabel1 = this.createCycleLabel(-5);
        this.cycleLabel2 = this.createCycleLabel(20);
    }

    createCycleLabel(yOffset) {
        const label = createElement('text', {
            x: 0,
            y: yOffset,
            fill: 'var(--color3-dark)',
            'font-size': 7,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            parent: this.target
        });
        label.innerHTML = cycleNotation(this.globals.cycle);
        return label
    }

    createNodes() {
        let nodes = [];
        for (let i = 0; i < this.n; i++) {
            const permutationNodeData = {
                id: `A${i}`,
                location: this.globals.nodeLocations[i],
                yOffset: -15,
                globals: this.globals,
                color: '--color1',
                target: this.target
            };
            nodes.push(new PermutationNode(permutationNodeData, this.target));
        }
        for (let i = 0; i < this.n; i++) {
            const permutationNodeData = {
                id: `B${i}`,
                location: this.globals.nodeLocations[i],
                yOffset: 10,
                globals: this.globals,
                color: '--color2',
                target: this.target
            };
            nodes.push(new PermutationNode(permutationNodeData, this.target));
        }

        return nodes;
    }

    interpolate(t) {
        this.nodes.forEach(node => {
            node.shift(t, true);
        });
    }

    update() {
        this.cycleLabel1.innerHTML = cycleNotation(this.globals.cycle);
        this.cycleLabel2.innerHTML = cycleNotation(this.globals.currentLinkedPermutation);

        this.globals.currentPermutation = Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, this.globals.cycle[i]]));
        this.globals.currentPermutationInverse = Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, this.globals.cycle.indexOf(i)]));
        this.globals.cycleInverse = Array.from({ length: this.n }, (_, i) => this.globals.cycle.indexOf(i));
        this.globals.selectedNodeIndices = [];
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }

    animate(t) {
        
        if (this.animStart === undefined) {
            this.animStart = t;
        }
        const elapsed = t - this.animStart;
        const shift = Math.min(elapsed / 600, 1);
        if (shift < 1) {
            let t = easeInOutCubic(shift);
            this.interpolate(t);
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.animStart = undefined;
            this.update();
        }
    }
}

// class SynthemeComposer {
//     constructor(data, config, target) {
//         this.data = data;
//         this.config = config;
//         this.target = target;
//         const duadList = ['05','04','03','02','01','12','23','34','45','51','13','24','35','41','52'];
//         this.globals = {
//             currentPhi: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
//             cycle: [1, 2, 3, 4, 5],
//             cycleInverse: [1, 2, 3, 4, 5],
//             currentPhiInverse: [1, 2, 3, 4, 5],
//             currentPsi: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
//             currentPsiInverse: {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5},
//             duadList: duadList,
//             clockwiseForm: [0, 1, 2, 3, 4, 5]
//                 .map(i => [0, 1, 2, 3, 4, 5].map(j => [i, j]).filter(([i, j]) => i !== j))
//                 .reduce((acc, elem) => acc.concat(elem), [])
//                 .reduce((acc, [i, j]) => {
//                     acc[`${i}${j}`] = duadList.includes(`${i}${j}`) ? `${i}${j}` : `${j}${i}`;
//                     return acc;
//                 }, {}),
//             selectedNodeIndices: [],
//             nodeLocations: {
//                 0: 'center',
//                 1: 'top',
//                 2: 'top right',
//                 3: 'bottom right',
//                 4: 'bottom left',
//                 5: 'top left'
//             },
//             pentagramLocations: {
//                 0: 'center',
//                 1: 'top',
//                 2: 'top right',
//                 3: 'bottom right',
//                 4: 'bottom left',
//                 5: 'top left'
//             },
//             pentagramCoords: {
//                 'center': {x: 0, y: 0},
//                 'top': {x: Math.sin(10 * Math.PI / 5), y: Math.cos(10 * Math.PI / 5)},
//                 'top right': {x: Math.sin(2 * Math.PI / 5), y: Math.cos(2 * Math.PI / 5)},
//                 'bottom right': {x: Math.sin(4 * Math.PI / 5), y: Math.cos(4 * Math.PI / 5)},
//                 'bottom left': {x: Math.sin(6 * Math.PI / 5), y: Math.cos(6 * Math.PI / 5)},
//                 'top left': {x: Math.sin(8 * Math.PI / 5), y: Math.cos(8 * Math.PI / 5)}
//             },
//             locationEnum: {
//                 0: 'center',
//                 1: 'top',
//                 2: 'top right',
//                 3: 'bottom right',
//                 4: 'bottom left',
//                 5: 'top left'
//             },
//             reverseLocationEnum: {
//                 'center': 0,
//                 'top': 1,
//                 'top right': 2,
//                 'bottom right': 3,
//                 'bottom left': 4,
//                 'top left': 5
//             },
//             phi : {
//                 '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
//                 '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
//                 '41': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0},
//                 '51': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4},
//                 '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
//                 '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
//                 '52': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3},
//                 '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
//                 '35': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2},
//                 '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}
//             }
            
//         }
//         this.animStart = undefined;

//         this.createBackground();
//         this.pentagrams = this.createPentagrams();        
//     }
// }