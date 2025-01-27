from django.db import models

class Section(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='articles')
    file = models.FileField(upload_to='uploads/', blank=True, null=True)

    def __str__(self):
        return self.title
