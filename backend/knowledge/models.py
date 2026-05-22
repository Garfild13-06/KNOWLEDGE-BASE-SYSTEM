from django.conf import settings
from django.db import models

from .constants import ROLE_CHOICES, ROLE_EDITOR
from .utils import strip_html


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
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
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='articles',
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    content_plain = models.TextField(blank=True, default='')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='articles')
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

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.content_plain = strip_html(self.content or '')
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
