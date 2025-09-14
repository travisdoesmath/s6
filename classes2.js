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
    cycleNotation() {
        return this.cycleNotation(this.permutation);
    }

    map(value) {
        if (Object.keys(this.permutation).includes(String(value))) {
            return this.permutation[value];
        }
        return value;
    }

    inverse(value) {
        value = String(value);
        return Object.keys(this.permutation).find(key => this.permutation[key] === value) || value;
    }

    compose(permutation) {
        let newPermutation = {};
        Object.keys(this.permutation).forEach(key => {
            newPermutation[key] = permutation.map(this.permutation[key]);
        });
        this.permutation = newPermutation;
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
        this.location = this.data.location || new Location('', new Coords(0, 0));
        this.group = createElement('g', {
            id: this.id,
            class: `${this.type}`,
            transform: `translate(${this.location.coords.x}, ${this.location.coords.y})`,
            parent: target

        })
        this.extendBase();
        this.subcomponents = this.createSubcomponents();
    }

    extendBase() {

    }

    createSubcomponents() {

    }

    morph(newState, t) {
        // Implement interpolations that change the visual structure of the component
    }

    shift(newLocation, t, linear=true) {
        const start = this.location.coords;
        const end = newLocation.coords;
        const delta = end - start;
        if (linear) {
            let x = lerp(start.x, end.x, t);
            let y = lerp(start.y, end.y, t);
            this.group.setAttribute('transform', `translate(${x}, ${y})`);
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

        this.components = this.createComponents();
        this.interactionHandler = this.interactionHandler.bind(this);
    }

    extendBase() {

    }

    interpolate(t, multiStage=false) {
        let origin = new Location('center', new Coords(0, 0));
        const newState = {
            componentLocations: [...new Array(this.componentLocations.length).keys()].map(i => this.componentLocations[this.currentPsi.map(i)]),
            subcomponentLocations: [origin, ...[...new Array(this.subcomponentLocations.length).keys()].map(i => this.subcomponentLocations[this.currentPsi.map(i)])],
            phi: this.currentPhi
        }
        if (multiStage) {
            if (t < 0.5) {
                this.morph(newState, t);
            } else {
                this.components.forEach(component => {
                    component.shift(newState.componentLocations[component.id], t);
                });
            }
        } else {
            this.morph(newState, t);
            this.components.forEach(component => {
                component.shift(newState.componentLocations[component.id], t);
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

        const pathString = this.interpolatePathString(this.arcData, 0);

        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
            if (!this.pathElement.classList.contains('outline') && this.inCycle) {
                this.pathElement.classList.add('in-cycle')
            }
        }
        return [this.pathElement, this.outline].filter(Boolean);
    }

    extendBase() {
        this.arcData = {
            arcStart: this.data.arcStart,
            arcMiddle: this.data.arcMiddle,
            arcEnd: this.data.arcEnd,            
        }
    }

    morph(newState, t) {
        const pathString = this.interpolatePathString(newState, t);
        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
        }
    }

    interpolatePathString(newState, t=0) {
        let arcStartPoint = {
            x: lerp(this.arcData.arcStart.coords.x, newState.arcStart.coords.x, t),
            y: lerp(this.arcData.arcStart.coords.y, newState.arcStart.coords.y, t)
        }

        let arcControlPoint = {
            x: lerp(this.arcData.arcMiddle.x, newState.arcMiddle.x, t),
            y: lerp(this.arcData.arcMiddle.y, newState.arcMiddle.y, t)
        }

        let arcEndPoint = {
            x: lerp(this.arcData.arcEnd.coords.x, newState.arcEnd.coords.x, t),
            y: lerp(this.arcData.arcEnd.coords.y, newState.arcEnd.coords.y, t)
        }

        let pathString = `M ${arcStartPoint.x} ${arcStartPoint.y} `
        pathString +=    `Q ${arcControlPoint.x} ${arcControlPoint.y} ${arcEndPoint.x} ${arcEndPoint.y}`;
        return pathString
    }    
}



class Line extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'line',
            ...extensions
        });        
    }

    createSubcomponents() {
        if (this.config.hasOutline) {
            this.outline = createElement('line', {
                class: 'outline', 
                'data-id': this.data.colorIndex,
                x1: this.data.x1,
                y1: this.data.y1,
                x2: this.data.x2,
                y2: this.data.y2,
                parent: this.group
            })
        }
        this.lineElement = createElement('line', {
            class: 'duad-line', 
            'data-id': this.data.colorIndex, 
            x1: this.data.x1,
            y1: this.data.y1,
            x2: this.data.x2,
            y2: this.data.y2,
            parent: this.group
        })

        if (this.config.showCycle) {
            if (this.data.inCycle) {
                this.lineElement.classList.add('in-cycle')
            }
        }
        return [this.lineElement, this.outline].filter(Boolean);
    }
    
    morph(newState, t) {
        const pentagramCoords = this.globals.pentagramCoords;
        let p1coords = {
            start: { x: this.data.x1, y: this.data.y1 },
            end: { x: this.data.x2, y: this.data.y2 }
        }

        let p2coords = {
            start: { x: newState.x1, y: newState.y1 },
            end: { x: newState.x2, y: newState.y2 }
        }

        let point0 = {
            x: this.r * lerp(p1coords.start.x, p2coords.start.x, t),
            y: this.r * lerp(p1coords.start.y, p2coords.start.y, t)
        }

        let point1 = {
            x: this.r * lerp(p1coords.end.x, p2coords.end.x, t),
            y: this.r * lerp(p1coords.end.y, p2coords.end.y, t)
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
        }
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
        let psi = {
            '01': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2},
            '02': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4},
            '03': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1},
            '04': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3},
            '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0},
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
            phi: phi,
            psi: psi
        }
        super(data, config, target, {
            globals: globals,
            ...extensions
        });
    }
}

class PentagramComposer extends BasePentagramComposer {
    constructor(data, config, target, extensions = {}) {
        let pentagramCoords = {
            'center': new Coords(0, 0),
            'top': new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5)),
            'top right': new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5)),
            'bottom right': new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5)),
            'bottom left': new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5)),
            'top left': new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5))
        }

        let componentLocations = Object.entries(pentagramCoords)
            .map(([label, coords]) => new Location(label, coords.multiply(config.R)));
        let subcomponentLocations = Object.entries(pentagramCoords).filter(x => x[0] !== 'center')
            .map(([label, coords]) => new Location(label, coords.multiply(config.r)));

        extensions = {
            pentagramCoords: pentagramCoords,
            componentLocations: componentLocations,
            subcomponentLocations: subcomponentLocations,
            currentPhi: new Permutation(6),
            currentPsi: new Permutation(6),
            selectedNodeIndices: [],
            ...extensions
        }
        super(data, config, target, extensions);
        this.globals.selectedNodeIndices = [];
    }

    createComponents() {
        const components = [];
        components.push(this.createBackground());
        this.pentagrams = this.createPentagrams();
        components.push(...this.pentagrams);
        return components;
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
            subcomponentLocations: this.componentLocations.filter(loc => loc.label !== 'center'),
            composer: this
        }
        const backgroundConfig = {
            showCycle: false,
            showLabel: false,
            useArcs: true
        }
        this.background = new BackgroundPentagram(backgroundData, backgroundConfig, this.target);
        return this.background;
    }

    createPentagrams() {
        let pentagrams = []
        this.data.pentagramData.forEach(pentagram => {
            const pentagramData = {
                id: pentagram.id,
                location: this.componentLocations[pentagram.id],
                synthemes: pentagram.synthemes,
                fiveCycle: pentagram['5-cycle'],
                r: this.config.r,
                R: this.config.R,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                composer: this,
                pentagramCoords: this.pentagramCoords,
                subcomponentLocations: this.subcomponentLocations,
                interactionHandler: this.interactionHandler
            }
            const configData = {
                showCycle: this.config.showCycle,
                useArcs: true,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding
            }
            const newPentagram = new ForegroundPentagram(pentagramData, configData, this.target);
            pentagrams.push(newPentagram);
        });
        return pentagrams;
    }

    interactionHandler(event, that) {
        let nodeIdx = that.group.getAttribute('id').split('-')[2];
        let nodes = this.target.querySelectorAll(`.node-${nodeIdx}`);
        if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
        {            
            nodes.forEach(n => n.classList.toggle('selected'));
        }
        
        if (nodes[0].classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
            this.globals.selectedNodeIndices.push(nodeIdx);
        } else {
            this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
        }
        if (this.globals.selectedNodeIndices.length === 2) {
            let duad = this.globals.clockwiseForm[this.globals.selectedNodeIndices.join('')];
            this.currentPhi.compose(new Permutation(this.globals.phi[duad]));
            this.currentPsi.compose(new Permutation(this.globals.psi[duad]));

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }
    
    morph(newState, t) {
    
        this.background.morph(newState, t);
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
            0: this.componentLocations[this.globals.currentPsi[0]],
            1: this.componentLocations[this.globals.currentPsi[1]],
            2: this.componentLocations[this.globals.currentPsi[2]],
            3: this.componentLocations[this.globals.currentPsi[3]],
            4: this.componentLocations[this.globals.currentPsi[4]],
            5: this.componentLocations[this.globals.currentPsi[5]]
        }
        for (let i = 1; i <= 5; i++) {
            this.globals.nodeLocations[i] = this.subcomponentLocations[this.globals.currentPhi[i]];
        }
    }
}

class MysticPentagramComposer extends BasePentagramComposer {
    constructor(data, config, target, extensions = {}) {
        let pentagramCoords = [
            new Location('center', new Coords(0, 0)),
            new Location('top', new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5))),
            new Location('top right', new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5))),
            new Location('bottom right', new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5))),
            new Location('bottom left', new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5))),
            new Location('top left', new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5)))
        ]
        let componentLocations = [  
            new Location('top left', new Coords(-25, -12.5)),
            new Location('top center', new Coords(0, -12.5)),
            new Location('top right', new Coords(25, -12.5)),
            new Location('bottom right', new Coords(25, 12.5)),
            new Location('bottom center', new Coords(0, 12.5)),
            new Location('bottom left', new Coords(-25, 12.5)),
        ]

        let subcomponentLocations = pentagramCoords.map(location => new Location(location.label, location.coords.multiply(config.R)));

        extensions = {
            componentLocations: componentLocations,
            subcomponentLocations: subcomponentLocations,
            currentPhi: new Permutation(6),
            currentPsi: new Permutation(6),
            selectedNodeIndices: [],
            ...extensions
        }        

        super(data, config, target, {
            phi: new Permutation(6),
            psi: new Permutation(6),
            ...extensions
        });

    }

    createComponents() {
        this.pentagrams = this.createPentagrams();
    }

    createPentagrams() {
        let pentagrams = [];
        this.data.pentagramData.forEach(pentagram => {
            const pentagramGroup = createElement('g', {
                class: 'pentagram',
                'data-id': pentagram.id,
            })

            const pentagramData = {
                id: pentagram.id,
                location: this.componentLocations[pentagram.id],
                synthemes: pentagram.synthemes,
                fiveCycle: pentagram['5-cycle'],
                r: this.config.r,
                R: this.config.R,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                composer: this,
                pentagramCoords: this.pentagramCoords,
                subcomponentLocations: this.subcomponentLocations,
                interactionHandler: this.interactionHandler
            }
            const configData = {
                showCycle: this.config.showCycle,
                useLines: true,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding
            }
            const newPentagram = new MysticPentagram(pentagramData, configData, this.target);
            pentagrams.push(newPentagram);
        });
        return pentagrams;

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
        let subcomponents = [];
        let duads = [];
        let arcs = [];
        this.arcs = [];
        let interactionHandler = this.data.interactionHandler.bind(this.data.composer);
        this.group.addEventListener('click', (event) => interactionHandler(event, this));
        this.nodeCircle = createElement('circle', {
            cx: '0',
            cy: '0',
            r: this.data.r,
            parent: this.group
        });
        subcomponents.push(this.nodeCircle);

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
            subcomponents.push({labelGroup: labelGroup, text: text});
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
                let [left, right] = this.globals.clockwiseForm[duad].split('');
                let locations = Object.entries(this.data.pentagramCoords).map(([key, value]) => new Location(key, value.multiply(this.data.r - this.data.padding)));
                const { arcStart, arcMiddle, arcEnd } = getArcData(locations, left, right);
                const arcData = {
                    id: duad,
                    duad: duad,
                    r: this.data.r,
                    pentagram: this,
                    arcStart: arcStart,
                    arcMiddle: arcMiddle,
                    arcEnd: arcEnd,
                    colorIndex: this.id.split('-')[2]
                }
                const arcConfig = {
                    hasOutline: false,
                    classPrefix: 'node-'
                }
                const arc = new Arc(arcData, arcConfig, duadGroup);            
                this.arcs.push(arc);

                const pentagramCoords = Object.values(this.data.pentagramCoords);
                const i = this.id.split('-')[2];
                const circle1 = createElement('circle', {
                    cx: `${(this.data.r - this.data.padding) * pentagramCoords[left].x}`,
                    cy: `${(this.data.r - this.data.padding) * pentagramCoords[left].y}`,
                    r: `${this.data.r/10}`,
                    fill: `var(--color${i}-light)`,
                    stroke: 'none',
                    parent: duadGroup
                });

                const circle2 = createElement('circle', {
                    cx: `${(this.data.r - this.data.padding) * pentagramCoords[right].x}`,
                    cy: `${(this.data.r - this.data.padding) * pentagramCoords[right].y}`,
                    r: `${this.data.r/10}`,
                    fill: `var(--color${i}-light)`,
                    stroke: 'none',
                    parent: duadGroup
                });
                duads.push(duadGroup);
            });
        }
        subcomponents.push(arcs);
        subcomponents.push(duads);
        return subcomponents;
    }
}

class BasePentagram extends BaseComponent{
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            synthemes: data.synthemes,
            fiveCycle: data['5-cycle'],
            composer: data.composer,
            r: data.r,
            globals: data.composer.globals,
            ...extensions
        });
    }

    extendBase() {
        this.layers = {
            lines: createElement('g', { class: 'lines', parent: this.group }),
            labels: createElement('g', { class: 'labels', parent: this.group }),
            background: createElement('g', { class: 'background', parent: this.group })
        };
    }

    createSubcomponents() {
        let subcomponents = {
            'label': this.createLabel(),
            'edges': []
        };
        let duadList = this.globals.duadList;
        
        duadList.forEach(duad => {
            const duadGroup = createElement('g', {
                class: 'duad',
                'data-id': duad,
                parent: this.layers.lines
            });
        })

        if (this.config.useArcs) {
            const lambda1 = 0.1;
            const lambda2 = 0.7;
            this.synthemes.forEach((syntheme, i) => {
                syntheme.forEach(duad => {
                    let [left, right] = this.globals.clockwiseForm[duad].split('');
                    [left, right] = [+left, +right]
                    let locations = [new Location('center', new Coords(0,0)), ...this.data.subcomponentLocations];
                    const { arcStart, arcMiddle, arcEnd } = getArcData(locations, left, right);
                    const arcData = {
                        id: duad,
                        duad: duad,
                        r: this.r,
                        pentagram: this,
                        arcStart: arcStart,
                        arcMiddle: arcMiddle,
                        arcEnd: arcEnd,
                        colorIndex: i + 1
                    }
                    const arcConfig = {
                        showCycle: true,
                        hasOutline: true,
                    }
                    const duadGroup = this.group.querySelector(`.duad[data-id="${duad}"]`);

                    const arc = new Arc(arcData, arcConfig, duadGroup, {

                    });
                    subcomponents.edges.push(arc);
                })
            })
        }

        if (this.config.useLines) {
            this.synthemes.forEach((syntheme, i) => {
                syntheme.forEach(duad => {
                    let [left, right] = this.globals.clockwiseForm[duad].split('');
                    [left, right] = [+left, +right]
                    if (left !== 0) {
                        let startCoords = this.data.subcomponentLocations[left];
                        let endCoords = this.data.subcomponentLocations[right];
                        let pentagramCycle = this.data.fiveCycle.map((v, i, arr) => {
                            let d = [v, arr[(i+1) % arr.length]].join(''); 
                            return this.globals.clockwiseForm[d];
                        })
                        let inCycle  = pentagramCycle.includes(duad);
                        const lineData = {
                            id: duad,
                            duad: duad,
                            r: this.R,
                            pentagram: this,
                            x1: startCoords.coords.x,
                            y1: startCoords.coords.y,
                            x2: endCoords.coords.x,
                            y2: endCoords.coords.y,
                            colorIndex: inCycle ? 1 : 2,
                            inCycle: inCycle
                        }
                        const duadGroup = this.group.querySelector(`.duad[data-id="${duad}"]`);

                        const line = new Line(lineData, {
                            showCycle: true,
                            hasOutline: true,
                        }, duadGroup);
                        subcomponents.edges.push(line);

                    }
                })
            })
        }
        return subcomponents;
    }
                    
    createLabel() {
        const labelGroup = createElement('g', {
            id: this.id,
            class: 'label',
            parent: this.layers.labels
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

    morph(newState, t) {
        this.subcomponents.edges.forEach(edge => {
            let [left, right] = edge.data.duad.split('');
            if (this.config.useArcs) {
                const newArcData = getArcData(newState.componentLocations, left, right, newState.phi);
                edge.morph(newArcData, t);
            }
            if (this.config.useLines) {
                const newLineData = {
                    x1: newState.subcomponentLocations[left].x,
                    y1: newState.subcomponentLocations[left].y,
                    x2: newState.subcomponentLocations[right].x,
                    y2: newState.subcomponentLocations[right].y
                };
                edge.morph(newLineData, t);
            }
        });
    }
}

class BackgroundPentagram extends BasePentagram {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'background-pentagram',
            ...extensions
        }); 
    }

    shift() {
        // do nothing
    }
}

class ForegroundPentagram extends BasePentagram {
    constructor(data, config, target) {
        super(data, config, target, {
            type: 'foreground-pentagram',
            position: data.position,
            R: data.R,
            r: data.r,
            nodeR: data.nodeR,
            nodePadding: data.nodePadding,
        });
        this.subcomponents.nodes = this.createNodes();
    }
    extendBase() {
        this.layers = {
            background: createElement('g', {class: 'background', parent: this.group}),
            lines: createElement('g', {class: 'lines', parent: this.group}),
            nodes: createElement('g', {class: 'nodes', parent: this.group}),
            labels: createElement('g', {class: 'labels', parent: this.group})
        }
    }

    morph(newState, t) {
        this.subcomponents.edges.forEach(arc => {
            let [left, right] = arc.data.duad;
            arc.morph(getArcData(newState.subcomponentLocations, left, right, newState.phi), t);
        });
        this.subcomponents.nodes.forEach(node => node.shift(newState, t));
    }

    createLabel() {
        const labelGroup = createElement('g', {
            id: this.id,
            class: 'label',
            parent: this.layers.labels
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
                class: `node node-${i+1}`,
                id: `node-${this.id}-${i+1}`,
                parent: this.layers.nodes,
            });
            const nodeData = {
                id: `node-${this.id}-${i + 1}`,
                syntheme: this.synthemes[i],
                R: this.data.r,
                r: this.data.nodeR,
                padding: this.data.nodePadding,
                pentagram: this,
                pentagramCoords: this.data.pentagramCoords,
                subcomponentLocations: this.data.pentagramLocations,
                group: nodeGroup,
                interactionHandler: this.data.interactionHandler.bind(this.data.composer)
            }
            const nodeConfig = {

            }
            const node = new PentagramNode(nodeData, nodeConfig, nodeGroup);

            nodes.push(node);


        })
        return nodes;
    }
}

class MysticPentagram extends BasePentagram {
    constructor(data,config, target, extensions = {}) {
        super(data, config, target, {
            type: 'mystic-pentagram',
            position: data.position,
            R: data.R,
            nodeR: data.nodeR,
            ...extensions
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
        const pentagramLocations = this.data.subcomponentLocations;
        let nodes = [];
        pentagramLocations.forEach((location, i) => {
            if (i !== 0) {
                const nodeGroup = createElement('g', {
                    id: this.id, 
                    transform: `translate(${location.coords.x}, ${location.coords.y})`,
                    class: `node node-${i}`,
                    id: `node-${this.id}-${i}`,
                    parent: this.layers.nodes,
                });
                const nodeData = {
                    id: `node-${this.id}-${i}`,
                    label: i,   
                    R: this.data.r,
                    r: this.data.nodeR,
                    padding: this.data.nodePadding,
                    pentagram: this,
                    pentagramCoords: this.data.pentagramCoords,
                    subcomponentLocations: this.data.pentagramLocations,
                    group: nodeGroup,
                    interactionHandler: this.data.interactionHandler.bind(this.data.composer)
                }
                const nodeConfig = {

                }
                const node = new PentagramNode(nodeData, nodeConfig, nodeGroup);

                nodes.push(node);

            }


        })
        return nodes;
    }

    morph(newState, t) {
        this.lines.forEach(line => line.morph(newState, t));
        this.nodes.forEach(node => node.shift(newState, t));
    }

    shift(newState, t) {
        let location1 = this.location.coords;
        let location2 = newState.location.coords;

        let location = {
            x: t * location2.x + (1 - t) * location1.x,
            y: t * location2.y + (1 - t) * location1.y
        };

        this.group.setAttribute('transform', `translate(${location.x}, ${location.y})`);
    }

}

