import json
import keras


def generate_json(model, filename):
    json_string = model.to_json()
    summary = json.loads(json_string)

    params = {}
    for layer in model.layers:
        params[layer.name] = int(layer.count_params())
    summary['params'] = params

    with open("{}.json".format(filename), "w") as jsonf:
        json.dump(summary, jsonf)
    jsonf.close()


model = keras.applications.vgg19.VGG19(include_top=True, weights=None, input_tensor=None, input_shape=None, pooling=None, classes=1000)

generate_json(model, "vgg19")