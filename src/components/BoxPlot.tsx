import * as React from "react";
import * as d3 from "d3";

export interface Props {
    key: string,
    value: number,
    datum: number[],
    width: number,
    height: number,
    offset: number[]

}
export default class BoxPlot extends React.Component<Props, {}> {
    private scale = d3.scaleLinear()
        .domain([Math.min(...this.props.datum), Math.max(...this.props.datum)])
        .range([0, this.props.width]);
    getQuartiles(datum: number[], percent: number) {
        return d3.quantile(datum, percent) || 0
    }
    getiqr(k:number, d:number[]) {
        
          var q1 = d3.quantile(d, 0.25)||0,
              q3 = d3.quantile(d, 0.75)||0,
              iqr = (q3 - q1) * k,
              i = -1,
              j = d.length;
          while (d[++i] < q1 - iqr);
          while (d[--j] > q3 + iqr);
          return [i, j];
      }
    render() {
        let { height, width, datum, offset, value } = this.props,
            [i,j]=this.getiqr(1.5, datum),
            filtered = datum.slice(i,j)
            
        let boxW = this.scale((this.getQuartiles(datum, 0.75) - this.getQuartiles(datum, 0.25)))
        return <g className="boxplot" transform={`translate(${offset[0]}, ${offset[1]})`}>
            {/* max and min value */}
            <line
                stroke="gray"
                x1={this.scale(datum[i])} y1={0} x2={this.scale(datum[i])} y2={height} /> 
            <line
                stroke="gray"
                x1={this.scale(datum[j])} y1={0} x2={this.scale(datum[j])} y2={height} />
            <line
                stroke="gray"
                x1={this.scale(datum[i])} y1={height / 2}
                x2={this.scale(datum[j])} y2={height / 2} />
            {/* the box */}
            <rect
                x={this.scale(this.getQuartiles(datum, 0.25))} y={0}
                width={boxW} height={height}
                fill="white" stroke="gray" strokeWidth={2}
            >
            </rect>
            {/* the median value */}
            <line
                stroke="gray"
                x1={this.scale(this.getQuartiles(datum, 0.5))} y1={0}
                x2={this.scale(this.getQuartiles(datum, 0.5))} y2={height}
            />
            {/* the current value */}
            <circle
            r="3" fill="transparent"
            stroke="black"
            strokeWidth={2}
            cx={this.scale(value)} cy={height/2} 
            />

        </g>
    }
}