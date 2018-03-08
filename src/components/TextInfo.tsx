import * as React from "react";
import {Card} from "antd";
import "./App.css";
import { NN } from "../types"

export interface Props{
    database: string,
    nn: NN
}

export default class TextInfo extends React.Component<Props, {}>{
    constructor(props: Props) {
        super(props)
    }

    render(){
        console.log('render!')
        return <Card 
        bordered={false}
        title="Neural Network" 
        className="TextInfo View ViewBottom"
        >
        hello
        </Card>
    }
}