import * as fs from "fs";
import fetch from "node-fetch";
import * as generator from "ts-code-generator";
import { IDoc, IResource, IProperty, IRequest, IType, IParameter } from "./interfaces";
async function parseDnevnikApi(): Promise<void> {
    const resources: Array<IResource> = await (await fetch(
        "https://api.dnevnik.ru/v1/metadata/resources"
    )).json();
    const types: Array<IType> = await (await fetch(
        "https://api.dnevnik.ru/v1/metadata/types"
    )).json();
    const docs: Array<IDoc> = await (await fetch("https://api.dnevnik.ru/v1/metadata/docs")).json();
    let file = generator.createFile({});
    file.classes = createClasses(resources);
    console.log(file.write());
}
function createClasses(resources: IResource[]) {
    let _classes: generator.ClassDefinition[] = [];
    resources.forEach(resource => {
        let _resource = generator.createClass({
            name: resource.name,
            implementsTypes: ["IResource"]
        });
        let _request = createMethods(resource.requests);
        _resource.methods = _request;
        _classes.push(_resource);
    });
    return _classes;
}
function createMethods(requests: IRequest[]) {
    let _methods: generator.ClassMethodDefinition[] = [];
    requests.forEach(request => {
        let _request = generator.createClassMethod({
            name: request.name,
            isAsync: true,
            onWriteFunctionBody: writer => {
                const uri = request.uri.replace(/\{/gi, "${");
                if (request.method == "GET")
                    writer.write(`return request("${uri}", {method: ${request.method}})`);
                else {
                    const bodyParameters = request.parameters.filter(p => p.source == "body");
                    writer.write(
                        `return request("${uri}", {method: ${request.method}, body:${JSON.stringify({
                            ...bodyParameters
                        })})`
                    );
                }
            },
            returnType: request.returnType
        });
        _request.parameters = createParameters(request.parameters);
        _methods.push(_request);
    });
    return _methods;
}
function createParameters(parameters: IParameter[]) {
    let _parameters: generator.ClassMethodParameterDefinition[] = [];
    parameters.forEach(parameter => {
        let _parameter = generator.createClassMethodParameter({
            type: parameter.name,
            name: parameter.name,
            isOptional: false
        });
        if (parameter.name.indexOf("[]") > 0) _parameter.isRestParameter = true;
        _parameters.push(_parameter);
    });
    return _parameters;
}
parseDnevnikApi();
