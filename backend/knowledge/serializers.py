from rest_framework import serializers
from .models import Section, Article

class SectionSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(view_name='section-detail')

    class Meta:
        model = Section
        fields = ['id', 'url', 'name', 'description', 'parent', 'children']

    def get_children(self, obj):
        return SectionSerializer(
            obj.children.all(),
            many=True,
            context=self.context
        ).data



class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = '__all__'
