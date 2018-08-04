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
# for nn in evo:
#     if '1.1' in nn['application'][0]:
#         for parent in nn['parents']:
#             parent['link_category'] = ('=>').join(
#                 [cnn(arc) for arc in parent['link_category'].split('=>')]
#             )
          
#     else:
#         for parent in nn['parents']:
#             parent['link_category'] = ('=>').join(
#                 [rnn(arc) for arc in parent['link_category'].split('=>')]
#             )


polyInception =     {
        "training": [
            "3.4.1.dropout",
            "3.2.1.SGD with momentum",
            "3.4.2.weight decay",
            "2.2.2.2.1.1.standard relu"
        ],
        "url": "https://arxiv.org/abs/1611.05725",
        "citation": "32",
        "ID": "polyInception",
        "application": [
            "1.1.1.general recognition"
        ],
        "parents": [
            {
                "link_info_l": "generalize the additive combination in Inception residual units via various forms of polynomial compositions; encourages the structural diversity and enhances the expressive power",
                "ID": "inception_resNet",
                "link_info_s": "generalize",
                "link_category": "skip connections+multi-branch=>skip connections+multi-branch"
            }
        ],
        "architecture": [
            "multi-branch",
            "skip connections"
        ],
        "date": "2016.12.17",
        "variants": [
        ],
        "fullname": "polyNet",
        "names": [
            {
                "imagenet val top5": 4.25,
                "imageNet val top1": 18.71,
                "SVHN": None,
                "cifar10": None,
                "params": 92,
                "cifar100": None,
                "name": "PolyNet"
            }
        ]
    },

evo.append(polyInception)

savefile = open('evolution.json', 'w')
json.dump(evo, savefile)
