import * as React from "react"
import "./CorpusCompare.css"
import axios from "axios"
import * as d3 from "d3"
import { NN } from "../types"
// import { Dropdown, Icon, Menu } from "antd"

export interface Props {
    database: string,
    nn: NN,
}

export interface State {
    datum: any,
    database: string,
    nns: string[],
    performance: any[],
}

const sequenceDatasets = [],
      nonsequenceDatasets= ['SVHN', 'cifar10', 'cifar100', 'imageNet val top1', 'imagenet val top 5']

export default class CorpusCompare extends React.Component<Props, State> {
    private ref:HTMLDivElement|null
    constructor(props: Props) {
        super(props)
        this.state = {
            database: "nonsequence",
            nns: [],
            performance: [],
            datum: {}
        }
        this.draw = this.draw.bind(this)
        this.updateData = this.updateData.bind(this)
    }

    async getData() {
        let res = await axios.get("../../data/survey.json")
        let datum = res.data
        this.setState({ datum })
    }

    componentWillMount() {
        // this.getData()
    }

    componentDidMount() {
        window.addEventListener("resize", this.draw)
        d3.select("body").append("div").attr("class", "toolTip")
    }
    
    componentWillUnmount() {
        window.removeEventListener("resize", this.draw)
        d3.select(".toolTip").remove()
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevProps.nn === this.props.nn)
            return
        this.updateData()
        this.draw()
    }

    updateData() {
        let database = this.props.database, nns = this.state.nns, performance = this.state.performance
        if (database === 'nonsequence') {
            if (performance.length === 0) {
                console.log('aaaa')
                for (let dataset of nonsequenceDatasets)
                    performance.push({'dataset': dataset})
            }
        }
        for (let name of this.props.nn.names) {
            if (nns.indexOf(name.name) === -1) {
                nns.push(name.name)
                for (let index in nonsequenceDatasets) {
                    performance[index][name.name] = name[nonsequenceDatasets[index]] ? name[nonsequenceDatasets[index]] : 0
                }
            }
        }
        console.log(performance, '123456')        
        this.setState({ database, nns, performance})        
    }

    draw() {

        d3.select(".CorpusCompare")
            .select('svg')
            .remove()

        let margin = {top: 35, right: 60, bottom: 30, left: 80},
            width = (this.ref?this.ref.clientWidth:50) - margin.left - margin.right,
            height = (this.ref?this.ref.clientHeight:30) - margin.top - margin.bottom;
        
        let svg = d3.select(".CorpusCompare").insert("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")

        let tooltip = d3.select(".toolTip")

        let x = d3.scaleLinear().range([0, width]),
            y = d3.scaleBand().range([height, 0]),
            y_group = d3.scaleBand().padding(0.05),
            color = d3.scaleOrdinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])
        
        let g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        
        let data = this.state.performance,
            keys = this.state.nns
        //    keys = ["A", "B"]

        x.domain([0, 100])
        y.domain(data.map(((d: any) => d.dataset))).padding(0.1)
        y_group.domain(keys).rangeRound([0, y.bandwidth()])
        
        // axis
        g.append("g")
            .attr("class", "x axis")
       	    .attr("transform", "translate(0," + height + ")")
      	    .call(d3.axisBottom(x).ticks(5).tickFormat(null).tickSizeInner(-height))
        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y))
        
        // bar
        g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("transform", (d: any) => "translate(0," + y(d.dataset) + ")")
            .selectAll("rect")
            .data(function(d) { return keys.map(function(key: string) { return {key: key, value: d[key]}; }); })
            .enter().append("rect")
                .attr("class", (d: any) => "bar " + String(d.key))
                .attr("x", 0)
                .attr("height", y_group.bandwidth())
                .attr("y", (d: any) => String(y_group(d.key)))
                .attr("width", (d: any) => String(x(d.value)))
                .attr("fill", (d: any) => String(color(d.key)))
                .on("mousemove", (d: any) => {
                    tooltip
                        .style("left", d3.event.pageX - 30 + "px")
                        .style("top", d3.event.pageY - 60 + "px")
                        .style("display", "inline-block")
                        .html((d.key) + "<br><span>" + (d.value) + "</span>")
                })
                .on("mouseout", (d: any) => tooltip.style("display", "none"))

        var labels = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys)
            .enter().append("g")
            .attr("transform", (d: any, i: number) => "translate(50," + i * 10 + ")")
        labels.append("rect")
            .attr("class", (d: any) => "label")
            .attr("x", width - 9)
            .attr("width", 9)
            .attr("height", 9)
            .attr("fill", (d: any) => String(color(d)))
            .on("mousemove", (d: any) => {
                d3.selectAll(".bar")
                    .attr("opacity", (model: any) => {
                        if (model.key === d)
                            return 1
                        else
                            return 0.4
                    })
            })
            .on("mouseout", () => {
                d3.selectAll(".bar").attr("opacity", 1)
            })
        labels.append("text")
            .attr("x", width - 14)
            .attr("y", 6.5)
            .attr("dy", "0.15em")
            .text((d: any) => d)
    }

    render() {
        // /let headerHeight = 64
        //let screen_w = (window.innerWidth - 2 * margin) / 3
        //let screen_h = (window.innerHeight - headerHeight - 2 * margin) / 2
        // let menu = (
        //     <Menu>
        //       <Menu.Item key="1">1st menu item</Menu.Item>
        //       <Menu.Item key="2">2nd memu item</Menu.Item>
        //       <Menu.Item key="3">3rd menu item</Menu.Item>
        //     </Menu>
        //   )
        return <div className="CorpusCompare View" ref={(ref)=>{this.ref=ref}}>
            {/* <svg id="corpus" width="100%" height="100%"> </svg> */}
            {/* <Dropdown overlay={menu} trigger={['hover']}>
                <a className="ant-dropdown-link" href="#" style={{position: "absolute", right: "10px"}}>
                    Hover me <Icon type="down" />
                </a>
            </Dropdown> */}
        </div>
    }
}