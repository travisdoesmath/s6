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

function easeInOutCubic(x) {
return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInOutSine(x) {
return -(Math.cos(Math.PI * x) - 1) / 2;
}

function cycleNotation(permutation) {
    elements = Object.keys(permutation);
    let visited = new Set();
    let cycles = [];

    elements.forEach(element => {
        if (!visited.has(element)) {
            let current = String(element);
            let cycle = [];

            while (!visited.has(current)) {
                visited.add(current);
                cycle.push(current);
                current = String(permutation[current]);
            }

            if (cycle.length > 1) {
                cycles.push(cycle);
            }
        }
    })

    return cycles.map(cycle => '(' + cycle.join(' ') + ')').join('');
}

function stringToPermutationMap(str) {
    let permutation = {};
    let cycles = str.match(/\(([^)]+)\)/g);
    cycles.forEach(cycle => {
        let elements = cycle.replaceAll('(','').replaceAll(')','').split(' ').filter(x => x !== '(' && x !== ')');
        elements.forEach((char, i) => {
            let nextChar = elements[(i + 1) % elements.length];
            permutation[char] = nextChar;
        });
    });
    return permutation;
}

function arrayToMap(arr) {
    let map = {};
    arr.forEach((value, index) => {
        map[index] = value;
    });
    return map;
}