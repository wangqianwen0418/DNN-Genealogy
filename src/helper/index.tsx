
import getInterest from './getInterest'
import getColor from './getColor';
import getLayerColor from './getLayerColor';
import prepareBoxplotData from './boxplotData';

export {getInterest, getColor, getLayerColor, prepareBoxplotData}

export let capFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

export let cutLabel = (name:string, l: number)=>(name.length>l?(name.slice(0,l)+'...'):name)

export let generateOptions = (dnns:any[]) => {
    return dnns.map(dnn => {
        return {
            label: dnn.ID,
            value: dnn.ID,
            children: (dnn.models) ? dnn.models.map((d:string)=>{
                return {value:d, label: d}
            }) : []
        }
    })
}
