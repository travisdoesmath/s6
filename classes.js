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
    constructor(permutation, labels = undefined) {
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
        if (labels === undefined) {
                        this.labels = Object.keys(this.permutation);
            if (this.labels.every(x => !isNaN(+x))) {
                this.labels = this.labels.map(x => String(1 + +x));
            }
            this.labels = {};
            const keys = Object.keys(this.permutation);
            keys.forEach(key => {
                this.labels[key] = !isNaN(+key) ? String(1 + +key) : key;
            });

        } else {
            this.labels = labels;
        }
        this.cycleNotation = this._cycleNotation();
    }

    setLabels(labels) {
        this.labels = labels;
        this.cycleNotation = this._cycleNotation();
    }
    
    
    copy() {
        return new Permutation(this.permutation);
    }

    _cycleNotation() {
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
        });

        return cycles.map(cycle => '(' + (cycle.map(el => this.labels[el]).join(' ')) + ')').join('');
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
        return new Permutation(newPermutation, thatPermutation.labels);
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
        this.label = data.label;
        this.globals = data.globals;
        this.location = data.location;
        this.color = data.color;
        this.target = target;
        this.parent = data.parent;
        this.group = createElement('g', {
            id: this.id,
            class: 'permutation-node',
            transform: `translate(${this.location.x}, ${this.location.y})`,
            parent: this.target
        });
        this.label = data.label;
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
            this.group.setAttribute('transform', `translate(${location.x}, ${location.y})`);
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

            this.group.setAttribute('transform', `translate(${location.x}, ${-location.y})`);
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
        text.innerHTML = this.label ? this.label : (parseInt(this.id) + 1).toString();
    }
}
