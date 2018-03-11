import * as React from 'react'
import { Modal } from 'antd'
import Network from './Network'
import axios from 'axios'
import { EvoNode } from '../types';

const info = Modal.info

export async function showDetailedStructure(label: string) {
    let res = await axios.get('../../data/recognition/denseNet_40_12.json'),
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
