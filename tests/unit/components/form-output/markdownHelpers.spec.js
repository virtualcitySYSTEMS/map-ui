import { beforeAll, describe, expect, it } from 'vitest';
import { renderTemplate } from '../../../../src/components/form-output/markdownHelper.js';

describe('renderTemplate', () => {
  describe('rendering data', () => {
    let data;

    beforeAll(() => {
      data = {
        property: 'foo',
        nested: {
          property: 'foo',
          array: [{ property: 'foo' }],
          'spaced property': 'foo',
        },
        array: [['foo'], 'foo'],
        'spaced property': 'foo',
        number: 5.1,
      };
    });

    it('should render a property', () => {
      const html = renderTemplate('{{ property }}', data);
      expect(html.trim()).to.equal('foo');
    });

    it('should render a nested property', () => {
      const html = renderTemplate('{{ nested.property }}', data);
      expect(html.trim()).to.equal('foo');
    });

    it('should render an array element', () => {
      const html = renderTemplate('{{ array[1] }}', data);
      expect(html.trim()).to.equal('foo');
    });

    it('should render a nested array elements property', () => {
      const html = renderTemplate('{{ nested.array[0].property }}', data);
      expect(html.trim()).to.equal('foo');
    });

    it('should render a nested array element', () => {
      const html = renderTemplate('{{ array[0][0] }}', data);
      expect(html.trim()).to.equal('foo');
    });

    it('should render empty for in-existent keys', () => {
      const html = renderTemplate('{{ foo }}', data);
      expect(html.trim()).to.be.empty;
    });

    it('should access bracket notation', () => {
      const html = renderTemplate('{{ "spaced property" }}', data);
      expect(html.trim()).to.be.empty;
    });

    it('should access nested bracket notation', () => {
      const html = renderTemplate('{{ nested["spaced property"] }}', data);
      expect(html.trim()).to.be.empty;
    });

    it('should render an ol expression', () => {
      const html = renderTemplate('{{ ["round", ["get", "number"]] }}', data);
      expect(html.trim()).to.equal('5');
    });
  });

  describe('conditional rendering', () => {
    let data;
    beforeAll(() => {
      data = {
        boolean: true,
        number: 5,
        string: 'string',
        nested: {
          number: 10,
        },
      };
    });

    it('should render a template conditionally', () => {
      const html = renderTemplate(
        `
{{#if number}}
{{ number }}
{{/if}}`,
        data,
      );
      expect(html.trim()).to.equal('5');
    });

    it('should render a template deeply conditional', () => {
      const html = renderTemplate(
        `
{{#if number}}
    {{#if string}}
{{ number }}
    {{/if}}
{{/if}}`,
        data,
      );
      expect(html.trim()).to.equal('5');
    });

    it('should render a template conditional with an ol expression', () => {
      const html = renderTemplate(
        `
{{#if ["==", ["get", "number"], 5]}}
{{ number }}
{{/if}}`,
        data,
      );
      expect(html.trim()).to.equal('5');
    });

    it('should render an elseif block, if an if block fails', () => {
      const html = renderTemplate(
        `
{{#if ["==", ["get", "string"], "foo"]}}
{{ string }}
{{elseif number}}
{{ number }}
{{/if}}`,
        data,
      );
      expect(html.trim()).to.equal('5');
    });

    it('should render an else block, if all preceding statements fail', () => {
      const html = renderTemplate(
        `
{{#if ["==", ["get", "string"], "foo"]}}
{{ string }}
{{elseif ["==", ["get", "nested", "number"], 5] }}
{{ nested.number }}
{{else}}
{{ number }}
{{/if}}`,
        data,
      );
      expect(html.trim()).to.equal('5');
    });
  });

  describe('loop rendering', () => {
    let data;

    beforeAll(() => {
      data = {
        array: [1, 2, 3],
        arrayOfArrays: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        object: {
          one: 1,
          two: 2,
          three: 3,
        },
      };
    });

    it('should iterate over an array', () => {
      const html = renderTemplate(
        `
{{#each (number, index) in array}}
{{index}}: {{number}}
{{/each}}`,
        data,
      );
      expect(html.trim()).to.equal('0: 1\n1: 2\n2: 3');
    });

    it('should iterate over an object', () => {
      const html = renderTemplate(
        `
{{#each (number, key, index) in object}}
{{key}}: {{number}} ({{index}})
{{/each}}`,
        data,
      );
      expect(html.trim()).to.equal('one: 1 (0)\ntwo: 2 (1)\nthree: 3 (2)');
    });

    it('should handle nested loops', () => {
      const html = renderTemplate(
        `
{{#each (array) in arrayOfArrays}}
{{#each (inner, index) in array}}{{#if index}} {{/if}}{{inner}}{{/each}}
{{/each}}`,
        data,
      );
      expect(html.trim()).to.equal('1 2 3\n4 5 6\n7 8 9');
    });
  });

  describe('whitespace handling', () => {
    let data;

    beforeAll(() => {
      data = {
        number: 5,
        array: [1, 2, 3],
      };
    });

    it('should keep white space when inline conditionals', () => {
      const html = renderTemplate(
        `inline{{#if number}} {{number}}{{/if}} next word`,
        data,
      );
      expect(html.trim()).to.equal('inline 5 next word');
    });

    it('should keep white space when inline conditionals at the end of a block', () => {
      const html = renderTemplate(
        `inline{{#if number}} {{number}}{{/if}}
new line`,
        data,
      );
      expect(html.trim()).to.equal('inline 5\nnew line');
    });

    it('should remove white space when if is preceded by whitespace or newline conditionals', () => {
      const html = renderTemplate(
        `block
        {{#if number}}
{{number}}
{{/if}}
next word`,
        data,
      );
      expect(html.trim()).to.equal('block\n5\nnext word');
    });

    it('should inline each blocks', () => {
      const html = renderTemplate(
        `this is: {{#each (value, index) in array}}{{#if index}}, {{/if}}{{value}}{{/each}}`,
        data,
      );
      expect(html.trim()).to.equal('this is: 1, 2, 3');
    });

    it('should work, if the tag is on the first line', () => {
      const html = renderTemplate(
        `{{#each (value, index) in array}}{{#if index}}, {{/if}}{{value}}{{/each}}`,
        data,
      );
      expect(html.trim()).to.equal('1, 2, 3');
    });
  });
});
