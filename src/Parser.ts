import {
    ViewNode,
    QueryNode,
    WhereNode,
    LogicNode,
    ComparisonNode,
    FieldRefNode,
    ValueNode,
    MethodNode,
    FilterNode,
    ViewFieldsNode,
} from './CamlTypes';

const ensureExactChildCount = (node: Element, count: number): void => {
    if (node.children.length !== count) {
        throw new Error(`A ${node.nodeName} element must have exactly ${count} child element${count > 1 ? 's' : ''}`);
    }
};

const ensureMinimumChildCount = (node: Element, count: number): void => {
    if (node.children.length < count) {
        throw new Error(`A ${node.nodeName} element must have at least ${count} child element${count > 1 ? 's' : ''}`);
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
    ensureExactChildCount(node, 2);

    return {
        nodeType: node.nodeName as 'And' | 'Or',
        left: parseBody(node.children[0]),
        right: parseBody(node.children[1]),
    };
};

const parseFieldRef = (node: Element): FieldRefNode => {
    ensureNodeName(node, ['FieldRef']);
    const Name = getNodeAttribute(node, 'Name');
    const result: FieldRefNode = { nodeType: 'FieldRef', Name };

    const attr = node.attributes.getNamedItem('LookupId');
    if (attr) {
        result.LookupId = attr.value === 'TRUE';
    }

    return result;
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
        ensureExactChildCount(node, 2);
        return {
            nodeType: node.nodeName,
            left: parseOperand(node.children[0]),
            right: parseOperand(node.children[1]),
        } as ComparisonNode;
    } else if (node.nodeName === 'IsNull' || node.nodeName === 'IsNotNull') {
        ensureExactChildCount(node, 1);
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
    ensureExactChildCount(node, 1);
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

const parseFilter = (node: Element): FilterNode => {
    ensureExactChildCount(node, 0);
    ensureNodeName(node, ['Filter']);
    const name = getNodeAttribute(node, 'Name');
    const value = getNodeAttribute(node, 'Value');

    return {
        nodeType: 'Filter',
        Name: name,
        Value: value,
    };
};

const parseMethod = (node: Element): MethodNode => {
    ensureNodeName(node, ['Method']);
    const name = getNodeAttribute(node, 'Name');
    const result = {
        nodeType: 'Method',
        Name: name,
    } as MethodNode;

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        ensureNodeName(child, ['Filter']);
        if (result.filters === undefined) {
            result.filters = [];
        }
        result.filters.push(parseFilter(child));
    }

    return result;
};

const parseViewFields = (node: Element): ViewFieldsNode => {
    ensureMinimumChildCount(node, 1);
    ensureNodeName(node, ['ViewFields']);
    const result = {
        nodeType: 'ViewFields',
        fieldRefs: [],
    } as ViewFieldsNode;

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        ensureNodeName(child, ['FieldRef']);
        result.fieldRefs.push(parseFieldRef(child));
    }

    return result;
};

const parseView = (node: Element): ViewNode => {
    ensureNodeName(node, ['View']);
    ensureMinimumChildCount(node, 1);
    const result: ViewNode = { nodeType: 'View' as const };
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        ensureNodeName(child, ['Query', 'Method', 'ViewFields']);
        if (child.nodeName === 'Query') {
            if (result.query) {
                throw new Error('A View element can contain at most one Query element');
            }
            result.query = parseQuery(child);
        } else if (child.nodeName === 'Method') {
            if (result.method) {
                throw new Error('A View element can contain at most one Method element');
            }
            result.method = parseMethod(child);
        } else if (child.nodeName === 'ViewFields') {
            if (result.viewFields) {
                throw new Error('A View element can contain at most one ViewFields element');
            }
            result.viewFields = parseViewFields(child);
        }
    }
    return result;
};

// if (firstChild.children.length === 0 || firstChild.children[0] === null) {
//     throw new Error(`Failed to parse XML query - View element must contain a Query element.`);
// }
// return { nodeType: 'View', query: parseQuery(firstChild.children[0]) };

export const parseCamlQuery = (query: string): ViewNode | QueryNode => {
    const domParser = new window.DOMParser();
    const doc = domParser.parseFromString(query, 'text/xml');

    if (doc.children.length === 0 || doc.children[0] === null) {
        throw new Error(`Failed to parse XML query ${query}.`);
    }

    const firstChild = doc.children[0];
    if (firstChild.nodeName === 'View') {
        return parseView(firstChild);
    } else if (firstChild.nodeName === 'Query') {
        return parseQuery(firstChild);
    } else {
        throw new Error(`Invalid Caml XML root node "${firstChild.nodeName}". Only View or Query are supported.`);
    }
};
