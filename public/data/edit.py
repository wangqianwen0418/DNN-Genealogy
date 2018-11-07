import json
from collections import OrderedDict
def cnn(name):
    if not name:
        return ''
    CNN = ['streamlined', 'skip connections', 'multi-branch', 'depthwise separable conv']
    try:
        return CNN[ord(name)%32-1]
    except Exception:
        return ('+').join([CNN[ord(arc)%32-1] for arc in name.split('+')])

def rnn(name):
    if not name:
        return ''
    RNN = ['stacked', 'bidirectional', 'multiple time scale', 'gated', 'tree-structured']
    try:
        return RNN[ord(name)%32-1]
    except Exception:
        
        return ('+').join([RNN[ord(arc)%32-1] for arc in name.split('+')])

key_order = [
    "ID",
    "fullname",
    "application",
    "parents",
    "architecture",
    "training",
    "citation",
    "date",
    "names"
]

train_file = open('./train.json')
train_info = json.load(train_file)
new_info = []
for cate in train_info:
    new_cate = OrderedDict()
    new_cate['name'] = cate['name']
    new_cate['children'] = []
    for child in cate['children']:
        new_child = OrderedDict()
        new_child['name'] = child['name']
        for key in child:
            if key not in ['name', 'id', 'depth', 'size']:
                new_child[key] = child[key]
        new_cate['children'].append(new_child)
    new_info.append(new_cate)
    
newfile = open('./train2.json', 'w')
json.dump(new_info, newfile)

# dnnfile = open('./dnns.json','r')
# dnns = json.load(dnnfile)
# print(len(dnns))

# textfile = open('./textInfo.json','r')
# texts = json.load(textfile)

# for dnn in dnns:
#     id = dnn['ID']
#     if not id in texts:
#         texts[id] = {
#         "info": "",
#         "fullname": "",
#         "links": [
#         ]
#     }

# newTextfile = open('./textInfo2.json','w')
# json.dump(texts, newTextfile)


# new_nns = []
# for nn in evo:
#     new_nn = OrderedDict()
#     for k in key_order:
#         new_nn[k] = nn[k]
#     new_nns.append(new_nn)
# print(new_nns)

# newfile = open('./dnns.json', 'w')
# new_nns.sort(key=lambda x: x['application'][0].split('.')[0])
# json.dump(new_nns, newfile)

# datasets=[
#     "params",
#     "imagenet val top5",        
#     "imageNet val top1",
#     "SVHN",
#     "cifar10",        
#     "cifar100"
# ]

# cnnTable = {
#     "name": 'image classification',
#     "modelIDs": [],
#     "datasets": datasets,
#     "models": {}
# }

# for nn in evo:
#     if '1.1' in nn['application'][0]:
#         cnnTable['modelIDs'].append([nn['ID'], [name['name'] for name in nn['names']] ])
#         for model in nn['names']:
#             scores = []
#             for dataset in datasets:
#                 if model[dataset] and dataset!="params":
#                     scores.append(100-model[dataset])
#                 elif dataset=="params":
#                     scores.append(model[dataset])
#                 else:
#                     scores.append(0)
#             cnnTable['models'][model['name']] = scores
          
#     # else:
#     #     for parent in nn['parents']:
#     #         parent['link_category'] = ('=>').join(
#     #             [rnn(arc) for arc in parent['link_category'].split('=>')]
#     #         )



# savefile = open('performances.json', 'w')
# json.dump([cnnTable], savefile)
