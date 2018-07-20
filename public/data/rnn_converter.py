import json 
jsonfile = open('rnn_data.json')
oldjson = json.load(jsonfile)
newjson = []
for item in oldjson:
    table = item['table']
    for tab in table:
        newTab = {}
        newTab['name'] = tab['field']
        newTab['datasets'] = tab['dataset']
        newTab['modelIDs'] = item['ID']
        newTab['models'] = {}
        for i, model in enumerate( tab['model'] ):
            newTab['models'][model] = [d[int(i)] for d in tab['acc']]
        newjson.append(newTab)

newJsonFile = open('rnn_scores.json', 'w')
json.dump(newjson, newJsonFile)

