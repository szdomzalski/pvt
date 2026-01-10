from django.urls import path
from . import views

urlpatterns = [
    path('', views.reaction_test, name='reaction_test'),
]
