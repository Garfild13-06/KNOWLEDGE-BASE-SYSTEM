from rest_framework import serializers

from .models import (
    Article,
    ArticleComment,
    ArticleVersion,
    AuditLog,
    Organization,
    Section,
    UserProfile,
    WebhookSubscription,
)
from .utils import make_snippet, strip_html


def _attach_prefetched_children(sections):
    by_parent = {}
    for section in sections:
        parent_id = section.parent_id
        by_parent.setdefault(parent_id, []).append(section)
    for section in sections:
        section.prefetched_children = by_parent.get(section.id, [])
    return sections


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug']


class SectionSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Section
        fields = [
            'id', 'name', 'description', 'parent', 'children', 'organization',
            'is_public', 'expires_at',
            'created_at', 'updated_at', 'created_by', 'created_by_username',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'created_by', 'created_by_username', 'organization',
        ]

    def get_children(self, obj):
        children = getattr(obj, 'prefetched_children', None)
        if children is None:
            children = Section.objects.filter(parent=obj)
        return SectionSerializer(children, many=True, context=self.context).data


class ArticleSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    wiki_links = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'section', 'file', 'organization',
            'is_published', 'status', 'template_key', 'view_count',
            'created_at', 'updated_at', 'created_by', 'updated_by',
            'created_by_username', 'updated_by_username', 'section_name',
            'is_bookmarked', 'wiki_links',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'created_by', 'updated_by',
            'created_by_username', 'updated_by_username', 'section_name',
            'organization', 'view_count', 'slug',
        ]

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user_states.filter(user=request.user, is_bookmarked=True).exists()

    def get_wiki_links(self, obj):
        from .wiki_links import extract_wiki_titles

        return extract_wiki_titles(obj.content)


class ArticleVersionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = ArticleVersion
        fields = [
            'id', 'version_number', 'title', 'content', 'change_summary',
            'created_at', 'created_by', 'created_by_username',
        ]
        read_only_fields = fields


class ArticleVersionDetailSerializer(ArticleVersionSerializer):
    class Meta(ArticleVersionSerializer.Meta):
        fields = ArticleVersionSerializer.Meta.fields + ['content_plain']


class ArticleSearchResultSerializer(serializers.ModelSerializer):
    section_id = serializers.IntegerField(source='section.id', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    snippet = serializers.SerializerMethodField()
    search_rank = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'section_id', 'section_name', 'snippet',
            'updated_at', 'search_rank',
        ]

    def get_snippet(self, obj):
        query = self.context.get('query', '')
        text = obj.content_plain or strip_html(obj.content or '')
        if query:
            return make_snippet(text or obj.title, query)
        return text[:160]


class ArticleCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = ArticleComment
        fields = ['id', 'article', 'author', 'author_username', 'body', 'created_at']
        read_only_fields = ['author', 'author_username', 'created_at']


class WebhookSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookSubscription
        fields = ['id', 'url', 'secret', 'events', 'is_active', 'created_at']
        read_only_fields = ['created_at']
        extra_kwargs = {'secret': {'write_only': True}}


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'entity_type', 'entity_id', 'details',
            'username', 'ip_address', 'created_at',
        ]


class UserMeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    role = serializers.CharField()
    role_display = serializers.CharField()
    can_edit = serializers.BooleanField()
    is_admin = serializers.BooleanField()
    organization = OrganizationSerializer()
    features = serializers.DictField(required=False)


class JoinOrganizationSerializer(serializers.Serializer):
    organization_slug = serializers.SlugField()
