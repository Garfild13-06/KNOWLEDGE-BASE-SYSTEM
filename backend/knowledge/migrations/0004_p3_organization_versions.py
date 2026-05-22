import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def create_default_org_and_assign(apps, schema_editor):
    Organization = apps.get_model('knowledge', 'Organization')
    Section = apps.get_model('knowledge', 'Section')
    Article = apps.get_model('knowledge', 'Article')

    org, _ = Organization.objects.get_or_create(
        slug='default',
        defaults={'name': 'Основная организация'},
    )
    Section.objects.filter(organization__isnull=True).update(organization=org)
    Article.objects.filter(organization__isnull=True).update(organization=org)


def create_user_profiles(apps, schema_editor):
    UserProfile = apps.get_model('knowledge', 'UserProfile')
    Organization = apps.get_model('knowledge', 'Organization')
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))

    org = Organization.objects.get(slug='default')
    for user in User.objects.all():
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'organization': org, 'role': 'editor'},
        )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('knowledge', '0003_metadata_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('slug', models.SlugField(max_length=64, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.AddField(
            model_name='section',
            name='organization',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='sections',
                to='knowledge.organization',
            ),
        ),
        migrations.AddField(
            model_name='article',
            name='organization',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='articles',
                to='knowledge.organization',
            ),
        ),
        migrations.AddField(
            model_name='article',
            name='content_plain',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.RunPython(create_default_org_and_assign, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='section',
            name='organization',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='sections',
                to='knowledge.organization',
            ),
        ),
        migrations.AlterField(
            model_name='article',
            name='organization',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='articles',
                to='knowledge.organization',
            ),
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(
                    choices=[('reader', 'Читатель'), ('editor', 'Редактор'), ('admin', 'Администратор')],
                    default='editor',
                    max_length=20,
                )),
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='members',
                    to='knowledge.organization',
                )),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='profile',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.RunPython(create_user_profiles, migrations.RunPython.noop),
        migrations.CreateModel(
            name='ArticleVersion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version_number', models.PositiveIntegerField()),
                ('title', models.CharField(max_length=255)),
                ('content', models.TextField(blank=True, default='')),
                ('content_plain', models.TextField(blank=True, default='')),
                ('change_summary', models.CharField(blank=True, default='', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('article', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='versions',
                    to='knowledge.article',
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='article_versions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-version_number'],
                'unique_together': {('article', 'version_number')},
            },
        ),
    ]
