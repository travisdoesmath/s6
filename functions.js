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

function sortedForm(a) {
    return a.split('').sort().join('');
}

function clockwiseForm(a) {
    let duadList =  ['01', '12', '23', '34', '40', '02', '13', '24', '30', '41', '05', '15', '25', '35', '45']
    let clockwiseMap = [...Array(6).keys()]
        .map(i => [...Array(6).keys()]
            .map(j => [i, j])
            .filter(([i, j]) => i !== j)
        )
        .reduce((acc, elem) => acc.concat(elem), [])
        .reduce((acc, [i, j]) => {
            acc[`${i}${j}`] = duadList.includes(`${i}${j}`) ? `${i}${j}` : `${j}${i}`;
            return acc;
        }, {});

    return clockwiseMap[a];

}



function getArcData(locations, left, right, phi, verbose=false) {
    if (phi === undefined) {
        phi = new Permutation(6)
    }
    phiLeft = phi.map(left)
    phiRight = phi.map(right)
    let arcStart = locations[left];
    let arcEnd = locations[right];
    if (verbose) {
        console.log(left, right, phiLeft, phiRight, arcStart, arcEnd, locations);
    }
    let dotProduct = (arcStart.coords.x * arcEnd.coords.x + arcStart.coords.y * arcEnd.coords.y) / (Math.sqrt(arcStart.coords.x**2 + arcStart.coords.y**2) * Math.sqrt(arcEnd.coords.x**2 + arcEnd.coords.y**2));

    let arcAngle = Math.acos(dotProduct) || 0;

    let arcMiddle = new Coords(
        (arcStart.coords.x + arcEnd.coords.x) / 2,
        (arcStart.coords.y + arcEnd.coords.y) / 2
    );
    arcMiddle.x *= (1 + (arcAngle / Math.PI));
    arcMiddle.y *= (1 + (arcAngle / Math.PI));

    return { arcStart, arcMiddle, arcEnd };
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

function lerp(start, end, t) {
    return start + (end - start) * t;
}