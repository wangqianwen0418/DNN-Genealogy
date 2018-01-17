import * as React from "react"
import axios from "axios"
import {Dot} from "./Compare2"
import moment from "moment"
// import * as d3 from "d3"
export interface State{
    dots:Dot[]
}
export default class TimeLine extends React.Component<{}, State>{
    constructor(props:{}){
        super(props)
        this.state={
            dots:[]
        }
        this.getData = this.getData.bind(this)
    }
    async getData(){
        let res = await axios.get('../../data/recognition.csv')
        let datum = res.data
        let lines = datum.split('\n')
        // let attr_names = lines[0].split('|').slice(4, 9)
        lines = lines.slice(1)
        let dots:Dot[] = []
        let startTime = moment(lines[0].split('|')[2], 'YYYY-MM-DD')
        lines.forEach((line:string)=>{
            let attrs = line.split('|')
            if(attrs[8]){
                let time = moment(attrs[2], 'YYYY-MM-DD')
                let diff = time.diff(startTime, 'days')
                dots.push({
                    'name':attrs[1],
                    'date': diff,
                    'citation':attrs[9],
                    'acc':attrs[8]
                })
            }
        })
        this.setState({dots})
    }
    componentWillMount(){
        this.getData()
    }
    render(){
        let {dots} = this.state
        let height = 400
        let radioR = 0.05/ Math.max(...dots.map(d=>Math.log(d.citation)))
        let radioX = 1200/ Math.max(...dots.map(d=>d.date))
        let dot_chart = dots.map((dot:Dot)=>{
            return <circle 
            r={dot.citation * radioR}
            cx={dot.date * radioX}
            cy={dot.acc/100 *height }
            fill = "#49A9EE"
            >
            <title>{dot.name}</title>
            </circle>
        })
        return <g transform={`translate(200, ${height})`}>{dot_chart}</g>
    }
}