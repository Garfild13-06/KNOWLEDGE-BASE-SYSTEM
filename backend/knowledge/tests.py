from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Section, Article
from .utils import make_snippet, strip_html


class SectionAPITestCase(APITestCase):
    def setUp(self):
        self.section = Section.objects.create(
            name='Root',
            description='Root description',
        )

    def test_section_list_includes_description_and_metadata(self):
        response = self.client.get('/sections/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = next(row for row in response.data if row['id'] == self.section.id)
        self.assertEqual(item['description'], 'Root description')
        self.assertIn('created_at', item)
        self.assertIn('updated_at', item)

    def test_create_section_requires_auth(self):
        response = self.client.post('/sections/', {'name': 'Child'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_section_with_author(self):
        user = User.objects.create_user(username='editor', password='secret123')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            '/sections/',
            {'name': 'Child', 'description': 'Nested', 'parent': self.section.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['description'], 'Nested')
        self.assertEqual(response.data['created_by_username'], 'editor')


class UploadAPITestCase(APITestCase):
    def test_upload_requires_auth(self):
        file = SimpleUploadedFile('test.png', b'file_content', content_type='image/png')
        response = self.client.post('/uploads/', {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_upload_succeeds(self):
        user = User.objects.create_user(username='uploader', password='secret123')
        self.client.force_authenticate(user=user)
        file = SimpleUploadedFile('test.png', b'file_content', content_type='image/png')
        response = self.client.post('/uploads/', {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('location', response.data)


class TreeSectionsAPITestCase(APITestCase):
    def test_tree_returns_nested_children(self):
        root = Section.objects.create(name='Root', description='R')
        Section.objects.create(name='Child', description='C', parent=root)
        response = self.client.get('/tree_sections/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        root_data = next(item for item in response.data if item['name'] == 'Root')
        self.assertEqual(len(root_data['children']), 1)
        self.assertEqual(root_data['children'][0]['description'], 'C')


class ArticleAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='author', password='secret123')
        self.section = Section.objects.create(name='Docs')
        self.article = Article.objects.create(
            title='Guide',
            content='<p>Hello world</p>',
            section=self.section,
        )

    def test_list_articles_by_section(self):
        response = self.client.get(f'/articles/?section={self.section.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Guide')
        self.assertIn('created_at', response.data[0])

    def test_create_article_sets_author(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/articles/',
            {
                'title': 'New doc',
                'content': '<p>Body</p>',
                'section': self.section.id,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created_by_username'], 'author')


class ArticleSearchAPITestCase(APITestCase):
    def setUp(self):
        section = Section.objects.create(name='KB')
        Article.objects.create(
            title='Docker setup',
            content='<p>Install docker-compose on Linux</p>',
            section=section,
        )
        Article.objects.create(
            title='Other',
            content='<p>No match here</p>',
            section=section,
        )

    def test_search_requires_min_length(self):
        response = self.client.get('/articles/search/?q=a')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_search_finds_by_title_and_content(self):
        response = self.client.get('/articles/search/?q=docker')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Docker setup')
        self.assertIn('docker', response.data['results'][0]['snippet'].lower())


class UtilsTestCase(APITestCase):
    def test_strip_html(self):
        self.assertEqual(strip_html('<p>Hi <b>there</b></p>'), 'Hi there')

    def test_make_snippet_finds_query(self):
        snippet = make_snippet('<p>Alpha beta gamma</p>', 'beta')
        self.assertIn('beta', snippet.lower())
