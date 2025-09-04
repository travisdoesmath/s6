drawBackground();

pentagramData.forEach(pentagram => {
    let mainSvg = document.getElementById('main');
    createPentagram(pentagram, mainSvg);
});

document.querySelectorAll('.node').forEach(node => {
    node.addEventListener('click', () => {
        let nodeIdx = node.getAttribute('id').split('-')[2];
        if (selectedNodeIndices.includes(nodeIdx) || selectedNodeIndices.length < 2)
        {
            let nodes = document.querySelectorAll(`.node-${nodeIdx}`);
            nodes.forEach(n => n.classList.toggle('selected'));
        }
        if (node.classList.contains('selected') && selectedNodeIndices.length < 2) {
            selectedNodeIndices.push(nodeIdx);
        } else {
            selectedNodeIndices = selectedNodeIndices.filter(n => n !== nodeIdx);
        }
        if (selectedNodeIndices.length === 2) {
            let duad = selectedNodeIndices.sort().join('');
            let [a, b] = duad.split('');
            cycle = ['1', '2', '3', '4', '5']
            cycle[a - 1] = b;
            cycle[b - 1] = a;

            let leftPentagram = document.getElementById(`${a}`);
            let rightPentagram = document.getElementById(`${b}`);
            let centerPentagram = document.getElementById('0');
            let highlightDuad = centerPentagram.querySelector(`.background-lines>line[data-id="${duad}"]`)
            let highlightBgDuad = background.querySelector(`path[data-id="${duad}"]`)
            let highlightLeftNode = leftPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
            let highlightRightNode = rightPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
            highlightDuad.classList.add('highlight');
            highlightBgDuad.classList.add('highlight');
            highlightLeftNode.classList.add('highlight');
            highlightRightNode.classList.add('highlight');

            // requestAnimationFrame(animate);
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }

        //requestAnimationFrame(animate);
    });
});

function selectNodes(a, b) {
    selectedNodeIndices = [a, b];
    let nodesA = document.querySelectorAll(`.node-${a}`);
    nodesA.forEach(n => n.classList.add('selected'));
    setTimeout(() => {
        let nodesB = document.querySelectorAll(`.node-${b}`);
        nodesB.forEach(n => n.classList.add('selected'));
    }, 500);
    setTimeout(() => {
        let [a, b] = selectedNodeIndices;
        cycle = ['1', '2', '3', '4', '5'];
        cycle[a - 1] = b;
        cycle[b - 1] = a;
        console.log(cycle);
        console.log(currentPhi);
        console.log(currentPhiInverse);

        // requestAnimationFrame(animate);
    }, 750);
}

function animationLoop() {
    let nodes = ['1', '2', '3', '4', '5'];
    nodes = nodes.sort(() => Math.random() - 0.5);
    let a = nodes[0];
    let b = nodes[1];
    selectNodes(a, b);
    // requestAnimationFrame(animationLoop);
}

// requestAnimationFrame(animationLoop);