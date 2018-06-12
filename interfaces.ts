export interface IType {
    name: string;
    docId: string;
    properties: IProperty[];
}
export interface IProperty {
    docId: string;
    name: string;
    type: string;
}
export interface IResource {
    docId: string;
    name: string;
    requests: IRequest[];
}
export interface IParameter {
    name: string;
    source: "uri" | "body";
    docId: string;
    type: string;
}
export interface IRequest {
    method: "GET" | "POST" | "PUT" | "DELETE";
    docId: string;
    name: string;
    parameters: IParameter[];
    requiredAuthorizationScope: string;
    requiredAuthorization: boolean;
    requresHttps: boolean;
    returnType: string;
    uri: string;
    uris: string[];
}
export interface IDoc {
    id: string;
    text: string;
    localization: string;
}
// export interface IResouce {
//     parameters: IType[];
//     returnType: IType;
//     accessRights:
//         | "CommonInfo"
//         | "ContactInfo"
//         | "FriendsAndRelatives"
//         | "EducationalInfo"
//         | "SocialInfo"
//         | "Files"
//         | "Wall"
//         | "Messages";
// }