import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from .models import Livro, Exemplar, Autor, Genero


def _criar_livro(titulo="Livro Teste", nome_autor="Autor Teste", nome_genero="Ficção"):
    autor = Autor.objects.create(nome=nome_autor)
    genero = Genero.objects.create(nome=nome_genero)
    return Livro.objects.create(
        titulo=titulo,
        autor=autor,
        edicao="1ª Edição",
        numero_paginas=200,
        genero=genero,
        classificacao=5,
        sinopse="Sinopse de teste.",
    )


class LivroModelTest(TestCase):

    def test_criar_livro(self):
        livro = _criar_livro(titulo="Água Viva", nome_autor="Clarice Lispector")
        self.assertEqual(livro.titulo, "Água Viva")
        self.assertEqual(livro.autor.nome, "Clarice Lispector")

    def test_idioma_padrao(self):
        livro = _criar_livro()
        self.assertEqual(livro.idioma, "Português")


class ExemplarModelTest(TestCase):

    def setUp(self):
        self.livro = _criar_livro(titulo="1984", nome_autor="George Orwell")

    def _novo_exemplar(self):
        return Exemplar.objects.create(
            livro=self.livro,
            codigo_tombo=f"EX-{uuid.uuid4().hex[:8]}"
        )

    def test_status_padrao_exemplar(self):
        exemplar = self._novo_exemplar()
        self.assertEqual(exemplar.status, "disponivel")

    def test_codigo_tombo_unico(self):
        tombo = f"EX-{uuid.uuid4().hex[:8]}"
        Exemplar.objects.create(livro=self.livro, codigo_tombo=tombo)
        with self.assertRaises(IntegrityError):
            Exemplar.objects.create(livro=self.livro, codigo_tombo=tombo)


class UsuarioTest(TestCase):

    def test_criacao_usuario(self):
        usuario = User.objects.create_user(
            username="testuser",
            password="senha_segura_456"
        )
        self.assertEqual(usuario.username, "testuser")
        self.assertTrue(usuario.check_password("senha_segura_456"))
