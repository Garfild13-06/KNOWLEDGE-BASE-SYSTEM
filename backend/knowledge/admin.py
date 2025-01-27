from django.contrib import admin
from .models import Section, Article

admin.site.site_header = "Knowledge Base Admin"  # Верхний заголовок
admin.site.site_title = "Admin Panel"            # Название вкладки
admin.site.index_title = "Welcome to Admin Panel"  # Заголовок на главной странице админки


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')  # Какие поля показывать в списке
    search_fields = ('name',)              # Поля для поиска

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'file')  # Отображаемые поля
    list_filter = ('section',)                 # Фильтр по разделу
    search_fields = ('title',)                 # Поля для поиска

    actions = ['delete_selected_articles']

    @admin.action(description="Удалить выбранные статьи")
    def delete_selected_articles(self, request, queryset):
        queryset.delete()
