# Camlpiler

## Overview

Collaborative Application Markup Language (CAML) is an XML-based language used in SharePoint for querying lists, defining views, defining list fields, and other tasks.

Camlpiler is a JavaScript library that will take a CAML query and convert it to a filter function that can be applied to JavaScript objects.

## Use Cases

### Building a dev API

The primary motivation for creating this library was to make it easier to create a development API that could mimic requests to a SharePoint server. Basically, in a React app deployed to SharePoint, I was using a local store of JavaScript objects to mimic the production store in SharePoint. This was easy to implement for basic operations such as get/save/delete, but ran into a problem when searching/filtering because that required dealing with CAML.

### Validating CamlQuery syntax (not ready yet)

SharePoint in general does not give helpful error messages when presented with incorrect Syntax in a CAML query, whether it's malformed XML, a misspelled element name, or any other sort of error. While this is a secondary use case, and not the reason I wrote this library, I do hope that as this library becomes more feature complete that this will become a potential use for it, especially for the case of generated CAML queries.

## Getting Started

### Installation

Install via npm or yarn using one of the following commands:

#### npm

    npm install camlpiler

#### yarn

    yarn add camlpiler

### Usage

Camlpiler is intended to be used when running your project in development mode, for example if you're running an App created
with create-react-app using the local development server via the command `npm start`. In this scenario, camlpiler is intended
to replicate the SharePoint CAML parsing functionality.

As a somewhat simplified example, here is a somewhat contrived sample usage in a SharePoint-hosted JavaScript application:

    const search = (term: string): Promise<ItemType[]> => {
        const query =
            `<View>
                <Query>
                    <Where>
                        <Contains>
                            <FieldRef Name='Title' />
                            <Value Type='Text'>${term}</Value>
                        </Contains>
                    </Where>
                </Query>
            </View>`;
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            const camlTester = new CamlTester({});
            return camlTester.testQueryXml(testItems, query);
        } else {
            return promiseBasedSharePointWrapper.search(term);
        }
    }
