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
});
