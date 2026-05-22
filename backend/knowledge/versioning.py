from .models import ArticleVersion
from .utils import strip_html


def create_article_version(article, user, change_summary=''):
    last = (
        ArticleVersion.objects.filter(article=article)
        .order_by('-version_number')
        .first()
    )
    version_number = (last.version_number + 1) if last else 1
    return ArticleVersion.objects.create(
        article=article,
        version_number=version_number,
        title=article.title,
        content=article.content or '',
        content_plain=strip_html(article.content or ''),
        created_by=user if user and user.is_authenticated else None,
        change_summary=change_summary[:255],
    )
