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
            swap: this.swap,
            psiOfSwap: this.psiOfSwap,
            phi: this.currentPhi.compose(this.swap),
            psi: this.currentPsi.compose(this.psiOfSwap)
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
        throw new Error("interactionHandler not implemented")
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
        this.currentPhi = this.currentPhi.compose(this.swap);
        this.currentPsi = this.currentPsi.compose(this.psiOfSwap);
    }

    morph(oldState, newState, t) {
        this.components.forEach(component => {
            component.morph(oldState, newState, t);
        });
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

class BaseStarComposer extends BaseComposer {
    constructor(data, config, target, extensions = {}) {
        let duadList = ['01', '12', '23', '34', '40', '02', '13', '24', '30', '41', '05', '15', '25', '35', '45'];
        let phi = {
            '01': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3},
            '12': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
            '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
            '34': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
            '40': {0: 1, 1: 0, 2: 5, 3: 4, 4: 2, 5: 2},

            '02': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1},
            '13': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
            '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0},
            '24': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
            '30': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4},
            '41': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}
 
        }
        let psi = {
            '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0},
            '15': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1},
            '25': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2},
            '35': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3},
            '45': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4},

            '01': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3},
            '12': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
            '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
            '34': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
            '40': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2},

            '02': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1},
            '13': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
            '24': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
            '30': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4},
            '41': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}
        }
        let globals = {
            duadList: duadList,
            phi: phi,
            psi: psi
        }
        super(data, config, target, {
            globals: globals,
            ...extensions
        });
    }

    interactionHandler(event, that) {
        // let nodeIdx = this.currentPhi.inverse(that.group.getAttribute('id').split('-')[2]);
        let nodeIdx = that.group.getAttribute('id').split('-')[2];
        let nodes = this.target.querySelectorAll(`.node-${nodeIdx}`);
        if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
        {            
            nodes.forEach(n => {
                n.classList.toggle('selected');
                n.classList.toggle('glow');
            });
        }        
        if (nodes[0].classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
            this.globals.selectedNodeIndices.push(nodeIdx);
        } else {
            this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
        }
        if (this.globals.selectedNodeIndices.length === 2) {
            let duad = clockwiseForm(this.globals.selectedNodeIndices.map(x => this.currentPhi.map(x)).join(''));
            this.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
            this.psiOfSwap = new Permutation(this.globals.psi[duad]);

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }

    updateComponents() {
        if (this.background) {
            this.background.update();
        }
        this.updateStars();
    }

    updateStars() {
        this.globals.selectedNodeIndices = [];

        document.querySelectorAll('.node.selected').forEach(node => {
            node.classList.toggle('selected');
        });
        document.querySelectorAll('.highlight').forEach(highlight => {
            highlight.classList.toggle('highlight');
        });
        // this.componentLocations = this.componentLocations.map((loc, i) => this.componentLocations[this.psiOfSwap.map(i)]);
        // this.subcomponentLocations = this.subcomponentLocations.map((loc, i) => this.subcomponentLocations[this.swap.map(i + 1) - 1]);
    }
}

class StarComposer extends BaseStarComposer {
    constructor(data, config, target, extensions = {}) {
        let starCoords = {
            'top': new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5)),
            'top right': new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5)),
            'bottom right': new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5)),
            'bottom left': new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5)),
            'top left': new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5)),
            'center': new Coords(0, 0),
        }

        let componentLocations = Object.entries(starCoords)
            .map(([label, coords]) => new Location(label, coords.multiply(config.R)));
        let subcomponentLocations = Object.entries(starCoords)
            .map(([label, coords]) => new Location(label, coords.multiply(config.r)));

        extensions = {
            starCoords: starCoords,
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
        this.stars = this.createStars();
        components.push(...this.stars);
        return components;
    }

    createBackground() {
        const backgroundData = {
            id: 0,
            synthemes: [
                ['05', '41', '23'],
                ['15', '02', '34'],
                ['25', '40', '13'],
                ['35', '01', '24'],
                ['45', '30', '12']
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
        this.background = new BackgroundStar(backgroundData, backgroundConfig, this.target);
        return this.background;
    }

    createStars() {
        let stars = []
        this.data.pentadData.forEach(star => {
            const pentadData = {
                id: star.id,
                location: this.componentLocations[star.id],
                synthemes: star.synthemes,
                fiveCycle: star['5-cycle'],
                r: this.config.r,
                R: this.config.R,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                composer: this,
                starCoords: this.starCoords,
                subcomponentLocations: this.subcomponentLocations,
                interactionHandler: this.interactionHandler
            }
            const configData = {
                showCycle: this.config.showCycle,
                useArcs: true,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding
            }
            const newStar = new ForegroundStar(pentadData, configData, this.target);
            stars.push(newStar);
        });
        return stars;
    }
    
    morph(oldState, newState, t) {
        this.background.morph(oldState, newState, t);
        this.stars.forEach(star => {
            star.morph(oldState, newState, t);
        });
    }

}

class MysticStarComposer extends BaseStarComposer {
    constructor(data, config, target, extensions = {}) {
        let starCoords = [
            new Location('top', new Coords(Math.sin(10 * Math.PI / 5), -Math.cos(10 * Math.PI / 5))),
            new Location('top right', new Coords(Math.sin(2 * Math.PI / 5), -Math.cos(2 * Math.PI / 5))),
            new Location('bottom right', new Coords(Math.sin(4 * Math.PI / 5), -Math.cos(4 * Math.PI / 5))),
            new Location('bottom left', new Coords(Math.sin(6 * Math.PI / 5), -Math.cos(6 * Math.PI / 5))),
            new Location('top left', new Coords(Math.sin(8 * Math.PI / 5), -Math.cos(8 * Math.PI / 5))),
            new Location('center', new Coords(0, 0)),

        ]
        let componentLocations;
        if (config.configuration === 'rectangle') {
            componentLocations = [  
                new Location('top left', new Coords(-25, -12.5)),
                new Location('top center', new Coords(0, -12.5)),
                new Location('top right', new Coords(25, -12.5)),
                new Location('bottom left', new Coords(-25, 12.5)),
                new Location('bottom center', new Coords(0, 12.5)),
                new Location('bottom right', new Coords(25, 12.5)),
            ]
        }
        if (config.configuration === 'star') {
            componentLocations = starCoords
            .map(location => location.multiply(config.R))
        }

        let subcomponentLocations = starCoords.map(location => new Location(location.label, location.coords.multiply(config.r)));

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
        this.stars = this.createStars();
        components.push(...this.stars);
        return components;
    }

    createStars() {
        let stars = [];
        this.data.pentadData.forEach(star => {
            const starGroup = createElement('g', {
                class: 'star',
                'data-id': star.id,
            })

            const pentadData = {
                id: star.id,
                location: this.componentLocations[star.id],
                synthemes: star.synthemes,
                fiveCycle: star['5-cycle'],
                R: this.config.r,
                r: this.config.r,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                composer: this,
                starCoords: this.starCoords,
                subcomponentLocations: this.subcomponentLocations,
                interactionHandler: this.interactionHandler
            }
            const configData = {
                showCycle: this.config.showCycle,
                useLines: true,
                nodeR: this.config.nodeR,
                nodePadding: this.config.nodePadding,
                showLabels: this.config.labels === undefined ? true : this.config.labels
            }
            const newStar = new MysticStar(pentadData, configData, this.target);
            stars.push(newStar);
        });
        return stars;

    }

    morph(oldState, newState, t) {
        this.stars.forEach(star => {
            star.morph(oldState, newState, t);
        });
    }

    // interactionHandler(event, that) {
    //     // let nodeIdx = this.currentPhi.inverse(that.group.getAttribute('id').split('-')[2]);
    //     let nodeIdx = that.group.getAttribute('id').split('-')[2];
    //     let nodes = this.target.querySelectorAll(`.node-${nodeIdx}`);
    //     if (this.globals.selectedNodeIndices.includes(nodeIdx) || this.globals.selectedNodeIndices.length < 2)
    //     {            
    //         nodes.forEach(n => n.classList.toggle('selected'));
    //     }        
    //     if (nodes[0].classList.contains('selected') && this.globals.selectedNodeIndices.length < 2) {
    //         this.globals.selectedNodeIndices.push(nodeIdx);
    //     } else {
    //         this.globals.selectedNodeIndices = this.globals.selectedNodeIndices.filter(n => n !== nodeIdx);
    //     }
    //     if (this.globals.selectedNodeIndices.length === 2) {
    //         let duad = clockwiseForm(this.globals.selectedNodeIndices.map(x => this.currentPhi.map(x)).join(''));
    //         this.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
    //         this.psiOfSwap = new Permutation(this.globals.psi[duad]);

    //         requestAnimationFrame(this.animate.bind(this));
            
    //     } else {
    //         document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    //     }            
    // }
    
}

class PermutationComposer extends BaseComposer{
    constructor(data, config, target, extensions = {}) {
        let globals =  {
            selectedNodeIndices: [],
            psi: {
                '01': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2}, // (12)(36)(45)
                '02': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4}, // (13)(24)(56)
                '03': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1}, // (14)(26)(35)
                '04': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3}, // (15)(23)(46)
                '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0}, // (16)(25)(34)
                '12': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1}, // (15)(26)(43)
                '13': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3}, // (13)(25)(46)
                '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}, // (16)(24)(35)
                '15': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4}, // (14)(23)(56)
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0}, // (16)(23)(45)
                '24': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, // (14)(25)(36)
                '25': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3}, // (12)(35)(46)
                '34': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4}, // (12)(34)(56)
                '35': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2}, // (15)(24)(36)
                '45': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}  // (13)(26)(45)
            },
        }
        super(data, config, target, {
            globals: globals,   
            ...extensions
        });
        if (config.permutation) {
            this.currentPhi = config.permutation;
        }
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
        }, {padding: 15, color: '--color2'}, this.target, {composer: this});
        
    }
    
    interpolate(t) {
        this.components.forEach(component => component.interpolate(t));
    }

    interactionHandler(event, that) {
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
            let duad = this.globals.selectedNodeIndices.join('');
            let swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
            this.swap = swap;
            this.psiOfSwap = new Permutation(this.globals.psi[sortedForm(duad)]);

            requestAnimationFrame(this.animate.bind(this));
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }

    update() {
        // this.currentPhi = this.swap.compose(this.currentPhi);
        this.components.forEach(component => component.update())
        this.globals.selectedNodeIndices = [];
        this.target.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }
}

class LinkedPermutationComposer extends BaseComposer {
    constructor(data, config, target, extensions = {}) {
        let globals =  {
            selectedNodeIndices: [],
            selectedOutNodeIndices: [],
            currentPhi: new Permutation(config.n),
            currentPsi: new Permutation(config.n),
            psi: {
                '01': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3}, // (12) -> (AE)(BC)(DF), (AB) -> (15)(23)(46)
                '02': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1}, // (13) -> (AD)(BF)(CE), (AC) -> (14)(26)(35)
                '03': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4}, // (14) -> (AC)(BD)(EF), (AD) -> (13)(24)(56)
                '04': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2}, // (15) -> (AB)(CF)(DE), (AE) -> (12)(36)(45)
                '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0}, // (16) -> (AF)(BE)(CD), (AF) -> (16)(25)(34)
                '12': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4}, // (23) -> (AB)(CD)(EF), (BC) -> (12)(34)(56)
                '13': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, // (24) -> (AD)(BE)(CF), (BD) -> (14)(25)(36)
                '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}, // (25) -> (AF)(BD)(CE), (BE) -> (16)(24)(35)
                '15': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1}, // (26) -> (AC)(BF)(DE), (BF) -> (13)(26)(45)
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0}, // (34) -> (AF)(BC)(DE), (CD) -> (16)(23)(45)
                '24': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3}, // (35) -> (AC)(BE)(DF), (CE) -> (13)(25)(46)
                '25': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2}, // (36) -> (AE)(BD)(CF), (CF) -> (15)(24)(36)
                '34': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1}, // (45) -> (AE)(BF)(CD), (DE) -> (15)(26)(34)
                '35': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3}, // (46) -> (AB)(CE)(DF), (DF) -> (12)(35)(46)
                '45': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4}, // (56) -> (AD)(BC)(EF), (EF) -> (14)(23)(56)
            },

            // (12) -> (AE)(BF)(CD), (AE) -> (14)(23)(56), (BF) -> (13)(25)(46), (CD) -> (12)(34)(56)
            // (12) -> (14)(23)(56) (13)(25)(46) (12)(34)(56) = (1536)()
        }
        super(data, config, target, {
            globals: globals,
            ...extensions
        });
        if (config.phi) {
            this.currentPhi = config.phi;
        }
        if (config.psi) {
            this.currentPsi = config.psi; 
        }
    }

    createComponents() {
        let components = [
            new PermutationComponent({
                id: 'permutation-component',
                n: this.config.n,
                location: new Location('origin', new Coords(0, -17.5)),
                interactionHandler: this.interactionHandler.bind(this),
                globals: this.globals,
                
            }, {padding: 15, color: '--color3', input: true}, this.target, {composer: this}),
            new PermutationComponent({
                id: 'permutation-component',
                n: this.config.n,
                location: new Location('origin', new Coords(0, 7.5)),
                interactionHandler: this.interactionHandler.bind(this),
                globals: this.globals,
                labels: ['A', 'B', 'C', 'D', 'E', 'F'],
                
            }, {padding: 15, color: '--color4', output: true}, this.target, {composer: this})    
        ]
        return components;  
    }
    
    interpolate(t) {
        this.components[0].interpolate(t, this.swap);
        this.components[1].interpolate(t, this.psiOfSwap);
    }

    interactionHandler(event, that) {
        let nodeIdx = +that.id;
        let selectedNodeIndices = this.globals.selectedNodeIndices;
        let out = false;
        if (['A','B','C','D','E','F'].includes(that.label)) {
            out = true;
            selectedNodeIndices = this.globals.selectedOutNodeIndices;
        }
        let nodes = Array.from(that.target.getElementsByClassName('permutation-node')).filter(el => el.id == nodeIdx);
        if (selectedNodeIndices.includes(nodeIdx) || selectedNodeIndices.length < 2)
        {            
            nodes.forEach(n => n.classList.toggle('selected'));
        }        
        if (nodes[0].classList.contains('selected') && selectedNodeIndices.length < 2) {
            selectedNodeIndices.push(nodeIdx);
        } else {
            selectedNodeIndices = selectedNodeIndices.filter(n => n !== nodeIdx);
        }
        if (selectedNodeIndices.length === 2) {
            let duad = selectedNodeIndices.join('');
            if (out) {
                this.psiOfSwap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]}, labels=['A','B','C','D','E','F']);
                this.swap = new Permutation(this.globals.psi[sortedForm(duad)]);
            } else {
                this.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
                this.psiOfSwap = new Permutation(this.globals.psi[sortedForm(duad)], labels=['A','B','C','D','E','F']);
            }

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            that.target.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }

    update() {
        this.components[0].update(true);
        this.components[1].update(false);
        this.globals.selectedNodeIndices = [];
        this.globals.selectedOutNodeIndices = [];
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }
}

class PentadComposer extends BaseComposer {
    constructor(data, config, target, extendsions = {}) {
        let pentadLocations = [
            new Location('top left', new Coords(-30, -5)),
            new Location('top center', new Coords(0, -5)),
            new Location('top right', new Coords(30, -5)),
            new Location('bottom left', new Coords(-30, 30)),
            new Location('bottom center', new Coords(0, 30)),
            new Location('bottom right', new Coords(30, 30)),
            
        ]
        let globals =  {
            selectedNodeIndices: [],
            psi: {
                '05': {0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0},
                '15': {0: 2, 1: 5, 2: 0, 3: 4, 4: 3, 5: 1},
                '25': {0: 4, 1: 3, 2: 5, 3: 1, 4: 0, 5: 2},
                '35': {0: 1, 1: 0, 2: 4, 3: 5, 4: 2, 5: 3},
                '45': {0: 3, 1: 2, 2: 1, 3: 0, 4: 5, 5: 4},

                '01': {0: 4, 1: 2, 2: 1, 3: 5, 4: 0, 5: 3},
                '12': {0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4},
                '23': {0: 5, 1: 2, 2: 1, 3: 4, 4: 3, 5: 0},
                '34': {0: 4, 1: 5, 2: 3, 3: 2, 4: 0, 5: 1},
                '04': {0: 1, 1: 0, 2: 5, 3: 4, 4: 3, 5: 2},

                '02': {0: 3, 1: 5, 2: 4, 3: 0, 4: 2, 5: 1},
                '13': {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2},
                '24': {0: 2, 1: 4, 2: 0, 3: 5, 4: 1, 5: 3},
                '03': {0: 2, 1: 3, 2: 0, 3: 1, 4: 5, 5: 4},
                '14': {0: 5, 1: 3, 2: 4, 3: 1, 4: 2, 5: 0}
            }

        };
        super(data, config, target, {
            componentLocations: pentadLocations,
            subcomponentLocations: [...Array(6).keys()].map(i => new Location(i, new Coords(0, -10 + 5 * i))),
            currentPhi: new Permutation(6),
            currentPsi: new Permutation(6),
            globals: globals
        });
    }

    createComponents() {
        let pentads = []
        this.data.pentadData.forEach(pentad => {
            const location = this.componentLocations[pentad.id];
            const pentadData = {
                id: pentad.id,
                '5-cycle': pentad['5-cycle'],
                subcomponentLocations: this.subcomponentLocations,
                synthemes: pentad.synthemes,
                location: location,
                interactionHandler: this.interactionHandler.bind(this),
            };
            const pentadConfig = {};
            const pentadElement = new Pentad(pentadData, pentadConfig, this.target);
            pentads.push(pentadElement);
        });
        return pentads;
    }
    interactionHandler(event, that) {
        // let nodeIdx = this.currentPhi.inverse(that.group.getAttribute('id').split('-')[2]);
        let nodeIdx = +that.id;
        let nodes = Array.from(that.target.getElementsByClassName('syntheme')).filter(el => el.id == nodeIdx);
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
            let duad = sortedForm(this.globals.selectedNodeIndices.map(x => this.currentPhi.map(x)).join(''));
            this.swap = new Permutation({[duad[0]]: +duad[1], [duad[1]]: +duad[0]});
            this.psiOfSwap = new Permutation(this.globals.psi[duad]);

            requestAnimationFrame(this.animate.bind(this));
            
        } else {
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        }            
    }

    updateComponents() {
        this.components[0].update(this.currentPhi);
        this.components[1].update(this.currentPsi);
        this.globals.selectedNodeIndices = [];
        this.globals.selectedOutNodeIndices = [];
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }  
    
}
