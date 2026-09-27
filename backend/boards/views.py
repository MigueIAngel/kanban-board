from django.db.models import Count, Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Board, Card, Column
from .serializers import (
    BoardDetailSerializer,
    BoardSerializer,
    CardMoveSerializer,
    CardSerializer,
    ColumnSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class BoardViewSet(viewsets.ModelViewSet):
    """Boards owned by the current user. Other users' boards return 404."""

    def get_queryset(self):
        queryset = Board.objects.filter(owner=self.request.user).annotate(
            card_count=Count("columns__cards")
        )
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch("columns", queryset=Column.objects.prefetch_related("cards"))
            )
        return queryset

    def get_serializer_class(self):
        return BoardDetailSerializer if self.action == "retrieve" else BoardSerializer

    def perform_create(self, serializer):
        serializer.instance = Board.create_with_defaults(
            owner=self.request.user, name=serializer.validated_data["name"]
        )


class ColumnViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ColumnSerializer

    def get_queryset(self):
        return Column.objects.filter(board__owner=self.request.user)


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer

    def get_queryset(self):
        return Card.objects.filter(column__board__owner=self.request.user)

    @extend_schema(request=CardMoveSerializer, responses=CardSerializer)
    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        """Move a card to another position and/or column (drag & drop)."""
        card = self.get_object()
        serializer = CardMoveSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        column = serializer.validated_data["column"]
        if column.board_id != card.column.board_id:
            return Response(
                {"column": ["Cards can only move within the same board."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        card.move(column=column, position=serializer.validated_data["position"])
        return Response(CardSerializer(card, context={"request": request}).data)
