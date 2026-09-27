from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from boards.models import Board, Card

CARDS = {
    "To do": [
        ("Set up CI pipeline", "high", "Lint, tests and Docker build on every PR."),
        ("Write API docs", "medium", "Document endpoints with OpenAPI."),
        ("Add dark mode", "low", ""),
    ],
    "In progress": [
        ("Drag & drop between columns", "high", "Use dnd-kit with optimistic updates."),
        ("Spanish translations", "medium", "react-i18next with a language switcher."),
    ],
    "Done": [
        ("JWT authentication", "high", "Access + refresh tokens with rotation."),
        ("Board data model", "medium", ""),
    ],
}


class Command(BaseCommand):
    help = "Create a demo user (demo / kanban12345) with a sample board."

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username="demo", defaults={"email": "demo@example.com"}
        )
        if not created:
            self.stdout.write("Demo user already exists, skipping.")
            return
        user.set_password("kanban12345")
        user.save()

        board = Board.create_with_defaults(owner=user, name="Product launch 🚀")
        for column in board.columns.all():
            for position, (title, priority, description) in enumerate(CARDS[column.title]):
                Card.objects.create(
                    column=column,
                    title=title,
                    priority=priority,
                    description=description,
                    position=position,
                    due_date=date.today() + timedelta(days=position * 3 + 2),
                )
        Board.create_with_defaults(owner=user, name="Personal")
        self.stdout.write(self.style.SUCCESS("Demo data created (demo / kanban12345)."))
