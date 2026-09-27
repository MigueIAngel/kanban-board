import pytest
from rest_framework.test import APIClient

from boards.models import Board, Card


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user("ana", password="kanban12345")


@pytest.fixture
def api(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def board(user):
    return Board.create_with_defaults(owner=user, name="Sprint")


def titles(column):
    return list(column.cards.order_by("position").values_list("title", flat=True))


def positions(column):
    return list(column.cards.order_by("position").values_list("position", flat=True))


@pytest.mark.django_db
def test_register_and_obtain_token():
    client = APIClient()
    response = client.post(
        "/api/auth/register/",
        {"username": "new", "email": "new@example.com", "password": "kanban12345"},
    )
    assert response.status_code == 201
    token = client.post("/api/auth/token/", {"username": "new", "password": "kanban12345"})
    assert "access" in token.data and "refresh" in token.data

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
    assert client.get("/api/auth/me/").data["username"] == "new"


@pytest.mark.django_db
def test_endpoints_require_authentication():
    assert APIClient().get("/api/boards/").status_code == 401


@pytest.mark.django_db
def test_creating_a_board_adds_default_columns(api):
    response = api.post("/api/boards/", {"name": "Personal"})
    assert response.status_code == 201
    detail = api.get(f"/api/boards/{response.data['id']}/").data
    assert [c["title"] for c in detail["columns"]] == ["To do", "In progress", "Done"]


@pytest.mark.django_db
def test_cards_are_appended_at_the_end(api, board):
    todo = board.columns.first()
    for title in ["A", "B", "C"]:
        api.post("/api/cards/", {"column": todo.id, "title": title})
    assert titles(todo) == ["A", "B", "C"]
    assert positions(todo) == [0, 1, 2]


@pytest.mark.django_db
def test_move_card_within_column(api, board):
    todo = board.columns.first()
    ids = [api.post("/api/cards/", {"column": todo.id, "title": t}).data["id"] for t in "ABC"]
    api.post(f"/api/cards/{ids[2]}/move/", {"column": todo.id, "position": 0})
    assert titles(todo) == ["C", "A", "B"]
    assert positions(todo) == [0, 1, 2]


@pytest.mark.django_db
def test_move_card_between_columns_keeps_positions_dense(api, board):
    todo, doing, _ = board.columns.all()
    ids = [api.post("/api/cards/", {"column": todo.id, "title": t}).data["id"] for t in "ABC"]
    api.post("/api/cards/", {"column": doing.id, "title": "X"})

    response = api.post(f"/api/cards/{ids[1]}/move/", {"column": doing.id, "position": 0})
    assert response.status_code == 200
    assert titles(todo) == ["A", "C"] and positions(todo) == [0, 1]
    assert titles(doing) == ["B", "X"] and positions(doing) == [0, 1]


@pytest.mark.django_db
def test_move_clamps_position(api, board):
    todo, doing, _ = board.columns.all()
    card = api.post("/api/cards/", {"column": todo.id, "title": "A"}).data
    api.post(f"/api/cards/{card['id']}/move/", {"column": doing.id, "position": 99})
    assert Card.objects.get(pk=card["id"]).position == 0


@pytest.mark.django_db
def test_users_cannot_touch_other_boards(api, django_user_model):
    stranger = django_user_model.objects.create_user("eve", password="kanban12345")
    other_board = Board.create_with_defaults(owner=stranger, name="Private")
    other_column = other_board.columns.first()

    assert api.get(f"/api/boards/{other_board.id}/").status_code == 404
    response = api.post("/api/cards/", {"column": other_column.id, "title": "Sneaky"})
    assert response.status_code == 400
    assert not Card.objects.filter(title="Sneaky").exists()


@pytest.mark.django_db
def test_cannot_move_card_to_another_board(api, user, board):
    second = Board.create_with_defaults(owner=user, name="Other")
    card = api.post("/api/cards/", {"column": board.columns.first().id, "title": "A"}).data
    response = api.post(
        f"/api/cards/{card['id']}/move/", {"column": second.columns.first().id, "position": 0}
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_and_delete_card(api, board):
    card = api.post("/api/cards/", {"column": board.columns.first().id, "title": "A"}).data
    updated = api.patch(f"/api/cards/{card['id']}/", {"priority": "high", "title": "A+"})
    assert updated.data["priority"] == "high"
    assert api.delete(f"/api/cards/{card['id']}/").status_code == 204
