import CorpusCompare from '../components/CorpusCompare';
import * as actions from '../actions/';
import { StoreState } from '../types/index';
import { connect, Dispatch } from 'react-redux';

export function mapStateToProps(state:StoreState) {
    return {
        nn:state.nn
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.AllActions>) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CorpusCompare);