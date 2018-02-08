import * as constants from '../constants'



export interface SelectArc{
    type:constants.SELECT_ARC,
    node:string
}
export function selectArc(node:string):SelectArc{
    return {
        type:constants.SELECT_ARC,
        node
    }
}

export interface SelectTrain{
    type:constants.SELECT_TRAIN,
    node:string
}
export function selectTrain(node:string):SelectTrain{
    return {
        type:constants.SELECT_TRAIN,
        node
    }
}

export interface SelectApp{
    type:constants.SELECT_APP,
    node:string
}
export function selectApp(node:string):SelectApp{
    return {
        type:constants.SELECT_APP,
        node
    }
}

export interface SelectNN{
    type:constants.SELECT_NN,
    nns:string[]
}
export function selectNN(nns:string[]):SelectNN{
    return {
        type:constants.SELECT_NN,
        nns
    }
}
// export type EnthusiasmAction = IncrementEnthusiasmAction | DecrementEnthusiasmAction
export type AllActions = SelectApp|SelectArc|SelectTrain
