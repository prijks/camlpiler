import { QueryNode, ViewNode } from './CamlTypes';
import { parseCamlQuery } from './Parser';
import { whereGenerator } from './WhereGenerator';

export class CamlTester {
    private today: Date;
    private userId: number;

    public constructor(options: { today?: Date; userId?: number }) {
        this.today = options.today ?? new Date();
        this.userId = options.userId ?? 1;
    }

    public testQueryXml<T extends Record<string, any>>(testItems: T[], queryXml: string): T[] {
        const query = parseCamlQuery(queryXml);
        return this.testQuery(testItems, query);
    }

    public testQuery<T extends Record<string, any>>(testItems: T[], query: QueryNode | ViewNode): T[] {
        const root = query.nodeType === 'Query' ? query : query.query;

        let result = testItems;
        if (root.where) {
            const where = whereGenerator(root.where);
            result = testItems.filter((i) => where(i));
        }

        return result;
    }
}
