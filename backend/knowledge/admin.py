from django.contrib import admin
from .models import Section, Article

admin.site.site_header = "Knowledge Base Admin"  # Верхний заголовок
admin.site.site_title = "Admin Panel"            # Название вкладки
admin.site.index_title = "Welcome to Admin Panel"  # Заголовок на главной странице админки


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_by', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'created_by', 'updated_at')
    list_filter = ('section',)
    search_fields = ('title', 'content')
    readonly_fields = ('created_at', 'updated_at')

    actions = ['delete_selected_articles']

    @admin.action(description="Удалить выбранные статьи")
    def delete_selected_articles(self, request, queryset):
        queryset.delete()
