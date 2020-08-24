import {
    WhereNode,
    LogicNode,
    ComparisonNode,
    BeginsWithNode,
    EqNode,
    GtNode,
    GeqNode,
    LtNode,
    LeqNode,
    ContainsNode,
    NeqNode,
    FieldRefNode,
    ValueNode,
} from './CamlTypes';

export type Where<T extends Record<string, any>> = (item: T) => boolean;
type LeftRightComparison = BeginsWithNode | ContainsNode | EqNode | GtNode | GeqNode | LtNode | LeqNode | NeqNode;

const valueGenerator = <T extends Record<string, any>>(node: FieldRefNode | ValueNode): ((item: T) => any) => {
    if (node.nodeType === 'FieldRef') {
        return (item: T) => item[node.Name];
    } else {
        return (item: T) => node.value;
    }
};

const leftRightGenerator = <T extends Record<string, any>>({
    nodeType,
    left,
    right,
}: LeftRightComparison): Where<T> => {
    const leftValue = valueGenerator(left);
    const rightValue = valueGenerator(right);

    if (nodeType === 'BeginsWith') {
        return (item: T) => {
            const l = leftValue(item);
            if (typeof l !== 'string') {
                throw new Error(`BeginsWith: Value (${l}) is not a string`);
            }
            return l.startsWith(rightValue(item));
        };
    } else if (nodeType === 'Contains') {
        return (item: T) => {
            const l = leftValue(item);
            if (typeof l !== 'string') {
                throw new Error(`BeginsWith: Value (${l}) is not a string`);
            }
            return l.indexOf(rightValue(item)) > 0;
        };
    } else if (nodeType === 'Eq') {
        return (item: T) => leftValue(item) == rightValue(item);
    } else if (nodeType === 'Geq') {
        return (item: T) => leftValue(item) >= rightValue(item);
    } else if (nodeType === 'Gt') {
        return (item: T) => leftValue(item) > rightValue(item);
    } else if (nodeType === 'Leq') {
        return (item: T) => leftValue(item) <= rightValue(item);
    } else if (nodeType === 'Lt') {
        return (item: T) => leftValue(item) < rightValue(item);
    } else if (nodeType === 'Neq') {
        return (item: T) => leftValue(item) != rightValue(item);
    }

    throw new Error(`Unsupported Node Type ${nodeType}`);
};

const comparisonGenerator = <T extends Record<string, any>>(node: ComparisonNode): Where<T> => {
    switch (node.nodeType) {
        case 'BeginsWith':
        case 'Contains':
        case 'Eq':
        case 'Geq':
        case 'Gt':
        case 'Leq':
        case 'Lt':
        case 'Neq':
            return leftRightGenerator(node);
        default:
            throw new Error(`Node type ${node.nodeType} is not supported yet.`);
    }
};

const logicGenerator = <T extends Record<string, any>>(node: LogicNode): Where<T> => {
    const left = generator(node.left);
    const right = generator(node.right);

    return (item: T) => {
        return node.nodeType === 'And' ? left(item) && right(item) : left(item) || right(item);
    };
};

export const generator = <T extends Record<string, any>>(node: LogicNode | ComparisonNode): Where<T> => {
    if (node.nodeType === 'And' || node.nodeType === 'Or') {
        return logicGenerator(node);
    } else {
        return comparisonGenerator(node);
    }
};

export const whereGenerator = <T extends Record<string, any>>(query: WhereNode): Where<T> => {
    return generator(query.body);
};
