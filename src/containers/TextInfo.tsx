import TextInfo from 'components/TextInfo/TextInfo'
import * as actions from 'actions/';
import { StoreState } from 'types/index';
import { connect, Dispatch } from 'react-redux';

export function mapStateToProps(state:StoreState) {
    return {
        database:state.database,
        selectedNN: state.selectedNN,
        op:state.op,
        textInfo: state.textInfo
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.AllActions>) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TextInfo);