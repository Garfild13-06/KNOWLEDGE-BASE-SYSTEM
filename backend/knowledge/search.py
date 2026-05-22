from datetime import datetime

from django.db import connection
from django.db.models import Case, IntegerField, Q, Value, When
from .models import Article
from .utils import strip_html

MIN_SEARCH_LENGTH = 2
SEARCH_RESULTS_LIMIT = 25


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def build_article_search_queryset(request, query, filters=None):
    filters = filters or {}
    organization = filters.get('organization')
    queryset = Article.objects.select_related('section', 'created_by', 'updated_by')

    if organization:
        queryset = queryset.filter(organization=organization)

    if len(query) < MIN_SEARCH_LENGTH:
        return queryset.none()

    section_id = filters.get('section_id')
    if section_id:
        queryset = queryset.filter(section_id=section_id)

    author = filters.get('author')
    if author:
        queryset = queryset.filter(
            Q(created_by__username__icontains=author)
            | Q(updated_by__username__icontains=author)
        )

    date_from = _parse_date(filters.get('date_from'))
    if date_from:
        queryset = queryset.filter(updated_at__date__gte=date_from)

    date_to = _parse_date(filters.get('date_to'))
    if date_to:
        queryset = queryset.filter(updated_at__date__lte=date_to)

    terms = [term for term in query.split() if term]
    if not terms:
        return queryset.none()

    text_filter = Q()
    for term in terms:
        text_filter &= (
            Q(title__icontains=term)
            | Q(content_plain__icontains=term)
            | Q(content__icontains=term)
        )
    queryset = queryset.filter(text_filter)

    if connection.vendor == 'postgresql':
        try:
            from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

            search_query = SearchQuery(query)
            vector = SearchVector('title', weight='A') + SearchVector('content_plain', weight='B')
            return (
                queryset.annotate(rank=SearchRank(vector, search_query))
                .filter(rank__gte=0.01)
                .order_by('-rank', '-updated_at')[:SEARCH_RESULTS_LIMIT]
            )
        except Exception:
            pass

    rank_cases = []
    for term in terms:
        rank_cases.append(When(title__icontains=term, then=Value(3)))
        rank_cases.append(When(content_plain__icontains=term, then=Value(2)))
        rank_cases.append(When(content__icontains=term, then=Value(1)))

    return (
        queryset.annotate(
            search_rank=Case(
                *rank_cases,
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        .order_by('-search_rank', '-updated_at')[:SEARCH_RESULTS_LIMIT]
    )


def sync_article_plain_content(article):
    article.content_plain = strip_html(article.content or '')
    return article.content_plain
