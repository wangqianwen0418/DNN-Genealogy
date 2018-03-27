import * as React from 'react'
import { Modal } from 'antd'
import Network from './Network'
import axios from 'axios'
import { EvoNode } from '../types';

const info = Modal.info

const mapLabelToJson = {
    "fractalNet-40": "fractal_40",
    "inception_resNet": "inception_resNet",
    "mobileNet-160": "mobile",
    "mobileNet-224": "mobile",
    "nasNet_cifar": "nasNet_cifar",
    "nasNet_small": "nasNet_small",
    "nasNet_large": "nasNet_large",
    "denseNet_40_12": "denseNet_40_12",
    "denseNet_100_12": "denseNet_100_12",
    "denseNet_100_24": "denseNet_100_24",
    "denseNet_121": "denseNet_121",
    "denseNet_201": "denseNet_201",
    "denseNet-BC(l=100, k=12)": "denseNet_bc_100_12",
    "vgg19": "vgg19",
    "squeezeNet": "squeezeNet",
    "resNet_v1_152": "resNet_v1_152",
    "resNet_v1_50": "resNet_v1_50",
    "resNet_v2": "resNet_v2",
    "resNet_v2_56_cifar": "resNet_v2_56_cifar",
    "resNet_v1_110_cifar": "resNet_v1_110_cifar",
    "resNet_v1_56_cifar": "resNet_v1_56_cifar",
    "resNet_v2_110_cifar": "resNet_v2_110_cifar",
}

export async function showDetailedStructure(label: string) {
    let res = await axios.get('../../data/recognition/' + (mapLabelToJson[label] ? mapLabelToJson[label] : "vgg19") + '.json'),
        datum: EvoNode[] = res.data.config.layers

    return info({
        title: (
            <div style={{textAlign:'center'}}>Detailed Structure of {label}</div>
        ),
        content: (
            <Network nodes={datum} />
        ),
        okText: 'OK',
        iconType: '',
        width: '40%',
        onOk() {
            // do nothing
        },
    });
}
