from django.contrib import admin

from .models import Board, Card, Column


class ColumnInline(admin.TabularInline):
    model = Column
    extra = 0


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "created_at"]
    inlines = [ColumnInline]


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ["title", "column", "priority", "position", "due_date"]
    list_filter = ["priority", "column__board"]
    search_fields = ["title", "description"]
