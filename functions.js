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

function permutationToCycle(permutation) {
    elements = Array.from({ length: Object.keys(permutation).length }, (_, i) => i + 1);
    let visited = new Set();
    let cycles = [];

    for (let i = 0; i < elements.length; i++) {
        if (!visited.has(i)) {
            let current = i;
            let cycle = [];

            while (!visited.has(current)) {
                visited.add(current);
                cycle.push(current);
                current = permutation[current];
            }

            if (cycle.length > 1) {
                cycles.push(cycle);
            }
        }
    }

    return cycles.map(cycle => '(' + cycle.map(x => x + 1).join(' ') + ')').join('');
}