import * as React from "react";
// import { IRNode } from "../types";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';
import { getColor } from "../helper";
// import * as d3 from "d3";

export default class Compare extends React.Component<{}, {}>{
    render(){
        let points:Array<[number, number]>=[]
        let n:number = 6 
        let len:number = 150
        let margin:number = 5
        let bar_h:number = len * Math.sin(Math.PI / n) *2
        let bar_w:number = 15
        let data:Array<Array<number>>=[[87,35], [93,56], [66,87],[40,64],[66,87],[50,74]]

        // let simulation = d3.forceSimulation

        for(let i=0;i<n;i++){
            let x = len*Math.cos(Math.PI*2 / n * i )
            let y = len*Math.sin(Math.PI*2 / n * i )
            points.push([x,y])
        }
        let bars:JSX.Element[][]=data.map((d:Array<number>, i:number)=>{
            return d.map((h:number, idx:number)=>{
                return <rect
                x={points[i][0] + idx*(bar_w+margin) + margin}
                y={points[i][1] - -bar_h*(100-h)/100/2}
                transform={`rotate(${(360/n)*(i+1)-(360/n/2)} ${points[i][0]}, ${points[i][1]})`}
                height={bar_h*h/100}
                width={bar_w}
                fill={getColor(i.toString())}>
                </rect>
            })
        })
        return <g transform={`translate(${len*3}, ${len*3}) rotate(-90 0,0)`}>
            <polygon 
        points={points.join(" ")}
        stroke="gray"
        fill="none">
        </polygon>
        {bars}
        </g>
    }
}