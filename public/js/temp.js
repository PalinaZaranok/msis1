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
export function getParseTree(code){
    return parser.parse(code);
}


export function extractHalsteadTokens(node) {
    const operators = [];
    const operands = [];
    const functionDefinitions = new Set();
    const processedNodes = new Set();

    function traverse(node) {
        if (processedNodes.has(node)) return;
        processedNodes.add(node);
        console.log(node.type);
        switch (node.type) {
            case 'function_definition':
                handleFunctionDefinition(node);
                break;

            case 'val_definition':
                handleValDefinition(node);
                return;

            case 'if_expression':
                handleIfExpression(node);
                break;

            case 'call_expression':
                operators.push('()');
                break;

            case 'operator_identifier':
                operators.push(node.text);
                break;

            case 'infix_expression':
                break;

            case '<-':
            case 'identifier':
                if (!functionDefinitions.has(node.text)) {
                    operands.push(node.text);
                }
                break;


            case 'integer_literal':
            case 'string_literal':
            case 'boolean_literal':
                operands.push(node.text);
                break;

            case 'type_identifier':
                operands.push(node.text);
                break;

            case 'match_expression':
                handleMatchExpression(node);
                break;
            case 'for_expression':
                handleForExpression(node);
                break;

            case 'interpolated_string_expression':
                operands.push(node.text);
                break;
            case 'guard':
                handleGuard(node);
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
            processedNodes.add(funcName);
        }

        const parameters = node.children.find(child => child.type === 'parameters');
        if (parameters) {
            operators.push('()');
            processedNodes.add(parameters);

            parameters.children.forEach(child => {
                if (child.type === 'parameter') {
                    handleParameter(child);
                }
            });
        }

        const returnType = node.children.find(child =>
            child.type === 'type_identifier' &&
            child.previousSibling &&
            child.previousSibling.type === ':'
        );
        if (returnType) {
            operators.push(':');
            operands.push(returnType.text);
            processedNodes.add(returnType);
        }
    }

    function handleIfExpression(node) {
        let hasElse = false;

        let i = 0;
        while(i < node.childCount && !hasElse) {
            const child = node.children[i];
            if (child.type === 'else') {
                hasElse = true;
            }
            i++;
        }

        if (hasElse) {
            operators.push('if-else');
        } else {
            operators.push('if');
        }

        processedNodes.add(node);

        const condition = node.children.find(child => child.type === 'parenthesized_expression');
        if (condition) {
            traverse(condition);
        }

        const consequence = node.children.find(child =>
            child.type !== 'parenthesized_expression' &&
            child.type !== 'else' &&
            child.type !== 'if'
        );
        if (consequence) {
            traverse(consequence);
        }

        const elseClause = node.children.find(child => child.type === 'else');
        if (elseClause) {
            const hasNestedIf = elseClause.children.some(child => child.type === 'if_expression');
            if (!hasNestedIf) {
                traverse(elseClause);
            }
        }
    }

    function handleValDefinition(node) {
        operators.push('val');

        const varName = node.children.find(child =>
            child.type === 'identifier' &&
            child.previousSibling &&
            child.previousSibling.type === 'val'
        );

        if (varName) {
            operands.push(varName.text);
            processedNodes.add(varName);
        }

        const assignmentOp = node.children.find(child => child.type === '=');
        if (assignmentOp) {
            operators.push('=');
            processedNodes.add(assignmentOp);
        }

        for (let i = 0; i < node.childCount; i++) {
            const child = node.children[i];
            if (child.type !== 'val' && child !== varName && child !== assignmentOp) {
                traverse(child);
            }
        }
    }

    function handleParameter(node) {
        const paramName = node.children.find(child => child.type === 'identifier');
        if (paramName) {
            operands.push(paramName.text);
            processedNodes.add(paramName);
        }

        const colon = node.children.find(child => child.type === ':');
        if (colon) {
            operators.push(':');
            processedNodes.add(colon);
        }

        const type = node.children.find(child =>
            child.type === 'type_identifier' || child.type === 'generic_type'
        );
        if (type) {
            operands.push(type.text);
            processedNodes.add(type);
        }
    }
    function handleMatchExpression(node) {
        let operator = 'match';

        processedNodes.add(node);

        const matchExpression = node.children.find(child =>
            child.type === 'identifier' ||
            child.type === 'parenthesized_expression'
        );
        if (matchExpression) {
            traverse(matchExpression);
        }

        const caseBlock = node.children.find(child => child.type === 'case_block');
        if (caseBlock) {
            operator += '-case';
            operators.push(operator);
            for (let i = 0; i < caseBlock.childCount; i++) {
                const child = caseBlock.children[i];
                if (child.type === 'case_clause') {
                    handleCaseClause(child);
                }
            }
        }
    }

    function handleCaseClause(node) {
        operators.push('=>');

        processedNodes.add(node);

        const pattern = node.children.find(child =>
            child.type === 'string' ||
            child.type === 'identifier' ||
            child.type === 'wildcard' ||
            child.type === 'number'
        );

        if (pattern) {
            if (pattern.type === 'wildcard') {
                operands.push('_');
            } else {
                operands.push(pattern.text);
            }
            processedNodes.add(pattern);
        }

        const guard = node.children.find(child => child.type === 'guard');
        if (guard) {
            handleGuard(guard);
        }

        for (let i = 0; i < node.childCount; i++) {
            const child = node.children[i];
            if (child !== pattern && child !== guard && child.type !== '=>') {
                traverse(child);
            }
        }
    }

    function handleGuard(node) {
        operators.push('if');

        processedNodes.add(node);

        for (let i = 0; i < node.childCount; i++) {
            const child = node.children[i];
            if (child.type !== 'if') {
                traverse(child);
            }
        }
    }
    function handleForExpression(node) {
        operators.push('for');

        processedNodes.add(node);

        const enumerators = node.children.find(child => child.type === 'enumerators');
        if (enumerators) {
            handleEnumerators(enumerators);
        }

        const yieldNode = node.children.find(child => child.type === 'yield');
        if (yieldNode) {
            operators.push('yield');
            processedNodes.add(yieldNode);
        }

        for (let i = 0; i < node.childCount; i++) {
            const child = node.children[i];
            if (child !== enumerators && child !== yieldNode) {
                traverse(child);
            }
        }
    }

    function handleEnumerators(node) {
        for (let i = 0; i < node.childCount; i++) {
            const enumeratorNode = node.children[i];
            for(let j = 0; j < enumeratorNode.childCount; j++) {
                const enumeratorChild =enumeratorNode.children[j];
                traverse(enumeratorChild);
            }
        }
    }

    function handleGenerator(node) {
        operators.push('<-');

        processedNodes.add(node);

        const pattern = node.children.find(child =>
            child.type === 'identifier' ||
            child.type === 'pattern'
        );
        if (pattern) {
            operands.push(pattern.text);
            processedNodes.add(pattern);
        }

        const expression = node.children.find(child =>
            child.type === 'identifier' ||
            child.type === 'call_expression' ||
            child.type === 'parenthesized_expression'
        );
        if (expression) {
            traverse(expression);
        }
    }

    traverse(node);
    return { operators, operands };
}


const { operators, operands } = extractHalsteadTokens(tree.rootNode);
console.log("Operators:", operators);
console.log("Operands:", operands);