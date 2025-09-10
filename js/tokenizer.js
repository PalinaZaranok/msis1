class ScalaTokenizer {
    constructor() {
        this.REGEX_PATTERNS = {
          SINGLE_LINE_COMMENT: /\/\/.*$/gm,
          MULTI_LINE_COMMENT: /\/\*[\s\S]*?\*\//g,
          DOUBLE_QUOTE_STRING: /"(?:[^"\\]|\\.)*"/g,
          SINGLE_QUOTE_STRING: /'(?:[^'\\]|\\.)*'/g,
          NUMERIC_LITERAL: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?\b/g,
          TOKEN_SPLIT: /([a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|==|!=|<=|>=|&&|\|\||[+\-*/%=<>&|!(){}\[\];.,:#@])/g,
          MULTI_WORD_OPERATORS: /\b(if\s*else|for\s*yield|try\s*catch|try\s*finally|try\s*catch\s*finally|match\s*case|while\s*do|do\s*while|class\s*extends|trait\s*extends|object\s*extends|var\s*:|val\s*:|def\s*=)\b/g,
          PARENTHESES_PAIR: /\([^()]*\)/g,
          BRACES_PAIR: /\{[^{}]*}/g
        }
        this.REPLACEMENT_TEMPLATES = {
          STRING_LITERAL: 'STRING_LITERAL_',
          CHAR_LITERAL:   'CHAR_LITERAL_',
          NUMBER_LITERAL: 'NUMBER_LITERAL_'
        };

        this.SYMBOLIC_OPERATORS = [
          '=', '=>', '<-', '->', '<:', '>:', '#', '@',
          '+', '-', '*', '/', '%', ':', '::', ':::',
          '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!',
          '&', '|', '^', '~', '<<', '>>', '>>>',
          '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=',
          '++', '--',
          '.', ',', ';'
        ];

        this.SPECIAL_OPERATORS = ['PAREN_PAIR', 'BRACE_PAIR'];

        this.KEYWORD_OPERATORS = [
            'if else', 'for yield', 'try catch', 'try finally', 'try catch finally',
            'match case', 'while do', 'do while', 'class extends', 'trait extends',
            'object extends'
        ];
      }

    tokenize(code){
        const preprocessed = this.preprocessCode(code);

        const tokens = this.splitTokens(preprocessed.code);

        return this.classifyTokens(tokens, preprocessed.literals);
    }

    preprocessCode(code) {
        let processed = code;
        const literals = {
          strings: [],
          numbers: [],
          characters: [],
          multiWordOperators: []
        };

        processed = processed.replace(
            this.REGEX_PATTERNS.SINGLE_LINE_COMMENT,
            ''
        );

        processed = processed.replace(
            this.REGEX_PATTERNS.MULTI_LINE_COMMENT,
            ''
        );

        processed = processed.replace(
            this.REGEX_PATTERNS.DOUBLE_QUOTE_STRING,
            (match) => {
              literals.strings.push(match);
              return `${this.REPLACEMENT_TEMPLATES.STRING_LITERAL}${literals.strings.length - 1}`;
            }
        );

        processed = processed.replace(
            this.REGEX_PATTERNS.SINGLE_QUOTE_STRING,
            (match) => {
              literals.characters.push(match);
              return `${this.REPLACEMENT_TEMPLATES.CHAR_LITERAL}${literals.characters.length - 1}`;
            }
        );

        processed = processed.replace(
            this.REGEX_PATTERNS.NUMERIC_LITERAL,
            (match) => {
              literals.numbers.push(match);
              return `${this.REPLACEMENT_TEMPLATES.NUMBER_LITERAL}${literals.numbers.length - 1}`;
            }
        );

      processed = processed.replace(
          this.REGEX_PATTERNS.MULTI_WORD_OPERATORS,
          (match) => {
            literals.multiWordOperators.push(match);
            return `MULTI_WORD_OP_${literals.multiWordOperators.length - 1}`;
          }
      );

      processed = processed.replace(
          this.REGEX_PATTERNS.PARENTHESES_PAIR,
          (match) => {
            return `PAREN_PAIR`;
          }
      );

      processed = processed.replace(
          this.REGEX_PATTERNS.BRACES_PAIR,
          (match) => {
            return `BRACE_PAIR`;
          }
      );

      return {
        code: processed,
        literals: literals
      };
    }

    splitTokens(code) {
        const tokens = [];
        let match;

        const tokenRegex = new RegExp(this.REGEX_PATTERNS.TOKEN_SPLIT.source, 'g');

        while ((match = tokenRegex.exec(code)) !== null) {
          if (match[0].trim() !== '') {
            tokens.push(match[0]);
          }
        }

        return tokens;
    }

    classifyTokens(tokens, literals) {
        const operators = [];
        const operands = [];

        for (const token of tokens) {
            if (token === 'PAREN_PAIR' || token === 'BRACE_PAIR') {
                operators.push(token);
            } else if (token.startsWith('MULTI_WORD_OP_')) {
                const index = parseInt(token.replace('MULTI_WORD_OP_', ''));
                operators.push(literals.multiWordOperators[index]);
            }else if (this.isOperator(token)) {
              operators.push(token);
            } else if (token.startsWith(this.REPLACEMENT_TEMPLATES.STRING_LITERAL)) {
              const index = parseInt(token.replace(this.REPLACEMENT_TEMPLATES.STRING_LITERAL, ''));
              operands.push(literals.strings[index]);
            } else if (token.startsWith(this.REPLACEMENT_TEMPLATES.CHAR_LITERAL)) {
              const index = parseInt(token.replace(this.REPLACEMENT_TEMPLATES.CHAR_LITERAL, ''));
              operands.push(literals.characters[index]);
            } else if (token.startsWith(this.REPLACEMENT_TEMPLATES.NUMBER_LITERAL)) {
              const index = parseInt(token.replace(this.REPLACEMENT_TEMPLATES.NUMBER_LITERAL, ''));
              operands.push(literals.numbers[index]);
            } else {
              operands.push(token);
            }
        }

        return {
          operators: operators,
          operands: operands
        };
    }

    isOperator(token) {
        return this.KEYWORD_OPERATORS.includes(token)  ||
               this.SYMBOLIC_OPERATORS.includes(token) ||
               this.SPECIAL_OPERATORS.includes(token);
    }
}
