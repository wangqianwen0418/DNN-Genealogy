import { EvoNode } from './types';
import * as dagre from './lib/dagre.js';
import { Node, GraphEdge } from './lib/@types/dagre';

const workercode = ()=>{
    onmessage = function(e: MessageEvent){
        let dag = new dagre.graphlib.Graph();
        let {layers, selectedLayers, nodeH, margin, node_w, expandMaxH} = e.data
        dag.setGraph({ 
                ranksep: nodeH * .6,
                marginx: margin,
                marginy: margin,
                rankdir: 'TB',
                edgesep: node_w * 0.02 
            });
        dag.setDefaultEdgeLabel(() => { return {}; });
        layers.forEach((layer:any) => {
                let details = JSON.stringify(layer.config, null, 2)
                                .replace(/"/g, '').split('\n'), 
                textLength = details.length * 12 + 30
                dag.setNode(layer.name, { 
                    label: layer.name,
                    width: layer.name.length*nodeH/4 + nodeH,
                    height: nodeH,
                    className: layer.class_name,
                    config: layer.config,
                    expand: false,
                    location: 0,
                    textLength: textLength,
                    details: details,
                })
                // IR model or keras model
                if (layer.inbound_nodes.length > 0) {
                    let inputs = layer.inbound_nodes[0]
                    inputs.forEach((input:string[]|any[]) => {
                        dag.setEdge(input[0], layer.name)
                    })
                }
            })
            
            // Selected Layers
        selectedLayers.forEach((layer:any) => {
                let node = dag.node(layer)
                dag.setNode(layer, {
                    ...node,
                    height: node.textLength > expandMaxH ? expandMaxH : node.textLength,
                    expand: true
                })
            })
    
        dagre.layout(dag)
        let nodes:Node[] = [], edges:GraphEdge[] = []
        dag.nodes().forEach((v:string) => {
                if (dag.node(v)) {
                    nodes.push(dag.node(v))
                }
            })
        dag.edges().forEach((e:string) => {    
                edges.push(dag.edge(e))
            });
        let height = dag.graph().height,
                width = dag.graph().width
                // console.log(nodes)        
        postMessage({ nodes, edges, height, width },)
    }
}

let code = workercode.toString();
code = code.substring(code.indexOf('{')+1, code.lastIndexOf('}'));

const blob = new Blob([code], {type: 'application/javascript'});
const workerScript = URL.createObjectURL(blob);

export default workerScript;