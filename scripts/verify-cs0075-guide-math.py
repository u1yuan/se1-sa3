"""Independent stdlib arithmetic and coverage checks for the embedded guide.

Run: python scripts/verify-cs0075-guide-math.py
The build-time Python visualization scripts are also retained in the HTML.
"""
from pathlib import Path
from html.parser import HTMLParser
import json
import math
import re

root = Path(__file__).resolve().parents[1]
doc = (root / 'public/study-guides/cs0075/study-guide-1.html').read_text(encoding='utf-8')
frames = json.loads(re.search(r'const walkthroughs=(.*?);\s*const gallery=', doc, re.S)[1])

def entropy(counts):
    return -sum(c / sum(counts) * math.log2(c / sum(counts)) for c in counts if c)

def mse(values):
    mean = sum(values) / len(values)
    return sum((x - mean)**2 for x in values) / len(values)

parent = entropy([9, 5])
groups = [([2, 3], [4, 0], [3, 2]), ([2, 2], [4, 2], [3, 1]), ([3, 4], [6, 1]), ([3, 3], [6, 2])]
gains = []
for children in groups:
    weighted = sum(sum(c) / 14 * entropy(c) for c in children)
    gain = parent - weighted
    gains.append(gain)
    assert f'{weighted:.6f}' in frames['id3'][2]['detail']
    assert f'{gain:.6f}' in frames['id3'][2]['detail']
assert gains.index(max(gains)) == 0

for step, left, right in [(1, [0, 1], [2, 1]), (2, [0, 2], [2, 0]), (3, [1, 2], [1, 0])]:
    weighted = sum(left) / 4 * entropy(left) + sum(right) / 4 * entropy(right)
    split_info = entropy([sum(left), sum(right)])
    assert f'{(1 - weighted) / split_info:.6f}' in frames['c45'][step]['detail']

prices = [100, 120, 140, 300, 320]
assert sum(prices) / 5 == 196
assert mse(prices) == 8864
split_mse = 3 / 5 * mse(prices[:3]) + 2 / 5 * mse(prices[3:])
assert split_mse == 200
assert math.isclose(mse([x / 10 for x in prices]), 88.64)
assert math.isclose((mse(prices) - split_mse) / mse(prices) * 100, 97.74368231046931)
assert '196' in frames['cart'][1]['description']
assert '8864' in frames['cart'][1]['description']
assert '8664' in frames['cart'][3]['description']
assert '97.7437%' in frames['cart'][3]['detail']
assert math.isclose(1 - .6**2 - .4**2, .48)
assert math.isclose(.4 * 0 + .6 * (1 - (2/6)**2 - (4/6)**2), 4/15)

observed = [[40, 10], [10, 40]]
row_sums = [sum(row) for row in observed]
col_sums = [sum(row[j] for row in observed) for j in range(2)]
expected = [[r*c/100 for c in col_sums] for r in row_sums]
chi2 = sum((observed[i][j] - expected[i][j])**2 / expected[i][j] for i in range(2) for j in range(2))
assert chi2 == 36
assert math.isclose(math.erfc(math.sqrt(chi2 / 2)), 1.9731752900753933e-9)
assert math.isclose(4 * (15 - .5)**2 / 25, 33.64)
assert '36' in frames['chaid'][2]['description']

assert [2+3*max(0, x-5) for x in [2, 4, 5, 7, 9]] == [2, 2, 2, 8, 14]
assert math.isclose((1 - 1/10000)**10000, math.exp(-1), rel_tol=1e-4)
prior = 70
for step, (h, expected) in enumerate(zip([20, 18, 16], [72, 73.8, 75.4]), 1):
    prior += .1*h
    assert math.isclose(prior, expected)
    assert f'New F={expected:g}' in frames['gbm'][step]['description']
for point, y in zip([(2, 3), (3, 3), (1, 1), (2, 1)], [1, 1, -1, -1]):
    assert y * (point[1] - 2) == 1

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.questions = self.answers = self.lessons = self.inputs = self.textareas = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = a.get('class', '').split()
        self.lessons += 'lesson' in classes
        self.questions += 'question' in classes
        self.answers += 'answer' in classes
        self.textareas += tag == 'textarea'
        self.inputs += tag == 'input' and a.get('type') == 'checkbox'
        assert not (tag in ['script', 'img', 'iframe', 'link'] and any(k in a for k in ['src', 'href'])), 'External runtime dependency'

audit = Audit()
audit.feed(doc)
assert (audit.lessons, audit.questions, audit.answers, audit.inputs, audit.textareas) == (8, 40, 40, 40, 40)
assert sum(map(len, frames.values())) == 39
for api in ['localStorage.', 'sessionStorage.', 'indexedDB.', 'fetch(', 'XMLHttpRequest', 'WebSocket(']:
    assert api not in doc
print('Independent arithmetic passed for all eight algorithms; 8 lessons, 39 steps, 40 prompts, 40 answers, 40 checklists; no runtime dependencies or storage APIs.')
