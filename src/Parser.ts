import { ViewNode, QueryNode, WhereNode, LogicNode, ComparisonNode, FieldRefNode, ValueNode } from './CamlTypes';

const ensureChildCount = (node: Element, count: number): void => {
    if (node.children.length !== count) {
        for (let i = 0; i < node.children.length; i++) {
            console.log(`ERR ${i} - ${node.children[i].nodeName}`);
        }
        throw new Error(`A ${node.nodeName} element must have exactly ${count} child element${count > 1 ? 's' : ''}`);
    }
};

const ensureNodeName = (node: ChildNode, names: string[]): void => {
    if (names.indexOf(node.nodeName) < 0) {
        throw new Error(
            `Unexpected element ${node.nodeName}. Expected ${names.length > 1 ? 'one of ' : ''} ${names.join(', ')}.`
        );
    }
};

const getNodeAttribute = (node: Element, attribute: string): string => {
    const attr = node.attributes.getNamedItem(attribute);
    if (!attr) {
        throw new Error(`Element ${node.nodeName} is missing attribute ${attribute}`);
    }
    return attr.value;
};

const parseLogicalNode = (node: Element): LogicNode => {
    ensureNodeName(node, ['And', 'Or']);
    ensureChildCount(node, 2);

    return {
        nodeType: node.nodeName as 'And' | 'Or',
        left: parseBody(node.children[0]),
        right: parseBody(node.children[1]),
    };
};

const parseFieldRef = (node: Element): FieldRefNode => {
    ensureNodeName(node, ['FieldRef']);
    const Name = getNodeAttribute(node, 'Name');

    return { nodeType: 'FieldRef', Name };
};

const parseValue = (node: Element): ValueNode => {
    ensureNodeName(node, ['Value']);
    const Type = getNodeAttribute(node, 'Type');
    if (!node.textContent) {
        throw new Error('Value element is missing value content');
    }
    return { nodeType: 'Value', Type, value: node.textContent };
};

const parseOperand = (node: Element): FieldRefNode | ValueNode => {
    ensureNodeName(node, ['FieldRef', 'Value']);

    if (node.nodeName === 'FieldRef') {
        return parseFieldRef(node);
    } else if (node.nodeName === 'Value') {
        return parseValue(node);
    } else {
        throw new Error(`Expected a FieldRef or Value element. Instead got ${node.nodeName}`);
    }
};

const leftRightOperators = ['BeginsWith', 'Contains', 'Eq', 'Geq', 'Gt', 'Leq', 'Lt', 'Neq'];

const parseComparisonNode = (node: Element): ComparisonNode => {
    if (leftRightOperators.indexOf(node.nodeName) >= 0) {
        ensureChildCount(node, 2);
        return {
            nodeType: node.nodeName,
            left: parseOperand(node.children[0]),
            right: parseOperand(node.children[1]),
        } as ComparisonNode;
    } else if (node.nodeName === 'IsNull' || node.nodeName === 'IsNotNull') {
        ensureChildCount(node, 1);
        return { nodeType: node.nodeName, value: parseOperand(node.children[0]) } as ComparisonNode;
    } else {
        throw new Error(`Unexpected element ${node.nodeName}`);
    }
};

const parseBody = (node: Element): LogicNode | ComparisonNode => {
    if (node.nodeName === 'And' || node.nodeName === 'Or') {
        return parseLogicalNode(node);
    } else {
        return parseComparisonNode(node);
    }
};

const parseWhere = (node: Element): WhereNode => {
    ensureChildCount(node, 1);
    ensureNodeName(node, ['Where']);

    return {
        nodeType: 'Where',
        body: parseBody(node.children[0]),
    };
};

const parseQuery = (node: Element): QueryNode => {
    ensureNodeName(node, ['Query']);
    const result: QueryNode = { nodeType: 'Query' as const };
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        ensureNodeName(child, ['Where', 'OrderBy', 'GroupBy']);
        if (child.nodeName === 'Where') {
            result.where = parseWhere(child);
        } else if (child.nodeName === 'OrderBy') {
            //result.orderBy = parseWhere(child);
        } else if (child.nodeName === 'GroupBy') {
            //result.orderBy = parseWhere(child);
        }
    }
    return result;
};

export const parseCamlQuery = (query: string): ViewNode | QueryNode => {
    const domParser = new window.DOMParser();
    const doc = domParser.parseFromString(query, 'text/xml');

    if (doc.children.length === 0 || doc.children[0] === null) {
        throw new Error(`Failed to parse XML query ${query}.`);
    }

    const firstChild = doc.children[0];
    if (firstChild.nodeName === 'View') {
        if (firstChild.children.length === 0 || firstChild.children[0] === null) {
            throw new Error(`Failed to parse XML query - View element must contain a Query element.`);
        }
        return { nodeType: 'View', query: parseQuery(firstChild.children[0]) };
    } else if (firstChild.nodeName === 'Query') {
        return parseQuery(firstChild);
    } else {
        throw new Error(`Invalid Caml XML root node "${firstChild.nodeName}". Only View or Query are supported.`);
    }
};
