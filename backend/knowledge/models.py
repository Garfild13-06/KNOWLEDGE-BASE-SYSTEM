from django.conf import settings
from django.db import models


class Section(models.Model):
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
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
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
