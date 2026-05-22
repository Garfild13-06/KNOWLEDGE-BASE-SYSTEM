from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .constants import ROLE_EDITOR, ROLE_READER
from .models import Article, ArticleVersion, Organization, Section, UserProfile
from .tenancy import get_default_organization
from .utils import make_snippet, strip_html


class KnowledgeTestMixin:
    def setUp(self):
        self.organization = get_default_organization()
        self.other_org = Organization.objects.create(name='Other', slug='other')

    def create_user(self, username, role=ROLE_EDITOR, organization=None):
        user = User.objects.create_user(username=username, password='secret123')
        org = organization or self.organization
        UserProfile.objects.filter(user=user).delete()
        UserProfile.objects.create(user=user, organization=org, role=role)
        return user


class SectionAPITestCase(KnowledgeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.section = Section.objects.create(
            name='Root',
            description='Root description',
            organization=self.organization,
        )

    def test_section_list_includes_description_and_metadata(self):
        response = self.client.get('/sections/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = next(row for row in response.data if row['id'] == self.section.id)
        self.assertEqual(item['description'], 'Root description')
        self.assertIn('created_at', item)

    def test_create_section_requires_editor(self):
        reader = self.create_user('reader1', role=ROLE_READER)
        self.client.force_authenticate(user=reader)
        response = self.client.post('/sections/', {'name': 'Child'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_editor_can_create_section(self):
        user = self.create_user('editor1')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            '/sections/',
            {'name': 'Child', 'description': 'Nested', 'parent': self.section.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created_by_username'], 'editor1')


class ArticleVersionAPITestCase(KnowledgeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.editor = self.create_user('versioner')
        self.section = Section.objects.create(
            name='Docs', organization=self.organization
        )
        self.client.force_authenticate(user=self.editor)
        response = self.client.post(
            '/articles/',
            {'title': 'V1', 'content': '<p>First</p>', 'section': self.section.id},
            format='json',
        )
        self.article_id = response.data['id']

    def test_update_creates_version(self):
        self.client.put(
            f'/articles/{self.article_id}/',
            {
                'title': 'V2',
                'content': '<p>Second</p>',
                'section': self.section.id,
            },
            format='json',
        )
        versions = self.client.get(f'/articles/{self.article_id}/versions/')
        self.assertEqual(versions.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(versions.data), 2)

    def test_restore_version(self):
        article = Article.objects.get(pk=self.article_id)
        old_version = article.versions.order_by('version_number').first()
        response = self.client.post(
            f'/articles/{self.article_id}/restore/',
            {'version_id': old_version.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        article.refresh_from_db()
        self.assertEqual(article.title, old_version.title)


class ArticleSearchAPITestCase(KnowledgeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        section = Section.objects.create(name='KB', organization=self.organization)
        Article.objects.create(
            title='Docker setup',
            content='<p>Install docker-compose on Linux</p>',
            content_plain='Install docker-compose on Linux',
            section=section,
            organization=self.organization,
        )

    def test_search_with_section_filter(self):
        response = self.client.get('/articles/search/?q=docker')
        self.assertEqual(len(response.data['results']), 1)

    def test_search_filters_by_section_id(self):
        other_section = Section.objects.create(
            name='Other', organization=self.organization
        )
        Article.objects.create(
            title='Docker other',
            content='docker',
            content_plain='docker',
            section=other_section,
            organization=self.organization,
        )
        response = self.client.get(
            f'/articles/search/?q=docker&section={other_section.id}'
        )
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['section_id'], other_section.id)


class TenancyAPITestCase(KnowledgeTestMixin, APITestCase):
    def test_user_sees_only_own_organization_sections(self):
        Section.objects.create(name='Default', organization=self.organization)
        Section.objects.create(name='Hidden', organization=self.other_org)
        response = self.client.get('/sections/')
        names = [item['name'] for item in response.data]
        self.assertIn('Default', names)
        self.assertNotIn('Hidden', names)


class AuthMeAPITestCase(KnowledgeTestMixin, APITestCase):
    def test_me_returns_role_and_organization(self):
        user = self.create_user('meuser', role=ROLE_READER)
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], ROLE_READER)
        self.assertFalse(response.data['can_edit'])
        self.assertEqual(response.data['organization']['slug'], self.organization.slug)


class UploadAPITestCase(KnowledgeTestMixin, APITestCase):
    def test_upload_requires_auth(self):
        file = SimpleUploadedFile('test.png', b'file_content', content_type='image/png')
        response = self.client.post('/uploads/', {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reader_cannot_upload(self):
        reader = self.create_user('ru', role=ROLE_READER)
        self.client.force_authenticate(user=reader)
        file = SimpleUploadedFile('test.png', b'file_content', content_type='image/png')
        response = self.client.post('/uploads/', {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DashboardAPITestCase(KnowledgeTestMixin, APITestCase):
    def test_dashboard_returns_sections(self):
        section = Section.objects.create(name='Dash', organization=self.organization)
        Article.objects.create(
            title='Recent',
            content='x',
            content_plain='x',
            section=section,
            organization=self.organization,
        )
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recent', response.data)
        self.assertIn('stats', response.data)


class HealthAPITestCase(APITestCase):
    def test_health_ok(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')


class ArticlePublishAPITestCase(KnowledgeTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.editor = self.create_user('pubeditor')
        self.section = Section.objects.create(name='Pub', organization=self.organization)
        self.client.force_authenticate(user=self.editor)

    def test_publish_draft(self):
        article = Article.objects.create(
            title='Draft',
            content='<p>d</p>',
            section=self.section,
            organization=self.organization,
            status=Article.STATUS_DRAFT,
            is_published=False,
            created_by=self.editor,
        )
        response = self.client.post(f'/articles/{article.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        article.refresh_from_db()
        self.assertTrue(article.is_published)


class TemplatesAPITestCase(APITestCase):
    def test_templates_list(self):
        response = self.client.get('/api/templates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['templates']), 0)


class UtilsTestCase(APITestCase):
    def test_strip_html(self):
        self.assertEqual(strip_html('<p>Hi <b>there</b></p>'), 'Hi there')

    def test_make_snippet_finds_query(self):
        snippet = make_snippet('<p>Alpha beta gamma</p>', 'beta')
        self.assertIn('beta', snippet.lower())
