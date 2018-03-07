import * as React from 'react'
import './SimpleTree.css'
import axios from 'axios'
import * as d3 from 'd3'
import './App.css'

export interface Props {
    treeType: string
    onSelect:(node:string)=>void
}

export interface State {
    datum: any
}

export interface TreeNode extends d3.HierarchyNode<any>{
    x0:number,
    y0:number,
    [key:string]:any
}

export default class SimpleTree extends React.Component<Props, State>{
    private ref:HTMLDivElement|null; reset:boolean=true
    constructor(props: Props) {
        super(props)
        // this.update = this.update.bind(this)
        this.draw = this.draw.bind(this)
        this.state = {
            datum: {}
        }
    }

    async getData() {
        let res = await axios.get('../../data/taxonomy.json')
        let datum = res.data['children']
        if (this.props['treeType'] === 'Architecture') {
            this.setState({ datum: datum[1] })
        } else {
            this.setState({ datum: datum[2] })
        }
    }
    componentDidMount(){
        window.addEventListener('resize', this.draw)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.draw)
    }

    componentDidUpdate(){
        this.draw()
    }

    draw() {

        let {onSelect} = this.props
        let this_ = this
        let margin = {top: 40, right: 10, bottom: 10, left: 10},
            nodeSize:[number, number] = [80, 20],
            node_margin = 10,
            width = (this.ref?this.ref.clientWidth:50) - margin.right - margin.left,
            // height = (this.ref?this.ref.clientHeight:30) - margin.top - margin.bottom,
            duration = 750,
            i = 0,
            root:TreeNode,
            depth_th = (this.props['treeType'] === 'Architecture'?2:1)

        d3.select('.SimpleTree#' + this.props['treeType'])
            .select('svg')
            .remove()

        let svg = d3.select('.SimpleTree#' + this.props['treeType']).insert('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .append('g')
            .attr('transform', `translate(${ margin.left + width/2},${ margin.top })`)
            .append('g')
            .attr('class', 'svg')

        let treemap = d3.tree()
            .nodeSize([nodeSize[0]+node_margin, nodeSize[1]])

        let root_:any = d3.hierarchy(this.state.datum, d => d.children)
        root_.x0 = width / 2
        root_.y0 = 0
        root = root_

        function collapse(d: any) {
            if (d.depth<depth_th && d.children) {
                d.children.forEach(collapse)
            }else if (d.children){
                d._children = d.children
                d._children.forEach(collapse)
                d.children = null
            }
        }
        if(root.children){
            root.children.forEach(collapse)
        update(root)
        }
        
        function update(source: any) {
            let treeData = treemap(root)
            let nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);
            
            // let max_depth = Math.max(...nodes.map(d=>d.depth))+1
            nodes.forEach((d: any) => {d.y = d.depth * nodeSize[1]* 3})

            // Node Section
            let node = svg.selectAll('g.node')
                .data(nodes, (d: any) => (d.id || (d.id = ++i)))

            let nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr('transform', (d: any) => 'translate(' + source.x0 + ',' + source.y0 + ')')
                .on('click', click)

            nodeEnter.append('rect')
                .attr('class', 'node_bg')
                .attr('width', nodeSize[0])
                .attr('height', nodeSize[1])
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('fill', 'none')
                .style('opacity', (d: any) => (d._children ? 1 : (d.centered0)))
                .attr('transform', (d)=>`translate(${-nodeSize[0]/2 + 3}, ${-nodeSize[1]/2 - 3})`)

            nodeEnter.append('rect')
                .attr('class', 'node')
                .attr('width', nodeSize[0])
                .attr('height', nodeSize[1])
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('transform', (d:any)=>{
                    d.centered = false
                    return `translate(${-nodeSize[0]/2}, ${-nodeSize[1]/2})`
            })
                .style('fill', 'white')
            

            nodeEnter.append('text')
                .attr('y', '0.7em')
                .attr('text-anchor', 'middle')
                .text((d:any)=>d.data.name)
                // .attr('text-anchor', (d: any) => ( d.children || d._childrean ? 'end' : 'start'))
                // .text((d: any) => ((d.depth<3||d.centered)?d.data.name:''))
            
            let nodeUpdate = nodeEnter.merge(node)
            nodeUpdate.transition()
                .duration(duration)
                .attr('transform', (d: any) => 'translate(' + d.x + ',' + d.y + ')')
            nodeUpdate.select('rect.node')
                .attr('cursor', 'pointer')
                // .style("opacity", (d:any)=>this_.reset?1:(d.centered?1:0.5))
            nodeUpdate.select('rect.node_bg')
                .transition()
                .duration(duration)
                .style('opacity', (d: any) => {
                    return (d._children ? 1 : 0)
                })
            // nodeUpdate.select('text')
            // .text((d: any) => ((d.depth<3||d.centered)?d.data.name:''))

            let nodeExit = node.exit().transition()
                .duration(duration)
                .attr('transform', (d: any) => 'translate(' + source.x + ',' + source.y + ')')
                .remove()
            nodeExit.select('rect')
                .attr('opacity', 1e-6)
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
                L ${d.x} ${(d.y + s.y) / 2},
                L  ${s.x} ${(d.y + s.y) / 2} 
                L ${s.x} ${s.y}`
                return path
            }

            function click(d: any) {
                onSelect(d.data.name)
                this_.reset = !this_.reset
                const center=(d:any)=>d.centered = !d.centered
                center(d)
                

                if (d.children) {
                    d._children = d.children
                    d.children = null
                } else if(d._children) {
                    d.children = d._children
                    d._children.forEach(center)
                    d._children = null
                }
                let box=find_box(d, [Infinity,0, Infinity,0])
                update(d)
            }
        }
    }

    componentWillMount() {
        this.getData()
    }

    render() {
        return <div className='SimpleTree View' 
        ref={(ref)=>{this.ref=ref}}
        id={this.props['treeType']} />
    }
}


function find_box(parent:TreeNode, box:number[]){
    box=compare(parent, box)
    let children = parent.children||parent._children
    
    if(children){
        children.forEach((child:TreeNode)=>{
            box=find_box(child, box)
        })
    }
    
    return box
}
function compare(node:TreeNode, box:number[]){
    box[0]=node.x<box[0]?node.x:box[0]
    box[1]=node.x>box[1]?node.x:box[1]
    box[2]=node.y<box[2]?node.y:box[2]
    box[3]=node.y>box[3]?node.y:box[3]
    return box
}