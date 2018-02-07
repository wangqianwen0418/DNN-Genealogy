import * as React from "react"
import "./SimpleTree.css"
import axios from "axios"
import * as d3 from "d3"
import "./App.css"

export interface Props {
    treeType: string
}

export interface State {
    datum: any
}

export default class SimpleTree extends React.Component<Props, State>{
    private ref:HTMLDivElement|null
    constructor(props: Props) {
        super(props)
        // this.update = this.update.bind(this)
        this.draw = this.draw.bind(this)
        this.state = {
            datum: {}
        }
    }

    async getData() {
        let res = await axios.get("../../data/taxonomy.json")
        let datum = res.data["children"]
        if (this.props["treeType"] === "Architecture") {
            this.setState({ datum: datum[1] })
        } else {
            this.setState({ datum: datum[2] })
        }
    }
    componentDidMount(){
        
        window.addEventListener("resize", this.draw)
        
    }
    componentDidUpdate(){
        this.draw()
    }

    draw() {
        let margin = {top: 40, right: 10, bottom: 10, left: 10},
            width = (this.ref?this.ref.clientWidth:50) - margin.right - margin.left,
            height = (this.ref?this.ref.clientHeight:30) - margin.top - margin.bottom,
            duration = 750,
            i = 0,
            root: any;


            d3
            .select(".SimpleTree#" + this.props["treeType"])
            .select('svg')
            .remove()

        let svg = d3.select(".SimpleTree#" + this.props["treeType"]).insert("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", `translate(${ margin.left },${ margin.top })`)

        let treemap = d3.tree().size([width, height])

        root = d3.hierarchy(this.state.datum, d => d.children)
        root.x0 = height / 2
        root.y0 = 0
        function collapse(d: any) {
            if (d.children) {
                d._children = d.children
                d._children.forEach(collapse)
                d.children = null
            }
        }

        root.children.forEach(collapse)
        update(root)
        
        function update(source: any) {
            let treeData = treemap(root)
            let nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);
            
            nodes.forEach((d: any) => {d.y = d.depth * 100})

            // Node Section
            let node = svg.selectAll('g.node')
                .data(nodes, (d: any) => (d.id || (d.id = ++i)))

            let nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr('transform', (d: any) => "translate(" + source.x0 + "," + source.y0 + ")")
                .on('click', click)
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6)
                .style('fill', (d: any) => (d._children ? "lightsteelblue" : "white"))
            nodeEnter.append('text')
                // .attr('dx', '.45em')
                .attr('y', (d: any) => ( d.children || d._childrean ? '-1.5em' : '1.5em'))
                .attr("text-anchor", "middle")
                // .attr('text-anchor', (d: any) => ( d.children || d._childrean ? "end" : "start"))
                .text((d: any) => d.data.name)
            
            let nodeUpdate = nodeEnter.merge(node)
            nodeUpdate.transition()
                .duration(duration)
                .attr('transform', (d: any) => "translate(" + d.x + "," + d.y + ")")
            nodeUpdate.select('circle.node')
                .attr('r', 4.5)
                .style('fill', (d: any) => (d._children ? "lightsteelblue" : "white"))
                .attr('cursor', 'pointer')

            let nodeExit = node.exit().transition()
                .duration(duration)
                .attr('transform', (d: any) => "translate(" + source.x + "," + source.y + ")")
                .remove()
            nodeExit.select('circle')
                .attr('r', 1e-6)
            nodeExit.select('text')
                .style('fill-opacity', 1e-6)

            // Link Section
            let link = svg.selectAll('path.link')
                .data(links, (d: any) => d.id)

            let linkEnter = link.enter().insert('path', 'g')
                .attr('class', 'link')
                .attr('d', (d: any) => {
                    let o = {x: source.x0, y: source.y0}
                    return diagonal(o, o)
                })
            
            let linkUpdate = linkEnter.merge(link)
            linkUpdate.transition()
                .duration(duration)
                .attr('d', (d: any) => diagonal(d, d.parent))
            
            link.exit().transition()
                .duration(duration)
                .attr('d', function(d: any) {
                    var o = {x: source.x, y: source.y}
                    return diagonal(o, o)
                  })
                  .remove()

            nodes.forEach((d: any) => {
                d.x0 = d.x
                d.y0 = d.y
            })

            function diagonal(s: any, d: any) {
                // let path = `M ${s.x} ${s.y}
                //             C ${(s.x + d.x) / 2} ${d.y},
                //               ${(s.x + d.x) / 2} ${s.y},
                //               ${d.x} ${d.y}`
                let path = `M ${d.x} ${d.y}
                C ${d.x} ${(d.y + s.y) / 2},
                  ${s.x} ${(d.y + s.y) / 2} 
                  ${s.x} ${s.y}`
                return path
            }

            function click(d: any) {
                if (d.children) {
                    d._children = d.children
                    d.children = null
                } else {
                    d.children = d._children
                    d._children = null
                }
                update(d)
            }
        }
    }

    componentWillMount() {
        this.getData()
    }

    render() {
        return <div className="SimpleTree View" 
        ref={(ref)=>{this.ref=ref}}
        id={this.props["treeType"]} />
    }
}