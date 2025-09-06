drawBackground();

pentagramData.forEach(pentagram => {
    let mainSvg = document.getElementById('main');
    createPentagram(pentagram, mainSvg, config.r);
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
            
            let reversePentagramLocationMap = Object.fromEntries(Object.entries(pentagramLocations).map(([k,v]) => [v,k]));

            let duad = clockwiseForm[selectedNodeIndices.map(x => reverseLocationEnum[nodeLocations[x]]).join('')];

            for (let i = 0; i < 5; i++) {
                currentPhi[i] = phi[duad][currentPhi[i]];
            }
            currentPhiInverse = Object.fromEntries(Object.entries(currentPhi).map(([key, value]) => [value, +key]));

            for (let i = 0; i < 6; i++) {
                currentPsi[i] = phi[duad][currentPsi[i]];
            }
            currentPsiInverse = Object.fromEntries(Object.entries(currentPsi).map(([key, value]) => [value, +key]));

            let [a, b] = duad.split('');
            let swap = cycle[a - 1];
            cycle[a - 1] = cycle[b - 1];
            cycle[b - 1] = swap;
            cycleInverse = [1, 2, 3, 4, 5].map(i => cycle.indexOf(i) + 1);

            let leftPentagram = document.getElementById(`${a}`);
            let rightPentagram = document.getElementById(`${b}`);
            
            // let centerPentagram = document.getElementById(reversePentagramLocationMap['center']);
            // let highlightDuad = centerPentagram.querySelector(`.outline[duad="${duad}"]`)
            // let highlightBgDuad = background.querySelector(`path[duad="${duad}"]`)
            // let highlightLeftNode = leftPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
            // let highlightRightNode = rightPentagram.querySelector(`.nodes>g.node-${testMap[duad]}`)
            // highlightDuad.classList.add('highlight');
            // highlightBgDuad.classList.add('highlight');
            // highlightLeftNode.classList.add('highlight');
            // highlightRightNode.classList.add('highlight');

            setTimeout(() => {
                requestAnimationFrame(animate);
            }, 0)

            // requestAnimationFrame(animate);
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }

        //requestAnimationFrame(animate);
    });
});

// function selectNodes(a, b) {
//     selectedNodeIndices = [a, b];
//     let nodesA = document.querySelectorAll(`.node-${a}`);
//     nodesA.forEach(n => n.classList.add('selected'));
//     setTimeout(() => {
//         let nodesB = document.querySelectorAll(`.node-${b}`);
//         nodesB.forEach(n => n.classList.add('selected'));
//     }, 500);
//     setTimeout(() => {
//         let [a, b] = selectedNodeIndices;
//         cycle = ['1', '2', '3', '4', '5'];
//         cycle[a - 1] = b;
//         cycle[b - 1] = a;
//         console.log(cycle);
//         console.log(currentPhi);
//         console.log(currentPhiInverse);

//         // requestAnimationFrame(animate);
//     }, 750);
// }

function animationLoop() {
    let nodes = ['1', '2', '3', '4', '5'];
    nodes = nodes.sort(() => Math.random() - 0.5);
    let a = nodes[0];
    let b = nodes[1];
    selectNodes(a, b);
    // requestAnimationFrame(animationLoop);
}

// requestAnimationFrame(animationLoop);