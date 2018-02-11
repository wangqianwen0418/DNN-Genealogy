export interface StoreState {
    arc:string,
    train:string,
    app:string,
    nns:string[]
}

export interface EvoNode {
    name:string,
    inputs:EvoLink[],
    [key:string]:any
}

export interface EvoLink {
    name:string,
    link:string
}

// models=Array<model>

export interface NN{
    ID:string,
    url:string,
    date:string,
    application:Array<string>,
    training:Array<string>,
    architecture:Array<string>,
    names:Array<Name>,
    parents:Array<Parent>,
    [key:string]:any
}


export interface Parent{
    ID:string,
    link_info:string,
    [key:string]:any
}

interface Name{
    name:string,
    [datasets:string]:number|any,
    params:number
}
