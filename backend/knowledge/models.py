from django.conf import settings
from django.db import models
from django.utils import timezone

from .constants import ROLE_CHOICES, ROLE_EDITOR
from .utils import strip_html


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name='members',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EDITOR)

    def __str__(self):
        return f'{self.user.username} ({self.get_role_display()})'


class Section(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='sections',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='children'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sections_created',
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Article(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_IN_REVIEW = 'in_review'
    STATUS_PUBLISHED = 'published'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Черновик'),
        (STATUS_IN_REVIEW, 'На ревью'),
        (STATUS_PUBLISHED, 'Опубликовано'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='articles',
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=220, blank=True, default='')
    content = models.TextField(blank=True, null=True)
    content_plain = models.TextField(blank=True, default='')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='articles')
    is_published = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PUBLISHED)
    template_key = models.CharField(max_length=32, blank=True, default='')
    view_count = models.PositiveIntegerField(default=0)
    file = models.FileField(upload_to='uploads/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles_updated',
    )

    class Meta:
        ordering = ['-updated_at']
        unique_together = [('organization', 'slug')]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        from .wiki_links import ensure_article_slug

        self.content_plain = strip_html(self.content or '')
        if not self.slug:
            self.slug = ensure_article_slug(self)
        if self.status != self.STATUS_PUBLISHED:
            self.is_published = False
        elif self.is_published:
            self.status = self.STATUS_PUBLISHED
        super().save(*args, **kwargs)


class ArticleVersion(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default='')
    content_plain = models.TextField(blank=True, default='')
    change_summary = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='article_versions',
    )

    class Meta:
        ordering = ['-version_number']
        unique_together = [('article', 'version_number')]

    def __str__(self):
        return f'{self.article_id} v{self.version_number}'


class ArticleComment(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='article_comments',
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class SectionPermission(models.Model):
    PERM_READ = 'read'
    PERM_WRITE = 'write'
    PERM_CHOICES = [(PERM_READ, 'Чтение'), (PERM_WRITE, 'Запись')]

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='section_permissions',
    )
    permission = models.CharField(max_length=10, choices=PERM_CHOICES, default=PERM_READ)

    class Meta:
        unique_together = [('section', 'user')]


class WebhookSubscription(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='webhooks'
    )
    url = models.URLField()
    secret = models.CharField(max_length=64, blank=True, default='')
    events = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='audit_logs'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=32)
    entity_id = models.PositiveIntegerField()
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class UserArticleState(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='user_states')
    is_bookmarked = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [('user', 'article')]


class ArticleEmbedding(models.Model):
    article = models.OneToOneField(
        Article, on_delete=models.CASCADE, related_name='embedding'
    )
    vector = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)
