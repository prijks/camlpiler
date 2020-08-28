import { QueryNode, ViewNode } from './CamlTypes';
import { parseCamlQuery } from './Parser';
import { whereGenerator } from './WhereGenerator';
import { ListDefinition } from './ListDefinition';

export class CamlTester<T = any> {
    private today: Date;
    private userId: number;
    private listDefinition?: ListDefinition;

    public constructor(options: { today?: Date; userId?: number; listDefinition?: ListDefinition }) {
        this.today = options.today ?? new Date();
        this.userId = options.userId ?? 1;
        this.listDefinition = options.listDefinition;
    }

    public testQueryXml(testItems: T[], queryXml: string): T[] {
        const query = parseCamlQuery(queryXml);
        return this.testQuery(testItems, query);
    }

    public testQuery(testItems: T[], rootNode: QueryNode | ViewNode): T[] {
        const query = rootNode.nodeType === 'Query' ? rootNode : rootNode.query;

        let result = testItems;
        if (rootNode.nodeType === 'View' && rootNode.method) {
            if (this.listDefinition === undefined || this.listDefinition.external === false) {
                throw new Error(
                    'View contains a Method element, but no list definition for an external list was provided.'
                );
            }
            const methodNode = rootNode.method;
            const method = this.listDefinition.methods.find((m) => m.name === methodNode.Name);
            if (method === undefined) {
                throw new Error(`No method definition provided for method ${methodNode.Name}.`);
            }

            const filters = methodNode.filters.map((f) => ({ name: f.Name, value: f.Value }));
            result = method.method(result, filters);
        }

        if (query && query.where) {
            const where = whereGenerator(query.where);
            result = result.filter((i) => where(i));
        }

        return result;
    }
}
