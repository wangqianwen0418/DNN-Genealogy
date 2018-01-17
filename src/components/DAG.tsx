import * as React from "react"
import "./DAG.css"
import axios from "axios"
import { Dot } from "./Compare2"
import moment from "moment"
// import * as d3 from "d3"
export interface State {
    dots: Dot[]
}
export default class DAG extends React.Component<{}, State>{
    constructor(props: {}) {
        super(props)
        this.state = {
            dots: []
        }
        this.getData = this.getData.bind(this)
    }
    async getData() {
        let res = await axios.get('../../data/recognition.csv')
        let datum = res.data
        let lines = datum.split('\n')
        // let attr_names = lines[0].split('|').slice(4, 9)
        lines = lines.slice(1)
        let dots: Dot[] = []
        let startTime = moment(lines[0].split('|')[2], 'YYYY-MM-DD')
        lines.forEach((line: string) => {
            let attrs = line.split('|')
            if (attrs[8] != "na" && attrs[8]) {
                console.info(attrs[8], parseFloat(attrs[8]))
                let time = moment(attrs[2], 'YYYY-MM-DD')
                let diff = time.diff(startTime, 'days')
                dots.push({
                    name: attrs[1],
                    date: diff,
                    citation: attrs[9],
                    acc: parseFloat(attrs[8])
                })
            }
        })
        this.setState({ dots })
    }
    componentWillMount() {
        this.getData()
    }
    render() {
        let { dots } = this.state
        let margin = 5
        let height = (window.innerHeight - 70) * 0.6 - 2*margin
        let width = window.innerWidth - 2*margin
        let ratioR = 0.05 / Math.max(...dots.map(d => Math.log(d.citation)))
        let ratioX = width / Math.max(...dots.map(d => d.date))
        let min_acc = Math.min(...dots.map(d => d.acc))
        let max_acc = Math.max(...dots.map(d => d.acc))
        let ratioY = height / (max_acc - min_acc)

        let dot_chart = dots.map((dot: Dot) => {
            return <circle
                r={Math.max(dot.citation * ratioR, 10)}
                cx={dot.date * ratioX + dot.citation * ratioR + margin}
                cy={(dot.acc - min_acc) * ratioY + margin}
                stroke="white"
                strokeWidth={2}
                fill="#49A9EE"
            >
                <title>{dot.name}</title>
            </circle>
        })
        return <div className="DAG">
            <svg height={height} width={width}>
                {dot_chart}
            </svg>
        </div>
    }
}