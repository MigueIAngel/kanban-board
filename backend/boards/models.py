from django.conf import settings
from django.db import models, transaction
from django.db.models import F

DEFAULT_COLUMNS = ["To do", "In progress", "Done"]


class Board(models.Model):
    name = models.CharField(max_length=120)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="boards"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name

    @classmethod
    def create_with_defaults(cls, *, owner, name: str) -> "Board":
        with transaction.atomic():
            board = cls.objects.create(owner=owner, name=name)
            Column.objects.bulk_create(
                Column(board=board, title=title, position=index)
                for index, title in enumerate(DEFAULT_COLUMNS)
            )
        return board


class Column(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="columns")
    title = models.CharField(max_length=80)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return f"{self.board} / {self.title}"


class Card(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    column = models.ForeignKey(Column, on_delete=models.CASCADE, related_name="cards")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    due_date = models.DateField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return self.title

    def move(self, *, column: Column, position: int) -> None:
        """Move the card to `position` inside `column`, shifting its siblings.

        Positions stay dense (0..n-1) in both the source and target columns.
        """
        with transaction.atomic():
            # Lock the cards of both columns to serialize concurrent moves.
            list(
                Card.objects.select_for_update()
                .filter(column_id__in={self.column_id, column.id})
                .values_list("id", flat=True)
            )
            source_id, old_position = self.column_id, self.position

            # Close the gap in the source column.
            Card.objects.filter(column_id=source_id, position__gt=old_position).update(
                position=F("position") - 1
            )

            target_count = Card.objects.filter(column=column).exclude(pk=self.pk).count()
            position = max(0, min(position, target_count))

            # Open a slot in the target column.
            Card.objects.filter(column=column, position__gte=position).exclude(pk=self.pk).update(
                position=F("position") + 1
            )
            self.column = column
            self.position = position
            self.save(update_fields=["column", "position", "updated_at"])
