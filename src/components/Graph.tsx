import * as React from "react";
import "./Graph.css";
import Compare from "./Compare"
import Compare2  from "./Compare2"
import Network from "./Network"
// import * as d3 from "d3";
import { IRNode } from "../types";
import axios from "axios";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';
// import { getColor } from "../helper";

// export interface Node {
//     class?:string
// }
// const node_w: number = 110, node_h: number = 20, margin: number = 10;
export interface Props {
}
export interface State {
    selectedNN:IRNode[]
}
export default class Graph extends React.Component<Props, State> {
    public graphWindow: any; x0:number;y0:number;
    constructor(props: Props) {
        super(props)
        this.state={
            selectedNN:[]
        }
    }
    async drawDag(name:string, task:string){
        let res = await axios.get(`../../data/${task}/${name}.json`)
        let nodes: IRNode[] = res.data.config.layers
        this.setState({selectedNN:nodes})
    }
    render() {
            return (
                <svg className="graphWindow">
                    <Compare/>
                    <Compare2 drawDag={this.drawDag.bind(this)}/>
                    <Network nodes={this.state.selectedNN}/>
                </svg>
            )
        }
}