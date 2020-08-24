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
});

describe('Basic queries', () => {
    const testItems: Array<{ id: number; a: string; c: number }> = [
        { id: 1, a: 'abc', c: 123 },
        { id: 2, a: 'a;sdfj', c: 8135 },
        { id: 3, a: 'abc', c: 12543 },
        { id: 4, a: '1234', c: 5234 },
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
});
