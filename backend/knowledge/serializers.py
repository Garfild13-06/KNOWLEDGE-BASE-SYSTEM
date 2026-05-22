from rest_framework import serializers
from .models import Section, Article
from .utils import make_snippet, strip_html


def _attach_prefetched_children(sections):
    by_parent = {}
    for section in sections:
        parent_id = section.parent_id
        by_parent.setdefault(parent_id, []).append(section)
    for section in sections:
        section.prefetched_children = by_parent.get(section.id, [])
    return sections


class SectionSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Section
        fields = [
            'id', 'name', 'description', 'parent', 'children',
            'created_at', 'updated_at', 'created_by', 'created_by_username',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'created_by_username']

    def get_children(self, obj):
        children = getattr(obj, 'prefetched_children', None)
        if children is None:
            children = Section.objects.filter(parent=obj)
        return SectionSerializer(children, many=True, context=self.context).data


class ArticleSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'section', 'file',
            'created_at', 'updated_at', 'created_by', 'updated_by',
            'created_by_username', 'updated_by_username', 'section_name',
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'created_by', 'updated_by',
            'created_by_username', 'updated_by_username', 'section_name',
        ]


class ArticleSearchResultSerializer(serializers.ModelSerializer):
    section_id = serializers.IntegerField(source='section.id', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    snippet = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'title', 'section_id', 'section_name', 'snippet', 'updated_at']

    def get_snippet(self, obj):
        query = self.context.get('query', '')
        if query:
            return make_snippet(obj.content or obj.title, query)
        return strip_html(obj.content or '')[:160]


class TreeSectionSerializer(SectionSerializer):
    pass
