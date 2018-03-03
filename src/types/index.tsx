export interface StoreState {
    arc:string,
    train:string,
    app:string,
    nn:NN
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
    api?:number,
    interest?:number,
    [key:string]:any
}

export interface NNS {
    nodes: NN[],
    links: NNLink[]
}

export interface NNLink {
    source: any,
    target: any,
    [key: string]: any
}

export interface GraphEdge {
    points: Array<Point>;
    [key: string]: any;
}

export interface Point {
    x: number, y: number
}

export interface Node {
    x: number;
    y: number;
    width: number;
    height: number;
    ID?:string;
    doi?:number;
    api?:number;
    [key: string]: any;
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
