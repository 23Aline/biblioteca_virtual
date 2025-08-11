from django.contrib import admin
from django.urls import path
from biblioteca_app import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('cadastro-livros/', views.cadastro_livros, name='cadastro_livros'),
    path('cadastro-leitor/', views.cadastro_leitor, name='cadastro_leitor'),
    path('emprestimo/', views.emprestimo, name='emprestimo'),
    path('reservas/', views.reservas, name='reservas'),
    path('multa/', views.multa, name='multa'),
    path('estoque/', views.estoque, name='estoque'),
    path('usuarios/', views.usuarios, name='usuarios'),
    path('api/leitor/buscar/', views.buscar_leitor, name='buscar_leitor'),
    path('api/livro/buscar/', views.buscar_livro, name='buscar_livro'),
    path('livro/<int:livro_id>/', views.livro_detalhes, name='livro_detalhes'),
    path('emprestimo/', views.emprestimo, name='emprestimo'),
    path('emprestimo/<int:livro_id>/', views.emprestimo_com_livro, name='emprestimo_com_livro'),
    path('api/livro/buscar_por_id/', views.buscar_livro_por_id, name='buscar_livro_por_id'),
    path('editar_livro/<int:livro_id>/', views.editar_livro, name='editar_livro'),
    path('excluir_livro/<int:livro_id>/', views.excluir_livro, name='excluir_livro'),
    path('usuarios/editar/<int:leitor_id>/', views.editar_leitor, name='editar_leitor'),
    path('usuarios/excluir/<int:leitor_id>/', views.excluir_leitor, name='excluir_leitor'),
    path('api/leitor/buscar_por_id/', views.buscar_leitor_por_id, name='buscar_leitor_por_id'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)