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
            throw new Error(`Invalid permutation type: ${typeof permutation} `);
        }
    }
    copy() {
        return new Permutation(this.permutation);
    }
    cycleNotation() {
        return cycleNotation(this.permutation);
    }

    cycleNotation(index=1) {
        let elements = Object.keys(this.permutation);
        let visited = new Set();
        let cycles = [];

        elements.forEach(element => {
            if (!visited.has(element)) {
                let current = String(element);
                let cycle = [];

                while (!visited.has(current)) {
                    visited.add(current);
                    cycle.push(current);
                    current = String(this.permutation[current]);
                }

                if (cycle.length > 1) {
                    cycles.push(cycle);
                }
            }
        })

    return cycles.map(cycle => '(' + (cycle.map(el => +el + index).join(' ')) + ')').join('');
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

    compose(thatPermutation) {
        let newPermutation = {};
        Object.keys(thatPermutation.permutation)
            .filter(key => !Object.keys(this.permutation).includes(key))
            .forEach(key => {
            newPermutation[key] = thatPermutation.permutation[key];
        });
        Object.keys(this.permutation).forEach(key => {
            newPermutation[key] = thatPermutation.map(this.permutation[key]);
        });
        return new Permutation(newPermutation);
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

    morph(oldState, newState, t) {
        // Implement interpolations that change the visual structure of the component
    }

    shift(oldLocation, newLocation, t, linear=true) {
        const start = oldLocation.coords;
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
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                this[key] = value;
            });
        }
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
        const oldState = {
            componentLocations: [...new Array(this.componentLocations.length).keys()].map(i => this.componentLocations[this.currentPsi.map(i)]),
            subcomponentLocations: [...new Array(this.subcomponentLocations.length).keys()].map(i => this.subcomponentLocations[this.currentPhi.map(i)]),
            // componentLocations: this.componentLocations,
            // subcomponentLocations: this.subcomponentLocations,
            psi: this.psi,
            phi: this.phi
        }
        const newState = {
            componentLocations: [...new Array(this.componentLocations.length).keys()].map(i => this.componentLocations[this.psiOfSwap.map(this.currentPsi.map(i))]),
            subcomponentLocations: [...new Array(this.subcomponentLocations.length).keys()].map(i => this.subcomponentLocations[this.swap.map(this.currentPhi.map(i))]),
            psi: this.psiOfSwap,
            phi: this.swap

        }
        if (multiStage) {
            if (t < 0.5) {
                this.morph(oldState, newState, t);
            } else {
                this.components.forEach(component => {
                    component.shift(oldState.componentLocations[component.id], newState.componentLocations[component.id], t);
                });
            }
        } else {
            this.morph(oldState, newState, t);
            this.components.forEach(component => {
                component.shift(oldState.componentLocations[component.id], newState.componentLocations[component.id], t);
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
        return [this.pathElement, this.outline].filter(Boolean);
    }

    extendBase() {
        this.arcData = {
            arcStart: this.data.arcStart,
            arcMiddle: this.data.arcMiddle,
            arcEnd: this.data.arcEnd,            
        }
    }

    morph(oldState, newState, t) {
        const pathString = this.interpolatePathString(oldState, newState, t);
        this.pathElement.setAttribute('d', pathString);
        if (this.config.hasOutline) {
            this.outline.setAttribute('d', pathString);
        }
    }

    interpolatePathString(oldState, newState, t=0) {
        let arcStartPoint = {
            x: lerp(oldState.arcStart.coords.x, newState.arcStart.coords.x, t),
            y: lerp(oldState.arcStart.coords.y, newState.arcStart.coords.y, t)
        }

        let arcControlPoint = {
            x: lerp(oldState.arcMiddle.x, newState.arcMiddle.x, t),
            y: lerp(oldState.arcMiddle.y, newState.arcMiddle.y, t)
        }

        let arcEndPoint = {
            x: lerp(oldState.arcEnd.coords.x, newState.arcEnd.coords.x, t),
            y: lerp(oldState.arcEnd.coords.y, newState.arcEnd.coords.y, t)
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
    
    morph(oldState, newState, t) {
        let p1coords = {
            start: { x: oldState.x1, y: oldState.y1 },
            end: { x: oldState.x2, y: oldState.y2 }
        }

        let p2coords = {
            start: { x: newState.x1, y: newState.y1 },
            end: { x: newState.x2, y: newState.y2 }
        }

        let point0 = {
            x: lerp(p1coords.start.x, p2coords.start.x, t),
            y: lerp(p1coords.start.y, p2coords.start.y, t)
        }

        let point1 = {
            x: lerp(p1coords.end.x, p2coords.end.x, t),
            y: lerp(p1coords.end.y, p2coords.end.y, t)
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

    updateState() {
        if (this.background) {
            this.background.update();
        }
        this.updatePentagrams();
    }

    updatePentagrams() {
        this.globals.selectedNodeIndices = [];

        document.querySelectorAll('.node.selected').forEach(node => {
            node.classList.toggle('selected');
        });
        document.querySelectorAll('.highlight').forEach(highlight => {
            highlight.classList.toggle('highlight');
        });
        // this.componentLocations = this.componentLocations.map((loc, i) => this.componentLocations[this.psiOfSwap.map(i)]);
        // this.subcomponentLocations = this.subcomponentLocations.map((loc, i) => this.subcomponentLocations[this.swap.map(i + 1) - 1]);
        this.currentPhi.compose(this.swap);
        this.currentPsi.compose(this.psiOfSwap);
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
        let subcomponentLocations = Object.entries(pentagramCoords)
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
                ['01', '52', '34'],
                ['02', '13', '45'],
                ['03', '24', '51'],
                ['04', '12', '35'],
                ['05', '41', '23']
            ],
            r: this.config.R,
            subcomponentLocations: this.componentLocations,
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
        // let nodeIdx = this.currentPhi.inverse(that.group.getAttribute('id').split('-')[2]);
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
            let duad = this.globals.clockwiseForm[this.globals.selectedNodeIndices.map(x => this.currentPhi.map(x)).join('')];
            this.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
            this.psiOfSwap = new Permutation(this.globals.psi[duad]);

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }
    
    morph(oldState, newState, t) {
        this.background.morph(oldState, newState, t);
        this.pentagrams.forEach(pentagram => {
            pentagram.morph(oldState, newState, t);
        });
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
        this.globals.selectedNodeIndices = [];
    }

    createComponents() {
        const components = [];
        this.pentagrams = this.createPentagrams();
        components.push(...this.pentagrams);
        return components;
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

    morph(oldState, newState, t) {
        this.pentagrams.forEach(pentagram => {
            pentagram.morph(oldState, newState, t);
        });
    }

    interactionHandler(event, that) {
        // let nodeIdx = this.currentPhi.inverse(that.group.getAttribute('id').split('-')[2]);
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
            let duad = this.globals.clockwiseForm[this.globals.selectedNodeIndices.map(x => this.currentPhi.map(x)).join('')];
            this.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
            this.psiOfSwap = new Permutation(this.globals.psi[duad]);

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
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
        this.group.classList.add(data.class);

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
        // subcomponents.push(this.nodeCircle);

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
        // subcomponents.push(arcs);
        // subcomponents.push(duads);
        return {
            group: this.group,
            arcs: arcs,
            duads: duads
        }
        // return subcomponents;
    }

    morph(oldState, newState, t) {
        this.arcs.forEach(arc => {
            let [left, right] = arc.data.duad.split('');
            // let locations = Object.entries(this.data.pentagramCoords).map(([key, value]) => new Location(newState.phi.map(key), value.multiply(this.data.r - this.data.padding)));
            let oldLocations = oldState.subcomponentLocations.map(loc => loc.multiply((this.data.r - this.data.padding)/this.data.R));
            let newLocations = newState.subcomponentLocations.map(loc => loc.multiply((this.data.r - this.data.padding)/this.data.R));
            let oldArcData = getArcData(oldLocations, left, right, oldState.psi);
            let newArcData = getArcData(newLocations, left, right, newState.psi);
            arc.morph(oldArcData, newArcData, t);
        });
    }

    shift(oldLocation, newLocation, t, linear=true) {
        const start = oldLocation.coords;
        const end = newLocation.coords;
        if (linear) {
            let x = lerp(start.x, end.x, t);
            let y = lerp(start.y, end.y, t);
            this.group.setAttribute('transform', `translate(${x}, ${y})`);
            this.group.setAttribute('debug', 'testing')
        } else {
            // implement code for elliptic path
        }
}}

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
            this.synthemes.forEach((syntheme, i) => {
                syntheme.forEach(duad => {
                    let [left, right] = this.globals.clockwiseForm[duad].split('');
                    [left, right] = [+left, +right]
                    
                    //let locations = [new Location('center', new Coords(0,0)), ...this.data.subcomponentLocations];
                    let locations = this.data.subcomponentLocations;
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
                        const lineConfig = {
                            showCycle: true,
                            hasOutline: true,
                        }
                        const duadGroup = this.group.querySelector(`.duad[data-id="${duad}"]`);

                        const line = new Line(lineData, lineConfig, duadGroup, {});
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

    morph(oldState, newState, t) {
        this.subcomponents.edges.forEach(edge => {
            let [left, right] = edge.data.duad.split('').map(x => +x);
            if (this.config.useArcs) {
                const oldArcData = getArcData(oldState.componentLocations, left, right, oldState.phi);
                const newArcData = getArcData(newState.componentLocations, left, right, newState.phi);
                edge.morph(oldArcData, newArcData, t);
            }
            if (this.config.useLines) {
                const oldLineData = {
                    x1: oldState.subcomponentLocations[left].coords.x,
                    y1: oldState.subcomponentLocations[left].coords.y,
                    x2: oldState.subcomponentLocations[right].coords.x,
                    y2: oldState.subcomponentLocations[right].coords.y
                };
                const newLineData = {
                    x1: newState.subcomponentLocations[left].coords.x,
                    y1: newState.subcomponentLocations[left].coords.y,
                    x2: newState.subcomponentLocations[right].coords.x,
                    y2: newState.subcomponentLocations[right].coords.y
                };
                edge.morph(oldLineData, newLineData, t);
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
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'foreground-pentagram',
            position: data.position,
            R: data.R,
            r: data.r,
            nodeR: data.nodeR,
            nodePadding: data.nodePadding,
            ...extensions
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

    morph(oldState, newState, t) {
        this.subcomponents.edges.forEach(arc => {            
            let [left, right] = arc.data.duad.split('');
            let oldArcData = getArcData(oldState.subcomponentLocations, left, right, oldState.psi);
            let newArcData = getArcData(newState.subcomponentLocations, left, right, newState.psi);

            arc.morph(oldArcData, newArcData, t);
        });
        this.subcomponents.nodes.forEach(node => node.morph(oldState, newState, t));
        this.subcomponents.nodes.forEach(node => {
            let oldLocation = oldState.subcomponentLocations[node.id.split('-')[2]];
            let newLocation = newState.subcomponentLocations[node.id.split('-')[2]];
            node.shift(oldLocation, newLocation, t)
        });
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
        const pentagramLocations = this.data.subcomponentLocations.filter(loc => loc.label !== 'center');
        let nodes = [];
        pentagramLocations.forEach((location, i) => {
            // const nodeGroup = createElement('g', {
            //     id: this.id, 
            //     transform: `translate(${location.coords.x}, ${location.coords.y})`,
            //     class: `node node-${i+1}`,
            //     id: `node-${this.id}-${i+1}`,
            //     parent: this.layers.nodes,
            // });
            const nodeData = {
                id: `node-${this.id}-${i + 1}`,
                class: `node-${i+1}`,
                syntheme: this.synthemes[i],
                R: this.data.r,
                r: this.data.nodeR,
                padding: this.data.nodePadding,
                pentagram: this,
                pentagramCoords: this.data.pentagramCoords,
                subcomponentLocations:this.data.subcomponentLocations,
                group: this.layers.nodes,
                location: location,
                interactionHandler: this.data.interactionHandler.bind(this.data.composer)
            }
            const nodeConfig = {

            }
            const node = new PentagramNode(nodeData, nodeConfig, this.layers.nodes);

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
        // const pentagramLocations = this.data.subcomponentLocations;
        let nodes = [];
        this.data.subcomponentLocations.forEach((location, i) => {
            if (i !== 0) {
                const nodeData = {
                    id: `node-${this.id}-${i}`,
                    label: i,   
                    class: `node-${i}`,
                    location: location,
                    R: this.data.r,
                    r: this.data.nodeR,
                    padding: this.data.nodePadding,
                    pentagram: this,
                    pentagramCoords: this.data.pentagramCoords,
                    subcomponentLocations: this.data.subcomponentLocations,
                    
                    interactionHandler: this.data.interactionHandler.bind(this.data.composer)
                }
                const nodeConfig = {

                }
                const node = new PentagramNode(nodeData, nodeConfig, this.layers.nodes);

                nodes.push(node);

            }


        })
        return nodes;
    }
    
    morph(oldState, newState, t) {
        super.morph(oldState, newState, t);
        this.subcomponents.nodes.forEach(node => node.morph(oldState, newState, t));
        this.subcomponents.nodes.forEach(node => {
            let oldLocation = oldState.subcomponentLocations[node.id.split('-')[2]];
            let newLocation = newState.subcomponentLocations[node.id.split('-')[2]];
            node.shift(oldLocation, newLocation, t)
        });
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
        this.group.addEventListener('click', (event) => data.interactionHandler(event, this));
        this.render();
    }

    shift(oldLocation, newLocation, t, linear=false) {
        const start = oldLocation[this.id];
        const end = newLocation[this.id];
        if (linear) {
            const location = {
                x: (1-t) * oldLocation.x + t * newLocation.x,
                y: (1-t) * oldLocation.y + t * newLocation.y
            };
            this.group.setAttribute('transform', `translate(${location.x}, ${location.y + this.yOffset})`);
        } else {

            let cx = (oldLocation.x + newLocation.x) / 2;
            let cy = (oldLocation.y + newLocation.y) / 2;

            // Calculate semi-major and semi-minor axes
            let dx = (newLocation.x - oldLocation.x) / 2;
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

class PermutationComponent extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'permutation-component',
            globals: data.globals,
            subcomponentLocations: [...Array(6).keys()].map(i => new Coords(config.padding*(i - 2 * data.n/(data.n - 1)), 0)),
            ...extensions
        });
    }
    extendBase() {
        this.layers = {
            background: createElement('g', { class: 'background', parent: this.group }),
            nodes: createElement('g', { class: 'nodes', parent: this.group }),
            labels: createElement('g', { class: 'labels', parent: this.group }),
        };
    }

    createSubcomponents() {
        let subcomponents = {};
        subcomponents.cycleLabel = this.createCycleLabel();
        subcomponents.nodes = this.createNodes();
        return subcomponents
    }

    createCycleLabel() {
        const label = createElement('text', {
            x: 0,
            y: 15,
            fill: 'var(--color3-dark)',
            'font-size': 7,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            parent: this.layers.labels
        });
        label.innerHTML = this.globals.currentPhi.cycleNotation();
        return label
    }

    createNodes() {
        let nodes = [];
        this.subcomponentLocations.forEach((location, i) => {
            const permutationNodeData = {
                id: i,
                globals: this.globals,
                location: location,
                color: '--color3',
                target: this.layers.nodes,
                interactionHandler: this.data.interactionHandler.bind(this.data.composer),
                yOffset: 0
            };
            nodes.push(new PermutationNode(permutationNodeData, this.layers.nodes));
        })
        return nodes;
    }

    interpolate(t) {
        this.subcomponents.cycleLabel.innerHTML = this.globals.currentPhi.cycleNotation() + this.globals.swap.cycleNotation();
        // this.subcomponents.cycleLabel.innerHTML = 'test';
        this.subcomponents.nodes.forEach(node => {
            let oldLocation = this.subcomponentLocations[this.globals.currentPhi.map(node.id)];
            let newLocation = this.subcomponentLocations[this.globals.swap.compose(this.globals.currentPhi).map(node.id)];
            node.shift(oldLocation, newLocation, t, false);
        });
    }

    update() {
        this.subcomponents.cycleLabel.innerHTML = this.globals.currentPhi.cycleNotation();
        this.subcomponentLocations.map((loc, i) => this.globals.currentPhi.map(i))
    }

}

class PermutationComposer extends BaseComposer{
    constructor(data, config, target, extensions = {}) {
        let globals =  {
            selectedNodeIndices: [],
            currentPhi: new Permutation(config.n),
            psi: {
                '01': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2}, // (12)(36)(45)
                '02': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4}, // (13)(24)(56)
                '03': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1}, // (14)(26)(35)
                '04': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3}, // (15)(23)(46)
                '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0}, // (16)(25)(34)
                '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1}, // (15)(26)(43)
                '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3}, // (13)(25)(46)
                '41': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}, // (16)(24)(35)
                '51': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4}, // (14)(23)(56)
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0}, // (16)(23)(45)
                '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, // (14)(25)(36)
                '52': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3}, // (12)(35)(46)
                '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4}, // (12)(34)(56)
                '35': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2}, // (15)(24)(36)
                '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}  // (13)(26)(45)
            },
        }
        super(data, config, target, {
            globals: globals,    
            ...extensions
        });
        this.currentPhi = new Permutation(this.config.n);
    }

    createComponents() {
        let components = [this.createPermutationComponent()];
        return components;  
    }


    createPermutationComponent() {
        return new PermutationComponent({
            id: 'permutation-component',
            n: this.config.n,
            location: new Location('origin', new Coords(0,0)),
            interactionHandler: this.interactionHandler.bind(this),
            globals: this.globals,
        }, {padding: 15}, this.target, {});
        
    }
    
    interpolate(t) {
        this.components.forEach(component => {
            component.interpolate(t);
        });
    }

    interactionHandler(event, that) {
        // let nodeIdx = this.currentPhi.inverse(that.id);
        let nodeIdx = +that.id;
        let nodes = Array.from(that.target.getElementsByClassName('permutation-node')).filter(el => el.id == nodeIdx);
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
            let duad = this.globals.selectedNodeIndices.map(x => this.currentPhi.map(x)).join('');
            this.globals.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
            this.globals.psiOfSwap = new Permutation(this.globals.psi[clockwiseForm(duad)]);

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }

    update() {
        this.globals.currentPhi = this.globals.swap.compose(this.globals.currentPhi);
        this.components.forEach(component => component.update())
        //component.subcomponentLocations.map((loc, i) => this.globals.currentPhi.map(i)));
        this.globals.selectedNodeIndices = [];
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
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
            currentPhi: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
            currentPhiInverse: Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, i])),
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
                '41': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}, // (16)(24)(35)
                '51': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4}, // (14)(23)(56)
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0}, // (16)(23)(45)
                '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, // (14)(25)(36)
                '52': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3}, // (12)(35)(46)
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
            parent: this.layers.labels
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

        this.globals.currentPhi = Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, this.globals.cycle[i]]));
        this.globals.currentPhiInverse = Object.fromEntries(Array.from({ length: this.n }, (_, i) => [i, this.globals.cycle.indexOf(i)]));
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