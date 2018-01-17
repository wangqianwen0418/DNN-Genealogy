import * as React from "react";
import "./MultiSunBurst.css";
import {Arc} from "./SunBurst";
import axios from "axios";
// import { IRNode } from "../types";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';


import SunBurst from "./SunBurst"
// import axios from "axios";
export interface State{
    datum:Arc[]
}
export default class MultiSunBurst extends React.Component<{}, State> {
    constructor(props:{}){
        super(props)
        this.state={datum:[]}
        this.getData = this.getData.bind(this)
    }
    async getData(){
        let res = await axios.get("../../data/overview.json")
        let datum = res.data
        this.setState({datum})
    }
    componentWillMount(){
        this.getData()
    }
    render() {
        let {datum} = this.state
        let margin = 10
        let sunBurst_h = (window.innerHeight - 70)*0.4-2*margin
        let sunBurst_r = sunBurst_h/2 - margin
        let sunBurst_y = sunBurst_r + margin
        let sunBurst_w = window.innerWidth - 2*margin
        let sunBursts = datum.map(
            (d, i) => <SunBurst data={d}
                radius={sunBurst_r}
                key={d.name}
                pos={
                    [sunBurst_w / 2 - datum.length * sunBurst_r*1.5 + sunBurst_r + i * sunBurst_r * 3,
                        sunBurst_y]
                }
                tittle={d.name} />)

        return <div className="MultiSunBurst">
            <svg width={window.innerWidth} height={sunBurst_h}>
                {sunBursts}
            </svg>
        </div>
    }
} 