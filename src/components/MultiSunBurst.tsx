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
export interface Props {
    callbackParent: (filter: string, newState: string) => void
}
export interface State {
    datum: Arc[]
}
export default class MultiSunBurst extends React.Component<Props, State> {
    constructor(props: Props) {
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
    onChildrenChanged(filter: string, newState: string) {
        this.props.callbackParent(filter, newState)
    }
    render() {
        let { datum } = this.state
        let margin = 26
        let sunBurst_h = (window.innerHeight - 70) * 0.25 - margin
        let sunBurst_r = sunBurst_h / 3
        let sunBurst_y = sunBurst_r * 1.5
        let sunBurst_w = (window.innerWidth - 2 * margin) / 6 - margin
        let sunBursts = datum.map(
            (d, i) => <Col className="SidebarItem" span={4}>
                <SunBurst data={d}
                    radius={sunBurst_r}
                    idx={i}
                    key={d.name}
                    pos={
                        [   sunBurst_w / 2,
                            sunBurst_y,
                            sunBurst_w,
                            sunBurst_h
                        ]
                    }
                    title={d.name}
                    callbackParent={(filter, name)=>{this.onChildrenChanged(filter, name)}} />
            </Col>)

        return <div className="MultiSunBurst">
            {sunBursts}
        </div>
    }
} 