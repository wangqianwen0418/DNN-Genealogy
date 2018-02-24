import csv
import re
import json


class DfsPos:
    def __init__(self, imax, jmax):
        self.imax = imax
        self.jmax = jmax
        self.i = 0
        self.j = 0

    @property
    def has_next(self):
        return self.i <= self.imax and self.j <= self.jmax

    def cur(self):
        return self.i, self.j

    def next(self):
        self.j += 1
        if self.j > self.jmax:
            self.i += 1
            self.j = 0


class TaxonomyParser:
    def __init__(self, filepath):
        self.data = list(csv.reader(open(filepath, 'r'), delimiter='\t'))

    def dfs(self, insert_pos, dfs_pos):
        parent_split = insert_pos['id'].split('.')[:-1]

        while dfs_pos.has_next:
            i, j = dfs_pos.cur()
            if self.data[i][j]:
                # extract id
                grid = self.data[i][j]
                if grid == '...':
                    dfs_pos.next()
                    continue
                identity = re.findall('^((?:[0-9]+\.)+)(.+)$', grid)
                if len(identity) != 1:
                    print('Error in (%s): Format error.' % grid)
                    return False
                identity = identity[0]
                id_split = identity[0].split('.')[:-1]

                if len(id_split) != j + 1 or len(id_split) > len(parent_split) + 1:
                    print('Error in (%s): Id does not match with the grid in which it locates.' % grid)
                    return False

                if (insert_pos['id'] == '0' and len(id_split) == 1) or (insert_pos['id'] != 0 and len(id_split) == len(parent_split) + 1):
                    if parent_split != id_split[:-1]:
                        print('Error in (%s): Id does not math which parent\'s id.' % grid)
                        return False

                    child_count = len(insert_pos['children']) if 'children' in insert_pos else 0
                    if id_split[-1] != str(child_count + 1):
                        print('Error in (%s): Id does not match which sibling\'s id.' % grid)
                        return False

                    insert_pos.setdefault('children', list())
                    insert_pos['children'].append({
                        'name': identity[1],
                        'size': 0,
                        'id': identity[0],
                        'depth': insert_pos['depth'] + 1
                    })

                    dfs_pos.next()
                    judge = self.dfs(insert_pos['children'][-1], dfs_pos)
                    if not judge:
                        return False
                else:
                    return True
            else:
                dfs_pos.next()

        return True

    def save_json(self, filepath):
        result = {
            'name': 'root',
            'size': 0,
            'id': '0',
            'depth': 0,
        }

        dfs_pos = DfsPos(len(self.data) - 1, len(self.data[0]) - 1)
        judge = self.dfs(result, dfs_pos)
        if judge and not dfs_pos.has_next:
            result_json = json.dumps(result, indent=2)
            f = open(filepath, 'w')
            f.write(result_json)
            # print(result_json, file=f)
            f.close()
            print('Save json success.')
        else:
            print('The file is somehow not iterated completely.')
            print('Please check your tsv file.')


if __name__ == '__main__':
    parser = TaxonomyParser('../public/data/taxonomy.tsv')
    parser.save_json('../public/data/taxonomy.json')
