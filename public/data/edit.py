import json
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

evofile = open('./evolution.json','r')
evo = json.load(evofile)
print(len(evo))

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
