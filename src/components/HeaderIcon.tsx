import * as React from 'react';
import { Modal, Form, Input, Icon, Select } from 'antd';

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;

export default class HeaderIcon extends React.Component<{}, { visible: boolean }> {
    constructor(props: {}) {
        super(props)
        this.state = {
            visible: false
        }
        this.showModal = this.showModal.bind(this)
        this.closeModal = this.closeModal.bind(this)
    }
    showModal() {
        this.setState({ visible: !this.state.visible })
    }
    closeModal() {
        this.setState({ visible: false })
    }
    render() {
        return (
            <div className="icon" style={{ float: 'right', padding: '2px' }}>
                <span onClick={this.showModal} style={{marginRight: '10px'}}>
                    <img width={35} className="github" src="suggestion.png" />
                </span>
                <a href="https://github.com/wangqianwen0418/DNN-Genealogy" target="_blank">
                    <img width={35} className="github" src="git_icon.png" />
                </a>
                <Modal
                    title="Contribute a new DNN"
                    visible={this.state.visible}
                    cancelText="Cancel"
                    okText="Submit"
                    onOk={this.closeModal}
                    onCancel={this.closeModal}
                    align=" "
                >
                    <div>
                        <Input addonBefore="Title" defaultValue="paper title" autosize={false}/>
                    </div>
                    <div>
                        <Input addonBefore="Application"  autosize={false}/>
                    </div>
                    <div>
                        <Input addonBefore="Implementation Code" autosize={false} />
                    </div>
                    <div>
                    <TextArea rows={4} defaultValue="more details ..."/>
                    </div>

                </Modal>

            </div>
        )
    }
}