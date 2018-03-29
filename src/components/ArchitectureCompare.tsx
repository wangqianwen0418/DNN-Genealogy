import * as React from "react"
import Network from "./Network"
import { EvoNode } from '../types'
import axios from "axios"
import { TreeSelect, Cascader, Dropdown, Menu, Button } from "antd";

const mapNetworkToArcs = [{
    value: "fractalNet",
    label: "fractalNet",
    children: [{
        value: "fractal_40",
        label: "fractalNet-40"
    }]
}, {
    value: "inception_resNet",
    label: "inception_resNet"
}, {
    value: "mobile",
    label: "mobileNet"
}, {
    value: "nasNet",
    label: "nasNet",
    children: [{
        value: "nasNet_cifar",
        label: "nasNet_cifar"
    }, {
        value: "nasNet_small",
        label: "nasNet_small"
    }, {
        value: "nasNet_large",
        label: "nasNet_large"        
    }]
}, {
    value: "denseNet",
    label: "denseNet",
    children: [{
        value: "denseNet_40_12",
        label: "denseNet_40_12"
    }, {
        value: "denseNet_100_12",
        label: "denseNet_100_12"
    }, {
        value: "denseNet_100_24",
        label: "denseNet_100_24"
    }, {
        value: "denseNet_121",
        label: "denseNet_121"
    } ,{
        value: "denseNet_201",
        label: "denseNet_201"
    } ,{
        value: "denseNet_bc_100_12",
        label: "denseNet-BC(l=100, k=12)"
    }]
}, {
    value: "VGG",
    label: "VGG",
    children: [{
        value: "vgg19",
        label: "vgg19"
    }]
}, {
    value: "squeezeNet",
    label: "squeezeNet"
}, {
    value: "resNet",
    label: "resNet",
    children: [{
        value: "resNet_v1_152",
        label: "resNet_v1_152"
    }, {
        value: "resNet_v1_50",
        label: "resNet_v1_50"
    }, {
        value: "resNet_v1_56_cifar",
        label: "resNet_v1_56_cifar"
    }, {
        value: "resNet_v1_110_cifar",
        label: "resNet_v1_110_cifar"
    }, {
        value: "resNet_v2",
        label: "resNet_v2"
    }, {
        value: "resNet_v2_56_cifar",
        label: "resNet_v2_56_cifar"
    },{
        value: "resNet_v2_110_cifar",
        label: "resNet_v2_110_cifar"
    }]
}]

export interface Props {
    network: string,
}

export interface State {
    model1: string,
    model2: string,
    nodes1: EvoNode[],
    nodes2: EvoNode[]
}

export default class ArchitectureCompare extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            model1: "vgg19",
            model2: "",
            nodes1: [],
            nodes2: []
        }
        this.getData = this.getData.bind(this)
    }

    componentWillReceiveProps(nextProps: Props) {
        console.log('yuanjun', nextProps)
        let arcs: any = mapNetworkToArcs.filter((d: any) => nextProps.network == d.label)[0], model: string = ""
        console.log(arcs)
        if (arcs.hasOwnProperty('children'))
            model = arcs.children[0].value
        else
            model = arcs.value
        this.getData(model, 1)
    }

    async getData(model: string, idx: number) {
        let res = await axios.get('../../data/recognition/' + model + '.json'), nodes: EvoNode[]
        if (idx === 1)
            this.setState({nodes1: res.data.config.layers})
        else if (idx === 2)
            this.setState({nodes2: res.data.config.layers})

    }

    render() {
        let network = this.props.network
        let that = this
        return <div className="ArchitectureCompare">
            <div style={{float: "left", width: "50%"}}>
            <Cascader
                options={mapNetworkToArcs.filter((d: any) => network == d.label)}
                placeholder={`Choose Model in ${network}`}
                onChange={(value: any) => {this.getData(value[value.length - 1], 1)}}
                expandTrigger="hover"
                >
            </Cascader>
            <Network nodes={this.state.nodes1} />
            </div>
            <div style={{float: "left", width: "50%"}}>
            <Cascader
                options={mapNetworkToArcs}
                placeholder="Choose Model"
                onChange={(value: any) => {console.log(value); this.getData(value[value.length - 1], 2)}}
                expandTrigger="hover"
                >
            </Cascader>
            <Network nodes={this.state.nodes2} />
            </div>
        </div>
    }
}