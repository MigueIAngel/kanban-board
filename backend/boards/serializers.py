from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Max
from rest_framework import serializers

from .models import Board, Card, Column

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class OwnedColumnField(serializers.PrimaryKeyRelatedField):
    """Only accepts columns that belong to the requesting user's boards."""

    def get_queryset(self):
        return Column.objects.filter(board__owner=self.context["request"].user)


class CardSerializer(serializers.ModelSerializer):
    column = OwnedColumnField()

    class Meta:
        model = Card
        fields = [
            "id",
            "column",
            "title",
            "description",
            "priority",
            "due_date",
            "position",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["position", "created_at", "updated_at"]

    def validate(self, attrs):
        if self.instance and "column" in attrs and attrs["column"] != self.instance.column:
            raise serializers.ValidationError(
                {"column": "Use the move endpoint to change a card's column."}
            )
        return attrs

    def create(self, validated_data):
        column = validated_data["column"]
        last = column.cards.aggregate(last=Max("position"))["last"]
        validated_data["position"] = 0 if last is None else last + 1
        return super().create(validated_data)


class CardMoveSerializer(serializers.Serializer):
    column = OwnedColumnField()
    position = serializers.IntegerField(min_value=0)


class ColumnSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = Column
        fields = ["id", "board", "title", "position", "cards"]
        read_only_fields = ["position"]

    def validate_board(self, board: Board) -> Board:
        if board.owner != self.context["request"].user:
            raise serializers.ValidationError("Board not found.")
        return board

    def create(self, validated_data):
        board = validated_data["board"]
        last = board.columns.aggregate(last=Max("position"))["last"]
        validated_data["position"] = 0 if last is None else last + 1
        return super().create(validated_data)


class BoardSerializer(serializers.ModelSerializer):
    card_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Board
        fields = ["id", "name", "created_at", "card_count"]


class BoardDetailSerializer(BoardSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta(BoardSerializer.Meta):
        fields = BoardSerializer.Meta.fields + ["columns"]
