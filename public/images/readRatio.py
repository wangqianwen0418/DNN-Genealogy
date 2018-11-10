from PIL import Image
import json
jsonFile = '../../src/assets/dnns.json'
with open(jsonFile, 'r') as json_file:
    data = json.load(json_file)
ratio = dict() 
for model in data:
    name = model['ID']
    try:
        im = Image.open('./{}.png'.format(name))
        w, h = im.size
        ratio[name]= {'w':w, 'h':h}
    except Exception:
        print("no "+name)
        ratio[name]= {'w':30, 'h':10}
# print(ratio)
with open('../../src/assets/ratio.json', 'w') as save_file:
    json.dump(ratio, save_file)


        