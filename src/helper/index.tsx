
import getInterest from "./getInterest"
import getColor from './getColor';
import getLayerColor from './getLayerColor';

export {getInterest, getColor, getLayerColor}

export let capFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

export let cutLabel = (name:string, l: number)=>(name.length>l?(name.slice(0,l)+'...'):name)
