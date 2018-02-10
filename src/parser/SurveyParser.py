import csv
import re
import json


class SurveyParser:
    """
    Model {
        ID: str,
        url: str,
        date: str,
        *citation: str,
        application: list(str),
        training: list(str),
        architecture: list(str),
        names: array(Name),
        parents: array(Parents),
    }

    Parent {
        ID: str,
        link_info: str,
    }

    Name {
        name: str,
        datasets: indexer,
        params: float,
    }
    """
    def __init__(self, filepath):
        self.data = list(csv.reader(open(filepath, 'r'), delimiter='\t'))

    def get_split_data(self, s):
        return [datum.strip() for datum in s.split(';') if datum]

    def save_json(self, filepath):
        models = set()  # check the validity of 'parent' attr
        result = list()
        title_line = []
        dataset_start = -1
        for label, datum in enumerate(self.data):
            # a title line indicates the beginning of a new classification
            if 'application' and 'training' and 'architecture' in datum:
                title_line = datum
                dataset_start = datum.index('name')
                continue

            # add a new model
            if datum[0]:
                if datum[0] in models:
                    print('Error in line %d: Model "%s" already exists.' % (label, datum[0]))
                    break

                models.add(datum[0])
                result.append({
                    'ID': datum[0],
                    'url': datum[1],
                    'date': datum[2],
                    'citation': datum[3],
                    'application': datum[4],
                    'training': self.get_split_data(datum[5]),
                    'architecture': self.get_split_data(datum[6]),
                    'names': None,
                    'parents': None,
                })

            # add a parent to current model
            if datum[7]:
                if not result[-1]['parents']:
                    result[-1]['parents'] = list()
                if datum[7] not in models:
                    print('Error in line %d: Parent "%s" not exists.' % (label, datum[7]))
                result[-1]['parents'].append({
                    'ID': datum[7],
                    'link_info': datum[8],
                })

            # add datasets to current model
            if datum[dataset_start]:
                if not result[-1]['names']:
                    result[-1]['name'] = list()

                cur_name = {
                    'name': datum[dataset_start],
                    'params': 0.0 if not datum[dataset_start + 1] or datum[dataset_start + 1] == 'na'   else float(datum[dataset_start + 1]),
                }
                for i in range(dataset_start + 2, len(datum)):
                    if not title_line[i] or title_line[i] == 'model path':
                        continue
                    if not datum[i] or datum[i].lower() == 'na':
                        cur_name[title_line[i]] = None
                    else:
                        cur_name[title_line[i]] = float(datum[i])
                result[-1]['name'].append(cur_name)

        result_json = json.dumps(result, indent=2)
        f = open(filepath, 'w')
        f.write(result_json)
        f.close()


if __name__ == '__main__':
    parser = SurveyParser('../../public/data/survey(modified).tsv')
    parser.save_json('../../public/data/survey.json')
