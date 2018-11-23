
function asc(arr:number[]) {
    arr.sort(function (a:number, b:number) {
        return a - b;
    });
    return arr;
}

var quantile = function(ascArr:number[], p:number) {
    var H = (ascArr.length - 1) * p + 1,
        h = Math.floor(H),
        v = +ascArr[h - 1],
        e = H - h;
    return e ? v + e * (ascArr[h] - v) : v;
};

var prepareBoxplotData = function (rawData:any[], opt:any={layout: 'vertical'}) {
    opt = opt || [];
    var boxData = [];
    var outliers = [];
    var axisData = [];
    var boundIQR = opt.boundIQR;
    var useExtreme = boundIQR === 'none' || boundIQR === 0;

    for (var i = 0; i < rawData.length; i++) {
        axisData.push(i + '');
        var ascList = asc(rawData[i].slice());

        var Q1 = quantile(ascList, 0.25);
        var Q2 = quantile(ascList, 0.5);
        var Q3 = quantile(ascList, 0.75);
        var min = ascList[0];
        var max = ascList[ascList.length - 1];

        var bound = (boundIQR == null ? 1.5 : boundIQR) * (Q3 - Q1);

        var low = useExtreme
            ? min
            : Math.max(min, Q1 - bound);
        var high = useExtreme
            ? max
            : Math.min(max, Q3 + bound);

        boxData.push([low, Q1, Q2, Q3, high]);

        for (var j = 0; j < ascList.length; j++) {
            var dataItem = ascList[j];
            if (dataItem < low || dataItem > high) {
                var outlier = [i, dataItem];
                opt.layout === 'vertical' && outlier.reverse();
                outliers.push(outlier);
            }
        }
    }
    return {
        boxData: boxData,
        outliers: outliers,
        axisData: axisData
    };
};

export default prepareBoxplotData