interface InternalListDefinition {
    external: false;
    name: string;
}

interface ExternalListDefinition {
    external: true;
    name: string;
    methods: Array<{ name: string; method: (items: any[], filters: Array<{ name: string; value: string }>) => any[] }>;
}

export type ListDefinition = InternalListDefinition | ExternalListDefinition;
