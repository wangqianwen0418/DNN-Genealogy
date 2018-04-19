from PIL import Image
import json
jsonFile = '../data/evolution_dag.json'
with open(jsonFile, 'r') as json_file:
    data = json.load(json_file)
ratio = dict() 
for model in data:
    name = model['ID']
    try:
        im = Image.open('./{}_.png'.format(name))
        w, h = im.size
        ratio[name]= {'w':w, 'h':h}
    except Exception:
        pass
# print(ratio)
with open('ratio.json', 'w') as save_file:
    json.dump(ratio, save_file)