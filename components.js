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

class StarNode extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'node',
            syntheme: data.syntheme,
            label: data.label,
            r: data.nodeR,
            R: data.r,
            padding: data.padding,
            star: data.star,
            globals: data.star.composer.globals,
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
            this.nodeCircle.setAttribute('stroke', `var(--color1-dark)`);
            this.nodeCircle.setAttribute('stroke-width', `0.4`);
            let text = createElement('text', {
                class: 'mystic-star-label',
                parent: labelGroup,
                fill: `var(--color1-dark)`,
                opacity: 0.5    
            });
            if (this.config.showLabels) { text.innerHTML = this.label; }
            subcomponents.push({labelGroup: labelGroup, text: text});
        }
        
        if (this.syntheme) {
            const synthemeGroup = createElement('g', {
                class: 'syntheme',
                parent: this.group
            });
            this.nodeCircle.setAttribute('fill', `var(--color${+this.id.split('-')[2] + 1}-dark)`);
            this.syntheme.forEach(duad => {
                const duadGroup = createElement('g', {
                    class: 'duad',
                    'data-id': duad,
                    parent: synthemeGroup
                });
                let [left, right] = clockwiseForm(duad).split('');
                let locations = Object.entries(this.data.starCoords).map(([key, value]) => new Location(key, value.multiply(this.data.r - this.data.padding)));
                const { arcStart, arcMiddle, arcEnd } = getArcData(locations, left, right);
                const arcData = {
                    id: duad,
                    duad: duad,
                    r: this.data.r,
                    star: this,
                    arcStart: arcStart,
                    arcMiddle: arcMiddle,
                    arcEnd: arcEnd,
                    colorIndex: +this.id.split('-')[2] + 1
                }
                const arcConfig = {
                    hasOutline: false,
                    classPrefix: 'node-'
                }
                const arc = new Arc(arcData, arcConfig, duadGroup);            
                this.arcs.push(arc);

                const starCoords = Object.values(this.data.starCoords);
                const i = +this.id.split('-')[2];
                const circle1 = createElement('circle', {
                    cx: `${(this.data.r - this.data.padding) * starCoords[left].x}`,
                    cy: `${(this.data.r - this.data.padding) * starCoords[left].y}`,
                    r: `${this.data.r/10}`,
                    fill: `var(--color${i + 1}-light)`,
                    stroke: 'none',
                    parent: duadGroup
                });

                const circle2 = createElement('circle', {
                    cx: `${(this.data.r - this.data.padding) * starCoords[right].x}`,
                    cy: `${(this.data.r - this.data.padding) * starCoords[right].y}`,
                    r: `${this.data.r/10}`,
                    fill: `var(--color${i + 1}-light)`,
                    stroke: 'none',
                    parent: duadGroup
                });
                duads.push(duadGroup);
            });
        }
        return {
            group: this.group,
            arcs: arcs,
            duads: duads
        }
    }

    morph(oldState, newState, t) {
        this.arcs.forEach(arc => {
            let [left, right] = arc.data.duad.split('');
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
            // TODO: implement code for elliptic path
        } 
    }
}

class BaseStar extends BaseComponent{
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
                    let [left, right] = clockwiseForm(duad).split('');
                    [left, right] = [+left, +right]
                    
                    let locations = this.data.subcomponentLocations;
                    const { arcStart, arcMiddle, arcEnd } = getArcData(locations, left, right);
                    const arcData = {
                        id: duad,
                        duad: duad,
                        r: this.r,
                        star: this,
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
                    let [left, right] = clockwiseForm(duad).split('');
                    [left, right] = [+left, +right]
                    if (left !== 5 && right !== 5) {
                        let startCoords = this.data.subcomponentLocations[left];
                        let endCoords = this.data.subcomponentLocations[right];
                        let starCycle = this.data.fiveCycle.map((v, i, arr) => {
                            let d = [v, arr[(i+1) % arr.length]].join('');
                            return clockwiseForm(d);
                        })
                        let inCycle  = starCycle.includes(duad);
                        const lineData = {
                            id: duad,
                            duad: duad,
                            r: this.R,
                            star: this,
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
            class: 'star-label',
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

class BackgroundStar extends BaseStar {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'background-star',
            ...extensions
        }); 
    }

    shift() {
        // overwriting base method to do nothing
    }
}

class ForegroundStar extends BaseStar {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'foreground-star',
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
            r: '2',
            fill: this.id === 5 ? '#888' : `var(--color${this.id + 1})`,
            parent: labelGroup
        });
        let text = createElement('text', {
            class: 'star-label',
            parent: labelGroup,
            fill: this.id === 5 ? '#666' : `var(--color${this.id + 1}-dark)`,
            opacity: 0.5    
        });
        // text.innerHTML = ['A','B','C','D','E','F'][this.id];
    }
    
    createNodes() {
        const starLocations = this.data.subcomponentLocations.filter(loc => loc.label !== 'center');
        let nodes = [];
        starLocations.forEach((location, i) => {
            const nodeData = {
                id: `node-${this.id}-${i}`,
                class: `node-${i}`,
                syntheme: this.synthemes[i],
                R: this.data.r,
                r: this.data.nodeR,
                padding: this.data.nodePadding,
                star: this,
                starCoords: this.data.starCoords,
                subcomponentLocations: this.data.subcomponentLocations,
                group: this.layers.nodes,
                location: location,
                interactionHandler: this.data.interactionHandler.bind(this.data.composer)
            }
            const nodeConfig = {

            }
            const node = new StarNode(nodeData, nodeConfig, this.layers.nodes);

            nodes.push(node);


        })
        return nodes;
    }
}

class MysticStar extends BaseStar {
    constructor(data,config, target, extensions = {}) {
        super(data, config, target, {
            type: 'mystic-star',
            position: data.position,
            R: data.R,
            r: data.r,
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
        if (!this.config.showLabels) {return};
        const labelGroup = createElement('g', {
            id: this.id,
            class: 'label',
            parent: this.group
        });
        const labelBg = createElement('circle', {
            cx: '0',
            cy: '0',
            r: '2',
            fill: 'none',
            parent: labelGroup
        });
        let text = createElement('text', {
            class: 'mystic-star-label',
            parent: labelGroup,
            fill: `var(--color${2}-light)`,
            opacity: 0.5    
        });
        text.innerHTML = ['A','B','C','D','E','F'][this.id];

    }

    createNodes() {
        let nodes = [];
        this.data.subcomponentLocations.forEach((location, i) => {
            if (i !== 5) {
                const nodeData = {
                    id: `node-${this.id}-${i}`,
                    label: i + 1,   
                    class: `node-${i}`,
                    location: location,
                    R: this.data.r,
                    r: this.data.nodeR,
                    padding: this.data.nodePadding,
                    star: this,
                    starCoords: this.data.starCoords,
                    subcomponentLocations: this.data.subcomponentLocations,
                    
                    
                    interactionHandler: this.data.interactionHandler.bind(this.data.composer)
                }
                const nodeConfig = {
                    showLabels: this.config.showLabels,
                }
                const node = new StarNode(nodeData, nodeConfig, this.layers.nodes);

                nodes.push(node);

            }
        })
        return nodes;
    }
    
    morph(oldState, newState, t) {
        super.morph(oldState, newState, t);
        this.subcomponents.nodes.forEach(node => {
            node.morph(oldState, newState, t);
            let oldLocation = oldState.subcomponentLocations[node.id.split('-')[2]];
            let newLocation = newState.subcomponentLocations[node.id.split('-')[2]];
            node.shift(oldLocation, newLocation, t)
        });
    }
}

class PermutationComponent extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'permutation-component',
            globals: data.globals,
            subcomponentLocations: [...Array(6).keys()].map(i => new Location(i, new Coords(config.padding*(i - 2 * data.n/(data.n - 1)), config.yOffset || 0))),
            cycle: new Permutation(6),
            ...extensions
        });
        if (data.labels === undefined) {
            this.labels = [...Array(data.n).keys()].map(i => i + 1);
        } else {
            this.cycle.setLabels(data.labels);
        }
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
            y: 10,
            fill: `var(${this.config.color}-dark)`,
            'font-size': 7,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            parent: this.layers.labels
        });
        label.innerHTML = this.cycle.cycleNotation;
        return label
    }

    createNodes() {
        let nodes = [];
        this.subcomponentLocations.forEach((location, i) => {
            const permutationNodeData = {
                id: i,
                label: this.data.labels ? this.data.labels[i] : (i + 1).toString(),
                globals: this.globals,
                location: location,
                color: this.config.color || '--color3',
                interactionHandler: this.data.interactionHandler.bind(this.data.composer),
                parent: this,
            };
            nodes.push(new PermutationNode(permutationNodeData, {}, this.layers.nodes));
        })
        return nodes;
    }

    interpolate(t, swap=this.composer.swap) {
        this.subcomponents.cycleLabel.innerHTML = this.cycle.cycleNotation + swap.cycleNotation;
        this.subcomponents.nodes.forEach(node => {
            let oldLocation = this.subcomponentLocations[this.cycle.map(node.id)];
            let newLocation = this.subcomponentLocations[swap.compose(this.cycle).map(node.id)];
            node.shift(oldLocation, newLocation, t, false);
        });
    }

    update(usePhi=true) {
        if (usePhi) {
            this.cycle = this.composer.swap.compose(this.cycle)
        } else {
            this.cycle = this.composer.psiOfSwap.compose(this.cycle)
        }
        this.subcomponents.cycleLabel.innerHTML = this.cycle.cycleNotation;
        this.subcomponentLocations.map((loc, i) => this.cycle.map(i))
    }
}

class PermutationNode extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            type: 'permutation-node',
            label: data.label,
            globals: data.globals,
            location: data.location,
            color: data.color,
            parent: data.parent,
            ...extensions
        });
        if (data.labels === undefined) {
            this.labels = [...Array(data.n).keys()].map(i => i + 1);
        } else {
            this.currentPsi.setLabels(data.labels);
        }
        this.group.addEventListener('click', (event) => data.interactionHandler(event, this) );
    }


    createSubcomponents() {
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
        text.innerHTML = this.label ? this.label : (parseInt(this.id) + 1).toString();
    }

    shift(oldLocation, newLocation, t, linear=false) {
        if (linear) {
            const location = {
                x: (1-t) * oldLocation.coords.x + t * newLocation.coords.x,
                y: (1-t) * oldLocation.coords.y + t * newLocation.coords.y
            };
            this.group.setAttribute('transform', `translate(${location.x}, ${location.y})`);
        } else {

            let cx = (oldLocation.coords.x + newLocation.coords.x) / 2;
            let cy = (oldLocation.coords.y + newLocation.coords.y) / 2;

            // Calculate semi-major and semi-minor axes
            let dx = (newLocation.coords.x - oldLocation.coords.x) / 2;
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

            this.group.setAttribute('transform', `translate(${location.x}, ${location.y})`);
        }
    }

}

class Duad extends BaseComponent {
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            id: data.id,
            type: 'duad',
            location: data.location,
            duad: data.duad,
            bgColor: data.bgColor,
            textColor: data.textColor,
            strokeColor: data.strokeColor,
            ...extensions
        });
    }

    createSubcomponents() {
        const duadBg = createElement('circle', {
            r: '2',
            fill: this.bgColor,
            // stroke: this.strokeColor,
            // 'stroke-width': '0.25',
            parent: this.group
        })
        const duadText = createElement('text', {
            class: 'duad',
            fill: this.textColor,
            parent: this.group
        });
        //duadText.innerHTML = this.duad.split('').map(x => x == '0' ? 6 : +x).sort().join('');
        duadText.innerHTML = this.duad.split('').map(x => +x + 1).sort().join('');
        return {background: duadBg, text: duadText}
    }

    morph(oldState, newState, t) {
        
        let newText = this.duad.split('').map(x => newState.phi.map(x) + 1).sort().join('')
        this.subcomponents.text.innerHTML = newText;
    }
}

class Syntheme extends BaseComponent{
    constructor(data, config, target, extensions = {}) {
        super(data, config, target, {
            id: data.id,
            type: 'syntheme',
            location: data.location,
            duads: data.duads,
            ...extensions
        });

        this.group.addEventListener('click', (event) => data.interactionHandler(event, this) );
    }

    createSubcomponents() {
        const synthemeElement = createElement('g', { 
            transform: `translate(3, 0)`,
            parent: this.group
        });
        const synthemeBorder = createElement('rect', {
            class: 'border',
            x: -14.5,
            y: -2.5,
            width: 23,
            height: 5,
            fill: 'none',
            rx: 2.5,
            ry: 2.5,
            parent: synthemeElement
        });
        const synthemeBackground = createElement('rect', {
            x: -14.5,
            y: -2.5,
            width: 23,
            height: 5,
            fill: `var(--color${this.id + 1})`,
            rx: 2.5,
            ry: 2.5,
            parent: synthemeElement,
            opacity: 0.25
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
        synthemeLabelText.innerHTML = this.id + 1; 
        let duads = []
        this.duads.map(x => x.split('').sort().map(x => x).join('')).sort((x, y) => 
            {
            if (x[1] == '5') {
                if (y[1] == '5') {
                    return x[0] - y[0]
                }
                return -1
            }
            if (y[1] == '5') {
                return 1
            }
            return x[0] - y[0]
        }).forEach((duad, i) => {
            const duadData = {
                id: this.id,
                duad: duad,
                location: new Location(i, new Coords(-6 + 6 * i, 0)),
                bgColor: `var(--color${this.id + 1})`,
                textColor: `var(--color${this.id + 1}-dark)`,
                strokeColor: `var(--color${this.id + 1})`,
            }
            duads.push(new Duad(duadData, {}, synthemeElement));
        });
        return {border: synthemeBorder, labelText: synthemeLabelText, duads: duads}
    }

    morph(oldState, newState, t) {
        // this.subcomponents.labelText.innerHTML = newState.phi.map(this.id) + 1;
        this.subcomponents.duads.forEach(duad => {
            duad.morph(oldState, newState, t)
            // duad.shift()
        })
    }
}

class Pentad extends BaseComponent {
    constructor(data, config, target) {
        super(data, config, target, {
            id: data.id,
            type: 'pentad',
            location: data.location,
            // locationCoords: data.locationCoords,
        });
        
    }

    createSubcomponents() {
        let subcomponents = {}
        subcomponents.label = createElement('text', {
            class: 'pentad-label',
            parent: this.group,
        })
        subcomponents.label.innerHTML = ['A','B','C','D','E','F'][this.id];
        subcomponents.synthemes = this.createSynthemes();
        return subcomponents
    }

    createSynthemes() {
        let synthemes = [];
        this.data.synthemes.forEach((syntheme, i) => {
            const synthemeData = {
                id: i,
                duads: syntheme,
                location: this.data.subcomponentLocations[i],
                subcomponentLocations: [Array(6).keys()].map(i => new Location(i, new Coords(-6 + 6 * i, 0))),
                interactionHandler: this.data.interactionHandler,
            }
            synthemes.push(new Syntheme(synthemeData, {}, this.group));
        });
        return synthemes;
    }

    morph(oldState, newState, t) {
        this.subcomponents.synthemes.forEach(syntheme => {
            let oldLocation = oldState.subcomponentLocations[syntheme.id];
            let newLocation = newState.subcomponentLocations[syntheme.id];
            syntheme.shift(oldLocation, newLocation, t);
            syntheme.morph(oldState, newState, t)
        })
    }
}