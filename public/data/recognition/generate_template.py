import json

# model is a Keras model object
json_string = model.to_json()
summary = json.loads(json_string)

params = {}
for layer in model.layers:
    params[layer.name] = layer.count_params()
summary['params'] = params

with open("filename.json", "w") as jsonf:
    jsonf.write(json.dumps(summary))
jsonf.close()