from rest_framework import serializers
from .models import Section, Article

class SectionSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'name', 'parent', 'children']

    def get_children(self, obj):
        # Получаем дочерние разделы текущего объекта
        children = Section.objects.filter(parent=obj)
        # Рекурсивно сериализуем их
        return SectionSerializer(children, many=True).data



class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = '__all__'


class TreeSectionSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'name', 'parent', 'children']

    def get_children(self, obj):
        # Получаем дочерние разделы текущего объекта
        children = Section.objects.filter(parent=obj)
        # Рекурсивно сериализуем их
        return SectionSerializer(children, many=True).data