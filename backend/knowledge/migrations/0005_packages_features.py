import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def populate_article_slugs(apps, schema_editor):
    Article = apps.get_model('knowledge', 'Article')
    for article in Article.objects.all():
        if not article.slug:
            from django.utils.text import slugify
            base = slugify(article.title) or f'article-{article.pk}'
            slug = base
            counter = 1
            while Article.objects.filter(organization_id=article.organization_id, slug=slug).exclude(pk=article.pk).exists():
                slug = f'{base}-{counter}'
                counter += 1
            article.slug = slug[:220]
            article.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('knowledge', '0004_p3_organization_versions'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='settings',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='section',
            name='is_public',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='section',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='article',
            name='is_published',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='article',
            name='slug',
            field=models.SlugField(blank=True, default='', max_length=220),
        ),
        migrations.AddField(
            model_name='article',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Черновик'),
                    ('in_review', 'На ревью'),
                    ('published', 'Опубликовано'),
                ],
                default='published',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='article',
            name='template_key',
            field=models.CharField(blank=True, default='', max_length=32),
        ),
        migrations.AddField(
            model_name='article',
            name='view_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(populate_article_slugs, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name='article',
            unique_together={('organization', 'slug')},
        ),
        migrations.CreateModel(
            name='ArticleComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('body', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='knowledge.article')),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='article_comments', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['created_at']},
        ),
        migrations.CreateModel(
            name='SectionPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('permission', models.CharField(choices=[('read', 'Чтение'), ('write', 'Запись')], default='read', max_length=10)),
                ('section', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permissions', to='knowledge.section')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='section_permissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('section', 'user')}},
        ),
        migrations.CreateModel(
            name='WebhookSubscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.URLField()),
                ('secret', models.CharField(blank=True, default='', max_length=64)),
                ('events', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='webhooks', to='knowledge.organization')),
            ],
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=64)),
                ('entity_type', models.CharField(max_length=32)),
                ('entity_id', models.PositiveIntegerField()),
                ('details', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='audit_logs', to='knowledge.organization')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='UserArticleState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_bookmarked', models.BooleanField(default=False)),
                ('last_read_at', models.DateTimeField(blank=True, null=True)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_states', to='knowledge.article')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('user', 'article')}},
        ),
        migrations.CreateModel(
            name='ArticleEmbedding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('vector', models.JSONField(default=list)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('article', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='embedding', to='knowledge.article')),
            ],
        ),
    ]
