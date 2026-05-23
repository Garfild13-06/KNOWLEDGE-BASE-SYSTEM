import html
import io
import zipfile
from xml.sax.saxutils import escape

from .utils import strip_html


def article_to_markdown(article):
    lines = [
        f'# {article.title}',
        '',
        f'- Раздел: {article.section.name}',
        f'- Обновлено: {article.updated_at.isoformat()}',
        '',
        strip_html(article.content or ''),
    ]
    return '\n'.join(lines)


def build_section_zip(section, articles):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        readme = f'# Раздел: {section.name}\n\n{section.description or ""}\n'
        zf.writestr('README.md', readme)
        for article in articles:
            filename = f'{article.slug or article.id}.md'
            zf.writestr(filename, article_to_markdown(article))
    buffer.seek(0)
    return buffer.getvalue()


def simple_html_export(article):
    body = article.content or ''
    return (
        '<!DOCTYPE html><html><head><meta charset="utf-8">'
        f'<title>{escape(article.title)}</title></head>'
        f'<body><h1>{escape(article.title)}</h1>{body}</body></html>'
    )
