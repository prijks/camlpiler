import { CamlTester } from '../src/CamlTester';

describe('Error Handling', () => {
    test('Throws on empty query', () => {
        const tester = new CamlTester({});
        expect(() => tester.testQueryXml([], '')).toThrow();
    });

    test("Throws when root isn't View or Query", () => {
        const tester = new CamlTester({});
        expect(() => tester.testQueryXml([], '<valid><xml /></valid>')).toThrow();
    });

    test('Throws on malformed XML', () => {
        const tester = new CamlTester({});
        expect(() => tester.testQueryXml([], '<View><Query></View>')).toThrow();
    });

    test('Throws on missing method definition', () => {
        const tester = new CamlTester({});
        expect(() => tester.testQueryXml([], '<View><Method name="method" /></View>')).toThrow();
    });
});

describe('Basic queries', () => {
    const testItems: Array<{ id: number; a: string; c: number; user: { id: number; value: string } }> = [
        { id: 1, a: 'abc', c: 123, user: { id: 1, value: 'Doe, John' } },
        { id: 2, a: 'a;sdfj', c: 8135, user: { id: 2, value: 'Smith, Francis' } },
        { id: 3, a: 'abc', c: 12543, user: { id: 3, value: 'Test, User' } },
        { id: 4, a: '1234', c: 5234, user: { id: 4, value: 'Doe, Jane' } },
    ];
    test('Empty Query returns all items', () => {
        const tester = new CamlTester({});
        expect(tester.testQueryXml(testItems, '<View><Query /></View>')).toEqual(testItems);
        expect(tester.testQueryXml(testItems, '<Query />')).toEqual(testItems);
    });

    test('Basic query filters appropriate item', () => {
        const tester = new CamlTester({});
        expect(
            tester.testQueryXml(
                testItems,
                '<View><Query><Where><Eq><FieldRef Name="a" /><Value Type="Text">abc</Value></Eq></Where></Query></View>'
            )
        ).toEqual(testItems.filter((i) => i.a === 'abc'));
    });

    test('String filters are case insensitive', () => {
        const tester = new CamlTester({});
        expect(
            tester.testQueryXml(
                testItems,
                '<View><Query><Where><BeginsWith><FieldRef Name="a" /><Value Type="Text">AB</Value></BeginsWith></Where></Query></View>'
            )
        ).toEqual(testItems.filter((i) => i.a.toLowerCase().indexOf('ab') === 0));
    });

    test('Query with nested and/or returns appropriate items', () => {
        const tester = new CamlTester({});
        expect(
            tester.testQueryXml(
                testItems,
                `<View>
                    <Query>
                        <Where>
                            <And>
                                <Eq><FieldRef Name="a" /><Value Type="Text">abc</Value></Eq>
                                <Or>
                                    <Gt><FieldRef Name="c" /><Value Type="Number">8000</Value></Gt>
                                    <Lt><FieldRef Name="c" /><Value Type="Number">500</Value></Lt>
                                </Or>
                            </And>
                        </Where>
                    </Query>
                </View>`
            )
        ).toEqual(testItems.filter((i) => i.a === 'abc' && (i.c > 8000 || i.c < 500)));
    });

    test('Query with lookup ID', () => {
        const tester = new CamlTester({});
        expect(
            tester.testQueryXml(
                testItems,
                `<View>
                        <Query>
                            <Where>
                                <Eq><FieldRef Name="user" LookupId='TRUE' /><Value Type="Lookup">3</Value></Eq>
                            </Where>
                        </Query>
                    </View>`
            )
        ).toEqual(testItems.filter((i) => i.user.id === 3));
    });

    test('Query with lookup value', () => {
        const tester = new CamlTester({});
        expect(
            tester.testQueryXml(
                testItems,
                `<View>
                    <Query>
                        <Where>
                            <Contains><FieldRef Name="user" /><Value Type="Lookup">Doe</Value></Contains>
                        </Where>
                    </Query>
                </View>`
            )
        ).toEqual(testItems.filter((i) => i.user.value.indexOf('Doe') >= 0));
    });
});

describe('External list queries', () => {
    interface ExternalItemType extends Record<string, any> {
        id: number;
        a: string;
        b: string;
    }

    const testItems: Array<ExternalItemType> = [
        { id: 1, a: 'abc', b: 'def' },
        { id: 2, a: 'a;sdfj', b: 'def' },
        { id: 3, a: 'abc', b: 'xyz' },
        { id: 4, a: '1234', b: 'zxcv' },
    ];

    test('Query with method with single filter', () => {
        const tester = new CamlTester<ExternalItemType>({
            listDefinition: {
                external: true,
                name: 'test',
                methods: [
                    {
                        name: 'Read List',
                        method: (items: ExternalItemType[], filters: Array<{ name: string; value: string }>) => {
                            for (const filter of filters) {
                                items = items.filter((item) => item[filter.name] === filter.value);
                            }
                            return items;
                        },
                    },
                ],
            },
        });
        expect(
            tester.testQueryXml(
                testItems,
                '<View><Method Name="Read List" ><Filter Name="a" Value="abc" /></Method></View>'
            )
        ).toEqual(testItems.filter((i) => i.a === 'abc'));
    });
});
