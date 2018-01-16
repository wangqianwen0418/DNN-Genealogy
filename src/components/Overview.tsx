import * as React from "react";
import "./Compare.css";
// import { IRNode } from "../types";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';


import SunBurst from "./SunBurst"
// import axios from "axios";



export default class Overview extends React.Component {
    render() {
        let app = {
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
        }
        let architecture = {
            name: "Application",
            children: [
                {
                    name: "feed-forward ", value: 80,
                },
                { name: "recurrent", value: 55 },
                { name: "", value: 20 }
            ]
        }

        let train = {
            name: "Application",
            children: [
                {
                    name: "pre-processing", value: 30
                },
                { name: "processing", value: 25 },
                { name: "post-processing", value: 20 }
            ]
        }
        return [<SunBurst data={app}
            pos={[400, 800]}
            tittle={"Application"} />,
        <SunBurst data={architecture}
            pos={[750, 800]}
            tittle={"Architecture"} />,
        <SunBurst data={train}
            pos={[1100, 800]}
            tittle={"Training"} />
        ]
    }
} 