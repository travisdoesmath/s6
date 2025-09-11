const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

const {
    createElement,
    easeInOutCubic, 
    easeInOutSine,
    permutationToCycle,
    stringToPermutation
} = require('./functions.js');

describe('createElement', () => {
    test('creates SVG element with attributes', () => {
        const parent = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const element = createElement('circle', {
            cx: '10',
            cy: '20',
            r: '5',
            parent: parent
        });

        expect(element.tagName.toLowerCase()).toBe('circle');
        expect(element.getAttribute('cx')).toBe('10');
        expect(element.getAttribute('cy')).toBe('20');
        expect(element.getAttribute('r')).toBe('5');
        expect(element.parentNode).toBe(parent);
    });
});

describe('easeInOutCubic', () => {
    test('returns correct values', () => {
        expect(easeInOutCubic(0)).toBe(0);
        expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625);
        expect(easeInOutCubic(0.5)).toBe(0.5);
        expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375);
        expect(easeInOutCubic(1)).toBe(1);
    });
});

describe('easeInOutSine', () => {
    test('returns correct values', () => {
        expect(easeInOutSine(0)).toBe(0);
        expect(easeInOutSine(0.25)).toBeCloseTo(0.1464);
        expect(easeInOutSine(0.5)).toBe(0.5);
        expect(easeInOutSine(0.75)).toBeCloseTo(0.8536);
        expect(easeInOutSine(1)).toBe(1);
    });
});

describe('permutationToCycle', () => {
    test('converts permutation to cycle notation', () => {
        expect(permutationToCycle({0: 1, 1: 2, 2: 0})).toBe('(1 2 3)');
        expect(permutationToCycle({0: 1, 1: 0, 2: 2})).toBe('(1 2)');
        expect(permutationToCycle({0: 0, 1: 1, 2: 2})).toBe('');
    });
});

describe('stringToPermutation', () => {
    test('converts string to permutation object', () => {
        expect(stringToPermutation('213')).toEqual({0: 1, 1: 0, 2: 2});
        expect(stringToPermutation('123')).toEqual({0: 0, 1: 1, 2: 2});
        expect(stringToPermutation('321')).toEqual({0: 2, 1: 1, 2: 0});
    });
});