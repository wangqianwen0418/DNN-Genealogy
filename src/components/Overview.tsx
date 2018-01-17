import * as React from "react";
import "./Compare.css";
import Timeline from "./TimeLine"
// import { IRNode } from "../types";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';


import SunBurst from "./SunBurst"
// import axios from "axios";



export default class Overview extends React.Component {
    render() {
        let data = [{
            name: "Application",
            children: [
                {
                    name: "Computer Vision ",
                    children: [
                        { name: "recognition", value: 8 },
                        { name: "segmentation", value: 9 },
                        { name: "detection", value: 13 }
                    ]
                },
                { name: "NLP ", value: 25 },
                { name: "Audio", value: 50 }
            ]
        },
        {
            name: "Architecture",
            children: [
                {
                    name: "feed-forward ", 
                    children:[
                        {name:"convolution", value: 50},
                        {name:'', value:30}
                    ]
                },
                { name: "recurrent", value: 55 },
                { name: "", value: 20 }
            ]
        },
        {
            name: "Training",
            children: [
                {
                    name: "pre-processing", value: 30
                },
                {
                    name: "processing",
                    children: [
                        {
                            name:"dropout",
                            value:12
                        },{
                            name:"batch-normalization",
                            value:10
                        },{
                            name:"drop-path",
                            value:3
                        }
                    ]
                },
                { name: "post-processing", value: 20 }
            ]
        }]
        let sunBursts = data.map(
            (d, i) => <SunBurst data={d}
                key={d.name}
                pos={[400 + i * 250, 800]}
                tittle={d.name} />)
        return <g>
            {sunBursts}
            <Timeline />
        </g>
    }
} 