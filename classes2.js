class Coords {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    multiply(scalar) {
        return new Coords(this.x * scalar, this.y * scalar);
    }
}

class Location {
    constructor(label, coords) {
        this.label = label;
        this.coords = coords;
    }

    multiply(scalar) {
        return new Location(this.label, this.coords.multiply(scalar));
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

class BaseComponent {
    constructor(data, config, target, extensions={}) {
        if (this.constructor === BaseComponent) {
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
        this.extendBase();
        this.subcomponents = this.createSubcomponents();
    }

    extendBase() {

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

        this.extendBase();

        this.createComponents();
    }

    extendBase() {

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

class Arc extends BaseComponent {
    constructor(data, config, target, extensions={}) {
        super(data, config, target, {
            type: 'arc',
            ...extensions
        });
    }

    createSubcomponents() {
        if (this.config.hasOutline) {
            this.outline = createElement('path', {class: 'outline', 'data-id': this.data.colorIndex, parent: this.group})
        }
        this.pathElement = createElement('path', {class: 'duad-line', 'data-id': this.data.colorIndex, parent: this.group})

        const pathString = this.interpolatePathString(this.arcData, this.arcData, 0);

        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
            if (!this.pathElement.classList.contains('outline') && this.inCycle) {
                this.pathElement.classList.add('in-cycle')
            }
        }

    }

    extendBase() {
        this.arcData = {
            arcStart: this.data.arcStart,
            arcMiddle: this.data.arcMiddle,
            arcEnd: this.data.arcEnd,            
        }
    }
    
    morph(t) {
        const pathString = this.interpolatePathString(start, end, t);
        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
        }
    }

    interpolatePathString(startState, endState, t=0) {
        let lambda1 = 0.69;
        let lambda2 = 1;

        let arcStartPoint = {
            x: ((1 - t) * startState.arcStart.x + t * endState.arcStart.x),
            y: ((1 - t) * startState.arcStart.y + t * endState.arcStart.y)
        }

        let arcControlPoint = {
            x: ((1 - t) * startState.arcMiddle.x + t * endState.arcMiddle.x),
            y: ((1 - t) * startState.arcMiddle.y + t * endState.arcMiddle.y)
        }

        let arcEndPoint = {
            x: ((1 - t) * startState.arcEnd.x + t * endState.arcEnd.x),
            y: ((1 - t) * startState.arcEnd.y + t * endState.arcEnd.y)
        }

        let pathString = `M ${arcStartPoint.x} ${arcStartPoint.y} `
        pathString +=    `Q ${arcControlPoint.x} ${arcControlPoint.y} ${arcEndPoint.x} ${arcEndPoint.y}`;
        return pathString

    }    
}

class BasePentagramComposer extends BaseComposer {
    constructor(data, config, target, extensions = {}) {
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
            ...extensions
        });
    }
}


class PentagramComposer extends BasePentagramComposer {
    constructor(data, config, target) {
        let pentagramCoords = {
            'center': new Coords(0, 0),
            'top': new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5)),
            'top right': new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5)),
            'bottom right': new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5)),
            'bottom left': new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5)),
            'top left': new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5))
        }

        let componentLocations = Object.entries(pentagramCoords).map(([label, coords]) => new Location(label, coords.multiply(config.R)));
        let subcomponentLocations = Object.entries(pentagramCoords).map(([label, coords]) => new Location(label, coords.multiply(config.r)));

        let extensions = {
            componentLocations: componentLocations,
            subcomponentLocations: subcomponentLocations,
            currentPhi: new Permutation(6),
            currentPsi: new Permutation(6),
            selectedNodeIndices: [],
        }
        super(data, config, target, extensions);
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
            subcomponentLocations: this.componentLocations,
            composer: this
        }
        const backgroundConfig = {
            showCycle: false,
            showLabel: false
        }
        this.background = new BackgroundPentagram(backgroundData, backgroundConfig, this.target);
    }

    createPentagrams() {
        let pentagrams = []
        this.data.pentagramData.forEach(pentagram => {
            const pentagramData = {
                id: pentagram.id,
                synthemes: pentagram.synthemes,
                '5-cycle': pentagram['5-cycle'],
                r: this.config.r,
                R: this.config.R,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                composer: this,
                subcomponentLocations: this.subcomponentLocations,
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
        const bgStartingState = {};
        const bgEndingState = {};
        this.background.morph(bgStartingState, bgEndingState, t);
        this.pentagrams.forEach(pentagram => {
            const startingState = {position: {}};
            const endingState = {position: {}};
            pentagram.morph(startingState, endingState, t);
            pentagram.shift(startingState, endingState, t);
        });
    }

    updatePentagrams() {
        this.globals.selectedNodeIndices = [];

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

class PentagramNode extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'node',
            syntheme: data.syntheme,
            label: data.label,
            r: data.nodeR,
            R: data.r,
            padding: data.padding,
            pentagram: data.pentagram,
            globals: data.pentagram.composer.globals,
            ...extensions
        });

    }

    createSubcomponents() {
        this.arcs = [];

        this.nodeCircle = createElement('circle', {
            cx: '0',
            cy: '0',
            r: this.data.r,
            parent: this.group
        });


        if (this.label) {
            const labelGroup = createElement('g', {
                class: 'label',
                parent: this.group
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
                parent: this.group
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
                    locations: this.globals.nodeLocations,
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

class BasePentagram extends BaseComponent{
    constructor(data, config, target, extensions = {}) {
        console.log(data, config, target, extensions)
        super(data, config, target, {
            synthemes: data.synthemes,
            composer: data.composer,
            r: data.r,
            globals: data.composer.globals,
            ...extensions
        });
    }

    createSubcomponents() {
        let subcomponents = {
            'arcs': [],
            'label': this.createLabel()
        };
        let duadList = this.globals.duadList;
        
        duadList.forEach(duad => {
            const duadGroup = createElement('g', {
                class: 'duad',
                'data-id': duad,
                parent: this.group
            });
        })

        // middles = {
        //     [0,1] : {},// midpoint
        //     [12, 23, 34, 45, 51] : [4, 5, 1, 2, 3],// midpoint + lambda1 * (point opposite i,j - midpoint)
        //     [13, 24, 35, 42, 52] : [2, 3, 4, 5, 1] // midpoint + lambda2 * (point between i,j - midpoint)
        // }
        const lambda1 = 0.1;
        const lambda2 = 0.7;
        this.synthemes.forEach((syntheme, i) => {
            syntheme.forEach(duad => {
                let [left, right] = this.globals.clockwiseForm[duad].split('');
                [left, right] = [+left, +right]
                let arcStart = this.data.subcomponentLocations[left];
                let arcEnd = this.data.subcomponentLocations[right];
                let midpoint = new Coords(
                    (arcStart.coords.x + arcEnd.coords.x) / 2,
                    (arcStart.coords.y + arcEnd.coords.y) / 2
                );
                if (left !== 0) {
                    if (Math.abs(left - right) == 1 || Math.abs(left - right) == 4) {
                        let midpointLabel = (left + 2) % 5 + 1;
                        let oppositePoint = this.data.subcomponentLocations[midpointLabel];
                        console.log(left, right, midpointLabel, oppositePoint)
                        midpoint.x -= lambda1 * (oppositePoint.coords.x - midpoint.x);
                        midpoint.y -= lambda1 * (oppositePoint.coords.y - midpoint.y);
                    }
                    if (Math.abs(left - right) == 2 || Math.abs(left - right) == 3) {
                        let midpointLabel = Math.floor(left % 5 + 1);
                        let oppositePoint = this.data.subcomponentLocations[midpointLabel];
                        console.log(midpointLabel, oppositePoint)
                        midpoint.x += lambda2 * (oppositePoint.coords.x - midpoint.x);
                        midpoint.y += lambda2 * (oppositePoint.coords.y - midpoint.y);
                    }
                }
                const arcData = {
                    id: duad,
                    duad: duad,
                    r: this.r,
                    pentagram: this,
                    arcStart: arcStart.coords,
                    arcMiddle: midpoint,
                    arcEnd: arcEnd.coords,
                    colorIndex: i + 1
                }
                const arcConfig = {
                    hasOutline: true,
                }
                const duadGroup = this.group.querySelector(`.duad[data-id="${duad}"]`);

                const arc = new Arc(arcData, arcConfig, duadGroup, {

                });
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

class BackgroundPentagram extends BasePentagram {
    constructor(data, target, composer) {
        super(data, target, composer, {
            type: 'background-pentagram'
        }); 
    }
    morph(t) {
        this.arcs.forEach(arc => arc.morph(this.position, this.targetPosition, t));
    }

}

class ForegroundPentagram extends BasePentagram {
    constructor(data, config, target) {
        super(data, config, target, {
            type: 'foreground-pentagram',
            fiveCycle: data['5-cycle'],
            synthemes: data.synthemes,
            composer: data.composer,
            R: data.R,
            r: data.r,
            nodeR: data.nodeR,
            nodePadding: data.nodePadding,
            globals: data.composer.globals
        });
    }
    extendBase() {
        this.layers = {
            background: createElement('g', {class: 'background', parent: this.group}),
            lines: createElement('g', {class: 'lines', parent: this.group}),
            nodes: createElement('g', {class: 'nodes', parent: this.group}),
            labels: createElement('g', {class: 'labels', parent: this.group})
        }
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
        const pentagramLocations = this.data.subcomponentLocations;
        let nodes = [];
        pentagramLocations.forEach((location, i) => {
            const nodeGroup = createElement('g', {
                id: this.id, 
                transform: `translate(${location.coords.x}, ${location.coords.y})`,
                class: `node node-${i}`,
                id: `node-${this.id}-${i}`,
                parent: this.group,
            });
            const nodeData = {
                id: `node-${this.id}-${i}`,
                syntheme: this.synthemes[i - 1],
                R: this.data.r,
                r: this.data.nodeR,
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
}