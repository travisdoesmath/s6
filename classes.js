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
        // console.log(thatPermutation);
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