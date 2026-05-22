from rest_framework import serializers
from .models import Section, Article


def _attach_prefetched_children(sections):
    """Группирует разделы по parent_id для сериализации без N+1."""
    by_parent = {}
    for section in sections:
        parent_id = section.parent_id
        by_parent.setdefault(parent_id, []).append(section)
    for section in sections:
        section.prefetched_children = by_parent.get(section.id, [])
    return sections


class SectionSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'name', 'description', 'parent', 'children']

    def get_children(self, obj):
        children = getattr(obj, 'prefetched_children', None)
        if children is None:
            children = Section.objects.filter(parent=obj)
        return SectionSerializer(children, many=True, context=self.context).data


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = '__all__'


class TreeSectionSerializer(SectionSerializer):
    """Сериализатор дерева разделов (alias SectionSerializer)."""
    pass
