import * as React from "react"
import "./CorpusCompare.css"
import axios from "axios"
import * as d3 from "d3"
import { Dropdown, Icon, Menu } from "antd"

export interface Props {
    models: string[]
}

export interface State {
    selected: string[],
    datum: any
}
const margin = 30
export default class CorpusCompare extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            selected: [],
            datum: {}
        }
        this.selectDataset = this.selectDataset.bind(this)
    }

    selectDataset(name: string) {
        if (this.state.selected.indexOf(name) === -1)
            this.state.selected.push(name)
    }

    async getData() {
        let res = await axios.get("../../data/corpus_sample.json")
        let datum = res.data
        this.setState({ datum })
    }

    componentWillMount() {
        this.getData()
    }

    componentDidUpdate() {
        let svg = d3.select("#corpus"),
            margin = {top: 20, right: 50, bottom: 30, left: 100},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;
        
        let tooltip = d3.select("body").append("div").attr("class", "toolTip")

        let x = d3.scaleLinear().range([0, width]),
            y = d3.scaleBand().range([height, 0])
        
        let g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        
        let data = this.state.datum

        // data.sort((a: any, b: any) => (a.value - b.value))
        x.domain([0, 100000])
        y.domain(data.map(((d: any) => d.area))).padding(0.1)

        g.append("g")
            .attr("class", "x axis")
       	    .attr("transform", "translate(0," + height + ")")
      	    .call(d3.axisBottom(x).ticks(5).tickFormat(null).tickSizeInner(-height))

        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y))

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("y", (d: any) => String(y(d.area)))
            .attr("width", (d: any) => String(x(d.value)))
            .on("mousemove", (d: any) => {
                tooltip
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 90 + "px")
                    .style("display", "inline-block")
                    .html((d.area) + "<br><span>" + (d.value) + "</span>")
            })
            .on("mouseout", (d: any) => tooltip.style("display", "none"))
    }

    render() {
        let headerHeight = 64
        let screen_w = (window.innerWidth - 2 * margin) * 5 / 12
        let screen_h = (window.innerHeight - headerHeight - 2 * margin) / 2
        let menu = (
            <Menu>
              <Menu.Item key="1">1st menu item</Menu.Item>
              <Menu.Item key="2">2nd memu item</Menu.Item>
              <Menu.Item key="3">3rd menu item</Menu.Item>
            </Menu>
          )
        return <div className="CorpusCompare">
            <svg id="corpus" width={screen_w} height={screen_h}> </svg>
            <Dropdown overlay={menu} trigger={['hover']}>
                <a className="ant-dropdown-link" href="#" style={{position: "absolute", right: "10px"}}>
                    Hover me <Icon type="down" />
                </a>
            </Dropdown>
        </div>
    }
}