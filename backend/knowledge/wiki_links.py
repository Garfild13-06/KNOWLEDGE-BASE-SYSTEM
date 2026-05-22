import re

from django.utils.text import slugify

WIKI_LINK_PATTERN = re.compile(r'\[\[([^\]]+)\]\]')


def extract_wiki_titles(content):
    if not content:
        return []
    return list(dict.fromkeys(WIKI_LINK_PATTERN.findall(content)))


def ensure_article_slug(article):
    if article.slug:
        return article.slug
    from .models import Article

    base = slugify(article.title) or f'article-{article.pk or "new"}'
    slug = base[:200]
    counter = 1
    qs = Article.objects.filter(organization_id=article.organization_id, slug=slug)
    if article.pk:
        qs = qs.exclude(pk=article.pk)
    while qs.exists():
        slug = f'{base}-{counter}'[:220]
        counter += 1
        qs = Article.objects.filter(organization_id=article.organization_id, slug=slug)
        if article.pk:
            qs = qs.exclude(pk=article.pk)
    return slug


def resolve_wiki_links(organization, titles):
    from .models import Article

    resolved = []
    for title in titles:
        article = Article.objects.filter(
            organization=organization,
            title__iexact=title.strip(),
        ).first()
        if not article:
            article = Article.objects.filter(
                organization=organization,
                slug__iexact=slugify(title),
            ).first()
        resolved.append({
            'title': title,
            'article_id': article.id if article else None,
            'slug': article.slug if article else None,
        })
    return resolved


def find_backlinks(organization, article):
    from .models import Article

    needle = f'[[{article.title}]]'
    needle_slug = f'[[{article.slug}]]' if article.slug else None
    results = []
    for candidate in Article.objects.filter(organization=organization).exclude(pk=article.pk):
        content = candidate.content or ''
        if needle in content or (needle_slug and needle_slug in content):
            results.append(candidate)
    return results
