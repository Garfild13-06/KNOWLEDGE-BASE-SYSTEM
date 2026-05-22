import re


def strip_html(html):
    text = re.sub(r'<[^>]+>', ' ', html or '')
    return re.sub(r'\s+', ' ', text).strip()


def make_snippet(text, query, max_length=160):
    plain = strip_html(text)
    if not plain:
        return ''
    lower_plain = plain.lower()
    lower_query = query.lower()
    index = lower_plain.find(lower_query)
    if index == -1:
        return plain[:max_length] + ('…' if len(plain) > max_length else '')
    start = max(0, index - 40)
    excerpt = plain[start : start + max_length]
    if start > 0:
        excerpt = '…' + excerpt
    if start + max_length < len(plain):
        excerpt += '…'
    return excerpt
