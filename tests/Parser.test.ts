import { parseCamlQuery } from '../src/Parser';

describe('Error Handling', () => {
    test('Throws on empty query', () => {
        expect(() => parseCamlQuery('')).toThrow();
    });

    test("Throws when root isn't View or Query", () => {
        expect(() => parseCamlQuery('<valid><xml /></valid>')).toThrow();
    });

    test('Throws on malformed XML', () => {
        expect(() => parseCamlQuery('<View><Query></View>')).toThrow();
    });

    test('Throws on mixed quote types', () => {
        expect(() =>
            parseCamlQuery(
                `<View><Query><Where><Eq><FieldRef Name="Test' /><Value Type="Text">test</Value></Eq></Where></Query></View>`
            )
        ).toThrow();
    });
});

describe('Basic queries', () => {
    test('Can parse an empty view query', () => {
        expect(parseCamlQuery('<View><Query /></View>')).toEqual({ nodeType: 'View', query: { nodeType: 'Query' } });
        expect(parseCamlQuery('<Query />')).toEqual({ nodeType: 'Query' });
    });

    test('Can parse a basic where query', () => {
        expect(
            parseCamlQuery(
                '<View><Query><Where><Eq><FieldRef Name="Test" /><Value Type="Text">test</Value></Eq></Where></Query></View>'
            )
        ).toEqual({
            nodeType: 'View',
            query: {
                nodeType: 'Query',
                where: {
                    nodeType: 'Where',
                    body: {
                        left: {
                            nodeType: 'FieldRef',
                            Name: 'Test',
                        },
                        nodeType: 'Eq',
                        right: {
                            nodeType: 'Value',
                            Type: 'Text',
                            value: 'test',
                        },
                    },
                },
            },
        });
    });

    test('Can parse a where query with nested and/or', () => {
        expect(
            parseCamlQuery(
                `<View>
                    <Query>
                        <Where>
                            <And>
                                <Eq><FieldRef Name="Test" /><Value Type="Text">test</Value></Eq>
                                <Or>
                                    <Gt><FieldRef Name="Test" /><Value Type="Number">10</Value></Gt>
                                    <Lt><FieldRef Name="Test" /><Value Type="Number">5</Value></Lt>
                                </Or>
                            </And>
                        </Where>
                    </Query>
                </View>`
            )
        ).toEqual({
            nodeType: 'View',
            query: {
                nodeType: 'Query',
                where: {
                    nodeType: 'Where',
                    body: {
                        nodeType: 'And',
                        left: {
                            nodeType: 'Eq',
                            left: {
                                nodeType: 'FieldRef',
                                Name: 'Test',
                            },
                            right: {
                                nodeType: 'Value',
                                Type: 'Text',
                                value: 'test',
                            },
                        },
                        right: {
                            nodeType: 'Or',
                            left: {
                                nodeType: 'Gt',
                                left: {
                                    nodeType: 'FieldRef',
                                    Name: 'Test',
                                },
                                right: {
                                    nodeType: 'Value',
                                    Type: 'Number',
                                    value: '10',
                                },
                            },
                            right: {
                                nodeType: 'Lt',
                                left: {
                                    nodeType: 'FieldRef',
                                    Name: 'Test',
                                },
                                right: {
                                    nodeType: 'Value',
                                    Type: 'Number',
                                    value: '5',
                                },
                            },
                        },
                    },
                },
            },
        });
    });

    test('Properly parses boolean attributes', () => {
        expect(
            parseCamlQuery(
                `<View>
                        <Query>
                            <Where>
                                <Eq><FieldRef Name="user" LookupId='TRUE' /><Value Type="Lookup">3</Value></Eq>
                            </Where>
                        </Query>
                    </View>`
            )
        ).toEqual({
            nodeType: 'View',
            query: {
                nodeType: 'Query',
                where: {
                    body: {
                        left: {
                            nodeType: 'FieldRef',
                            LookupId: true,
                            Name: 'user',
                        },
                        nodeType: 'Eq',
                        right: {
                            nodeType: 'Value',
                            Type: 'Lookup',
                            value: '3',
                        },
                    },
                    nodeType: 'Where',
                },
            },
        });
    });
});

describe('External list view queries', () => {
    test('Properly parses Method elements', () => {
        expect(
            parseCamlQuery(
                `<View>
                    <Method Name='Method1'>
                        <Filter Name='filter1' Value='*abc*' />
                        <Filter Name='filter2' Value='1' />
                    </Method>
                </View>`
            )
        ).toEqual({
            nodeType: 'View',
            method: {
                nodeType: 'Method',
                Name: 'Method1',
                filters: [
                    {
                        nodeType: 'Filter',
                        Name: 'filter1',
                        Value: '*abc*',
                    },
                    {
                        nodeType: 'Filter',
                        Name: 'filter2',
                        Value: '1',
                    },
                ],
            },
        });
    });

    test('Properly parses ViewFields elements', () => {
        expect(
            parseCamlQuery(
                `<View>
                    <ViewFields>
                        <FieldRef Name='field1' />
                        <FieldRef Name='field2' />
                        <FieldRef Name='field3' />
                    </ViewFields>
                </View>`
            )
        ).toEqual({
            nodeType: 'View',
            viewFields: {
                nodeType: 'ViewFields',
                fieldRefs: [
                    {
                        nodeType: 'FieldRef',
                        Name: 'field1',
                    },
                    {
                        nodeType: 'FieldRef',
                        Name: 'field2',
                    },
                    {
                        nodeType: 'FieldRef',
                        Name: 'field3',
                    },
                ],
            },
        });
    });
});

describe('Misc XML parsing', () => {
    test('Single quotes are OK', () => {
        expect(
            parseCamlQuery(
                "<View><Query><Where><Eq><FieldRef Name='Test' /><Value Type='Text'>test</Value></Eq></Where></Query></View>"
            )
        ).toEqual({
            nodeType: 'View',
            query: {
                nodeType: 'Query',
                where: {
                    nodeType: 'Where',
                    body: {
                        left: {
                            nodeType: 'FieldRef',
                            Name: 'Test',
                        },
                        nodeType: 'Eq',
                        right: {
                            nodeType: 'Value',
                            Type: 'Text',
                            value: 'test',
                        },
                    },
                },
            },
        });
    });

    test('Double quotes are OK', () => {
        expect(
            parseCamlQuery(
                `<View><Query><Where><Eq><FieldRef Name="Test" /><Value Type="Text">test</Value></Eq></Where></Query></View>`
            )
        ).toEqual({
            nodeType: 'View',
            query: {
                nodeType: 'Query',
                where: {
                    nodeType: 'Where',
                    body: {
                        left: {
                            nodeType: 'FieldRef',
                            Name: 'Test',
                        },
                        nodeType: 'Eq',
                        right: {
                            nodeType: 'Value',
                            Type: 'Text',
                            value: 'test',
                        },
                    },
                },
            },
        });
    });
});
