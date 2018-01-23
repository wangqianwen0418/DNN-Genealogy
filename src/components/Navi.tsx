import * as React from "react"
import "./Navi.css"
import { Breadcrumb } from "antd"

export interface Props {
    selected: string[]
}

export default class Navi extends React.Component<Props, {}>{
    render() {
        let items = this.props.selected, flag = 4
        let breadcrumbItem = items.map(
            item => {
                if (!item) --flag
                return <Breadcrumb.Item>{item}</Breadcrumb.Item>
            }
        )
        if (!flag) breadcrumbItem = [<Breadcrumb.Item>No Selected Tags</Breadcrumb.Item>]
        return <div className="Navi" style={{ height: "20px" }}>
            <Breadcrumb separator=">">
                {breadcrumbItem}
            </Breadcrumb>
        </div>
    }
}