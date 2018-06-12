/**
 * Very bad code, but another way takes much more time
 */
import * as fs from "fs";
import fetch from "node-fetch";
import * as generator from "ts-code-generator";
import { IDoc, IResource, IProperty, IRequest, IType, IParameter } from "./interfaces";
async function parseDnevnikApi(): Promise<void> {
    const resources: IResource[] = await (await fetch(
        "https://api.dnevnik.ru/v1/metadata/resources"
    )).json();
    const types: IType[] = await (await fetch("https://api.dnevnik.ru/v1/metadata/types")).json();
    const docs: IDoc[] = await (await fetch("https://api.dnevnik.ru/v1/metadata/docs")).json();
    let file = generator.createFile({});
    file.classes = file.classes.concat(createClasses(resources, docs));
    file.addFunction({
        name: "request",
        parameters: [
            {
                name: "url",
                type: "string"
            },
            {
                name: "config",
                type: "object"
            }
        ]
    });
    file.interfaces = file.interfaces.concat(createInterfaces(types, docs));
    file.getClass;
    fs.writeFileSync("output.ts", file.write({ indentNumberOfSpaces: 4, useTabs: false }));
}
function findDocText(docs: IDoc[], docId: string) {
    const doc = docs.find(doc => doc.id === docId);
    if (doc) return doc.text;
    return "";
}
function createClasses(resources: IResource[], docs: IDoc[]) {
    let _classes: generator.ClassDefinition[] = [];
    resources.forEach(resource => {
        let _resource = generator.createClass({
            name: resource.name,
            documentationComment: findDocText(docs, resource.docId),
            isExported: true,
            isAbstract: true
        });
        let _request = createMethods(resource.requests, docs);
        _resource.methods = _resource.methods.concat(_request);
        _classes.push(_resource);
    });
    return _classes;
}
function createInterfaces(types: IType[], docs: IDoc[]) {
    /**generator doeesnt supprt createType */
    let _types: generator.InterfaceDefinition[] = [];
    types.forEach(type => {
        let _type = generator.createInterface({
            name: type.name,
            isExported: true
        });
        type.properties.forEach(property => {
            _type.addProperty({
                name: makeInterfacePropertyName(property.name),
                isOptional: false,
                type: resolveType(property.type),
                documentationComment: findDocText(docs, property.docId)
            });
        });
        _types.push(_type);
    });
    return _types;
}
function makeInterfacePropertyName(name: string) {
    if (name.indexOf("-") > 0) return '"' + name + '"';
    return name;
}
function findMethodWithMaxParametersCount(methods: generator.ClassMethodDefinition[]) {
    let classWithMaxParametersCount = methods[0];
    for (let i = 1; i < methods.length; i++)
        if (methods[i].parameters.length > classWithMaxParametersCount.parameters.length)
            classWithMaxParametersCount = methods[i];
    return classWithMaxParametersCount;
}
function createMethods(requests: IRequest[], docs: IDoc[]) {
    let _methods: generator.ClassMethodDefinition[] = [];
    requests.forEach(request => {
        let repeats = _methods.filter(x => x.name === request.name);
        if (repeats.length > 1) {
            findMethodWithMaxParametersCount(repeats);
        }
        let _request = generator.createClassMethod({
            name: request.name,
            isAsync: true,
            documentationComment: findDocText(docs, request.docId),
            onWriteFunctionBody: writer => {
                const uri = request.uri.replace(/\{/gi, "${");

                if (request.method == "GET") {
                    let block = `return request(\`${uri}\`, {method: "${request.method}"`;
                    writer.write(block + `})`);
                } else if (request.method == "POST") {
                    const bodyParameters = ejectBodyParameters(request.parameters);
                    let block = `const data = ${bodyParameters}
return request(\`${uri}\`, {method: "${request.method}"`;
                    writer.write(block + `, body:JSON.stringify(data)})`);
                }
            },
            returnType: request.returnType
        });
        _request.parameters = _request.parameters.concat(createParameters(request.parameters));
        _methods.push(_request);
    });
    return _methods;
}
function ejectBodyParameters(parameters: IParameter[]) {
    let bodyParameters = parameters.filter(p => p.source == "body");
    let result = bodyParameters.map((parameter: IParameter) => {
        return parameter.name;
    });
    return `{${result.toString()}}`;
}
function resolveType(_type: string) {
    let ext = _type.replace("[]", "");
    switch (ext) {
        case "Number":
        case "String":
            return _type.toLowerCase();
        default:
            return _type;
    }
}
function createParameters(parameters: IParameter[]) {
    let _parameters: generator.ClassMethodParameterDefinition[] = [];
    parameters.forEach(parameter => {
        const type = resolveType(parameter.type);
        let _parameter = generator.createClassMethodParameter({
            type: resolveType(parameter.type),
            name: parameter.name,
            isOptional: false
        });
        if (parameter.name.indexOf("[]") > 0) _parameter.isRestParameter = true;
        _parameters.push(_parameter);
    });
    return _parameters;
}
parseDnevnikApi();
