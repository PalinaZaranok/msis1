import Parser from "tree-sitter";
import Scala from "tree-sitter-scala";

const parser = new Parser();
parser.setLanguage(Scala);

const code = `
    // Example Scala code
    object HelloWorld {
      def main(args: Array[String]): Unit = {
        val greeting = "Hello, World!"
        println(greeting)
    
        // Calculate factorial
        val number = 5
        val result = factorial(number)
        println(s"Factorial of $number is: $result")
      }
    
      def factorial(n: Int): Int = {
        if (n <= 1) 1
        else n * factorial(n - 1)
      }
    }
`;

const tree = parser.parse(code);

export function extractHalsteadTokens(node) {
    const operators = [];
    const operands = [];
    const functionDefinitions = new Set();

    function traverse(node) {
        switch (node.type) {
            case 'function_definition':
                handleFunctionDefinition(node);
                break;

            case 'if_expression':
                operators.push('if');
                break;
            case 'match_expression':
                operators.push('match');
                break;
            case 'do_expression':
                operators.push('do-while');
                break;

            case 'call_expression':
                operators.push('()');
                break;

            case 'operator_identifier':
                operators.push(node.text);
                break;
            case '=':
                operators.push('=');
                break;
            case ':':
                operators.push(':');
                break;
            case 'val':
                operators.push('val');
                break;
            case 'def':
                operators.push('def');
                break;

            case 'identifier':
                if (!functionDefinitions.has(node.text)) {
                    operands.push(node.text);
                }
                break;
            case 'integer_literal':
            case 'string_literal':
                operands.push(node.text);
                break;
            case 'type_identifier':
                operands.push(node.text);
                break;
            case 'parameter':
                const paramName = node.children.find(child => child.type === 'identifier');
                if (paramName) {
                    operands.push(paramName.text);
                }
                break;
        }

        for (let i = 0; i < node.childCount; i++) {
            traverse(node.children[i]);
        }
    }

    function handleFunctionDefinition(node) {
        operators.push('def');

        const funcName = node.children.find(child =>
            child.type === 'identifier' &&
            child.previousSibling &&
            child.previousSibling.type === 'def'
        );

        if (funcName) {
            operators.push(funcName.text);
            functionDefinitions.add(funcName.text);
        }

        const parameters = node.children.find(child => child.type === 'parameters');
        if (parameters) {
            operators.push('()');

            const colons = parameters.children.filter(child => child.type === ':');
            colons.forEach(() => operators.push(':'));

            const typeIds = parameters.children.filter(child => child.type === 'type_identifier');
            typeIds.forEach(typeId => operands.push(typeId.text));
        }

        const returnType = node.children.find(child =>
            child.type === 'type_identifier' &&
            child.previousSibling &&
            child.previousSibling.type === ':'
        );
        if (returnType) {
            operators.push(':');
            operands.push(returnType.text);
        }
    }

    traverse(node);
    return { operators, operands };
}

const { operators, operands } = extractHalsteadTokens(tree.rootNode);
console.log("Operators:", operators);
console.log("Operands:", operands);