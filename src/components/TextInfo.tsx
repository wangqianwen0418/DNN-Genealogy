import * as React from "react";
import {Card} from "antd";
import "./App.css";
import { NN } from "../types"
import { State } from "./Evolution";

export interface Props{
    database: string,
    nn: NN,
    op: number
}

export default class TextInfo extends React.Component<Props, {}>{
    constructor(props: Props) {
        super(props)
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (nextProps.op === 2) {
            return true
        } else {
            return false
        }
    }

    render(){
        let nn = this.props.nn
        return (
        <Card
            bordered={false}
            title={<span style={{fontSize:'1.2em'}}>{nn.ID}</span>}
            className="TextInfo View ViewBottom"
        >
        {nn.url}
        </Card>)
    }
}