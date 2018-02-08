import SimpleTree from '../components/SimpleTree';
import * as actions from '../actions/';
import { StoreState } from '../types/index';
import { connect, Dispatch } from 'react-redux';

export function mapStateToProps(state:StoreState) {
    return {
        treeType:"Architecture"

    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SelectArc>) {
    return {
        onSelect:(arc_node:string)=>{dispatch(actions.selectArc(arc_node))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SimpleTree);