import math
import re
from collections import Counter

from .features import semantic_search_enabled
from .models import Article, ArticleEmbedding


def _tokenize(text):
    return re.findall(r'[\wа-яА-ЯёЁ]+', (text or '').lower())


def _tf_vector(tokens):
    counts = Counter(tokens)
    total = sum(counts.values()) or 1
    return {token: count / total for token, count in counts.items()}


def _cosine(a, b):
    if not a or not b:
        return 0.0
    keys = set(a) | set(b)
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def build_embedding_vector(text):
    return _tf_vector(_tokenize(text))


def update_article_embedding(article):
    vector = build_embedding_vector(article.content_plain or article.title)
    ArticleEmbedding.objects.update_or_create(
        article=article,
        defaults={'vector': vector},
    )


def semantic_similar_articles(organization, article, limit=5):
    if not semantic_search_enabled(organization):
        return Article.objects.none()
    update_article_embedding(article)
    source = article.embedding.vector if hasattr(article, 'embedding') else build_embedding_vector(article.content_plain)
    if not source:
        return Article.objects.none()
    candidates = Article.objects.filter(
        organization=organization, is_published=True
    ).exclude(pk=article.pk).select_related('section')[:200]
    scored = []
    for candidate in candidates:
        try:
            emb = candidate.embedding.vector
        except ArticleEmbedding.DoesNotExist:
            emb = build_embedding_vector(candidate.content_plain)
        scored.append((_cosine(source, emb), candidate))
    scored.sort(key=lambda row: row[0], reverse=True)
    return [row[1] for row in scored[:limit] if row[0] > 0.01]
