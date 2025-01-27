from rest_framework import serializers
from .models import Section, Article

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True}
        }

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = '__all__'
