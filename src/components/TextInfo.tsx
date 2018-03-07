import  * as React from "react";
import {Card} from "antd";
import "./App.css";

export interface Props{
    title:string,
    content: string
}
export default class TextInfo extends React.Component<Props, {}>{
    render(){
        let {title, content}=this.props
        return <Card 
        bordered={false}
        title={title} 
        className="TextInfo View ViewBottom"
        >
            {content}
        </Card>
    }
}