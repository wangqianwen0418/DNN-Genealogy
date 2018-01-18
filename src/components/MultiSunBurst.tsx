import * as React from "react";
import "./MultiSunBurst.css";
import { Arc } from "./SunBurst";
import axios from "axios";
import { Col } from "antd";
// import { IRNode } from "../types";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';


import SunBurst from "./SunBurst"
// import axios from "axios";
export interface State {
    datum: Arc[]
}
export default class MultiSunBurst extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props)
        this.state = { datum: [] }
        this.getData = this.getData.bind(this)
    }
    async getData() {
        let res = await axios.get("../../data/overview.json")
        let datum = res.data
        this.setState({ datum })
    }
    componentWillMount() {
        this.getData()
    }
    render() {
        let { datum } = this.state
        let margin = 7
        let sunBurst_h = (window.innerHeight - 70) * 0.3 - 2 * margin
        let sunBurst_r = sunBurst_h / 3
        let sunBurst_y = sunBurst_r * 1.5
        let sunBurst_w = (window.innerWidth - 2 * margin)/4 -margin
        let sunBursts = datum.map(
            (d, i) => <Col span={6}>
                <SunBurst data={d}
                    radius={sunBurst_r}
                    idx={i}
                    key={d.name}
                    pos={
                        [   sunBurst_w/2,
                            sunBurst_y,
                            sunBurst_w,
                            sunBurst_h
                        ]
                    }
                    tittle={d.name} />
            </Col>)

        return <div className="MultiSunBurst">
            {sunBursts}
        </div>
    }
} 