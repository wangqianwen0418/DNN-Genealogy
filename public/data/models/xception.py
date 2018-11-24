import keras
import json

model = keras_applications.xception.Xception(include_top=True, weights=None, input_tensor=None, input_shape=None, pooling=None, classes=1000)
json_string = model.to_json()
summary = json.loads(json_string)

params = {}
for layer in model.layers:
    params[layer.name] = layer.count_params()
summary['params'] = params

with open("xception.json", "w") as jsonf:
    jsonf.write(json.dumps(summary))
jsonf.close()