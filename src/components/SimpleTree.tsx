import * as React from "react"
import "./SimpleTree.css"
import axios from "axios"
import * as d3 from "d3"

export interface Props {
    treeType: string
}

export interface State {
    datum: any
}

export default class SimpleTree extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props)
        this.state = {
            datum: {}
        }
    }

    async getData() {
        let res = await axios.get("../../data/taxonomy.json")
        let datum = res.data["children"][1]
        this.setState({ datum })

        const divMargin = 30

        let headerHeight = 64,
            screen_w = (window.innerWidth - 2 * divMargin) / 2,
            screen_h = (window.innerHeight - headerHeight - 2 * divMargin) / 2

        let margin = {top: 10, right: 20, bottom: 10, left: 80},
            width = screen_w - margin.right - margin.left,
            height = screen_h - margin.top - margin.bottom,
            duration = 750,
            i = 0,
            root: any;

        // let svg = <svg width={width + margin.right + margin.left} height={height + margin.top + margin.bottom}>
        //     <g transform={`translate(${margin.left},${margin.top})`}></g>
        // </svg>

        let svg = d3.select(".SimpleTree").insert("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        let treemap = d3.tree().size([height, width])

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
                .attr('transform', (d: any) => "translate(" + source.y0 + "," + source.x0 + ")")
                .on('click', click)
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6)
                .style('fill', (d: any) => (d._children ? "lightsteelblue" : "white"))
            nodeEnter.append('text')
                .attr('dy', '.35em')
                .attr('x', (d: any) => ( d.children || d._childrean ? -8 : 8))
                .attr('text-anchor', (d: any) => ( d.children || d._childrean ? "end" : "start"))
                .text((d: any) => d.data.name)
            
            let nodeUpdate = nodeEnter.merge(node)
            nodeUpdate.transition()
                .duration(duration)
                .attr('transform', (d: any) => "translate(" + d.y + "," + d.x + ")")
            nodeUpdate.select('circle.node')
                .attr('r', 4.5)
                .style('fill', (d: any) => (d._children ? "lightsteelblue" : "white"))
                .attr('cursor', 'pointer')

            let nodeExit = node.exit().transition()
                .duration(duration)
                .attr('transform', (d: any) => "translate(" + source.y + "," + source.x + ")")
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
                let path = `M ${s.y} ${s.x}
                            C ${(s.y + d.y) / 2} ${s.x},
                              ${(s.y + d.y) / 2} ${d.x},
                              ${d.y} ${d.x}`
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
        return <div className="SimpleTree">
        </div>
    }
}